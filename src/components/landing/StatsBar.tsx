import React from 'react';

const stats = [
  { value: '2,000+', label: 'worksheets generated' },
  { value: '29', label: 'exercise types' },
  { value: '15+', label: 'countries' },
];

const StatsBar: React.FC = () => {
  return (
    <section className="bg-background border-y border-border py-8">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0">
        {stats.map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <div className="hidden sm:block w-px h-8 bg-border mx-8" />}
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default StatsBar;
