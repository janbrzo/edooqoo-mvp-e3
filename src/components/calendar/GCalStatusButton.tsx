import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { supabase } from '@/integrations/supabase/client';

export function GCalStatusButton() {
  const { user, isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.id || !isRegisteredUser) return;
    supabase.from('calendar_gcal_tokens').select('id').eq('teacher_id', user.id).maybeSingle()
      .then(({ data }) => setGcalConnected(!!data));
  }, [user?.id, isRegisteredUser]);

  if (!isRegisteredUser) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" disabled className="opacity-50 text-xs h-8">
            🗓️ Google Calendar
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Log in to connect Google Calendar</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (gcalConnected === null) return null;

  if (gcalConnected) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 text-xs h-8 flex items-center">
        🗓️ GCal Synced
      </Badge>
    );
  }

  return (
    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => navigate('/calendar/settings#gcal')}>
      🗓️ Connect GCal
    </Button>
  );
}
