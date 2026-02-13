/**
 * WelcomeTestResults - Teacher dashboard view of Welcome Test results
 * Shows learning profile, traits, scores, and recommendations
 */

import { useState, useEffect } from 'react';
import { 
  Sparkles, Brain, Target, BookOpen, MessageCircle, 
  TrendingUp, Star, AlertCircle, Clock, Smile, Frown, Meh
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import type { LearningProfile } from '@/types/welcomeTest';

interface WelcomeTestResultsProps {
  testId: string;
  studentId: string;
  teacherId: string;
}

export function WelcomeTestResults({ testId, studentId, teacherId }: WelcomeTestResultsProps) {
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('student_learning_profiles')
          .select('*')
          .eq('student_id', studentId)
          .eq('teacher_id', teacherId)
          .single();

        if (data) {
          setProfile(data as unknown as LearningProfile);
        }
      } catch (err) {
        console.error('Error fetching learning profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [studentId, teacherId]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading learning profile...</div>;
  }

  if (!profile) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
        <CardContent className="py-6 text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Learning profile not yet generated. The student needs to complete the Welcome Test first,
            or the profile is still being processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const anxietyIcon = profile.anxiety_level === 'low' ? <Smile className="h-4 w-4 text-green-500" /> :
    profile.anxiety_level === 'high' ? <Frown className="h-4 w-4 text-red-500" /> :
    <Meh className="h-4 w-4 text-amber-500" />;

  return (
    <div className="space-y-6">
      {/* Level Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Level Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{profile.estimated_level || '—'}</div>
              <div className="text-xs text-muted-foreground">Estimated Level</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{profile.self_assessed_level || '—'}</div>
              <div className="text-xs text-muted-foreground">Self-Assessed</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Badge variant={
                profile.level_confidence === 'accurate' ? 'default' :
                profile.level_confidence === 'overestimates' ? 'destructive' : 'secondary'
              }>
                {profile.level_confidence || 'Unknown'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Self-Awareness</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-primary" />
            Skill Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Grammar', score: profile.grammar_score },
            { label: 'Vocabulary', score: profile.vocabulary_score },
            { label: 'Reading', score: profile.reading_score },
            { label: 'Writing', score: profile.writing_score },
            { label: 'Communication', score: profile.communication_score },
          ].map(({ label, score }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-28 text-sm">{label}</span>
              <div className="flex-1">
                <Progress value={score || 0} className="h-2" />
              </div>
              <span className="w-12 text-right text-sm font-medium">
                {score !== null ? `${Math.round(score)}%` : '—'}
              </span>
            </div>
          ))}
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Strongest:</span>
              <Badge variant="default">{profile.strongest_skill || '—'}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Weakest:</span>
              <Badge variant="destructive">{profile.weakest_skill || '—'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learner Profile */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-primary" />
              Motivation & Personality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Motivation</span>
              <Badge variant="outline">{profile.motivation_type || '—'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Anxiety Level</span>
              <div className="flex items-center gap-1">
                {anxietyIcon}
                <span>{profile.anxiety_level || '—'}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ambiguity Tolerance</span>
              <span>{profile.ambiguity_tolerance || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Error Attitude</span>
              <span>{profile.error_attitude || '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              Learning Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Input Channel</span>
              <Badge variant="outline">{profile.preferred_input_channel || '—'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Feedback</span>
              <span>{profile.feedback_preference || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly Time</span>
              <span>{profile.weekly_study_time || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Preferred Activities</span>
              <div className="flex flex-wrap gap-1">
                {(profile.preferred_activities || []).map((a, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interest Topics */}
      {profile.interest_topics && profile.interest_topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Interest Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.interest_topics.map((topic, i) => (
                <Badge key={i} variant="outline" className="text-sm">{topic}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Self-Efficacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-primary" />
            Confidence Self-Assessment (1-5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Speaking', value: profile.confidence_speaking },
              { label: 'Writing', value: profile.confidence_writing },
              { label: 'Listening', value: profile.confidence_listening },
              { label: 'Reading', value: profile.confidence_reading },
              { label: 'Presenting', value: profile.confidence_presenting },
              { label: 'Small Talk', value: profile.confidence_small_talk },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">{label}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div
                      key={n}
                      className={`w-3 h-3 rounded-full ${
                        value && n <= value ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
