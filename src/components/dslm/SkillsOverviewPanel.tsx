import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSkillMetrics, SkillMetric, CategoryMetric } from '@/hooks/useSkillMetrics';
import { TrendingUp, TrendingDown, Minus, BarChart3, List, ArrowUpDown, Filter } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

interface SkillsOverviewPanelProps {
  studentId: string;
  teacherId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  reading: 'Reading',
  speaking: 'Speaking',
  writing: 'Writing',
  listening: 'Listening',
  pronunciation: 'Pronunciation',
  other: 'Other',
};

const CATEGORY_ORDER = ['grammar', 'vocabulary', 'reading', 'speaking', 'writing', 'listening', 'pronunciation'];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function MasteryBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : value >= 25 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right">{Math.round(value)}%</span>
    </div>
  );
}

function formatSkillName(name: string): string {
  if (name.startsWith('flashcard:')) return `Flashcard ${name.slice(10, 18)}…`;
  // ns.grammar.conditional_2_comprehension -> Conditional 2 Comprehension
  const parts = name.split('.');
  const last = parts[parts.length - 1];
  return last
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function SkillsOverviewPanel({ studentId, teacherId }: SkillsOverviewPanelProps) {
  const { skills, categories, isLoading, error } = useSkillMetrics(studentId, teacherId);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'mastery' | 'events' | 'name'>('mastery');
  const [showFlashcards, setShowFlashcards] = useState(false);

  // Filter out flashcard skills from the main list (too many, show separately)
  const nanoSkills = useMemo(() => {
    let filtered = skills.filter(s => showFlashcards || !s.skill_name.startsWith('flashcard:'));
    if (selectedCategory) {
      filtered = filtered.filter(s => s.skill_category === selectedCategory);
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'mastery') return b.current_mastery - a.current_mastery;
      if (sortBy === 'events') return b.total_events - a.total_events;
      return a.skill_name.localeCompare(b.skill_name);
    });
  }, [skills, selectedCategory, sortBy, showFlashcards]);

  // Radar chart data - only main categories
  const radarData = useMemo(() => {
    return CATEGORY_ORDER
      .map(cat => {
        const found = categories.find(c => c.category === cat);
        return {
          category: CATEGORY_LABELS[cat] || cat,
          mastery: found ? found.avg_mastery : 0,
          events: found ? found.total_events : 0,
        };
      })
      .filter(d => d.events > 0 || categories.length > 0);
  }, [categories]);

  // Stats
  const totalSkills = skills.filter(s => !s.skill_name.startsWith('flashcard:')).length;
  const flashcardCount = skills.filter(s => s.skill_name.startsWith('flashcard:')).length;
  const overallMastery = categories.length > 0
    ? Math.round(categories.reduce((sum, c) => sum + c.avg_mastery, 0) / categories.length)
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading skill metrics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error loading metrics: {(error as Error).message}
        </CardContent>
      </Card>
    );
  }

  if (skills.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No skill data yet</h3>
          <p className="text-muted-foreground">
            Skills will appear here after the student completes worksheets, homework, or flashcard reviews.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{overallMastery}%</p>
            <p className="text-xs text-muted-foreground">Overall Mastery</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{totalSkills}</p>
            <p className="text-xs text-muted-foreground">Nano Skills</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{flashcardCount}</p>
            <p className="text-xs text-muted-foreground">Flashcards Tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart + Category List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        {radarData.length >= 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Skills Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Mastery"
                    dataKey="mastery"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CATEGORY_ORDER.map(cat => {
              const metric = categories.find(c => c.category === cat);
              if (!metric) return null;
              return (
                <button
                  key={cat}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedCategory === cat ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{CATEGORY_LABELS[cat]}</span>
                      <TrendIcon trend={metric.trend} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {metric.skill_count} skills
                    </Badge>
                  </div>
                  <MasteryBar value={metric.avg_mastery} />
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Nano Skills List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <List className="h-4 w-4" />
              {selectedCategory ? `${CATEGORY_LABELS[selectedCategory]} Skills` : 'All Nano Skills'}
              <Badge variant="outline">{nanoSkills.length}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={showFlashcards ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFlashcards(!showFlashcards)}
              >
                {showFlashcards ? 'Hide' : 'Show'} Flashcards
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy(sortBy === 'mastery' ? 'events' : sortBy === 'events' ? 'name' : 'mastery')}
              >
                <ArrowUpDown className="h-3 w-3 mr-1" />
                {sortBy === 'mastery' ? 'By Mastery' : sortBy === 'events' ? 'By Events' : 'By Name'}
              </Button>
              {selectedCategory && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                  <Filter className="h-3 w-3 mr-1" /> Clear Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {nanoSkills.slice(0, 100).map(skill => (
              <div key={skill.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                <TrendIcon trend={skill.trend} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{formatSkillName(skill.skill_name)}</p>
                  <p className="text-xs text-muted-foreground">
                    {skill.total_events} event{skill.total_events !== 1 ? 's' : ''} · {skill.skill_category}
                  </p>
                </div>
                <div className="w-32">
                  <MasteryBar value={skill.current_mastery} />
                </div>
              </div>
            ))}
            {nanoSkills.length > 100 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Showing 100 of {nanoSkills.length} skills
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
