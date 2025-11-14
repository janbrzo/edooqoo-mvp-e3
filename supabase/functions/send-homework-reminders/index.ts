import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[HOMEWORK-REMINDERS] Function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find homework assignments that need reminders
    // Criteria: deadline is set, reminder not sent yet, created more than 24h ago
    const reminderThreshold = new Date();
    reminderThreshold.setHours(reminderThreshold.getHours() - 24);

    const { data: homeworkToRemind, error: fetchError } = await supabase
      .from('homework_assignments')
      .select(`
        id,
        title,
        deadline,
        share_token,
        teacher_id,
        student_id,
        students (
          name,
          teacher_email
        ),
        profiles (
          email,
          first_name,
          last_name
        )
      `)
      .is('reminder_sent_at', null)
      .not('deadline', 'is', null)
      .lt('created_at', reminderThreshold.toISOString())
      .gte('deadline', new Date().toISOString()); // Only remind if deadline hasn't passed

    if (fetchError) {
      console.error('[HOMEWORK-REMINDERS] Error fetching homework:', fetchError);
      throw fetchError;
    }

    console.log(`[HOMEWORK-REMINDERS] Found ${homeworkToRemind?.length || 0} homework assignments needing reminders`);

    if (!homeworkToRemind || homeworkToRemind.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No homework reminders to send',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each homework
    const results = [];
    for (const homework of homeworkToRemind) {
      try {
        const student = Array.isArray(homework.students) ? homework.students[0] : homework.students;
        const teacher = Array.isArray(homework.profiles) ? homework.profiles[0] : homework.profiles;
        
        const studentEmail = student?.teacher_email;
        const teacherName = teacher?.first_name && teacher?.last_name 
          ? `${teacher.first_name} ${teacher.last_name}`
          : teacher?.email || 'Your teacher';
        
        const homeworkUrl = `${supabaseUrl.replace('.supabase.co', '')}/homework/${homework.share_token}`;
        
        // Log reminder information (in production, this would send an email)
        console.log(`[HOMEWORK-REMINDERS] Would send reminder for homework "${homework.title}"`);
        console.log(`  To: ${studentEmail || 'No email'}`);
        console.log(`  From: ${teacherName}`);
        console.log(`  Deadline: ${homework.deadline}`);
        console.log(`  Link: ${homeworkUrl}`);
        
        // TODO: Integrate with email service (e.g., Resend)
        // const emailResult = await fetch('https://api.resend.com/emails', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     from: 'noreply@yourdomain.com',
        //     to: studentEmail,
        //     subject: `Reminder: Homework "${homework.title}" due soon`,
        //     html: `
        //       <h2>Homework Reminder</h2>
        //       <p>Hi ${student?.name || 'Student'},</p>
        //       <p>This is a reminder about your homework assignment: <strong>${homework.title}</strong></p>
        //       <p>Deadline: <strong>${new Date(homework.deadline).toLocaleString()}</strong></p>
        //       <p><a href="${homeworkUrl}">Click here to view your homework</a></p>
        //       <p>Best regards,<br>${teacherName}</p>
        //     `
        //   })
        // });

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('homework_assignments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', homework.id);

        if (updateError) {
          console.error(`[HOMEWORK-REMINDERS] Error updating homework ${homework.id}:`, updateError);
          results.push({ id: homework.id, success: false, error: updateError.message });
        } else {
          results.push({ id: homework.id, success: true });
        }
      } catch (error) {
        console.error(`[HOMEWORK-REMINDERS] Error processing homework ${homework.id}:`, error);
        results.push({ id: homework.id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[HOMEWORK-REMINDERS] Processed ${results.length} reminders, ${successCount} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${results.length} homework reminders`,
        successCount,
        totalCount: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HOMEWORK-REMINDERS] Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
