import React, { useState, useEffect } from 'react';
import { Star, Lock, PlayCircle, ArrowDown, BookOpen, Brain, Calendar, BarChart2, ClipboardCheck, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const unlockFeatures = [
  { icon: BookOpen, label: 'Homework & AI Grading' },
  { icon: Brain, label: 'Smart Flashcards' },
  { icon: Calendar, label: 'Lesson Calendar' },
  { icon: BarChart2, label: 'Student Progress Tracking' },
  { icon: ClipboardCheck, label: 'Placement Tests' },
  { icon: Share2, label: 'Interactive Sharing' },
];

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HeroHeadline: React.FC = () => {
  const [dayIndex, setDayIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDayIndex(i => (i + 1) % 7);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const scrollToForm = () => {
    const formSection = document.getElementById('worksheet-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative pt-10 pb-2 px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/50 via-background to-background"></div>

      <div className="max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-3 leading-[1.1]">
          <span className="whitespace-nowrap">
            Stop wasting{' '}
            <span
              className="relative inline-block overflow-hidden"
              style={{ height: '1.2em', verticalAlign: 'text-bottom', minWidth: '3.5em' }}
            >
              <span
                key={dayIndex}
                className="inline-block animate-day-enter text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600"
              >
                {days[dayIndex]}
              </span>
            </span>
            {' '}evenings
          </span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
            on lesson prep.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
          AI creates complete, personalized worksheets for your 1-on-1 lessons.
          29 exercise types. Ready in 2 minutes.
        </p>

        {/* CTA Area */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Button
            onClick={scrollToForm}
            size="lg"
            className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Generate Your First Worksheet — Free
            <ArrowDown className="ml-2 h-5 w-5" />
          </Button>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-foreground">4.9/5 Rating</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-border rounded-full"></div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              <span>No signup needed</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-border rounded-full"></div>
            <div className="flex items-center gap-1.5">
              <PlayCircle className="h-4 w-4" />
              <span>Takes 2 minutes</span>
            </div>
          </div>
        </div>

        {/* Unlock features ticker */}
        <div className="w-full max-w-2xl mx-auto overflow-hidden border border-border rounded-2xl bg-secondary/60 py-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-1.5 px-4">
            Create a free account to unlock
          </p>
          <div className="flex overflow-hidden">
            <div className="flex animate-marquee whitespace-nowrap">
              {[...unlockFeatures, ...unlockFeatures].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-foreground/80 mx-4 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                  <span>{label}</span>
                  <span className="mx-3 text-muted-foreground/40">·</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroHeadline;
