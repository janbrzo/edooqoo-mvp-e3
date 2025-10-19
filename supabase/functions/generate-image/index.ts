import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

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

    console.log(`[GENERATE-IMAGE] Starting image generation for topic: "${topic}", level: ${englishLevel}`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // STEP 1: Generate image using Gemini Imagen 3.0
    const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

    const imagePrompt = createImagePrompt(topic, englishLevel);
    console.log(`[GENERATE-IMAGE] Image prompt: ${imagePrompt.substring(0, 150)}...`);

    const imageResult = await imageModel.generateContent(imagePrompt);

    // Extract image from response
    const imageData = imageResult.response.candidates?.[0]?.content?.parts?.[0];

    if (!imageData || !imageData.inlineData) {
      throw new Error("No image data received from Gemini Imagen");
    }

    const base64Image = imageData.inlineData.data;
    const mimeType = imageData.inlineData.mimeType || "image/jpeg";
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    console.log(`[GENERATE-IMAGE] Image generated successfully (${Math.round(base64Image.length / 1024)}KB)`);

    // STEP 2: Generate detailed description using Gemini Pro
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
          id: `gemini-${Date.now()}`,
          url: imageUrl,
          thumbnail: imageUrl, // Same as URL for now (could compress later)
          description: detailedDescription.substring(0, 100) + "...", // Short version
          detailedDescription: detailedDescription, // FULL description for exercises
          photographer: "AI Generated (Gemini Imagen 3.0)",
          photographerUrl: "https://ai.google.dev/gemini-api/docs/imagen",
          source: "gemini-generated",
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
