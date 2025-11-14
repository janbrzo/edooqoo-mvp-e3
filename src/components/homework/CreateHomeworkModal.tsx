import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateHomeworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worksheetId: string;
  worksheetTitle: string;
  exercises: any[];
  teacherId: string;
  students: Array<{
    id: string;
    name: string;
    english_level: string;
  }>;
}

export function CreateHomeworkModal({
  open,
  onOpenChange,
  worksheetId,
  worksheetTitle,
  exercises,
  teacherId,
  students
}: CreateHomeworkModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const toggleExercise = (index: number) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedExercises(newSelected);
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Homework link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const generateHomework = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }

    if (selectedExercises.size === 0) {
      toast.error("Please select at least one exercise");
      return;
    }

    setIsGenerating(true);

    try {
      const student = students.find(s => s.id === selectedStudentId);
      
      // Get selected exercises data
      const exercisesData = Array.from(selectedExercises)
        .map(index => exercises[index])
        .filter(Boolean);

      // Create homework assignment
      const { data: homework, error: insertError } = await supabase
        .from('homework_assignments')
        .insert({
          teacher_id: teacherId,
          student_id: selectedStudentId,
          source_worksheet_id: worksheetId,
          title: `${worksheetTitle} - Homework for ${student?.name}`,
          selected_exercises: exercisesData,
          deadline: deadline?.toISOString() || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Generate share token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_homework_share_token', {
          p_homework_id: homework.id,
          p_teacher_id: teacherId
        });

      if (tokenError) throw tokenError;

      const baseUrl = window.location.origin;
      const url = `${baseUrl}/homework/${tokenData}`;
      setShareUrl(url);

      // Emit event to notify components that homework was created
      window.dispatchEvent(new CustomEvent('homeworkCreated', {
        detail: { worksheetId, homeworkId: homework.id }
      }));

      toast.success("Homework created successfully!");
    } catch (error) {
      console.error('Error creating homework:', error);
      toast.error("Failed to create homework");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedStudentId("");
    setSelectedExercises(new Set());
    setDeadline(undefined);
    setShareUrl("");
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Homework from Worksheet</DialogTitle>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-6">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label>Select Student</Label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Choose a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.english_level})
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise Selection */}
            <div className="space-y-3">
              <Label>Select Exercises</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-md p-4">
                {exercises.map((exercise, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Checkbox
                      id={`exercise-${index}`}
                      checked={selectedExercises.has(index)}
                      onCheckedChange={() => toggleExercise(index)}
                    />
                    <label
                      htmlFor={`exercise-${index}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      Exercise {index + 1}: {exercise.type?.replace(/-/g, ' ')}
                      {exercise.title && ` - ${exercise.title}`}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Deadline Selection */}
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={generateHomework}
                disabled={isGenerating || !selectedStudentId || selectedExercises.size === 0}
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Homework
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Homework created successfully! Share this link with your student:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
