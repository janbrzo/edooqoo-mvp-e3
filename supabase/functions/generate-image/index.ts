import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_VERTEX_API_KEY = Deno.env.get("GEMINI_VERTEX_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, englishLevel = "B1/B2" } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required for image generation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GEMINI_VERTEX_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini Vertex API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[GENERATE-IMAGE] Starting image generation for topic: "${topic}", level: ${englishLevel}`);

    // STEP 1: Generate image using Vertex AI Imagen 4.0 Fast
    const imagePrompt = createImagePrompt(topic, englishLevel);
    console.log(`[GENERATE-IMAGE] Image prompt: ${imagePrompt.substring(0, 150)}...`);

    // Get access token from service account
    const accessToken = await getVertexAccessToken(GEMINI_VERTEX_API_KEY);
    
    // Parse project ID from service account JSON
    let projectId = "your-gcp-project";
    try {
      const serviceAccount = JSON.parse(GEMINI_VERTEX_API_KEY);
      projectId = serviceAccount.project_id;
      console.log(`[GENERATE-IMAGE] Using project ID: ${projectId}`);
    } catch {
      throw new Error("GEMINI_VERTEX_API_KEY must be a valid service account JSON");
    }

    const vertexEndpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-4.0-fast-generate-001:predict`;
    
    const imageResponse = await fetch(vertexEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: imagePrompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
          safetyFilterLevel: "block_few",
          personGeneration: "allow_all"
        }
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`[GENERATE-IMAGE] Vertex AI error: ${imageResponse.status} - ${errorText}`);
      throw new Error(`Image generation failed: ${imageResponse.status} - ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      console.error("[GENERATE-IMAGE] No image in Vertex AI response:", JSON.stringify(imageData));
      throw new Error("No valid image data received from Vertex AI");
    }

    // Convert to data URL
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    console.log(`[GENERATE-IMAGE] Image generated successfully (${Math.round(base64Image.length / 1024)}KB)`);

    // STEP 2: Generate detailed description using Gemini Pro
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const descriptionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const descriptionPrompt = `You are analyzing an AI-generated image for an English language worksheet. The image was generated for the topic: "${topic}" at level ${englishLevel}.

CRITICAL: Generate a DETAILED, FACTUAL description (200-300 words) of this image that will allow creating 2-4 UNIQUE picture-based exercises WITHOUT repetition.

DESCRIPTION STRUCTURE (include ALL elements):

1. PEOPLE (if present):
   - Count, approximate ages, genders
   - Clothing (colors, styles, formality)
   - Facial expressions (specific emotions)
   - Body language and postures
   - Interactions between people
   - What each person is doing/holding

2. SETTING:
   - Indoor/outdoor
   - Specific location type (office, restaurant, park, street, etc.)
   - Time of day (if inferable from lighting)
   - Weather/season (if visible)
   - Atmosphere (busy/calm, formal/casual)

3. OBJECTS & DETAILS:
   - Prominent items (furniture, tools, food, technology)
   - Colors and textures
   - Positions and arrangements
   - Conditions (new/old, clean/messy)
   - Text visible (signs, labels)

4. ACTIONS & EVENTS:
   - What is happening in the scene
   - Sequence of events (if multiple)
   - Purpose/goal of the activity

5. TEACHING OPPORTUNITIES:
   - Vocabulary that could be taught (list 8-10 specific items visible)
   - Grammar structures applicable to the scene
   - Cultural or situational aspects

FORMAT REQUIREMENTS:
- Write in present continuous tense ("A woman is sitting...")
- Use specific details, NOT generic descriptions
- Mention positions (left/right, foreground/background)
- Include colors, numbers, and concrete observations
- AVOID subjective interpretations ("seems happy" → "is smiling")
- Each paragraph should focus on different aspects to enable varied exercises

Generate the description now:`;

    const descriptionResult = await descriptionModel.generateContent(descriptionPrompt);
    const detailedDescription = descriptionResult.response.text();

    if (!detailedDescription || detailedDescription.length < 100) {
      throw new Error("Generated description is too short or empty");
    }

    console.log(`[GENERATE-IMAGE] Description generated (${detailedDescription.length} chars)`);
    console.log(`[GENERATE-IMAGE] Description preview: ${detailedDescription.substring(0, 200)}...`);

    return new Response(
      JSON.stringify({
        success: true,
        image: {
          id: `vertex-ai-${Date.now()}`,
          url: imageUrl,
          thumbnail: imageUrl,
          description: detailedDescription.substring(0, 100) + "...",
          detailedDescription: detailedDescription,
          photographer: "AI Generated (Google Imagen 4.0 Fast)",
          photographerUrl: "https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images",
          source: "vertex-ai-generated",
          generationPrompt: imagePrompt,
          topic: topic,
          englishLevel: englishLevel,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[GENERATE-IMAGE] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Failed to generate image or description",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});


/**
 * Convert PEM private key to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Remove PEM header/footer and newlines
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  
  // Decode base64 to binary string
  const binaryString = atob(pemContents);
  
  // Convert binary string to ArrayBuffer
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Import private key as CryptoKey for JWT signing
 */
async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  try {
    const keyData = pemToArrayBuffer(pemKey);
    
    return await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
  } catch (error) {
    console.error("[GENERATE-IMAGE] Failed to import private key:", error);
    throw new Error(`Invalid private key format: ${error.message}`);
  }
}

/**
 * Get OAuth2 access token from service account JSON
 */
async function getVertexAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Import the private key as CryptoKey
  const privateKey = await importPrivateKey(serviceAccount.private_key);
  
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: getNumericDate(60 * 60), // 1 hour
      iat: getNumericDate(0),
    },
    privateKey
  );

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Creates a detailed prompt for Gemini Imagen 3.0
 * Focus: photorealistic, everyday situations, clear context for exercises
 */
function createImagePrompt(topic: string, englishLevel: string): string {
  // Map English levels to complexity
  const complexity =
    {
      "A1/A2": "simple, clear, basic",
      "B1/B2": "moderate detail, everyday context",
      "C1/C2": "complex, nuanced, sophisticated",
    }[englishLevel] || "moderate detail, everyday context";

  return `Create a photorealistic image for an English language learning worksheet about: ${topic}

CRITICAL REQUIREMENTS:
- Style: Photorealistic, NOT artistic or illustrated
- Setting: Real-world, everyday situation (NOT staged or overly perfect)
- People: Include 2-4 people in natural interactions showing clear emotions and body language
- Context: ${complexity} scene with visible details for teaching
- Composition: Clear foreground and background, multiple elements to discuss
- Lighting: Natural, bright enough to see all details clearly
- Objects: Include relevant everyday objects related to ${topic}
- Actions: People actively doing something (not just posing)
- Emotions: Clear, identifiable facial expressions
- Teaching value: Scene should illustrate vocabulary, actions, and situations related to ${topic}

AVOID:
- Artistic filters or effects
- Overly staged or professional photography look
- Empty scenes without people
- Unclear or dark lighting
- Abstract or symbolic imagery
- Text or writing in the image (unless naturally part of scene like signs)

Generate a realistic photograph of this scene now.`;
}
