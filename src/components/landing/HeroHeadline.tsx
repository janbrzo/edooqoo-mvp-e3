import React from 'react';
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

const HeroHeadline: React.FC = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById('worksheet-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative pt-14 pb-4 px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/50 via-background to-background"></div>

      <div className="max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
          Stop wasting Sunday evenings <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
            on lesson prep.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          AI creates complete, personalized worksheets for your 1-on-1 lessons.
          29 exercise types. Ready in 2 minutes.
        </p>

        {/* CTA Area */}
        <div className="flex flex-col items-center gap-5 mb-6">
          <Button
            onClick={scrollToForm}
            size="lg"
            className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Generate Your First Worksheet — Free
            <ArrowDown className="ml-2 h-5 w-5" />
          </Button>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm font-medium text-muted-foreground">
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

        {/* Unlock features block */}
        <div className="inline-flex flex-col items-center gap-2.5 bg-secondary/60 border border-border rounded-2xl px-5 py-3 max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Create a free account to also unlock
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {unlockFeatures.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-sm text-foreground/80">
                <Icon className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroHeadline;
