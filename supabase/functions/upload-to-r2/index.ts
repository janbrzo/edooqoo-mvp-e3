import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { AwsClient } from "https://deno.land/x/aws_api@v0.8.1/client/mod.ts";

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

    // Initialize AWS client (compatible with Deno Edge Functions - no filesystem dependencies)
    const awsClient = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      region: "auto",
    });

    // Convert base64 to binary buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Construct the R2 upload URL
    const uploadUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${filename}`;
    console.log(`[UPLOAD-TO-R2] Upload URL: ${uploadUrl}`);

    // Upload to R2 using signed request
    const response = await awsClient.fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
      body: bytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[UPLOAD-TO-R2] Upload failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    // Extract account ID from endpoint for public URL
    // R2_ENDPOINT format: https://[account_id].r2.cloudflarestorage.com
    console.log(`[UPLOAD-TO-R2] R2_ENDPOINT: ${R2_ENDPOINT}`);  // ✅ Debug log
    
    const accountIdMatch = R2_ENDPOINT.match(/https:\/\/(.+?)\.r2\.cloudflarestorage\.com/);
    const accountId = accountIdMatch?.[1];
    
    console.log(`[UPLOAD-TO-R2] Extracted account ID: ${accountId}`);  // ✅ Debug log
    
    if (!accountId) {
      console.error("[UPLOAD-TO-R2] Could not extract account ID from endpoint:", R2_ENDPOINT);
      console.error("[UPLOAD-TO-R2] Expected format: https://[account_id].r2.cloudflarestorage.com");
      return new Response(
        JSON.stringify({ 
          error: "Invalid R2 endpoint configuration",
          endpoint: R2_ENDPOINT,
          expectedFormat: "https://[account_id].r2.cloudflarestorage.com"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct public R2 URL (with custom domain support)
    const CUSTOM_DOMAIN = Deno.env.get("R2_CUSTOM_DOMAIN");  // Optional: "images.edooqoo.com"
    const publicUrl = CUSTOM_DOMAIN 
      ? `https://${CUSTOM_DOMAIN}/${filename}`
      : `https://pub-${accountId}.r2.dev/${filename}`;
    
    console.log(`[UPLOAD-TO-R2] Constructed public URL: ${publicUrl}`);  // ✅ Debug log

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
