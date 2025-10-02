
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Clock, Database, Star, Edit, GraduationCap, BookOpen, FileText, MessageSquare } from "lucide-react";

// Exercise types mapping
const EXERCISE_TYPES_MAP: Record<string, string> = {
  'warmup': 'Warmup',
  'vocabulary': 'Vocabulary',
  'grammar': 'Grammar',
  'reading': 'Reading',
  'listening': 'Listening',
  'speaking': 'Speaking',
  'writing': 'Writing',
  'gaptext': 'Gap Text',
  'fillinblanks': 'Fill in Blanks',
  'multiplechoice': 'Multiple Choice',
  'matching': 'Matching',
  'truefalse': 'True/False',
  'wordorder': 'Word Order',
  'dialogue': 'Dialogue',
  'describe': 'Describe',
  'answerquestions': 'Answer Questions',
  'paraphrasing': 'Paraphrasing',
  'sentencetransformation': 'Sentence Transformation',
  'oddoneout': 'Odd One Out',
  'synonymsantonyms': 'Synonyms & Antonyms',
  'matchinghalves': 'Matching Halves',
  'completeword': 'Complete Word',
  'categorize': 'Categorize',
  'negativeprefixes': 'Negative Prefixes',
  // Add hyphenated versions for backward compatibility
  'matching-halves': 'Matching Halves',
  'true-false': 'True/False',
  'gap-text': 'Gap Text',
  'fill-in-blanks': 'Fill in the Blanks',
  'synonyms-antonyms': 'Synonyms & Antonyms',
  'word-order': 'Word Order',
  'odd-one-out': 'Odd One Out',
  'negative-prefixes': 'Negative Prefixes',
  'multiple-choice': 'Multiple Choice',
  'discussion': 'Discussion',
  'error-correction': 'Error Correction',
  'sentence-transformation': 'Sentence Transformation',
  'complete-word': 'Complete Word',
  'answer-questions': 'Answer Questions'
};

interface InputParamsCardProps {
  inputParams: {
    lessonTime: string;
    englishLevel: string;
    lessonTopic: string;
    lessonGoal: string;
    teachingPreferences?: string;
    additionalInformation?: string;
    languageStyle?: number;
  };
  selectedExercises?: string[];
}

// Function to convert language style number to descriptive text
const getLanguageStyleDescription = (value: number): string => {
  if (value === 1) return "Very casual (slang, contractions)";
  if (value === 2) return "Casual (relaxed, friendly)";
  if (value === 3) return "Neutral (balanced style)";
  if (value === 4) return "Formal (professional tone)";
  return "Very formal (academic style)";
};

const InputParamsCard = ({ inputParams, selectedExercises }: InputParamsCardProps) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Info className="h-5 w-5 text-worksheet-purple" />
        Your Input Parameters
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lesson Duration */}
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Clock className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lesson Duration</p>
            <p className="font-medium text-sm">{inputParams.lessonTime}</p>
          </div>
        </div>
        
        {/* English Level */}
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <GraduationCap className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">English Level</p>
            <p className="font-medium text-sm">{inputParams.englishLevel}</p>
          </div>
        </div>
        
        {/* Lesson Topic */}
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Database className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lesson Topic</p>
            <p className="font-medium text-sm">{inputParams.lessonTopic}</p>
          </div>
        </div>
      
        {/* Lesson Goal */}
        <div className="flex items-center gap-3">
          <div className="bg-worksheet-purpleLight rounded-full p-2">
            <Star className="h-4 w-4 text-worksheet-purple" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lesson Goal</p>
            <p className="font-medium text-sm">{inputParams.lessonGoal}</p>
          </div>
        </div>
        
        {/* Grammar focus (conditionally rendered) */}
        {inputParams.teachingPreferences && (
          <div className="flex items-center gap-3">
            <div className="bg-worksheet-purpleLight rounded-full p-2">
              <BookOpen className="h-4 w-4 text-worksheet-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Grammar focus</p>
              <p className="font-medium text-sm">{inputParams.teachingPreferences}</p>
            </div>
          </div>
        )}

        {/* Additional Information (conditionally rendered) */}
        {inputParams.additionalInformation && (
          <div className="flex items-center gap-3">
            <div className="bg-worksheet-purpleLight rounded-full p-2">
              <Edit className="h-4 w-4 text-worksheet-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Additional Information</p>
              <p className="font-medium text-sm">{inputParams.additionalInformation}</p>
            </div>
          </div>
        )}

        {/* Language Style (conditionally rendered) */}
        {inputParams.languageStyle && (
          <div className="flex items-center gap-3">
            <div className="bg-worksheet-purpleLight rounded-full p-2">
              <MessageSquare className="h-4 w-4 text-worksheet-purple" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Language Style</p>
              <p className="font-medium text-sm">
                {getLanguageStyleDescription(inputParams.languageStyle)} ({inputParams.languageStyle}/5)
              </p>
            </div>
          </div>
        )}

        {/* Selected Exercise Types */}
        {selectedExercises && selectedExercises.length > 0 && (
          <div className="flex items-start gap-3 col-span-1">
            <div className="bg-worksheet-purpleLight rounded-full p-2">
              <FileText className="h-4 w-4 text-worksheet-purple" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Selected Exercise Types</p>
              <div className="font-medium text-sm">
                {selectedExercises.map((exerciseId, index) => {
                  const exerciseName = EXERCISE_TYPES_MAP[exerciseId] || exerciseId;
                  const isLast = index === selectedExercises.length - 1;
                  const needsNewLine = (index + 1) % 8 === 0 && !isLast;
                  
                  return (
                    <span key={exerciseId}>
                      {exerciseName}
                      {!isLast && (needsNewLine ? <br /> : ', ')}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default InputParamsCard;
