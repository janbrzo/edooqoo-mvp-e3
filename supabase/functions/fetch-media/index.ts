import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { mediaType, searchQuery } = await req.json();

    console.log('Fetching media:', { mediaType, searchQuery });

    if (!mediaType || !searchQuery) {
      return new Response(
        JSON.stringify({ error: 'Missing mediaType or searchQuery' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Currently only support picture type
    if (mediaType !== 'picture') {
      return new Response(
        JSON.stringify({ error: `Media type ${mediaType} not yet supported` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from Unsplash API
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    
    if (!UNSPLASH_ACCESS_KEY) {
      console.error('UNSPLASH_ACCESS_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Media service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for 4 images from Unsplash
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=8&content_filter=high&orientation=landscape`;
    
    console.log('Calling Unsplash API:', unsplashUrl);

    const unsplashResponse = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    });

    if (!unsplashResponse.ok) {
      const errorText = await unsplashResponse.text();
      console.error('Unsplash API error:', unsplashResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch images from Unsplash' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const unsplashData = await unsplashResponse.json();
    
    console.log('Unsplash response:', {
      total: unsplashData.total,
      results: unsplashData.results?.length
    });

    if (!unsplashData.results || unsplashData.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No images found',
          suggestions: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select 4 random images from the results
    const shuffled = unsplashData.results.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    // Format results
    const suggestions = selected.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      description: photo.description || photo.alt_description || searchQuery,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadLocation: photo.links.download_location, // Required for Unsplash API compliance
    }));

    console.log('Returning suggestions:', suggestions.length);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-media function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
