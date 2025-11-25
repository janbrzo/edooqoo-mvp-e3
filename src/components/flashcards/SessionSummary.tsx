import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LearningSessionStats } from '@/types/flashcards';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SessionSummaryProps {
  stats: LearningSessionStats;
  onRestart: () => void;
  setTitle: string;
}

export function SessionSummary({ stats, onRestart, setTitle }: SessionSummaryProps) {
  const accuracy = stats.reviewedCards > 0
    ? Math.round((stats.correctAnswers / stats.reviewedCards) * 100)
    : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            🎉 Session Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">{setTitle}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {stats.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {stats.incorrectAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold mb-1">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>

          <div className="space-y-2">
            <Button onClick={onRestart} className="w-full" size="lg">
              Study Again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.close()}
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
