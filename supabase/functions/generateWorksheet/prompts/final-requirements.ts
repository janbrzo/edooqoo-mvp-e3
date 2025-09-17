/**
 * Final requirements section - EXACT content from original prompt
 * Lines 480-492 from original index.ts
 */

export const getFinalRequirements = (hasGrammarFocus: boolean) => {
  return `
CRITICAL REQUIREMENTS VERIFICATION:
1. Exercise 1 (reading): MUST have content more than 300 words. Analyze the lessonTopic, lessonGoal, grammarFocus and additionalInformation to determine the most appropriate text format (article, review, interview, story, email, etc.). The reading text should exemplify the format students will encounter or create based on the lesson objectives.
2. Exercise 2 (true-false): EXACTLY 10 statements ALL directly based on the reading text from Exercise 1. NO general knowledge questions. MUST be directly based on the reading text from Exercise 1. All statements should test comprehension of specific information, details, and facts mentioned in the reading passage. DO NOT include general knowledge questions.
3. Exercise 3 (matching): EXACTLY 10 items to match.
4. Exercise 4 (fill-in-blanks): EXACTLY 10 sentences and 10 words in word bank.
5. Exercise 5 (multiple-choice): EXACTLY 10 questions with 4 options each. All 4 options must be completely different from each other – no duplicates or similar variations allowed. Only one option per question is correct.
6. Exercise 6 (dialogue): AT LEAST 10 dialogue exchanges and EXACTLY 10 expressions.
7. Exercise 7 (discussion): EXACTLY 10 discussion questions.
8. Exercise 8 (error-correction): EXACTLY 10 sentences with errors.
9. Vocabulary sheet: EXACTLY 15 terms with definitions.
${hasGrammarFocus ? `10. Grammar Rules: Must include 4-7 grammar rules with title, explanation, and 3 examples each.` : ''}

RETURN ONLY VALID JSON. NO MARKDOWN. NO ADDITIONAL TEXT.`;
};