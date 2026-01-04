import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Gemini AI (primary model for faster generation)
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateTestRequest {
  studentId: string;
  teacherId: string;
  testType: 'placement' | 'progress_check' | 'skill_verification' | 'goal_check';
  linkedGoalId?: string;
  linkedElementIds?: string[];
  questionCount?: number;
  focusOnWeaknesses?: boolean;
  includeFlashcards?: boolean;
}

interface StudentData {
  name: string;
  english_level: string;
  main_goal: string;
  native_language?: string;
}

interface LearningElement {
  id: string;
  title: string;
  element_type: string;
  current_rating: number | null;
  description: string | null;
}

interface KnowledgeEntry {
  category: string;
  content: string;
}

interface FlashcardWithProgress {
  front_text: string;
  back_text: string;
  incorrect_count: number;
  correct_count: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: GenerateTestRequest = await req.json();
    const { 
      studentId, 
      teacherId, 
      testType, 
      linkedGoalId,
      linkedElementIds,
      questionCount = 10,
      focusOnWeaknesses = true,
      includeFlashcards = true
    } = requestData;

    console.log('Generating test for student:', studentId, 'type:', testType);

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('name, english_level, main_goal, native_language')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch learning elements (skills to test)
    let learningElements: LearningElement[] = [];
    if (linkedElementIds && linkedElementIds.length > 0) {
      const { data: elements } = await supabase
        .from('student_learning_elements')
        .select('id, title, element_type, current_rating, description')
        .in('id', linkedElementIds)
        .is('deleted_at', null);
      
      learningElements = elements || [];
    } else if (linkedGoalId) {
      // Get elements linked to the goal
      const { data: elements } = await supabase
        .from('student_learning_elements')
        .select('id, title, element_type, current_rating, description')
        .eq('goal_id', linkedGoalId)
        .is('deleted_at', null);
      
      learningElements = elements || [];
    } else {
      // Get all elements for this student with low ratings
      const { data: elements } = await supabase
        .from('student_learning_elements')
        .select('id, title, element_type, current_rating, description')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .or('current_rating.is.null,current_rating.lt.4')
        .limit(10);
      
      learningElements = elements || [];
    }

    // 3. Fetch knowledge entries (weaknesses, common mistakes)
    let knowledgeEntries: KnowledgeEntry[] = [];
    if (focusOnWeaknesses) {
      const { data: entries } = await supabase
        .from('student_knowledge_entries')
        .select('category, content')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .is('is_outdated', false)
        .in('category', ['Weaknesses', 'Common Mistakes', 'Needs Improvement', 'Problems'])
        .limit(20);
      
      knowledgeEntries = entries || [];
    }

    // 4. Fetch struggling flashcards
    let flashcards: FlashcardWithProgress[] = [];
    if (includeFlashcards) {
      // Get flashcard sets for this student
      const { data: sets } = await supabase
        .from('flashcard_sets')
        .select('id')
        .eq('student_id', studentId)
        .eq('teacher_id', teacherId)
        .is('deleted_at', null);

      if (sets && sets.length > 0) {
        const setIds = sets.map(s => s.id);
        
        // Get cards with progress
        const { data: cards } = await supabase
          .from('flashcard_cards')
          .select(`
            front_text,
            back_text,
            flashcard_progress (
              incorrect_count,
              correct_count
            )
          `)
          .in('set_id', setIds)
          .is('deleted_at', null)
          .limit(30);

        if (cards) {
          flashcards = cards
            .map(c => ({
              front_text: c.front_text,
              back_text: c.back_text,
              incorrect_count: (c.flashcard_progress as any)?.[0]?.incorrect_count || 0,
              correct_count: (c.flashcard_progress as any)?.[0]?.correct_count || 0,
            }))
            .filter(c => c.incorrect_count > 0 || c.correct_count < 2)
            .slice(0, 15);
        }
      }
    }

    // 5. Build the AI prompt
    const prompt = buildTestPrompt(
      student,
      testType,
      learningElements,
      knowledgeEntries,
      flashcards,
      questionCount
    );

    console.log('Calling AI to generate test questions...');

    // System prompt for test generation
    const systemPrompt = `You are an expert English language test creator for ESL teachers.
You create personalized test questions based on student data.
Always return valid JSON with the exact structure specified.
Questions should be appropriate for the student's English level.
Include a mix of question types for variety.

PEDAGOGICAL SKILL TAGGING

Each individual question MUST include EXACTLY one nano_skill object.
A nano_skill represents the smallest observable and testable unit of language ability.
A nano_skill MUST be verifiable from a single learner answer without external context.
A nano_skill MUST NOT describe broad grammar topics, lesson goals, exercise types or teaching strategies.
Each nano_skill MUST include name, confidence (0.00–1.00), and reason.
Reason MUST explain why this specific item tests the skill.`;

    // Try Gemini first, fallback to OpenAI
    let generatedContent: string;
    let usedModel: string;

    try {
      console.log('🔵 Trying Gemini 2.5 Flash with JSON mode for test generation...');
      
      if (!genAI) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          maxOutputTokens: 4000,
          temperature: 0.7,
          responseMimeType: 'application/json', // FORCE valid JSON output
        },
      });

      const fullPrompt = `${systemPrompt}\n\n---\n\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      generatedContent = result.response.text();
      usedModel = 'gemini-2.5-flash';
      console.log(`✅ Gemini 2.5 Flash with JSON mode succeeded`);
    } catch (geminiError) {
      console.warn('⚠️ Gemini failed, falling back to OpenAI:', (geminiError as Error).message);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to generate test questions', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      generatedContent = data.choices[0].message.content;
      usedModel = 'gpt-4o-mini';
      console.log(`✅ OpenAI fallback succeeded`);
    }

    console.log(`📊 Test generation used model: ${usedModel}`);

    // 7. Parse the response
    let questions;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonContent = generatedContent;
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      questions = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', generatedContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse generated questions', raw: generatedContent }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Generate test title
    const testTitle = generateTestTitle(testType, learningElements, student);

    console.log('Generated', questions.questions?.length || 0, 'questions using', usedModel);

    return new Response(
      JSON.stringify({
        success: true,
        title: testTitle,
        questions: questions.questions || [],
        metadata: {
          studentLevel: student.english_level,
          testType,
          elementsCount: learningElements.length,
          weaknessesCount: knowledgeEntries.length,
          flashcardsCount: flashcards.length,
          model: usedModel,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-test:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildTestPrompt(
  student: StudentData,
  testType: string,
  elements: LearningElement[],
  weaknesses: KnowledgeEntry[],
  flashcards: FlashcardWithProgress[],
  questionCount: number
): string {
  let prompt = `Generate a ${testType.replace('_', ' ')} test for an English student.

STUDENT PROFILE:
- Name: ${student.name}
- English Level: ${student.english_level}
- Main Goal: ${student.main_goal}
- Native Language: ${student.native_language || 'Unknown'}

`;

  if (elements.length > 0) {
    prompt += `SKILLS TO TEST (prioritize these):
${elements.map(e => `- ${e.title} (${e.element_type}) - Current rating: ${e.current_rating || 'Not rated'}${e.description ? ` - ${e.description}` : ''}`).join('\n')}

`;
  }

  if (weaknesses.length > 0) {
    prompt += `KNOWN WEAKNESSES (include questions targeting these):
${weaknesses.map(w => `- [${w.category}]: ${w.content}`).join('\n')}

`;
  }

  if (flashcards.length > 0) {
    prompt += `VOCABULARY TO TEST (student struggles with these words):
${flashcards.map(f => `- ${f.front_text} = ${f.back_text}`).join('\n')}

`;
  }

  prompt += `REQUIREMENTS:
1. Generate exactly ${questionCount} questions
2. Mix question types: multiple_choice, fill_blank, true_false, matching
3. Difficulty should match ${student.english_level} level
4. Include skill_tags for each question to enable progress tracking
5. For multiple_choice, provide exactly 4 options
6. For fill_blank, the blank should be marked with ___
7. For matching, provide pairs of items
8. Each question MUST include exactly ONE nano_skill object as specified in system instructions

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question_type": "multiple_choice",
      "question_text": "Choose the correct answer: She ___ to work every day.",
      "question_data": {
        "options": ["go", "goes", "going", "gone"]
      },
      "correct_answer": "goes",
      "element_type": "grammar",
      "difficulty_level": 3,
      "skill_tags": ["present_simple", "third_person_singular"],
      "explanation": "We use 'goes' because 'she' is third person singular.",
      "nano_skill": {"name": "ns.grammar.third_person_singular_s", "confidence": 0.96, "reason": "Tests adding -s/-es to verbs after he/she/it"}
    },
    {
      "question_type": "fill_blank",
      "question_text": "Complete the sentence: I have been ___ (wait) for an hour.",
      "question_data": {},
      "correct_answer": "waiting",
      "element_type": "grammar",
      "difficulty_level": 4,
      "skill_tags": ["present_perfect_continuous"],
      "explanation": "Present perfect continuous uses have/has been + verb-ing.",
      "nano_skill": {"name": "ns.grammar.present_perfect_continuous_form", "confidence": 0.95, "reason": "Tests forming have/has been + -ing"}
    },
    {
      "question_type": "true_false",
      "question_text": "The word 'beautiful' is an adverb.",
      "question_data": {},
      "correct_answer": false,
      "element_type": "vocabulary",
      "difficulty_level": 2,
      "skill_tags": ["parts_of_speech"],
      "explanation": "'Beautiful' is an adjective, not an adverb. The adverb form is 'beautifully'.",
      "nano_skill": {"name": "ns.vocab.adjective_identification", "confidence": 0.94, "reason": "Tests recognizing 'beautiful' as adjective not adverb"}
    }
  ]
}`;

  return prompt;
}

function generateTestTitle(
  testType: string,
  elements: LearningElement[],
  student: StudentData
): string {
  const typeLabels: Record<string, string> = {
    'placement': 'Placement Test',
    'progress_check': 'Progress Check',
    'skill_verification': 'Skill Verification',
    'goal_check': 'Goal Achievement Test',
  };

  const baseTitle = typeLabels[testType] || 'Test';
  
  if (elements.length === 1) {
    return `${baseTitle}: ${elements[0].title}`;
  } else if (elements.length > 1) {
    const types = [...new Set(elements.map(e => e.element_type))];
    return `${baseTitle}: ${types.slice(0, 2).join(' & ')}`;
  }
  
  return `${baseTitle} - ${student.english_level}`;
}
