import { useState } from 'react';
import { Plus, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlashcardSets } from '@/hooks/useFlashcardSets';
import { FlashcardSetCard } from './FlashcardSetCard';
import { CreateFlashcardSetModal } from './CreateFlashcardSetModal';
import { FlashcardSetEditor } from './FlashcardSetEditor';
import { DeleteFlashcardSetModal } from './DeleteFlashcardSetModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NATIVE_LANGUAGES } from '@/types/flashcards';
import { useStudents } from '@/hooks/useStudents';

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
  const { updateStudent } = useStudents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [deleteSetTitle, setDeleteSetTitle] = useState<string>('');

  const handleDeleteClick = (setId: string, setTitle: string) => {
    setDeleteSetId(setId);
    setDeleteSetTitle(setTitle);
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
    window.location.reload(); // Refresh to show updated language
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flashcard Sets</h2>
          <p className="text-muted-foreground">
            Create flashcard sets for {studentName} to practice vocabulary
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={studentNativeLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NATIVE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
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
              onDelete={() => handleDeleteClick(set.id, set.title)}
              onShare={() => generateShareToken(set.id)}
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
