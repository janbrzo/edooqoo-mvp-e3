/**
 * VersionSelector - Lets student choose between Short and Full Welcome Test
 */

import { Clock, Sparkles, Zap, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WELCOME_TEST_SHORT_QUESTIONS_COUNT, WELCOME_TEST_TOTAL_QUESTIONS } from '@/data/welcomeTestQuestions';

interface VersionSelectorProps {
  onSelect: (version: 'short' | 'full') => void;
}

export function VersionSelector({ onSelect }: VersionSelectorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-xl w-full space-y-5">
        <div className="text-center mb-6">
          <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Welcome Test</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose which version you'd like to take
          </p>
        </div>

        <Card
          className="cursor-pointer border-2 hover:border-primary/50 transition-all hover:shadow-md"
          onClick={() => onSelect('short')}
        >
          <CardContent className="py-5 px-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Quick Version</h3>
                  <Badge variant="secondary" className="text-xs">~15 min</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {WELCOME_TEST_SHORT_QUESTIONS_COUNT} key questions covering all areas
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚡ Faster but gives your teacher less detailed information, which may affect how quickly they can personalize your lessons.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-2 border-primary/30 hover:border-primary transition-all hover:shadow-md bg-primary/5"
          onClick={() => onSelect('full')}
        >
          <CardContent className="py-5 px-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Complete Version</h3>
                  <Badge variant="default" className="text-xs">~30 min</Badge>
                  <Badge variant="outline" className="text-xs text-primary border-primary">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {WELCOME_TEST_TOTAL_QUESTIONS} questions for a comprehensive learning profile
                </p>
                <p className="text-xs text-primary">
                  ✨ Gives your teacher complete information to create the best possible learning experience for you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
