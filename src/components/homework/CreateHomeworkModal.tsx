import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2, Copy, Check, Mail, ExternalLink, Clock, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
    student_email?: string | null;
  }>;
  preselectedStudent?: string;
  worksheetFormData?: any;
}

export function CreateHomeworkModal({
  open,
  onOpenChange,
  worksheetId,
  worksheetTitle,
  exercises,
  teacherId,
  students,
  preselectedStudent,
  worksheetFormData
}: CreateHomeworkModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());
  const [deadline, setDeadline] = useState<Date | undefined>(
    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) // Default: +6 days
  );
  const [sendReminder, setSendReminder] = useState<boolean>(true);
  const [reminderHours, setReminderHours] = useState<string>("24");
  const [sendToTeacher, setSendToTeacher] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [studentEmailFromDB, setStudentEmailFromDB] = useState<string>("");
  const [studentEmailInput, setStudentEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [createdHomeworkId, setCreatedHomeworkId] = useState<string>('');
  const [existingHomework, setExistingHomework] = useState<any>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  
  // Set preselected student when modal opens
  useEffect(() => {
    if (preselectedStudent && open) {
      setSelectedStudentId(preselectedStudent);
    }
  }, [preselectedStudent, open]);

  // Check for existing homework when modal opens
  useEffect(() => {
    if (open && worksheetId) {
      checkForExistingHomework();
    }
  }, [open, worksheetId]);

  const checkForExistingHomework = async () => {
    try {
      setCheckingDuplicate(true);
      const { data, error } = await supabase
        .from('homework_assignments')
        .select('id, title, share_token, created_at')
        .eq('source_worksheet_id', worksheetId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setExistingHomework(data);
    } catch (error) {
      console.error('Error checking for existing homework:', error);
    } finally {
      setCheckingDuplicate(false);
    }
  };

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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          homeworkId,
          studentEmail,
          updateStudentEmail: !studentEmailFromDB, // Update if email wasn't in DB
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
      
      // Get student email from DB
      const { data: studentData } = await supabase
        .from('students')
        .select('student_email')
        .eq('id', selectedStudentId)
        .single();
      
      const studentEmail = studentData?.student_email || '';

      // Create homework assignment
      const { data: homework, error: insertError } = await supabase
        .from('homework_assignments')
        .insert({
          teacher_id: teacherId,
          student_id: selectedStudentId,
          source_worksheet_id: worksheetId,
          title: `${worksheetTitle} - Homework for ${student?.name}`,
          selected_exercises: exercisesData,
          deadline: deadline?.toISOString() || null,
          reminder_hours: sendReminder ? parseInt(reminderHours) : null
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
      setStudentEmailFromDB(studentEmail);
      setStudentEmailInput(studentEmail); // Pre-fill email input
      setShowSuccessView(true); // Always show success view instead of auto-sending

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
    } catch (error: any) {
      console.error('Error creating homework:', error);
      toast.error(error.message || "Failed to create homework assignment");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSendEmailFromSuccess = async () => {
    if (!studentEmailInput) {
      toast.error("Please enter the student's email address.");
      return;
    }
    
    await sendHomeworkEmail(createdHomeworkId, studentEmailInput);
  };
  
  const handleClose = () => {
    setSelectedStudentId("");
    setSelectedExercises(new Set());
    setDeadline(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)); // Reset to +6 days
    setSendReminder(true);
    setReminderHours("24");
    setSendToTeacher(false);
    setIsGenerating(false);
    setShareUrl("");
    setCopied(false);
    setShowSuccessView(false);
    setStudentEmailFromDB('');
    setStudentEmailInput('');
    setIsSendingEmail(false);
    setCreatedHomeworkId('');
    setExistingHomework(null);
    onOpenChange(false);
  };

  const handleOpenInNewTab = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Homework Assignment</DialogTitle>
          <DialogDescription>
            Create a homework assignment from "{worksheetTitle}"
          </DialogDescription>
        </DialogHeader>

        {/* Existing Homework Alert */}
        {existingHomework && !showSuccessView && (
          <Alert className="border-amber-500 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              This worksheet already has homework created:{" "}
              <strong>{existingHomework.title}</strong>
              {existingHomework.share_token && (
                <>
                  {" • "}
                  <Link 
                    to={`/homework/${existingHomework.share_token}`}
                    target="_blank"
                    className="underline hover:text-amber-900"
                  >
                    View existing homework
                  </Link>
                </>
              )}
              {" • Created: " + format(new Date(existingHomework.created_at), 'MMM dd, yyyy')}
            </AlertDescription>
          </Alert>
        )}

        {showSuccessView ? (
          // Success view with email option
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
                  title="Copy link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenInNewTab}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this link or open homework in new tab to preview.
              </p>
            </div>

            {/* Email section */}
            <div className="space-y-3 pt-4 border-t">
              <Label htmlFor="student-email">Send Email Notification</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="student@example.com"
                value={studentEmailInput}
                onChange={(e) => setStudentEmailInput(e.target.value)}
                disabled={isSendingEmail}
              />
              
              {/* Checkbox "send also to me" */}
              {selectedStudent && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="send-to-teacher"
                    checked={sendToTeacher}
                    onCheckedChange={(checked) => setSendToTeacher(checked as boolean)}
                  />
                  <Label htmlFor="send-to-teacher" className="text-sm font-normal cursor-pointer">
                    Send also to me ({selectedStudent.student_email || 'teacher email'})
                  </Label>
                </div>
              )}
              
              {!studentEmailFromDB && (
                <p className="text-xs text-muted-foreground">
                  This student doesn't have an email saved. Enter it to send notification.
                </p>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSendEmailFromSuccess}
                  disabled={isSendingEmail || !studentEmailInput}
                  className="flex-1"
                  variant="secondary"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full" variant="outline">
              Done (skip sending email)
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

            {/* Reminder Hours Dropdown */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="send-reminder" 
                    checked={sendReminder}
                    onCheckedChange={setSendReminder}
                  />
                  <Label htmlFor="send-reminder" className="cursor-pointer">Send Reminder Before Deadline</Label>
                </div>
              </div>
              
              {sendReminder && (
                <div className="space-y-2">
                  <Label htmlFor="reminder-hours" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Send Reminder Before Deadline
                  </Label>
                  <Select value={reminderHours} onValueChange={setReminderHours}>
                    <SelectTrigger id="reminder-hours">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 hours before</SelectItem>
                      <SelectItem value="24">24 hours before (default)</SelectItem>
                      <SelectItem value="48">2 days before</SelectItem>
                      <SelectItem value="72">3 days before</SelectItem>
                      <SelectItem value="96">4 days before</SelectItem>
                      <SelectItem value="120">5 days before</SelectItem>
                      <SelectItem value="144">6 days before</SelectItem>
                      <SelectItem value="168">7 days before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
