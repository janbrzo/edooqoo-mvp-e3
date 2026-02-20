/**
 * Core instructions for worksheet generation - EXACT content from original prompt
 * Lines 110-158 from original index.ts
 */

/**
 * Helper function to generate dynamic exercise list instruction
 * @param hasSelectedImage - If true, transforms picture-compatible exercises to -picture versions
 */
const generateExerciseListInstruction = (
  selectedExercises?: string[],
  exerciseCount: number = 8,
  hasSelectedImage?: boolean,
  hasSelectedAudio?: boolean,
  exerciseFocusMap?: Record<string, string>,
) => {
  if (selectedExercises && selectedExercises.length > 0) {
    let orderedExercises = [...selectedExercises].slice(0, exerciseCount);

    // SORT: Picture exercises ALWAYS first, then audio exercises, then others
    if (hasSelectedImage || hasSelectedAudio) {
      const pictureExercises = orderedExercises.filter((ex) => ex.endsWith("-picture"));
      const audioExercises = orderedExercises.filter((ex) => ex.endsWith("-audio") || ex === "listening-comprehension");
      const otherExercises = orderedExercises.filter(
        (ex) => !ex.endsWith("-picture") && !ex.endsWith("-audio") && ex !== "listening-comprehension",
      );

      // Priority: picture > audio > others
      orderedExercises = [...pictureExercises, ...audioExercises, ...otherExercises];
    }

    // Append focus tags if exerciseFocusMap has entries
    const exerciseListWithTags = orderedExercises.map(ex => {
      if (exerciseFocusMap && exerciseFocusMap[ex]) {
        return `${ex} [${exerciseFocusMap[ex].toUpperCase()} FOCUS]`;
      }
      return ex;
    });

    const exerciseList = exerciseListWithTags.join(", ");
    return `Use EXACTLY these exercise types in this EXACT ORDER: ${exerciseList}`;
  }

  // Fallback to default exercises (no picture/audio transformation for defaults)
  const defaultExercises = [
    "reading",
    "true-false",
    "matching",
    "fill-in-blanks",
    "multiple-choice",
    "dialogue",
    "discussion",
    "error-correction",
  ];
  const exerciseList = defaultExercises.slice(0, exerciseCount).join(", ");
  return `Use EXACTLY these exercise types in this EXACT ORDER: ${exerciseList}${exerciseCount === 6 ? " (use only first 6)" : ""}`;
};

export const getCoreInstructions = (
  hasGrammarFocus: boolean,
  grammarFocus: string | null,
  formData: any,
  exerciseCount: number = 8,
  selectedExercises?: string[],
  selectedImage?: any,
  selectedAudio?: any,
  exerciseFocusMap?: Record<string, string>,
) => {
  const hasSelectedImage = !!selectedImage;
  const hasSelectedAudio = !!selectedAudio;

  // Extract image description before building the prompt to ensure it's properly embedded
  const imageDescription = selectedImage?.detailedDescription || "";
  const audioTranscript = selectedAudio?.transcript || "";
  const audioDuration = selectedAudio?.duration || 0;

  return `You are an expert ESL English language teacher specialized in creating context-specific, structured, comprehensive, high-quality English language worksheets for individual (one-on-one) tutoring sessions.
          Your goal: produce a worksheet so compelling that a private tutor will happily pay for it and actually use it.
          Your output will be used immediately in a 1-on-1 lesson; exercises must be ready-to-print without structural edits.

CRITICAL RULES AND REQUIREMENTS:
1. Create EXACTLY ${exerciseCount} exercises. No fewer, no more. Number them Exercise 1 through Exercise ${exerciseCount}.
2. ${generateExerciseListInstruction(selectedExercises, exerciseCount, hasSelectedImage, hasSelectedAudio, exerciseFocusMap)}
3. All exercises should be closely related to the specified lessonTopic, lessonGoal, grammarFocus and additionalInformation
4. Include specific vocabulary, expressions, and language structures related to the specified lessonTopic, lessonGoal, grammarFocus and additionalInformation. The 'englishLevel' must dictate the complexity of vocabulary and grammar according to CEFR scale
5. Keep exercise instructions clear and concise. Students should understand tasks without additional explanation.
6. DO NOT USE PLACEHOLDERS. Write full, complete, high-quality content for every field.

NATURAL HUMAN-LIKE CONTENT REQUIREMENTS:
7. Write all content as if created by an experienced human teacher, not AI. Use natural, authentic language that reflects real-world conversations and situations.
8. Avoid robotic, perfect, or overly polished AI-style language. Include natural imperfections, contractions, and conversational flow that real people use.
9. Create realistic scenarios with genuine human problems, emotions, and motivations. People should sound like real individuals with personalities, not textbook characters.
10. Use everyday vocabulary mixed with target language appropriately. Avoid consistently "educational" tone - make it engaging and relatable.
11. Include cultural references, current events, and contemporary contexts that students actually encounter in real life.
12. Make dialogue sound like authentic conversations people would actually have, with natural pauses, interruptions, and realistic speech patterns.

CRITICAL DIVERSITY REQUIREMENTS:
13. NEVER repeat the same examples, scenarios, names, places, or contexts across different exercises within the same worksheet.
14. Use completely different characters, locations, and situations for each exercise. If Exercise 1 mentions "John at a restaurant," Exercise 2 cannot use restaurants, John, or similar dining scenarios.
15. Ensure vocabulary examples in different exercises cover diverse topics, professions, and life situations.
16. Vary the complexity and style of content across exercises while maintaining the appropriate English level.
17. Create unique, fresh content for each exercise type that doesn't echo or repeat themes from other exercises.

AUTHENTICITY CHECK:
18. Before generating content, ask yourself:
- Would a real person actually say/write this?
- Does this sound like something from real life, not a textbook?
- Are the scenarios believable and relatable?
- Do the characters have realistic motivations and personalities?
- Is the language natural and conversational, not artificial or perfect?

19. ADAPT TO USER'S INPUT: Carefully analyze all information from the USER MESSAGE. The 'lessonTopic' and 'lessonGoal' must define the theme of all exercises. The 'englishLevel' must dictate the complexity of vocabulary and grammar according to CEFR scale.

${
  hasGrammarFocus
    ? `
20. GRAMMAR FOCUS REQUIREMENT: The user has specified a grammar focus: "${grammarFocus}". You MUST:
    - ENSURE grammar complexity matches CERF level: "${formData.englishLevel}"
    - Include a "grammar_rules" section in the JSON with detailed explanation of this grammar topic
    - Design ALL exercises to practice and reinforce this specific grammar point
    - Ensure the reading text, vocabulary, and all exercises incorporate examples of this grammar
    - Make this grammar topic the central pedagogical focus of the entire worksheet
    -provide a detailed and comprehensive explanation about the grammatical topic, including a thorough introduction explaining its usage, importance, and general overview, written in the style of well-known grammar reference books (such as My Grammar Lab, Cambridge Grammar, or Virginia Evans).
`
    : `
20. NO GRAMMAR FOCUS: The user has not specified a grammar focus, so create a general worksheet focused on the topic and goal without emphasizing any particular grammar point.
`
}

${
  hasSelectedImage
    ? `
21. IMAGE CONTEXT FOR PICTURE EXERCISES: 
IMPORTANT: You have an AI-generated image with detailed description.
The following exercises MUST use this image: ${selectedExercises?.filter((ex) => ex.endsWith("-picture")).join(", ")}
For these picture-based exercises, use SPECIFIC DETAILS from the image description below (people, objects, colors, positions, actions). Each exercise must focus on different aspects of the image.
${imageDescription}
`
    : hasSelectedAudio
      ? `
21. AUDIO CONTEXT FOR LISTENING EXERCISES:
IMPORTANT: You have an AI-generated audio scenario with transcript.
The following exercises MUST use this audio: ${selectedExercises?.filter((ex) => ex.endsWith("-audio") || ex === "listening-comprehension").join(", ")}
For these audio-based exercises, use SPECIFIC DETAILS from the audio transcript below. Create questions that test listening comprehension, detail retention, and understanding of spoken context.
AUDIO TRANSCRIPT:
${audioTranscript || "[NO TRANSCRIPT AVAILABLE - Generate generic audio-based exercise]"}
AUDIO DURATION: ${audioDuration} seconds
`
      : ""
}

22. PEDAGOGICAL SKILL TAGGING (NANO_SKILL SYSTEM)
Each individual exercise item MUST include EXACTLY one nano_skill with its own confidence and its own reason.
A nano_skill represents the smallest observable and testable unit of language ability.
A nano_skill MUST be verifiable from a single learner answer without external context.
A nano_skill MUST NOT describe broad grammar topics, lesson goals, exercise types, or teaching strategies.
Confidence values MUST be in range 0.00–1.00 and express certainty that the item genuinely tests the skill.
Reason MUST explain why this specific item tests the skill, not how it should be taught.
nano_skill tagging MUST be logically consistent with lesson topic, lesson focus and exercise type.

NANO_SKILL NAMING CONVENTION - CRITICAL:
Format: ns.[topic_prefix].[skill_name]
The skill_name MUST describe the LINGUISTIC SKILL being tested, NOT the lesson context.
Keep names REUSABLE across different lessons and topics.
Do NOT include lesson-specific words (city names, food, travel, etc.).
Use 2-4 word descriptors separated by underscores.

Topic prefixes (use ONLY these):
GRAMMAR: ps=Past Simple, pc=Past Continuous, pp=Past Perfect, prs=Present Simple, prc=Present Continuous, prp=Present Perfect, prpc=Present Perfect Continuous, fs=Future Simple (will), fg=Future Going To, fc=Future Continuous, cond1=First Conditional, cond2=Second Conditional, cond3=Third Conditional, condm=Mixed Conditionals, passive=Passive Voice, rs=Reported Speech, rel=Relative Clauses, mod=Modal Verbs, ger_inf=Gerund vs Infinitive, phr=Phrasal Verbs, comp=Comparatives, sup=Superlatives, art=Articles, prep=Prepositions, wo=Word Order, neg=Negative Prefixes, wf=Word Formation
VOCABULARY: vocab=General Vocabulary, coll=Collocations, idiom=Idioms, syn=Synonyms, ant=Antonyms
SKILLS: reading=Reading, speaking=Speaking, writing=Writing, listening=Listening

If grammarFocus matches a topic above, use that prefix. Otherwise choose the most fitting prefix for what the item actually tests.

GOLDEN EXAMPLES per exercise type (nano_skill name only - your output must include full object with confidence and reason):
reading: ns.reading.main_idea_extraction, ns.reading.detail_extraction, ns.reading.inference_from_context, ns.reading.paraphrase_recognition, ns.reading.sequence_of_events, ns.reading.cause_effect_identification, ns.reading.character_emotion_analysis, ns.reading.vocabulary_in_context
true-false: ns.reading.paraphrase_recognition, ns.reading.negation_detection, ns.reading.detail_verification, ns.reading.inference_validation, ns.reading.fact_vs_opinion
matching: ns.vocab.definition_matching, ns.vocab.contextual_meaning, ns.vocab.word_category_recognition, ns.coll.verb_noun_pairing, ns.vocab.register_awareness
fill-in-blanks: ns.vocab.adjective_collocation, ns.vocab.contextual_word_choice, ns.vocab.semantic_field_selection, ns.[grammar_prefix].form_selection, ns.coll.fixed_expression
multiple-choice: ns.[grammar_prefix].form_recognition, ns.comp.irregular_form, ns.sup.long_adjective_form, ns.comp.short_adjective_form, ns.comp.adverb_form
dialogue: ns.speaking.polite_request, ns.speaking.making_complaint, ns.speaking.expressing_gratitude, ns.speaking.apologizing, ns.speaking.ordering_food, ns.speaking.asking_for_information
discussion: ns.speaking.opinion_expression, ns.speaking.justifying_preference, ns.speaking.narrating_past_experience, ns.speaking.comparison_and_contrast, ns.speaking.hypothetical_reasoning
error-correction: ns.[grammar_prefix].form_error_recognition, ns.[grammar_prefix].word_order_error, ns.comp.double_comparative_error, ns.sup.double_superlative_error
odd-one-out: ns.vocab.part_of_speech_recognition, ns.vocab.gerund_recognition, ns.vocab.semantic_category_identification
synonyms: ns.syn.adjective_synonym, ns.syn.verb_synonym, ns.syn.formal_informal_equivalent
antonyms: ns.ant.adjective_antonym, ns.ant.verb_antonym, ns.ant.gradable_opposite
sentence-transformation: ns.passive.active_to_passive, ns.rs.direct_to_indirect, ns.comp.not_as_as_structure, ns.sup.superlative_transformation, ns.cond1.unless_transformation
word-order: ns.wo.subject_verb_object, ns.wo.adverb_frequency_position, ns.wo.question_inversion, ns.wo.adjective_order
gap-text: ns.ps.irregular_verb_form, ns.prp.continuous_form, ns.cond2.subjunctive_were, ns.[grammar_prefix].verb_conjugation
negative-prefixes: ns.neg.prefix_un_selection, ns.neg.prefix_dis_selection, ns.neg.prefix_im_selection, ns.neg.prefix_in_selection, ns.neg.prefix_ir_selection
categorize: ns.vocab.semantic_categorization, ns.vocab.word_family_grouping, ns.vocab.register_categorization
paraphrasing: ns.writing.synonym_substitution, ns.writing.structural_paraphrase, ns.writing.meaning_preservation
complete-word: ns.vocab.vowel_pattern_recognition, ns.vocab.spelling_from_context
matching-halves: ns.reading.clause_connection, ns.reading.semantic_coherence, ns.[grammar_prefix].subordinate_clause
listening-comprehension: ns.listening.main_idea_identification, ns.listening.detail_extraction, ns.listening.speaker_identification, ns.listening.emotion_inference, ns.listening.sequence_of_events
describe-picture: ns.speaking.scene_description, ns.speaking.object_identification, ns.speaking.spatial_description
answer-questions: ns.speaking.opinion_expression, ns.speaking.narrating_past_experience, ns.[grammar_prefix].form_in_context

${exerciseFocusMap && Object.keys(exerciseFocusMap).length > 0 ? `
25. EXERCISE FOCUS TAGS:
    Some exercises above are tagged with [VOCABULARY FOCUS] or [GRAMMAR FOCUS]:
    - [VOCABULARY FOCUS]: This exercise MUST focus on topic-related vocabulary, word meanings, collocations, and lexical practice. Do NOT emphasize grammar structures in this exercise.
    - [GRAMMAR FOCUS]: This exercise MUST focus on practicing the specified grammar point (from grammarFocus field). Design items that require students to apply the grammar rule. If no grammarFocus is specified, focus on grammar structures naturally relevant to the topic.
    - Exercises WITHOUT a tag: Use your best judgment to balance vocabulary and grammar based on the lesson context.
` : ''}
26. ENSURE ALL INSTRUCTIONS ARE STRICTLY ADHERED TO AND THAT THE JSON IS COMPLETE AND VALID.
27. Check your work again before finalizing. Every part of the JSON must be intentional and correct.

  `;
};
