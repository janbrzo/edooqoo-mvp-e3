import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: SHA256 hash using Web Crypto API
async function sha256(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return bufferToHex(hashBuffer);
}

// Helper: HMAC-SHA256 using Web Crypto API
async function hmacSha256(key: Uint8Array | string, data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyData = typeof key === 'string' ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return new Uint8Array(signature);
}

// AWS Signature V4 signing helper for R2/S3 compatibility
async function signAwsRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: Uint8Array,
  accessKeyId: string,
  secretAccessKey: string,
  region: string = "auto"
) {
  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const path = urlObj.pathname;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = date.slice(0, 8);

  // Canonical request - MUST include x-amz-content-sha256 for R2
  const payloadHash = await sha256(body);
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${date}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  // String to sign
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = `${algorithm}\n${date}\n${credentialScope}\n${canonicalRequestHash}`;

  // Signing key (chain of HMAC operations)
  const kDate = await hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, "s3");
  const kSigning = await hmacSha256(kService, "aws4_request");

  // Signature
  const signatureBytes = await hmacSha256(kSigning, stringToSign);
  const signature = bufferToHex(signatureBytes.buffer);

  // Authorization header
  const authHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    ...headers,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": date,
    "Authorization": authHeader,
  };
}

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

    // Convert base64 to binary
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Construct upload URL
    const uploadUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${filename}`;
    console.log(`[UPLOAD-TO-R2] Upload URL: ${uploadUrl}`);

    // Sign request with AWS Signature V4
    const signedHeaders = await signAwsRequest(
      "PUT",
      uploadUrl,
      {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
      bytes,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY
    );

    // Upload to R2 using native fetch with signed request
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: signedHeaders,
      body: bytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[UPLOAD-TO-R2] Upload failed: ${response.status}`, errorText);
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
