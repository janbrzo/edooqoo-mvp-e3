
import React from "react";
import { FileText } from "lucide-react";
import { VocabularyItem } from "../WorksheetForm/types";

interface Worksheet {
  title: string;
  subtitle: string;
  introduction: string;
  exercises: any[];
  vocabulary_sheet: VocabularyItem[];
}

interface VocabularySheetProps {
  vocabularySheet: VocabularyItem[];
  isEditing: boolean;
  viewMode: "student" | "teacher";
  editableWorksheet: Worksheet;
  setEditableWorksheet: (worksheet: Worksheet) => void;
}

const VocabularySheet = ({
  vocabularySheet,
  isEditing,
  viewMode,
  editableWorksheet,
  setEditableWorksheet
}: VocabularySheetProps) => {
  // Safety check: ensure vocabularySheet is valid array
  if (!Array.isArray(vocabularySheet) || vocabularySheet.length === 0) {
    console.warn('🔧 VocabularySheet: Invalid or empty vocabulary sheet data');
    return null;
  }

  // Safety check: ensure all items have required structure
  const safeVocabularySheet = vocabularySheet.map((item, index) => {
    if (!item || typeof item !== 'object') {
      console.warn(`🔧 VocabularySheet: Invalid item at index ${index}:`, item);
      return { term: `Term ${index + 1}`, meaning: 'Definition' };
    }
    
    // Convert various structures to {term, meaning}
    const safeTerm = typeof item.term === 'string' ? item.term : 
                     typeof item.word === 'string' ? item.word :
                     typeof item.phrase === 'string' ? item.phrase :
                     `Term ${index + 1}`;
    
    const safeMeaning = typeof item.meaning === 'string' ? item.meaning :
                        typeof item.definition === 'string' ? item.definition :
                        'Definition';
    
    return { term: safeTerm, meaning: safeMeaning };
  });

  return (
    <div className="mb-6 bg-white border rounded-lg overflow-hidden shadow-sm" style={{ breakBefore: "page" }} id="vocabulary-sheet">
      <div className="bg-worksheet-purple text-white p-2 flex justify-between items-center exercise-header">
        <div className="flex items-center">
          <div className="p-2 bg-white/20 rounded-full mr-3">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">Vocabulary Sheet</h3>
        </div>
      </div>

      <div className="p-5">
        <p className="font-medium mb-4">
          Learn and practice these key vocabulary terms related to the topic.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeVocabularySheet.map((item, index) => (
            <div key={index} className="border rounded-md p-4 vocabulary-card">
              <p className="font-semibold text-worksheet-purple">
                {isEditing ? (
                  <input
                    type="text"
                    value={item.term}
                    onChange={e => {
                      const updatedVocab = [...editableWorksheet.vocabulary_sheet];
                      updatedVocab[index] = {
                        ...updatedVocab[index],
                        term: e.target.value
                      };
                      setEditableWorksheet({
                        ...editableWorksheet,
                        vocabulary_sheet: updatedVocab
                      });
                    }}
                    className="w-full border p-1 editable-content"
                  />
                ) : item.term}
              </p>
              {viewMode === 'teacher' ? (
                <p className="text-sm text-gray-600 mt-2">
                  {isEditing ? (
                    <textarea
                      value={item.meaning}
                      onChange={e => {
                        const updatedVocab = [...editableWorksheet.vocabulary_sheet];
                        updatedVocab[index] = {
                          ...updatedVocab[index],
                          meaning: e.target.value
                        };
                        setEditableWorksheet({
                          ...editableWorksheet,
                          vocabulary_sheet: updatedVocab
                        });
                      }}
                      className="w-full border p-1 editable-content h-12"
                    />
                  ) : item.meaning}
                </p>
              ) : (
                <>
                  <span className="vocabulary-definition-label">Definition or translation:</span>
                  <span className="text-sm text-gray-500">_____________________</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VocabularySheet;
