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
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentHint = hints[currentHintIndex];
    
    if (isTyping) {
      // Typing effect - 3 seconds total for the whole text
      const typingDuration = 3000; // 3 seconds
      const charDelay = typingDuration / currentHint.length;
      
      if (displayedText.length < currentHint.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentHint.slice(0, displayedText.length + 1));
        }, charDelay);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, wait 2 seconds then move to next
        setIsTyping(false);
        const pauseTimeout = setTimeout(() => {
          setDisplayedText("");
          setCurrentHintIndex((prev) => (prev + 1) % hints.length);
          setIsTyping(true);
        }, 2000); // 2 second pause
        return () => clearTimeout(pauseTimeout);
      }
    }
  }, [displayedText, currentHintIndex, isTyping]);

  return (
    <div className="h-6 mb-2">
      <p className="text-sm font-medium text-red-600">
        {displayedText}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
}
