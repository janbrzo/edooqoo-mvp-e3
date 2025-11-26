import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LearningCard, ReviewQuality } from '@/types/flashcards';

interface FlashcardDisplayProps {
  card: LearningCard;
  onReview: (cardId: string, quality: ReviewQuality) => void;
  nativeLanguage: string;
}

export function FlashcardDisplay({ card, onReview, nativeLanguage }: FlashcardDisplayProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleReview = (quality: ReviewQuality) => {
    onReview(card.card_id, quality);
    setIsFlipped(false);
  };

  return (
    <div className="w-full max-w-2xl">
      <Card
        className="cursor-pointer transition-all duration-300 hover:shadow-lg min-h-[300px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          {!isFlipped ? (
            <div className="text-center space-y-4">
              <div className="text-sm text-muted-foreground mb-2">English</div>
              <div className="text-3xl font-bold">{card.front_text}</div>
              {card.front_example && (
                <div className="text-lg text-muted-foreground italic mt-4">
                  "{card.front_example}"
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-8">
                Click to reveal answer
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 w-full">
              <div className="text-sm text-muted-foreground mb-2">{nativeLanguage}</div>
              <div className="text-3xl font-bold">{card.back_text}</div>
              
              <div className="pt-8 space-y-3">
                <p className="text-sm text-muted-foreground">How well did you know this?</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReview(0);
                    }}
                  >
                    😰 Again
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-green-200 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReview(2);
                    }}
                  >
                    ✅ I Know This
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
