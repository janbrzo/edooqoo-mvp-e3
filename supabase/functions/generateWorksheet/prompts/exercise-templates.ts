/**
 * Exercise templates - dynamically compose exercises based on count
 * EXACT content from original prompt - modularized for flexibility
 */

import { 
  exerciseFunctions, 
  exerciseOrder, 
  getVocabularySheet 
} from './individual-exercises.ts';

export const getExerciseTemplates = (
  hasGrammarFocus: boolean, 
  grammarFocus: string | null, 
  exerciseCount: number = 8, 
  selectedExercises?: string[],
  hasSelectedImage: boolean = false // ETAP 2: Add hasSelectedImage parameter
) => {
  let finalExercises: string[];
  
  // Use custom selected exercises if provided, otherwise use default order
  if (selectedExercises && selectedExercises.length > 0) {
    // Validate selected exercises exist in our functions
    finalExercises = selectedExercises.filter(type => {
      const hasFunction = type in exerciseFunctions;
      return hasFunction;
    }).slice(0, exerciseCount);
  } else {
    // Select the first N exercises from the default order
    finalExercises = exerciseOrder.slice(0, exerciseCount);
  }
  
  // ETAP 2: Generate exercise JSON fragments dynamically based on picture mode
  const exerciseFragments = finalExercises.map((type, index) => {
    const exerciseFunction = exerciseFunctions[type as keyof typeof exerciseFunctions];
    
    // For picture exercises, use placeholder versions when image is selected
    if (hasSelectedImage && (type === 'describe-picture' || type === 'answer-questions')) {
      if (type === 'describe-picture') {
        return `    {
      "type": "describe-picture",
      "title": "Exercise ${index + 1}: Describe the Picture",
      "icon": "fa-image",
      "time": 10,
      "instructions": "[Generate instructions that reference the provided image and encourage students to describe what they see]",
      "image_url": "[USE THE IMAGE URL FROM IMAGE CONTEXT SECTION]",
      "image_description": "[Describe what you see in the provided image from IMAGE CONTEXT]",
      "prompts": [
        "[Generate 8 prompts based on specific visible elements in the image]",
        "[Each prompt should reference concrete details from the image]",
        "[Use lesson vocabulary where applicable]",
        "[Encourage description of colors, objects, people, atmosphere]",
        "[Ask about spatial relationships in the image]",
        "[Question about the story or context the image suggests]",
        "[Prompt about emotional tone or mood of the image]",
        "[Ask students to compare elements within the image]"
      ],
      "useful_vocabulary": ["[Generate vocabulary relevant to what's visible in the image]"],
      "photographer": "[USE PHOTOGRAPHER NAME FROM IMAGE CONTEXT]",
      "photographer_url": "[USE PHOTOGRAPHER URL FROM IMAGE CONTEXT]",
      "teacher_tip": "[Generate a tip about encouraging descriptive language and referencing the provided image]"
    }`;
      } else if (type === 'answer-questions') {
        return `    {
      "type": "answer-questions",
      "title": "Exercise ${index + 1}: Answer Questions About the Picture",
      "icon": "fa-question-circle",
      "time": 8,
      "instructions": "[Generate instructions that ask students to answer questions based on what they see in the provided image]",
      "image_url": "[USE THE IMAGE URL FROM IMAGE CONTEXT SECTION]",
      "questions": [
        {"question": "[Generate question about visible elements in the image]", "focus": "[focus area]"},
        {"question": "[Generate question about colors, objects, or people in the image]", "focus": "[focus area]"},
        {"question": "[Generate question about the setting or location shown]", "focus": "[focus area]"},
        {"question": "[Generate question about actions or activities visible]", "focus": "[focus area]"},
        {"question": "[Generate question about the atmosphere or mood]", "focus": "[focus area]"},
        {"question": "[Generate question comparing elements in the image]", "focus": "[focus area]"},
        {"question": "[Generate question about what might happen next]", "focus": "[focus area]"},
        {"question": "[Generate question about student's personal reaction to the image]", "focus": "[focus area]"},
        {"question": "[Generate question using lesson vocabulary related to image]", "focus": "[focus area]"},
        {"question": "[Generate question about details students might notice]", "focus": "[focus area]"}
      ],
      "photographer": "[USE PHOTOGRAPHER NAME FROM IMAGE CONTEXT]",
      "photographer_url": "[USE PHOTOGRAPHER URL FROM IMAGE CONTEXT]",
      "teacher_tip": "[Generate a tip about encouraging students to reference specific visual details]"
    }`;
      }
    }
    
    // For non-picture exercises, use standard function
    return exerciseFunction();
  });
  return `20. Generate a structured JSON worksheet with this EXACT format:
EXAMPLE OUTPUT (IGNORE CONTENT, FOCUS ON STRUCTURE):

IMPORTANT: Include a "warmup_questions" array with exactly 4 conversation starter questions that are personal and opinion-based, directly related to the lesson topic. Make questions 1-2 generic and questions 3-4 specific to engage students at the beginning of the lesson.

{
  "title": "In a restaurant",
  "subtitle": "Making a complaint about your dish in a restaurant: adjectives practice",
  "introduction": "In this lesson, you'll practice a restaurant role-play, learn how to order food, and make a complaint about an incorrect order. You'll also review grammar related to adjectives in their comparative and superlative forms.",
  "warmup_questions": [
    "Generic question 1 related to the lesson topic",
    "Generic question 2 related to the lesson topic",
    "Specific question 3 directly about the lesson context",
    "Specific question 4 directly about the lesson context"
  ],
  ${hasGrammarFocus ? `"grammar_rules": {
    "title": "Grammar Focus: ${grammarFocus}",
    "introduction": "Adjectives are words that describe or modify nouns, providing information about qualities such as size, color, shape, age, and many others. When we want to compare people, objects, or ideas, we use adjectives in their comparative or superlative forms.\\n\\nComparatives are used to compare two things or people, showing that one has a higher or lower degree of a particular quality than the other. For example, when saying \\"John is taller than Mike,\\" the adjective \\"taller\\" is in the comparative form, indicating a comparison between two individuals. Comparatives are often followed by the word \\"than\\" to introduce the second element of comparison.\\n\\nSuperlatives, on the other hand, are used to describe the extreme or highest degree of a quality among three or more things or people. For example, \\"Anna is the tallest in her class\\" uses the superlative form \\"tallest\\" to indicate that Anna has the greatest height compared to all others in the group. Superlatives are usually preceded by the definite article \\"the\\".\\n\\nThe formation of comparatives and superlatives depends largely on the length and ending of the adjective. One-syllable adjectives usually form comparatives and superlatives by adding the suffixes \\"-er\\" and \\"-est\\". For adjectives with two syllables or more, especially those with three or more syllables, the words \\"more\\" and \\"most\\" are used before the adjective instead of adding suffixes.\\n\\nSome adjectives have irregular comparative and superlative forms that must be memorized as they do not follow standard patterns. For instance, \\"good\\" becomes \\"better\\" (comparative) and \\"best\\" (superlative).\\n\\nIn addition to indicating comparisons of difference, adjectives can also be used to express equality, using the structure \\"as + adjective + as\\" to show that two things share the same degree of a quality.\\n\\nUnderstanding and correctly using comparatives and superlatives is essential for effective communication, enabling speakers and writers to accurately compare qualities and express degrees of difference or similarity.",
    "rules": [
      {
        "title": "Forming Comparatives for One-Syllable Adjectives",
        "explanation": "Most one-syllable adjectives form their comparative by adding the suffix \\"-er\\" to the base adjective. If the adjective ends with a single consonant preceded by a single vowel, double the consonant before adding \\"-er\\". When the adjective ends with \\"-e\\", just add \\"-r\\".",
        "examples": ["food → colder food", "dish → spicier dish", "service → slower service"]
      },
      {
        "title": "Forming Superlatives for One-Syllable Adjectives",
        "explanation": "One-syllable adjectives form the superlative by adding the suffix \\"-est\\" to the base adjective. Similar spelling rules apply as with comparatives.",
        "examples": ["food → coldest food", "dish → spiciest dish", "service → slowest service"]
      },
      {
        "title": "Forming Comparatives and Superlatives for Adjectives with Two or More Syllables",
        "explanation": "Adjectives with two or more syllables generally form comparatives and superlatives by using \\"more\\" before the adjective for comparatives, and \\"most\\" before the adjective for superlatives. Some two-syllable adjectives can also take \\"-er\\" and \\"-est\\" if they end with \\"-y\\" or certain other endings.",
        "examples": ["delicious → more delicious → most delicious", "uncomfortable → more uncomfortable → most uncomfortable", "friendly staff → friendlier staff → friendliest staff"]
      },
      {
        "title": "Irregular Comparatives and Superlatives",
        "explanation": "Some adjectives have irregular forms that do not follow the usual patterns and must be memorized. These are common and important adjectives.",
        "examples": ["good service → better service → best service", "bad coffee → worse coffee → worst coffee", "far table → farther table → farthest table"]
      },
      {
        "title": "Using \\"than\\" in Comparatives",
        "explanation": "Comparative adjectives are usually followed by \\"than\\" to introduce the second element being compared.",
        "examples": ["This soup is colder than it should be.", "The second waiter was more polite than the first one."]
      },
      {
        "title": "Using \\"the\\" with Superlatives",
        "explanation": "Superlative adjectives are usually preceded by the definite article \\"the\\" to show that one thing is the highest or lowest in a group.",
        "examples": ["That was the worst pasta I've ever eaten.", "This is the most expensive restaurant in the area."]
      },
      {
        "title": "Comparing Equality with \\"as...as\\"",
        "explanation": "To show that two things are equal in some quality, use the structure \\"as + adjective + as\\".",
        "examples": ["This dish is not as hot as I expected.", "The new waiter is as friendly as the old one."]
      }
    ]
  },` : ''}
  "exercises": [
${exerciseFragments.join(',\n')}
  ],
${getVocabularySheet()}
}
END OF EXAMPLE`;
};