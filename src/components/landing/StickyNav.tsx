import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { GCalStatusButton } from '@/components/calendar/GCalStatusButton';
import { HomeworkNotificationBadge } from '@/components/homework/HomeworkNotificationBadge';
import { Menu, GraduationCap, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StickyNavProps {
  isRegisteredUser: boolean;
  tokenLeft: number;
  user: any;
  scrollToPricing: () => void;
}

const StickyNav: React.FC<StickyNavProps> = ({ isRegisteredUser, tokenLeft, user, scrollToPricing }) => {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const Logo = () => (
    <Link to="/" className="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
      edooqoo
    </Link>
  );

  if (isRegisteredUser) {
    if (isMobile) {
      return (
        <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border h-14 px-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Tokens: {tokenLeft}
            </Badge>
            <HomeworkNotificationBadge />
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-3 pt-8">
                  <Button asChild variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                    <Link to="/dashboard"><GraduationCap className="h-4 w-4 mr-2" />Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                    <Link to="/profile"><User className="h-4 w-4 mr-2" />Profile</Link>
                  </Button>
                  <GCalStatusButton />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      );
    }

    return (
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border h-14 px-6 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            Tokens: {tokenLeft}
          </Badge>
          <HomeworkNotificationBadge />
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard"><GraduationCap className="h-4 w-4 mr-2" />Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/profile"><User className="h-4 w-4 mr-2" />Profile</Link>
          </Button>
          <GCalStatusButton />
        </div>
      </nav>
    );
  }

  // Anonymous nav
  if (isMobile) {
    return (
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border h-14 px-4 flex items-center justify-between">
        <Logo />
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-3 pt-8">
              <Button variant="ghost" size="sm" onClick={() => { scrollToPricing(); setSheetOpen(false); }}>
                Pricing
              </Button>
              <Button asChild variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 rounded-full relative" onClick={() => setSheetOpen(false)}>
                <Link to="/signup">
                  Start Free
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white animate-pulse text-[10px] px-1.5 py-0.5 border-0">
                    2 FREE
                  </Badge>
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border h-14 px-6 flex items-center justify-between">
      <Logo />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={scrollToPricing} className="text-muted-foreground hover:text-foreground">
          Pricing
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/login">Log in</Link>
        </Button>
        <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 rounded-full relative">
          <Link to="/signup">
            Start Free
            <Badge className="absolute -top-2 -right-2 bg-green-500 text-white animate-pulse text-[10px] px-1.5 py-0.5 border-0">
              2 FREE
            </Badge>
          </Link>
        </Button>
      </div>
    </nav>
  );
};

export default StickyNav;
