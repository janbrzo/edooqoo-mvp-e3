import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { HomeworkNotificationEmail } from "../_shared/email-templates/homework-notification.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendHomeworkEmailRequest {
  homeworkId: string;
  studentEmail: string;
  updateStudentEmail?: boolean; // If true, update student's email in database
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { homeworkId, studentEmail, updateStudentEmail } = (await req.json()) as SendHomeworkEmailRequest;

    console.log(`Sending homework email for homework ${homeworkId} to ${studentEmail}`);

    // Fetch homework details with related data
    const { data: homework, error: homeworkError } = await supabase
      .from("homework_assignments")
      .select(
        `
        *,
        students:student_id (
          id,
          name,
          english_level
        ),
        profiles:teacher_id (
          first_name,
          last_name,
          email
        )
      `,
      )
      .eq("id", homeworkId)
      .eq("teacher_id", user.id)
      .single();

    if (homeworkError || !homework) {
      throw new Error("Homework not found or unauthorized");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      throw new Error("Invalid email format");
    }

    // Update student email if requested
    if (updateStudentEmail && homework.students?.id) {
      const { error: updateError } = await supabase
        .from("students")
        .update({ student_email: studentEmail })
        .eq("id", homework.students.id)
        .eq("teacher_id", user.id);

      if (updateError) {
        console.error("Failed to update student email:", updateError);
        // Continue anyway - email sending is more important
      } else {
        console.log(`Updated student ${homework.students.id} email to ${studentEmail}`);
      }
    }

    // Generate homework link
    const homeworkLink = `${req.headers.get("origin") || "https://your-domain.com"}/homework/${homework.share_token}`;

    // Get teacher name
    const teacherName = homework.profiles?.first_name
      ? `${homework.profiles.first_name} ${homework.profiles.last_name || ""}`.trim()
      : homework.profiles?.email || "Your Teacher";

    // Get number of exercises
    const selectedExercises = homework.selected_exercises as any[];
    const exercisesCount = Array.isArray(selectedExercises) ? selectedExercises.length : 0;

    // Render email template
    const html = await renderAsync(
      React.createElement(HomeworkNotificationEmail, {
        studentName: homework.students?.name || "Student",
        teacherName,
        homeworkTitle: homework.title,
        homeworkLink,
        deadline: homework.deadline,
        selectedExercisesCount: exercisesCount,
      }),
    );

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${teacherName} <onboarding@edooqoo.com>`, // TODO: Use your verified domain
      to: [studentEmail],
      subject: `New Homework: ${homework.title}`,
      html,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailData?.id,
        message: "Homework email sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in send-homework-email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
