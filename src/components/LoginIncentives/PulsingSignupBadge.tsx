import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Incentive #8: Pulsing Badge on Sign Up button
 * Shows "2 FREE" badge with pulse animation
 */
export const PulsingSignupButton = () => {
  return (
    <Button asChild size="sm" className="relative">
      <Link to="/signup">
        Get Started Free
        <Badge className="absolute -top-2 -right-2 bg-green-500 hover:bg-green-500 text-[10px] px-1.5 py-0.5 animate-pulse">
          2 FREE
        </Badge>
      </Link>
    </Button>
  );
};
