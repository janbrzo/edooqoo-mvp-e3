import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { Calendar } from 'lucide-react';

export function GCalStatusButton() {
  const { isRegisteredUser } = useAuthFlow();
  const navigate = useNavigate();

  if (!isRegisteredUser) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" disabled className="opacity-50 text-xs h-8">
            <Calendar className="h-3.5 w-3.5 mr-1" /> Calendar
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>Use the Calendar for teachers after logging in. You can also sync it with Google Calendar.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => navigate('/calendar')}>
      🗓️ Calendar
    </Button>
  );
}
