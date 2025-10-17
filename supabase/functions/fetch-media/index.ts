import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, count = 4, mediaType = 'picture' } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Picture Mode (Unsplash)
    if (mediaType === 'picture') {
      if (!UNSPLASH_ACCESS_KEY) {
        return new Response(
          JSON.stringify({ error: 'Unsplash API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[FETCH-MEDIA] Searching Unsplash for: "${query}"`);

      const unsplashResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!unsplashResponse.ok) {
        throw new Error(`Unsplash API error: ${unsplashResponse.status}`);
      }

      const data = await unsplashResponse.json();

      const images = data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.small,
        description: photo.alt_description || photo.description || 'Image',
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
      }));

      console.log(`[FETCH-MEDIA] Found ${images.length} images`);

      return new Response(
        JSON.stringify({ images }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle Video Mode (YouTube)
    else if (mediaType === 'video') {
      const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
      
      if (!YOUTUBE_API_KEY) {
        console.warn('[FETCH-MEDIA] YouTube API key not configured');
        return new Response(
          JSON.stringify({ videos: [], error: 'YouTube API key not configured' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[FETCH-MEDIA] Searching YouTube for: "${query}"`);

      // Search YouTube API - educational, short videos with Creative Commons license
      const youtubeResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&q=${encodeURIComponent(query)}&type=video` +
        `&videoCategoryId=27&videoLicense=creativeCommon` +
        `&videoDuration=short&maxResults=${count}&key=${YOUTUBE_API_KEY}`
      );

      if (!youtubeResponse.ok) {
        const errorText = await youtubeResponse.text();
        console.error(`[FETCH-MEDIA] YouTube API error: ${youtubeResponse.status}`, errorText);
        throw new Error(`YouTube API error: ${youtubeResponse.status}`);
      }

      const data = await youtubeResponse.json();

      const videos = data.items?.map((video: any) => ({
        id: video.id.videoId,
        url: `https://www.youtube.com/embed/${video.id.videoId}`,
        thumbnail: video.snippet.thumbnails.medium.url,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt
      })) || [];

      console.log(`[FETCH-MEDIA] Found ${videos.length} videos`);

      return new Response(
        JSON.stringify({ videos }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Unknown media type
    return new Response(
      JSON.stringify({ error: 'Invalid media type. Use "picture" or "video".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FETCH-MEDIA] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
