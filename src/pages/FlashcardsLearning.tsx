import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FlashcardDisplay } from '@/components/flashcards/FlashcardDisplay';
import { LearningProgress } from '@/components/flashcards/LearningProgress';
import { SessionSummary } from '@/components/flashcards/SessionSummary';
import { useFlashcardLearning } from '@/hooks/useFlashcardLearning';

export default function FlashcardsLearning() {
  const { token } = useParams<{ token: string }>();
  const [setData, setSetData] = useState<any>(null);
  const [learnerEmail, setLearnerEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const learning = useFlashcardLearning(
    setData?.id || '',
    learnerEmail
  );

  useEffect(() => {
    if (token) {
      fetchSetData();
    }
  }, [token]);

  const fetchSetData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_flashcard_set_by_share_token', {
        p_share_token: token,
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setSetData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching flashcard set:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (learnerEmail.trim()) {
      setEmailSubmitted(true);
      learning.loadSession();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!setData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Flashcard set not found</h1>
          <p className="text-muted-foreground">This link may be invalid or expired</p>
        </div>
      </div>
    );
  }

  if (!emailSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{setData.title}</h1>
            {setData.description && (
              <p className="text-muted-foreground">{setData.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              By {setData.teacher_first_name} {setData.teacher_last_name}
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                value={learnerEmail}
                onChange={(e) => setLearnerEmail(e.target.value)}
                placeholder="Enter your email to track progress"
                required
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll save your progress using this email
              </p>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Start Learning ({setData.cards_count} cards)
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (learning.isSessionComplete) {
    return (
      <SessionSummary
        stats={learning.sessionStats}
        onRestart={learning.restartSession}
        setTitle={setData.title}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <LearningProgress
          current={learning.currentIndex + 1}
          total={learning.cards.length}
          stats={learning.sessionStats}
        />

        <div className="flex-1 flex items-center justify-center py-8">
          {learning.currentCard && (
            <FlashcardDisplay
              card={learning.currentCard}
              onReview={learning.submitReview}
              nativeLanguage={setData.student_native_language}
            />
          )}
        </div>
      </div>
    </div>
  );
}
