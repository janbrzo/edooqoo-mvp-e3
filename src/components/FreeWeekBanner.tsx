import React from 'react';
import { isFreeCustomDemoWeek, getFreeWeekEndDateString } from '@/utils/promoUtils';

/**
 * FreeWeekBanner component displays a promotional banner during FREE DEMO WEEK
 * Shows only when the promotion is active based on isFreeCustomDemoWeek()
 */
export const FreeWeekBanner: React.FC = () => {
  // Only show banner if FREE DEMO WEEK is currently active
  if (!isFreeCustomDemoWeek()) {
    return null;
  }

  const endDateString = getFreeWeekEndDateString();

  return (
    <div className="bg-green-500 text-white text-center py-2 px-4 text-sm font-medium">
      🎁 FREE DEMO WEEK 🎉 ⏰ TILL: {endDateString} 23:59 UTC+0
    </div>
  );
};