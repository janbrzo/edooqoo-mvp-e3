import { useState, useEffect } from 'react';

const hints = [
  "Input quality equals worksheet quality",
  "More context and clear requirements mean better worksheet",
  "Worksheet creator works only with what you write. Not with what you think",
  "Short inputs give generic worksheets",
  "More context in all 4 fields equals better worksheets",
  "Less context means more generic tasks",
  "Better input means better worksheets",
  "Fill in all 4 fields for best results",
  "Be specific to get useful worksheets",
  "More context equals less editing later",
  "Input context quality shapes the final worksheet",
  "AI cannot guess your idea. Write it!",
  "Short context gives average results",
  "Clear context creates better lessons",
  "Worksheet creator follows instructions, not thoughts."
];

export default function TypewriterHint() {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentHint = hints[currentHintIndex];
    const words = currentHint.split(' ');
    
    if (isTyping) {
      // Typing effect - 2 seconds total for all words
      const typingDuration = 2000; // 2 seconds
      const wordDelay = typingDuration / words.length;
      
      if (displayedWords.length < words.length) {
        const timeout = setTimeout(() => {
          setDisplayedWords(words.slice(0, displayedWords.length + 1));
        }, wordDelay);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, wait 2 seconds then move to next
        setIsTyping(false);
        const pauseTimeout = setTimeout(() => {
          setDisplayedWords([]);
          setCurrentHintIndex((prev) => (prev + 1) % hints.length);
          setIsTyping(true);
        }, 2000); // 2 second pause
        return () => clearTimeout(pauseTimeout);
      }
    }
  }, [displayedWords, currentHintIndex, isTyping]);

  return (
    <div className="h-6 mb-2">
      <p className="text-sm font-medium text-red-600">
        {displayedWords.join(' ')}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
}
