import React from 'react';
import { Sparkles, Users, BarChart3 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const cards = [
  {
    icon: Sparkles,
    title: '29 Exercise Types',
    description: 'Reading, gap fill, matching, listening, picture-based, discussion, error correction — and 22 more.',
  },
  {
    icon: Users,
    title: 'Student Hub',
    description: 'Students get their own portal with worksheets, flashcards, homework, and lesson booking.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'CEFR-tagged skill tracking. See what each student knows and what to teach next.',
  },
];

const ValueCards: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="bg-secondary/50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className={`text-2xl font-bold text-center text-foreground mb-8 animate-fade-up ${isVisible ? 'visible' : ''}`}>
          Everything you need to teach better
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <div
              key={card.title}
              className={`bg-background rounded-xl p-6 border border-border hover:shadow-md transition-shadow animate-fade-up stagger-${i + 1} ${isVisible ? 'visible' : ''}`}
            >
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
                <card.icon className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueCards;
