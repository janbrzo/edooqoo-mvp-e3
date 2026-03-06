import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudentHubLayout } from '@/components/student-hub/StudentHubLayout';
import { getSavedHubEmail } from '@/hooks/useStudentHubData';
import { StudentBookingsSection } from '@/components/calendar/StudentBookingsSection';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { Loader2 } from 'lucide-react';

const StudentHubLessons = () => {
  const { teacherToken } = useParams<{ teacherToken: string }>();
  const navigate = useNavigate();
  const email = getSavedHubEmail();

  useEffect(() => { if (!email) navigate('/my'); }, [email, navigate]);

  const { settings, loading: settingsLoading } = useCalendarSettings();

  if (!email || !teacherToken) return null;

  // Reuse StudentBookingsSection with the token and email
  // We need minimal settings for the component
  const minimalSettings = useMemo(() => settings || {
    min_cancellation_hours: 24,
    allow_student_reschedule: false,
    buffer_minutes: 0,
    default_booking_mode: 'requires_confirmation',
    default_lesson_duration_minutes: 60,
    display_start_hour: 7,
    display_end_hour: 22,
    timezone: 'Europe/Warsaw',
    notify_on_booking: true,
    notify_on_cancellation: true,
    public_calendar_enabled: true,
    public_calendar_token: teacherToken,
    enforce_slot_limit: false,
    max_slots_per_student_per_week: null,
    teacher_id: '',
    gcal_integration_enabled: false,
    gcal_default_color: '1',
    gcal_default_reminder_minutes: 30,
    gcal_on_cancel_action: 'update',
    payment_tracking_enabled: false,
    default_lesson_price: null,
    currency: 'USD',
    notify_email_on_booking: true,
    notify_email_on_cancellation: true,
    notify_email_on_confirmation: true,
    notify_email_on_rejection: true,
    notify_email_on_reschedule: true,
    notify_email_on_lesson_created: true,
    notify_payment_reminder: false,
    notify_student_reminder_hours: 24,
    gcal_color_booked: '9',
    gcal_color_available: '2',
    gcal_color_pending: '5',
    gcal_color_completed: '10',
    gcal_color_no_show: '6',
    gcal_sync_mode: 'booked_only',
    auto_create_meet_link: false,
  }, [settings, teacherToken]);

  return (
    <StudentHubLayout>
      <div className="space-y-6">
        <StudentBookingsSection
          settings={minimalSettings as any}
          token={teacherToken}
          availableSlots={[]}
          onBookingChanged={() => {}}
          defaultEmail={email}
        />
      </div>
    </StudentHubLayout>
  );
};

export default StudentHubLessons;
