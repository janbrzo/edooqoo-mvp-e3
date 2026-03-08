import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

const FinalCTA: React.FC = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById('worksheet-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="bg-gradient-to-br from-violet-600 to-indigo-700 py-12 text-center">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-2">
          Ready to save 10+ hours this week?
        </h2>
        <p className="text-violet-200 text-sm mb-6">
          No signup needed. No credit card. Just try it.
        </p>
        <Button
          onClick={scrollToForm}
          size="lg"
          className="bg-white text-violet-700 hover:bg-violet-50 rounded-full font-semibold"
        >
          Create Your First Worksheet — Free
          <ArrowUp className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </section>
  );
};

export default FinalCTA;
