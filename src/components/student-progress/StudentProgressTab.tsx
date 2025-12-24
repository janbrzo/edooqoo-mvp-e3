/**
 * Student Progress Tab - tracks goals, learning elements, and future worksheets
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useFutureTimeline } from '@/hooks/useFutureTimeline';
import { ELEMENT_TYPES, GOAL_TYPES } from '@/types/studentProgress';
import { MAIN_GOALS, formatGoalLabel } from '@/constants/studentGoals';
import { Plus, Target, Sparkles, Star, Trash2, Calendar, TrendingUp, BookOpen, Loader2, Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface StudentProgressTabProps {
  studentId: string;
  teacherId: string;
  studentName: string;
  englishLevel: string;
  mainGoal: string;
  onMainGoalChange?: (newGoal: string) => void;
  onUseWorksheetSuggestion?: (topic: string, goal: string) => void;
}

export const StudentProgressTab: React.FC<StudentProgressTabProps> = ({
  studentId,
  teacherId,
  studentName,
  englishLevel,
  mainGoal,
  onMainGoalChange,
  onUseWorksheetSuggestion
}) => {
  const { 
    goals, loading, addGoal, updateGoal, deleteGoal, 
    addElement, updateElementRating, deleteElement, getProgressStats 
  } = useStudentProgress({ studentId, teacherId });
  
  const { 
    suggestions, generating, generateTimeline, deleteSuggestion, updateSuggestion 
  } = useFutureTimeline({ studentId, teacherId });

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddElement, setShowAddElement] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ type: 'supporting', title: '', description: '' });
  const [newElement, setNewElement] = useState({ type: 'grammar', title: '', description: '' });
  
  // Main goal editing
  const [isEditingMainGoal, setIsEditingMainGoal] = useState(false);
  const [editedMainGoal, setEditedMainGoal] = useState(mainGoal);
  
  // Timeline editing
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const [editedSuggestion, setEditedSuggestion] = useState({ topic: '', goal: '' });
  
  // Regenerate confirmation
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [regenerateMode, setRegenerateMode] = useState<'replace' | 'add'>('replace');

  const stats = getProgressStats();

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return;
    await addGoal(newGoal.type as any, newGoal.title, newGoal.description);
    setNewGoal({ type: 'supporting', title: '', description: '' });
    setShowAddGoal(false);
  };

  const handleAddElement = async (goalId: string) => {
    if (!newElement.title.trim()) return;
    await addElement(goalId, newElement.type as any, newElement.title, newElement.description);
    setNewElement({ type: 'grammar', title: '', description: '' });
    setShowAddElement(null);
  };

  const handleGenerateClick = () => {
    if (suggestions.length > 0) {
      setShowRegenerateConfirm(true);
    } else {
      handleGenerateTimeline('replace');
    }
  };

  const handleGenerateTimeline = async (mode: 'replace' | 'add') => {
    setShowRegenerateConfirm(false);
    await generateTimeline(studentName, englishLevel, mainGoal, goals.map(g => ({
      title: g.title,
      elements: (g.elements || []).map(e => ({ title: e.title, current_rating: e.current_rating }))
    })), mode);
  };

  const handleUseSuggestion = (topic: string, goal: string | null) => {
    if (onUseWorksheetSuggestion) {
      onUseWorksheetSuggestion(topic, goal || '');
    }
  };

  const handleEditSuggestion = (s: any) => {
    setEditingSuggestionId(s.id);
    setEditedSuggestion({ topic: s.suggested_topic, goal: s.suggested_goal || '' });
  };

  const handleSaveSuggestion = async () => {
    if (!editingSuggestionId || !editedSuggestion.topic.trim()) return;
    await updateSuggestion(editingSuggestionId, editedSuggestion.topic, editedSuggestion.goal);
    setEditingSuggestionId(null);
  };

  const handleSaveMainGoal = async () => {
    if (onMainGoalChange && editedMainGoal !== mainGoal) {
      await onMainGoalChange(editedMainGoal);
    }
    setIsEditingMainGoal(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const supportingGoals = goals.filter(g => g.goal_type === 'supporting');
  const additionalGoals = goals.filter(g => g.goal_type === 'additional');

  return (
    <div className="space-y-6">
      {/* Main Goal Display */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Main Learning Goal
            </CardTitle>
            {!isEditingMainGoal && (
              <Button size="sm" variant="ghost" onClick={() => { setEditedMainGoal(mainGoal); setIsEditingMainGoal(true); }}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingMainGoal ? (
            <div className="flex items-center gap-2">
              <Select value={editedMainGoal} onValueChange={setEditedMainGoal}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAIN_GOALS.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" onClick={handleSaveMainGoal}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingMainGoal(false)}>
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-4 py-2">
                {formatGoalLabel(mainGoal)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalGoals}</div>
              <div className="text-sm text-muted-foreground">Goals</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalElements}</div>
              <div className="text-sm text-muted-foreground">Learning Elements</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.averageRating || '-'}</div>
              <div className="text-sm text-muted-foreground">Avg. Rating</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.masteredElements}</div>
              <div className="text-sm text-muted-foreground">Mastered</div>
            </div>
          </div>
          {stats.totalElements > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{stats.progressPercentage}%</span>
              </div>
              <Progress value={stats.progressPercentage} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supporting Goals - Full Width */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Supporting Goals
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setNewGoal({ ...newGoal, type: 'supporting' }); setShowAddGoal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <CardDescription>Goals that support the main learning objective</CardDescription>
        </CardHeader>
        <CardContent>
          {supportingGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No supporting goals yet</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {supportingGoals.map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onDelete={() => deleteGoal(goal.id)}
                  onAddElement={() => setShowAddElement(goal.id)}
                  onRateElement={updateElementRating}
                  onDeleteElement={deleteElement}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Goals - Full Width */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary-foreground" />
              Additional Goals
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setNewGoal({ ...newGoal, type: 'additional' }); setShowAddGoal(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <CardDescription>Important side objectives for the student</CardDescription>
        </CardHeader>
        <CardContent>
          {additionalGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No additional goals yet</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {additionalGoals.map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onDelete={() => deleteGoal(goal.id)}
                  onAddElement={() => setShowAddElement(goal.id)}
                  onRateElement={updateElementRating}
                  onDeleteElement={deleteElement}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Future Timeline
              </CardTitle>
              <CardDescription>Suggested worksheets for upcoming lessons</CardDescription>
            </div>
            <Button onClick={handleGenerateClick} disabled={generating || goals.length === 0}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Timeline
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {goals.length === 0 
                ? "Add some goals first, then generate your timeline" 
                : "Click 'Generate Timeline' to get AI-powered worksheet suggestions"}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {suggestions.map((s, idx) => (
                <Card key={s.id} className="border-dashed">
                  <CardContent className="pt-4">
                    {editingSuggestionId === s.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Topic</Label>
                          <Input 
                            value={editedSuggestion.topic} 
                            onChange={(e) => setEditedSuggestion({ ...editedSuggestion, topic: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Goal</Label>
                          <Input 
                            value={editedSuggestion.goal} 
                            onChange={(e) => setEditedSuggestion({ ...editedSuggestion, goal: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveSuggestion} disabled={!editedSuggestion.topic.trim()}>
                            <Check className="h-4 w-4 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSuggestionId(null)}>
                            <X className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="mb-2">Lesson {idx + 1}</Badge>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditSuggestion(s)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteSuggestion(s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-medium">{s.suggested_topic}</h4>
                        {s.suggested_goal && <p className="text-sm text-muted-foreground mt-1">{s.suggested_goal}</p>}
                        {s.rationale && <p className="text-xs text-muted-foreground mt-2 italic">{s.rationale}</p>}
                        <Button 
                          size="sm" 
                          className="mt-3 w-full" 
                          onClick={() => handleUseSuggestion(s.suggested_topic, s.suggested_goal)}
                        >
                          Use This
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New Timeline</AlertDialogTitle>
            <AlertDialogDescription>
              You already have {suggestions.length} suggestion(s). What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleGenerateTimeline('add')} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Add More
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleGenerateTimeline('replace')}>
              Replace All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
            <DialogDescription>Create a new learning goal for {studentName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal Type</Label>
              <Select value={newGoal.type} onValueChange={(v) => setNewGoal({ ...newGoal, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Master business email writing" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="More details about this goal..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGoal(false)}>Cancel</Button>
            <Button onClick={handleAddGoal} disabled={!newGoal.title.trim()}>Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Element Dialog */}
      <Dialog open={!!showAddElement} onOpenChange={() => setShowAddElement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Learning Element</DialogTitle>
            <DialogDescription>Add a specific skill or knowledge item to track</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Element Type</Label>
              <Select value={newElement.type} onValueChange={(v) => setNewElement({ ...newElement, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ELEMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={newElement.title} onChange={(e) => setNewElement({ ...newElement, title: e.target.value })} placeholder="e.g. Present Perfect Tense" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={newElement.description} onChange={(e) => setNewElement({ ...newElement, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddElement(null)}>Cancel</Button>
            <Button onClick={() => showAddElement && handleAddElement(showAddElement)} disabled={!newElement.title.trim()}>Add Element</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Goal Card Component
const GoalCard = ({ goal, onDelete, onAddElement, onRateElement, onDeleteElement }: any) => {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{goal.title}</h4>
          {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onAddElement}><Plus className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      {goal.elements?.length > 0 && (
        <div className="space-y-1 pt-2 border-t">
          {goal.elements.map((el: any) => (
            <div key={el.id} className="flex items-center justify-between text-sm py-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{el.element_type}</Badge>
                <span>{el.title}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(r => (
                  <button key={r} onClick={() => onRateElement(el.id, r)} className="p-0.5">
                    <Star className={`h-4 w-4 ${el.current_rating >= r ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
                <Button size="icon" variant="ghost" className="h-6 w-6 ml-1" onClick={() => onDeleteElement(el.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentProgressTab;
