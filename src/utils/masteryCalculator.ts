/**
 * ============================================
 * Per-Item Mastery Calculator Utility
 * ============================================
 * 
 * Centralized logic for calculating individual item mastery (0-100)
 * for closed exercises. Used by:
 * - useInteractiveSharedWorksheet
 * - useInteractiveHomework
 * - NanoSkillMasteryModal
 */

export interface ItemEvaluation {
  question_index: number;  // Index pytania w ćwiczeniu (0-based)
  name: string;
  reason: string;
  mastery: number;
  hasValue?: boolean;
}

export interface NanoSkillData {
  name: string;
  reason: string;
  confidence?: number;
}

// Exercise type classification
export const CLOSED_EXERCISE_TYPES = [
  'multiple-choice', 'multiple-choice-audio', 'multiple-choice-picture',
  'true-false', 'true-false-audio', 'matching', 'matching-halves',
  'fill-in-blanks', 'fill-in-blanks-audio', 'categorize',
  'complete-word', 'negative-prefixes', 'odd-one-out', 'synonyms-antonyms',
  'synonyms', 'antonyms'
];

export const OPEN_ENDED_EXERCISE_TYPES = [
  'reading', 'discussion', 'describe', 'answer-questions', 
  'dialogue', 'answer-questions-audio', 'describe-picture',
  'answer-questions-picture', 'paraphrasing', 'speaking',
  'sentence-transformation', 'essay', 'gap-text', 'word-order',
  'listening-comprehension'
];

/**
 * Safely extract nano_skill from an item (handles various data structures)
 */
export const safeGetNanoSkill = (item: any): NanoSkillData | null => {
  if (!item) return null;
  
  let ns = item?.nano_skill || item?.nanoSkill;
  
  // Handle arrays - Gemini sometimes returns nano_skill as array
  if (Array.isArray(ns)) {
    ns = ns[0];
  }
  
  if (ns && ns.name) {
    return {
      name: ns.name,
      reason: ns.reason || '',
      confidence: ns.confidence
    };
  }
  return null;
};

/**
 * Check if exercise type is closed (auto-gradable)
 */
export const isClosedExerciseType = (exerciseType: string): boolean => {
  const normalizedType = exerciseType.replace('-picture', '').replace('-audio', '');
  return CLOSED_EXERCISE_TYPES.some(t => 
    exerciseType === t || normalizedType === t.replace('-audio', '').replace('-picture', '')
  );
};

/**
 * Calculate mastery for a SINGLE item in a closed exercise
 * Returns 0-100 or null for open-ended items
 */
export const calculateItemMastery = (
  exerciseType: string,
  exerciseData: any,
  itemIndex: number,
  studentAnswer: any
): number | null => {
  // No answer = null mastery
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
    return null;
  }

  // Open-ended exercises can't be auto-graded
  if (!isClosedExerciseType(exerciseType)) {
    return null;
  }

  let isCorrect: boolean | null = null;

  try {
    // Multiple choice (including variants)
    if (exerciseType.startsWith('multiple-choice') && exerciseData?.questions?.[itemIndex]) {
      const question = exerciseData.questions[itemIndex];
      if (question.options && Array.isArray(question.options)) {
        const correctOption = question.options.find((o: any) => o.correct === true);
        if (correctOption) {
          isCorrect = studentAnswer === correctOption.text || 
                     studentAnswer === correctOption.label ||
                     studentAnswer === correctOption.value;
        }
      }
    }

    // True/False
    if (exerciseType.startsWith('true-false') && exerciseData?.statements?.[itemIndex]) {
      const statement = exerciseData.statements[itemIndex];
      const expectedValue = statement.isTrue;
      if (expectedValue !== undefined) {
        let normalizedAnswer: boolean | null = null;
        if (typeof studentAnswer === 'boolean') {
          normalizedAnswer = studentAnswer;
        } else if (studentAnswer === 'true' || studentAnswer === true) {
          normalizedAnswer = true;
        } else if (studentAnswer === 'false' || studentAnswer === false) {
          normalizedAnswer = false;
        }
        if (normalizedAnswer !== null) {
          isCorrect = normalizedAnswer === expectedValue;
        }
      }
    }

    // Matching
    if (exerciseType === 'matching' && exerciseData?.items?.[itemIndex]) {
      const item = exerciseData.items[itemIndex];
      const correctMatch = item.correct_match || item.match;
      if (correctMatch !== undefined) {
        isCorrect = studentAnswer === correctMatch;
      }
    }

    // Matching Halves - needs deterministic shuffle calculation
    if (exerciseType === 'matching-halves' && exerciseData?.sentence_halves?.[itemIndex]) {
      const allHalves = exerciseData.sentence_halves;
      const halvesKey = allHalves.map((h: any) => (h.first_half || '').trim()).join('|');
      const worksheetId = exerciseData?.worksheetId || 'default';
      const seed = `${worksheetId}-halves-${halvesKey}`;
      
      const shuffleIndicesWithSeed = (length: number, seedStr: string): number[] => {
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
          const char = seedStr.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        const random = () => {
          hash = (hash * 1103515245 + 12345) & 0x7fffffff;
          return (hash % 1000) / 1000;
        };
        
        const indices = Array.from({ length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices;
      };
      
      const shuffledIndices = shuffleIndicesWithSeed(allHalves.length, seed);
      const shuffledPosition = shuffledIndices.indexOf(itemIndex);
      
      if (shuffledPosition !== -1 && typeof studentAnswer === 'string') {
        const correctLetter = String.fromCharCode(65 + shuffledPosition);
        isCorrect = studentAnswer.toUpperCase() === correctLetter;
      }
    }

    // Fill in blanks
    if (exerciseType.startsWith('fill-in-blanks') && exerciseData?.sentences?.[itemIndex]) {
      const sentence = exerciseData.sentences[itemIndex];
      const correctAnswer = typeof sentence === 'string' ? null : (sentence.answer || sentence.correct || sentence.missing_word);
      if (correctAnswer && typeof studentAnswer === 'string') {
        isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      }
    }

    // Categorize
    if (exerciseType === 'categorize' && exerciseData?.categories && exerciseData?.items) {
      const item = exerciseData.items[itemIndex];
      if (item) {
        const itemWord = typeof item === 'string' ? item : (item.word || item.text);
        let correctCategoryIndex = -1;
        exerciseData.categories.forEach((cat: any, catIdx: number) => {
          if (cat.correct_items) {
            const found = cat.correct_items.some((ci: any) => {
              const ciWord = typeof ci === 'string' ? ci : (ci.word || ci.text);
              return ciWord && itemWord && ciWord.toLowerCase() === itemWord.toLowerCase();
            });
            if (found) correctCategoryIndex = catIdx;
          }
        });
        if (correctCategoryIndex !== -1) {
          const studentCatIdx = typeof studentAnswer === 'number' ? studentAnswer : parseInt(studentAnswer);
          isCorrect = studentCatIdx === correctCategoryIndex;
        }
      }
    }

    // Complete word
    if (exerciseType === 'complete-word' && exerciseData?.words?.[itemIndex]) {
      const word = exerciseData.words[itemIndex];
      const correctWord = typeof word === 'string' ? word : (word.word || word.complete || word.complete_word);
      if (correctWord && typeof studentAnswer === 'string') {
        isCorrect = studentAnswer.toLowerCase().trim() === correctWord.toLowerCase().trim();
      }
    }

    // Negative prefixes
    if (exerciseType === 'negative-prefixes' && exerciseData?.words?.[itemIndex]) {
      const word = exerciseData.words[itemIndex];
      const correctPrefix = typeof word === 'string' ? null : (word.prefix || word.answer);
      if (correctPrefix && typeof studentAnswer === 'string') {
        isCorrect = studentAnswer.toLowerCase().trim() === correctPrefix.toLowerCase().trim();
      }
    }

    // Odd one out
    if (exerciseType === 'odd-one-out' && exerciseData?.questions?.[itemIndex]) {
      const question = exerciseData.questions[itemIndex];
      const correctAnswer = question.odd_word || question.correct || question.correct_answer;
      if (correctAnswer) {
        isCorrect = String(studentAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
      }
    }

    // Synonyms/Antonyms
    if ((exerciseType === 'synonyms-antonyms' || exerciseType === 'synonyms' || exerciseType === 'antonyms') && exerciseData?.items?.[itemIndex]) {
      const item = exerciseData.items[itemIndex];
      // For letter-based answers (A, B, C...), check definition match
      if (item.definition && typeof studentAnswer === 'string' && studentAnswer.length === 1) {
        const allDefinitions = exerciseData.items.map((i: any) => i.definition);
        const correctIndex = allDefinitions.indexOf(item.definition);
        if (correctIndex !== -1) {
          const correctLetter = String.fromCharCode(65 + correctIndex);
          isCorrect = studentAnswer.toUpperCase().trim() === correctLetter;
        }
      } else {
        // Direct text answer
        const correctAnswer = item.answer || item.synonym || item.antonym;
        if (correctAnswer && typeof studentAnswer === 'string') {
          isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        }
      }
    }

    // Return mastery based on correctness
    if (isCorrect === true) {
      return 100; // Correct answer = 100%
    } else if (isCorrect === false) {
      return 0; // Incorrect answer = 0%
    }

    return null; // Can't determine
  } catch (e) {
    console.error('[calculateItemMastery] Error:', e);
    return null;
  }
};

/**
 * Get exercise items array from exercise data (handles various structures)
 */
export const getExerciseItems = (exerciseData: any): any[] => {
  if (!exerciseData) return [];
  return exerciseData.questions || 
         exerciseData.items || 
         exerciseData.sentences || 
         exerciseData.statements || 
         exerciseData.words || 
         exerciseData.sentence_halves ||
         exerciseData.expressions ||
         exerciseData.prompts ||
         [];
};

/**
 * Build per-item evaluations for an exercise
 * Returns array of { name, reason, mastery } for each item with nano_skill
 */
export const buildItemEvaluations = (
  exerciseData: any,
  answers: Record<string | number, any>,
  exerciseType: string,
  aiEvaluations?: Record<number, { quality_score?: number }> | null
): ItemEvaluation[] | null => {
  if (!exerciseData) return null;
  
  const itemEvaluations: ItemEvaluation[] = [];
  const items = getExerciseItems(exerciseData);
  
  items.forEach((item: any, idx: number) => {
    const nanoSkill = safeGetNanoSkill(item);
    if (!nanoSkill) return;
    
    // PROBLEM 1 FIX: Skip questions without student answers
    const studentAnswer = answers[idx];
    const hasStudentAnswer = studentAnswer !== undefined && 
                             studentAnswer !== null && 
                             String(studentAnswer).trim() !== '';
    if (!hasStudentAnswer) return; // Don't log empty answers
    
    let itemMastery: number | null = null;
    
    // For open-ended, use AI evaluation if available
    if (!isClosedExerciseType(exerciseType)) {
      if (aiEvaluations?.[idx]?.quality_score !== undefined) {
        itemMastery = Math.round(aiEvaluations[idx].quality_score! * 100);
      } else {
        // Has answer but no AI eval yet - mark as pending (50%)
        itemMastery = 50;
      }
    } else {
      // Closed exercise - calculate automatically
      itemMastery = calculateItemMastery(exerciseType, exerciseData, idx, studentAnswer);
    }
    
    itemEvaluations.push({
      question_index: idx,  // Indeks pytania dla precyzyjnego mapowania
      name: nanoSkill.name,
      reason: nanoSkill.reason,
      mastery: itemMastery ?? 0,
      hasValue: itemMastery !== null
    });
  });
  
  return itemEvaluations.length > 0 ? itemEvaluations : null;
};

/**
 * Calculate overall mastery for a closed exercise (average of item masteries)
 */
export const calculateOverallMastery = (
  exerciseType: string,
  exerciseData: any,
  answers: Record<string | number, any>
): number | null => {
  if (!exerciseData || !answers || Object.keys(answers).length === 0) return null;
  if (!isClosedExerciseType(exerciseType)) return null;
  
  const items = getExerciseItems(exerciseData);
  let correct = 0;
  let total = 0;
  
  items.forEach((item: any, idx: number) => {
    const mastery = calculateItemMastery(exerciseType, exerciseData, idx, answers[idx]);
    if (mastery !== null) {
      if (mastery >= 50) correct++;
      total++;
    }
  });
  
  return total > 0 ? Math.round((correct / total) * 100) : null;
};
