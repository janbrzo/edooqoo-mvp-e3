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
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useFutureTimeline } from '@/hooks/useFutureTimeline';
import { ELEMENT_TYPES, GOAL_TYPES, RATING_LABELS } from '@/types/studentProgress';
import { Plus, Target, Sparkles, Star, Trash2, Calendar, TrendingUp, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StudentProgressTabProps {
  studentId: string;
  teacherId: string;
  studentName: string;
  englishLevel: string;
  mainGoal: string;
  onUseWorksheetSuggestion?: (topic: string, goal: string) => void;
}

export const StudentProgressTab: React.FC<StudentProgressTabProps> = ({
  studentId,
  teacherId,
  studentName,
  englishLevel,
  mainGoal,
  onUseWorksheetSuggestion
}) => {
  const { 
    goals, loading, addGoal, updateGoal, deleteGoal, 
    addElement, updateElementRating, deleteElement, getProgressStats 
  } = useStudentProgress({ studentId, teacherId });
  
  const { 
    suggestions, generating, generateTimeline, deleteSuggestion 
  } = useFutureTimeline({ studentId, teacherId });

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddElement, setShowAddElement] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({ type: 'supporting', title: '', description: '' });
  const [newElement, setNewElement] = useState({ type: 'grammar', title: '', description: '' });

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

  const handleGenerateTimeline = async () => {
    await generateTimeline(studentName, englishLevel, mainGoal, goals.map(g => ({
      title: g.title,
      elements: (g.elements || []).map(e => ({ title: e.title, current_rating: e.current_rating }))
    })));
  };

  const handleUsesuggestion = (topic: string, goal: string | null) => {
    if (onUseWorksheetSuggestion) {
      onUseWorksheetSuggestion(topic, goal || '');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const supportingGoals = goals.filter(g => g.goal_type === 'supporting');
  const additionalGoals = goals.filter(g => g.goal_type === 'additional');

  return (
    <div className="space-y-6">
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

      {/* Goals Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Supporting Goals */}
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
          <CardContent className="space-y-3">
            {supportingGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No supporting goals yet</p>
            ) : (
              supportingGoals.map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onDelete={() => deleteGoal(goal.id)}
                  onAddElement={() => setShowAddElement(goal.id)}
                  onRateElement={updateElementRating}
                  onDeleteElement={deleteElement}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Additional Goals */}
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
          <CardContent className="space-y-3">
            {additionalGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No additional goals yet</p>
            ) : (
              additionalGoals.map(goal => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onDelete={() => deleteGoal(goal.id)}
                  onAddElement={() => setShowAddElement(goal.id)}
                  onRateElement={updateElementRating}
                  onDeleteElement={deleteElement}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

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
            <Button onClick={handleGenerateTimeline} disabled={generating || goals.length === 0}>
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
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="mb-2">Lesson {idx + 1}</Badge>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteSuggestion(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <h4 className="font-medium">{s.suggested_topic}</h4>
                    {s.suggested_goal && <p className="text-sm text-muted-foreground mt-1">{s.suggested_goal}</p>}
                    {s.rationale && <p className="text-xs text-muted-foreground mt-2 italic">{s.rationale}</p>}
                    <Button 
                      size="sm" 
                      className="mt-3 w-full" 
                      onClick={() => handleUsesuggestion(s.suggested_topic, s.suggested_goal)}
                    >
                      Use This
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
