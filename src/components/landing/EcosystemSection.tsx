import React from 'react';
import { Zap, BookOpen, Brain, Calendar, ClipboardCheck, Share2 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const features = [
  {
    icon: Zap,
    title: 'Live Sessions',
    description: 'Teach with the worksheet open. Real-time scoring, timer per exercise, AI evaluation of open answers.',
  },
  {
    icon: BookOpen,
    title: 'Homework + AI Grading',
    description: 'Assign exercises with deadlines. Students submit online. AI scores automatically — you review and adjust.',
  },
  {
    icon: Brain,
    title: 'Smart Flashcards',
    description: 'Auto-generated from every worksheet. SM-2 spaced repetition. Students study through their Hub.',
  },
  {
    icon: Calendar,
    title: 'Lesson Calendar',
    description: 'Students book lessons through your public page. Auto-syncs with Google Calendar. Reminders included.',
  },
  {
    icon: ClipboardCheck,
    title: 'Welcome Test',
    description: 'New student? Send a placement test. AI assesses their level automatically so you know where to start.',
  },
  {
    icon: Share2,
    title: 'Share & Collaborate',
    description: 'Share interactive worksheet links. Students solve exercises online. Track who completed what.',
  },
];

const EcosystemSection: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} id="features" className="bg-background py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold text-foreground mb-2 animate-fade-up ${isVisible ? 'visible' : ''}`}>
            More than a worksheet generator
          </h2>
          <p className={`text-sm text-muted-foreground max-w-2xl mx-auto animate-fade-up stagger-1 ${isVisible ? 'visible' : ''}`}>
            edooqoo saves you time at every step — from lesson prep to student management
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`bg-secondary/50 rounded-xl p-5 border border-border hover:shadow-md transition-shadow animate-fade-up stagger-${i + 1} ${isVisible ? 'visible' : ''}`}
            >
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
                <feature.icon className="h-4.5 w-4.5 text-violet-600" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
