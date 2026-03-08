import React from 'react';
import { Sparkles, Star, Lock, PlayCircle, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroHeadline: React.FC = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById('worksheet-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative pt-20 pb-16 px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/50 via-background to-background"></div>
      
      <div className="max-w-4xl mx-auto text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-4 py-1.5 text-sm font-medium mb-8 shadow-sm">
          <Sparkles className="h-4 w-4" />
          Trusted by 200+ English Teachers
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
          Stop wasting Sunday evenings <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
            on lesson prep.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          AI creates complete, personalized worksheets for your 1-on-1 lessons. 
          29 exercise types. Ready in 2 minutes.
        </p>

        {/* CTA Area */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <Button 
            onClick={scrollToForm}
            size="lg" 
            className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Generate Your First Worksheet — Free
            <ArrowDown className="ml-2 h-5 w-5" />
          </Button>
          
          {/* Trust Badges Inline */}
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
      </div>
    </section>
  );
};

export default HeroHeadline;