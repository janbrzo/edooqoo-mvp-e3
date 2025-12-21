import { Users } from 'lucide-react';

/**
 * Incentive #4: Social Proof Badge
 * Shows "Join 500+ teachers" near Generate button
 */
export const SocialProofBadge = () => {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Users className="h-3.5 w-3.5" />
      <span>Join 500+ teachers creating worksheets daily</span>
    </div>
  );
};
