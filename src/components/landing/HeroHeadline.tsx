import React from 'react';
import { Sparkles, Star } from 'lucide-react';

const HeroHeadline: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-violet-50/80 to-white text-center max-w-3xl mx-auto pt-16 pb-8 px-4">
      {/* Pill badge */}
      <div className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 rounded-full px-3 py-1 text-xs font-medium mb-5">
        <Sparkles className="h-3.5 w-3.5" />
        AI Worksheet Generator
      </div>

      {/* Headline */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
        Create personalized English lessons{' '}
        <span className="text-violet-600">in 2 minutes</span>
      </h1>

      {/* Value props */}
      <p className="text-sm text-muted-foreground mb-5">
        29 exercise types · Audio &amp; picture-based · Ready in 2 minutes · No signup needed
      </p>

      {/* Social proof */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="italic">"Saves me 10+ hours every week"</span>
        <span className="hidden sm:inline">—</span>
        <span className="hidden sm:inline">Used by 200+ teachers</span>
      </div>
    </section>
  );
};

export default HeroHeadline;
