import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.490.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base64Image, filename, contentType = "image/png" } = await req.json();

    if (!base64Image || !filename) {
      return new Response(
        JSON.stringify({ error: "Missing base64Image or filename" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get R2 credentials from environment
    const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
    const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT");
    const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
      console.error("[UPLOAD-TO-R2] Missing R2 credentials");
      return new Response(
        JSON.stringify({ error: "R2 credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[UPLOAD-TO-R2] Starting upload: ${filename} to bucket: ${R2_BUCKET_NAME}`);

    // Initialize S3-compatible client for R2
    const r2Client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    // Convert base64 to binary buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // Cache for 1 year
    });

    await r2Client.send(command);

    // Extract account ID from endpoint for public URL
    // R2_ENDPOINT format: https://[account_id].r2.cloudflarestorage.com
    const accountId = R2_ENDPOINT.match(/https:\/\/(.+?)\.r2\.cloudflarestorage\.com/)?.[1];
    
    if (!accountId) {
      console.error("[UPLOAD-TO-R2] Could not extract account ID from endpoint:", R2_ENDPOINT);
      return new Response(
        JSON.stringify({ error: "Invalid R2 endpoint configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct public R2 URL
    const publicUrl = `https://pub-${accountId}.r2.dev/${filename}`;

    console.log(`[UPLOAD-TO-R2] ✅ Upload successful: ${publicUrl}`);
    console.log(`[UPLOAD-TO-R2] File size: ${Math.round(bytes.length / 1024)}KB`);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filename,
        size: bytes.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[UPLOAD-TO-R2] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Upload failed",
        details: "Failed to upload image to R2",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
