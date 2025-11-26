import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlashcardSet, NATIVE_LANGUAGES } from '@/types/flashcards';
import { FlashcardSetCard } from './FlashcardSetCard';
import { CreateFlashcardSetModal } from './CreateFlashcardSetModal';
import { DeleteFlashcardSetModal } from './DeleteFlashcardSetModal';
import { FlashcardSetEditor } from './FlashcardSetEditor';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import { useStudents } from '@/hooks/useStudents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FlashcardSetsSectionProps {
  studentId: string;
  teacherId: string;
  studentName: string;
  studentNativeLanguage: string;
}

export function FlashcardSetsSection({
  studentId,
  teacherId,
  studentName,
  studentNativeLanguage,
}: FlashcardSetsSectionProps) {
  const { sets, loading, createSet, updateSet, deleteSet, generateShareToken } = useFlashcardSets(teacherId, studentId);
  const { students, updateStudent } = useStudents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [deleteSetTitle, setDeleteSetTitle] = useState<string>('');

  const student = students.find(s => s.id === studentId);

  const handleDeleteClick = (set: FlashcardSet) => {
    setDeleteSetId(set.id);
    setDeleteSetTitle(set.title);
  };

  const handleConfirmDelete = async () => {
    if (deleteSetId) {
      await deleteSet(deleteSetId);
      setDeleteSetId(null);
      setDeleteSetTitle('');
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    await updateStudent(studentId, { native_language: newLanguage });
  };

  if (editingSetId) {
    const set = sets.find(s => s.id === editingSetId);
    if (set) {
      return (
        <FlashcardSetEditor
          set={set}
          onBack={() => setEditingSetId(null)}
          onUpdate={updateSet}
          generateShareToken={generateShareToken}
          studentNativeLanguage={studentNativeLanguage}
        />
      );
    }
  }

  const selectedLanguage = NATIVE_LANGUAGES.find(
    lang => lang.value === (student?.native_language || studentNativeLanguage || 'Spanish')
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold">Flashcard Sets for {studentName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={student?.native_language || studentNativeLanguage || 'Spanish'}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedLanguage?.flag || '🌐'}</span>
                  <span>{selectedLanguage?.label || 'Spanish'}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {NATIVE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Set
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading flashcard sets...
        </div>
      )}

      {!loading && sets.length === 0 && (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <div className="text-lg font-medium mb-2">No flashcard sets yet</div>
          <p className="text-muted-foreground mb-4">
            Create your first flashcard set to help {studentName} learn vocabulary
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Set
          </Button>
        </div>
      )}

      {!loading && sets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set) => (
            <FlashcardSetCard
              key={set.id}
              set={set}
              onEdit={() => setEditingSetId(set.id)}
              onDelete={() => handleDeleteClick(set)}
              onShare={() => generateShareToken(set.id)}
              onAddCard={() => setEditingSetId(set.id)}
            />
          ))}
        </div>
      )}

      <CreateFlashcardSetModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        studentId={studentId}
        studentName={studentName}
        onCreate={createSet}
      />

      <DeleteFlashcardSetModal
        open={!!deleteSetId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteSetId(null);
            setDeleteSetTitle('');
          }
        }}
        setTitle={deleteSetTitle}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
