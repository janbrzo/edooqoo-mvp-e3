/**
 * FREE DEMO WEEK Promotion Utils
 * Handles checking if the FREE DEMO WEEK promotion is active
 */

// FREE DEMO WEEK dates (UTC+0)
const FREE_DEMO_WEEK_START = new Date('2025-09-23T00:00:00.000Z'); // Start: 23.09.2025 00:00 UTC+0
const FREE_DEMO_WEEK_END = new Date('2025-09-28T10:59:59.999Z');   // End: 28.09.2025 23:59 UTC+0 (TEST DATE)
// After testing, change to: new Date('2025-10-05T23:59:59.999Z'); // Final: 5.10.2025 23:59 UTC+0

/**
 * Check if FREE DEMO WEEK promotion is currently active
 * @returns {boolean} True if the promotion is active, false otherwise
 */
export const isFreeCustomDemoWeek = (): boolean => {
  const now = new Date();
  console.log('🎁 FREE DEMO WEEK CHECK:', {
    now: now.toISOString(),
    start: FREE_DEMO_WEEK_START.toISOString(),
    end: FREE_DEMO_WEEK_END.toISOString(),
    isActive: now >= FREE_DEMO_WEEK_START && now <= FREE_DEMO_WEEK_END
  });
  
  return now >= FREE_DEMO_WEEK_START && now <= FREE_DEMO_WEEK_END;
};

/**
 * Get the end date of the FREE DEMO WEEK for display purposes
 * @returns {Date} The end date of the promotion
 */
export const getFreeWeekEndDate = (): Date => {
  return FREE_DEMO_WEEK_END;
};

/**
 * Get formatted end date string for display
 * @returns {string} Formatted end date string
 */
export const getFreeWeekEndDateString = (): string => {
  return FREE_DEMO_WEEK_END.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

/**
 * Check if promotion ends today
 * @returns {boolean} True if promotion ends today
 */
export const isLastDayOfFreeWeek = (): boolean => {
  const now = new Date();
  const endDate = new Date(FREE_DEMO_WEEK_END);
  
  return now.getUTCFullYear() === endDate.getUTCFullYear() &&
         now.getUTCMonth() === endDate.getUTCMonth() &&
         now.getUTCDate() === endDate.getUTCDate();
};