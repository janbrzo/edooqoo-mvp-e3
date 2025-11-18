import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { HomeworkReminderEmail } from "../_shared/email-templates/homework-reminder.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[HOMEWORK-REMINDERS] Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find homework assignments that need reminders
    // Criteria:
    // - Created more than 24 hours ago
    // - Has a deadline that hasn't passed yet OR is slightly overdue (up to 7 days)
    // - Has not been completed
    // - Reminder hasn't been sent yet OR last reminder was sent more than 24h ago
    // - Student has email address
    const reminderThreshold = new Date();
    reminderThreshold.setHours(reminderThreshold.getHours() - 24);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: homeworkToRemind, error: fetchError } = await supabase
      .from("homework_assignments")
      .select(
        `
        id,
        title,
        deadline,
        share_token,
        teacher_id,
        student_id,
        reminder_sent_at,
        completed_at,
        reminder_hours,
        created_at,
        students (
          id,
          name,
          student_email
        ),
        profiles (
          email,
          first_name,
          last_name
        )
      `,
      )
      .not("deadline", "is", null)
      .is("completed_at", null) // Not completed
      .gt("deadline", sevenDaysAgo.toISOString()); // Deadline within last 7 days (allows overdue)

    if (fetchError) {
      console.error("[HOMEWORK-REMINDERS] Error fetching homework:", fetchError);
      throw fetchError;
    }

    console.log(`[HOMEWORK-REMINDERS] Found ${homeworkToRemind?.length || 0} homework assignments (before filtering)`);

    if (!homeworkToRemind || homeworkToRemind.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No homework reminders to send",
          count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Filter: only homework where student has email AND reminder should be sent based on reminder_hours
    const now = new Date();
    const filteredHomework = homeworkToRemind.filter((hw) => {
      const student = Array.isArray(hw.students) ? hw.students[0] : hw.students;
      if (!student?.student_email) return false;
      if (!hw.deadline) return false;
      
      const deadlineDate = new Date(hw.deadline);
      const reminderDelay = hw.reminder_hours || 24; // Default 24h if not set
      const reminderTime = new Date(deadlineDate.getTime() - reminderDelay * 60 * 60 * 1000);
      
      // Check if it's time to send reminder
      if (now < reminderTime) return false; // Not yet time
      
      // If no reminder sent yet, send it
      if (!hw.reminder_sent_at) return true;
      
      // Check if last reminder was sent more than reminderDelay hours ago (for resends)
      const lastReminder = new Date(hw.reminder_sent_at);
      const hoursSinceLastReminder = (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastReminder > reminderDelay;
    });

    console.log(
      `[HOMEWORK-REMINDERS] Filtered to ${filteredHomework.length} homework with student emails and reminder criteria`,
    );

    // Process each homework
    const results = [];
    for (const homework of filteredHomework) {
      try {
        const student = Array.isArray(homework.students) ? homework.students[0] : homework.students;
        const teacher = Array.isArray(homework.profiles) ? homework.profiles[0] : homework.profiles;

        const studentName = student?.name || "Student";
        const studentEmail = student?.student_email;
        const teacherName =
          teacher?.first_name && teacher?.last_name
            ? `${teacher.first_name} ${teacher.last_name}`
            : teacher?.email || "Your teacher";

        const deadline = new Date(homework.deadline);
        const now = new Date();
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const homeworkUrl = `${req.headers.get("origin") || supabaseUrl}/homework/${homework.share_token}`;

        console.log(`[HOMEWORK-REMINDERS] Sending reminder for homework "${homework.title}" to ${studentEmail}`);

        // Render email template
        const html = await renderAsync(
          React.createElement(HomeworkReminderEmail, {
            studentName,
            teacherName,
            homeworkTitle: homework.title,
            homeworkLink: homeworkUrl,
            deadline: homework.deadline,
            daysUntilDeadline,
          }),
        );

        // Send email via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: `${teacherName} <noreply@edooqoo.com>`, // TODO: Use your verified domain
          to: [studentEmail!],
          subject:
            daysUntilDeadline < 0
              ? `⚠️ Overdue Homework: ${homework.title}`
              : `⏰ Reminder: ${homework.title} due ${daysUntilDeadline === 0 ? "today" : `in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""}`}`,
          html,
        });

        if (emailError) {
          console.error(`[HOMEWORK-REMINDERS] Failed to send email for homework ${homework.id}:`, emailError);
          results.push({
            homeworkId: homework.id,
            success: false,
            error: emailError.message,
          });
          continue;
        }

        console.log(`[HOMEWORK-REMINDERS] Email sent successfully for homework ${homework.id}:`, emailData);

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from("homework_assignments")
          .update({
            reminder_sent_at: new Date().toISOString(),
          })
          .eq("id", homework.id);

        if (updateError) {
          console.error(
            `[HOMEWORK-REMINDERS] Failed to update reminder status for homework ${homework.id}:`,
            updateError,
          );
          results.push({
            homeworkId: homework.id,
            success: false,
            error: "Failed to update reminder status",
          });
        } else {
          results.push({
            homeworkId: homework.id,
            studentName,
            studentEmail,
            homeworkTitle: homework.title,
            emailId: emailData?.id,
            success: true,
            reminderSent: true,
          });
        }
      } catch (error: any) {
        console.error(`[HOMEWORK-REMINDERS] Error processing homework ${homework.id}:`, error);
        results.push({
          homeworkId: homework.id,
          success: false,
          error: error.message || "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`[HOMEWORK-REMINDERS] Completed: ${successCount}/${results.length} reminders sent successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount} homework reminders`,
        count: successCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[HOMEWORK-REMINDERS] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
