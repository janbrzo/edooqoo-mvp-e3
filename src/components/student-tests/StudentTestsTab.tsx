/**
 * Student Tests Tab - Main component for viewing and managing tests
 */

import { useState } from 'react';
import { Plus, FileText, TrendingUp, Target, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentTests } from '@/hooks/useStudentTests';
import { TEST_STATUS_CONFIG, TEST_TYPES } from '@/types/studentTests';
import type { StudentTest } from '@/types/studentTests';

interface StudentTestsTabProps {
  studentId: string;
  teacherId: string;
  studentName?: string;
}

export function StudentTestsTab({ studentId, teacherId, studentName }: StudentTestsTabProps) {
  const { tests, loading, getTestStats } = useStudentTests({ studentId, teacherId });
  const stats = getTestStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading tests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tests</h2>
          <p className="text-muted-foreground">
            {stats.total} tests • {stats.completed} completed • Avg score: {stats.avgScore.toFixed(0)}%
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
          <Badge variant="secondary" className="ml-2 text-xs">Coming Soon</Badge>
        </Button>
      </div>

      {/* Tests list */}
      {tests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
            <p className="text-muted-foreground mb-4">
              Tests help verify student progress and identify skill gaps.
            </p>
            <Button variant="outline" disabled>
              <Plus className="h-4 w-4 mr-2" />
              Create First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}

      {/* Info about upcoming features */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Intelligent Tests - Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>AI-Generated Questions</strong> based on student's Progress, Knowledge Base, and Flashcards</p>
          <p>• <strong>Automatic Progress Updates</strong> - test results update Learning Element ratings</p>
          <p>• <strong>Skill Verification</strong> - confirm mastery before marking goals as achieved</p>
          <p>• <strong>Placement Tests</strong> - initial assessment for new students</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TestCard({ test }: { test: StudentTest }) {
  const statusConfig = TEST_STATUS_CONFIG[test.status];
  const testTypeInfo = TEST_TYPES.find(t => t.value === test.test_type);

  const getIcon = () => {
    switch (test.test_type) {
      case 'placement': return <FileText className="h-5 w-5" />;
      case 'progress_check': return <TrendingUp className="h-5 w-5" />;
      case 'skill_verification': return <CheckCircle className="h-5 w-5" />;
      case 'goal_check': return <Target className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-semibold">{test.title}</h3>
              <p className="text-sm text-muted-foreground">
                {testTypeInfo?.label} • {test.total_questions} questions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {test.score_percentage !== null && (
              <div className="text-right">
                <div className="text-2xl font-bold">{test.score_percentage.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">
                  {test.correct_answers}/{test.total_questions} correct
                </div>
              </div>
            )}
            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
