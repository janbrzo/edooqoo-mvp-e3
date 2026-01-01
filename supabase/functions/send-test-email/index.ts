/**
 * send-test-email - Edge function to send test link via email
 * Similar to send-flashcard-email but for student tests
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken, recipientEmail, testTitle, teacherName } = await req.json();

    if (!shareToken || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing shareToken or recipientEmail' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shareUrl = `${req.headers.get('origin') || 'https://worksheetgenerator.lovable.app'}/test/${shareToken}`;

    console.log('[send-test-email] Sending to:', recipientEmail);
    console.log('[send-test-email] Share URL:', shareUrl);

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">📝 Test Assignment</h2>
        <p>Hello,</p>
        <p><strong>${teacherName || 'Your teacher'}</strong> has assigned you a test:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${testTitle}</h3>
        </div>
        <p>Click the button below to start the test:</p>
        <a href="${shareUrl}" 
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Start Test
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          <strong>Important:</strong> You will need to enter your email before starting. Your time will be tracked during the test.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          Or copy and paste this URL: ${shareUrl}
        </p>
      </div>
    `;

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
        subject: `${teacherName || 'Your teacher'} assigned you a test: ${testTitle}`,
        html: emailBody,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('[send-test-email] Resend error:', emailData);
      throw new Error(emailData.message || 'Failed to send email');
    }

    console.log('[send-test-email] Email sent successfully:', emailData.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[send-test-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
