import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, GraduationCap, History } from 'lucide-react';

/**
 * Incentive #7: Upgrade Your Teaching Banner
 * Shows benefits below worksheet for anonymous users
 */
export const UpgradeTeachingBanner = () => {
  return (
    <Card className="mx-auto max-w-4xl mt-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Save className="h-5 w-5 text-primary" />
            <span>Save worksheets</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>Track students</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <History className="h-5 w-5 text-primary" />
            <span>View history</span>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/signup">Create Free Account</Link>
        </Button>
      </div>
    </Card>
  );
};
