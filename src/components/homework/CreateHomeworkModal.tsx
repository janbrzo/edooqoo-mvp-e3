import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Loader2, Copy, Check, Mail } from "lucide-react";
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
  preselectedStudent?: string;
}

export function CreateHomeworkModal({
  open,
  onOpenChange,
  worksheetId,
  worksheetTitle,
  exercises,
  teacherId,
  students,
  preselectedStudent
}: CreateHomeworkModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  // Email state
  const [needsStudentEmail, setNeedsStudentEmail] = useState(false);
  const [studentEmailInput, setStudentEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [createdHomeworkId, setCreatedHomeworkId] = useState<string>('');
  
  // Set preselected student when modal opens
  useEffect(() => {
    if (preselectedStudent && open) {
      setSelectedStudentId(preselectedStudent);
    }
  }, [preselectedStudent, open]);

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

  const sendHomeworkEmail = async (homeworkId: string, studentEmail: string) => {
    try {
      setIsSendingEmail(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('send-homework-email', {
        body: {
          homeworkId,
          studentEmail,
          updateStudentEmail: needsStudentEmail, // Update student's email if it was manually entered
        },
      });

      if (error) throw error;

      toast.success(`Homework notification sent to ${studentEmail}`);
    } catch (error: any) {
      console.error('Error sending homework email:', error);
      toast.error(error.message || "Failed to send homework email. You can still share the link manually.");
    } finally {
      setIsSendingEmail(false);
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
      
      // Check if student has email
      const { data: studentData } = await supabase
        .from('students')
        .select('student_email')
        .eq('id', selectedStudentId)
        .single();
      
      const hasStudentEmail = !!studentData?.student_email;

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
      setCreatedHomeworkId(homework.id);

      // Emit event for other components to refresh
      window.dispatchEvent(
        new CustomEvent("homeworkCreated", {
          detail: {
            homeworkId: homework.id,
            studentId: selectedStudentId,
            worksheetId,
          },
        })
      );

      toast.success("Homework assignment created successfully!");
      
      // Check if we should prompt for email or send automatically
      if (!hasStudentEmail) {
        setNeedsStudentEmail(true);
        // Don't close modal - let user enter email
      } else {
        // Automatically send email if student has email
        await sendHomeworkEmail(homework.id, studentData.student_email);
      }
    } catch (error: any) {
      console.error('Error creating homework:', error);
      toast.error(error.message || "Failed to create homework assignment");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSendEmailAndClose = async () => {
    if (!studentEmailInput) {
      toast.error("Please enter the student's email address.");
      return;
    }
    
    await sendHomeworkEmail(createdHomeworkId, studentEmailInput);
    handleClose();
  };

  const handleClose = () => {
    setSelectedStudentId("");
    setSelectedExercises(new Set());
    setDeadline(undefined);
    setIsGenerating(false);
    setShareUrl("");
    setCopied(false);
    setNeedsStudentEmail(false);
    setStudentEmailInput('');
    setIsSendingEmail(false);
    setCreatedHomeworkId('');
    onOpenChange(false);
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Homework Assignment</DialogTitle>
          {needsStudentEmail && (
            <DialogDescription>
              Homework created! Enter student's email to send notification.
            </DialogDescription>
          )}
        </DialogHeader>

        {needsStudentEmail ? (
          // Email input form
          <div className="space-y-4 py-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                This student doesn't have an email address saved. Enter their email to send the homework notification.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="student-email">Student Email</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="student@example.com"
                value={studentEmailInput}
                onChange={(e) => setStudentEmailInput(e.target.value)}
                disabled={isSendingEmail}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You can also share this link manually with the student.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSendEmailAndClose}
                disabled={isSendingEmail}
                className="flex-1"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email & Close
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSendingEmail}
              >
                Skip Email
              </Button>
            </div>
          </div>
        ) : shareUrl ? (
          // Success view
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center text-green-500 mb-4">
              <Check className="h-16 w-16" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Homework Created!</h3>
              <p className="text-sm text-muted-foreground">
                Share this link with {selectedStudent?.name}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          // Creation form
          <div className="space-y-6 py-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label htmlFor="student">Select Student</Label>
              <select
                id="student"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!!preselectedStudent}
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
            <div className="space-y-2">
              <Label>Select Exercises</Label>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                {exercises.map((exercise, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exercise-${index}`}
                      checked={selectedExercises.has(index)}
                      onCheckedChange={() => toggleExercise(index)}
                    />
                    <Label
                      htmlFor={`exercise-${index}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      Exercise {index + 1}: {exercise.type || 'Unknown'}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedExercises.size} exercise{selectedExercises.size !== 1 ? 's' : ''} selected
              </p>
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
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={generateHomework}
                disabled={isGenerating || !selectedStudentId || selectedExercises.size === 0}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Homework"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
