import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken, recipientEmail, setTitle, teacherName } = await req.json();

    if (!shareToken || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing shareToken or recipientEmail' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shareUrl = `${req.headers.get('origin') || 'https://worksheetgenerator.lovable.app'}/flashcards/${shareToken}`;

    console.log('[send-flashcard-email] Sending to:', recipientEmail);
    console.log('[send-flashcard-email] Share URL:', shareUrl);

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Worksheet Generator <noreply@edooqoo.com>',
        to: [recipientEmail],
        subject: `${teacherName || 'Your teacher'} shared flashcards with you: ${setTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed;">📚 New Flashcard Set Shared!</h2>
            <p>Hello,</p>
            <p><strong>${teacherName || 'Your teacher'}</strong> has shared a flashcard set with you:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${setTitle}</h3>
            </div>
            <p>Click the button below to start learning:</p>
            <a href="${shareUrl}" 
               style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
              Start Learning
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This link will remain active for 1 year. You can practice these flashcards as many times as you like.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              Or copy and paste this URL: ${shareUrl}
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('[send-flashcard-email] Resend error:', emailData);
      throw new Error(emailData.message || 'Failed to send email');
    }

    console.log('[send-flashcard-email] Email sent successfully:', emailData.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[send-flashcard-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
