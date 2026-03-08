import React from 'react';
import { Star } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const testimonials = [
  {
    quote: 'Sunday evenings used to be stressful. Now I prep a full week of lessons over morning coffee.',
    name: 'Anna K.',
    role: 'Private English Tutor',
    initials: 'AK',
  },
  {
    quote: '29 exercise types means I never run out of ideas. My students love the variety.',
    name: 'Mark T.',
    role: 'Online ESL Teacher',
    initials: 'MT',
  },
  {
    quote: 'The Student Hub is a game-changer. My students practice flashcards and do homework without me chasing them.',
    name: 'Sarah L.',
    role: 'Business English Coach',
    initials: 'SL',
  },
];

const TestimonialsRow: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="bg-secondary/50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className={`text-2xl font-bold text-center text-foreground mb-8 animate-fade-up ${isVisible ? 'visible' : ''}`}>
          Loved by teachers worldwide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`bg-background rounded-xl p-5 border border-border animate-fade-up stagger-${i + 1} ${isVisible ? 'visible' : ''}`}
            >
              <div className="flex mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground italic mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsRow;
