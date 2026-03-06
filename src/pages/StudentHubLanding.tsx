import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSavedHubEmail, saveHubEmail, clearHubEmail } from '@/hooks/useStudentHubData';

interface Teacher {
  name: string;
  token: string;
}

const StudentHubLanding = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const saved = getSavedHubEmail();
    if (saved) {
      setEmail(saved);
      findTeachers(saved);
    }
  }, []);

  const findTeachers = async (emailToSearch: string) => {
    if (!emailToSearch.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-teachers-by-student-email', {
        body: { email: emailToSearch.trim() },
      });
      if (error) throw error;
      const found = data?.teachers || [];
      setTeachers(found);
      saveHubEmail(emailToSearch.trim());

      // Auto-redirect if single teacher
      if (found.length === 1) {
        navigate(`/my/${found[0].token}`);
      }
    } catch (err: any) {
      console.error('Error finding teachers:', err);
      toast.error('Could not find teachers');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    findTeachers(email);
  };

  const handleLogout = () => {
    clearHubEmail();
    setEmail('');
    setTeachers([]);
    setSearched(false);
  };

  const savedEmail = getSavedHubEmail();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <GraduationCap className="h-10 w-10 mx-auto text-primary mb-2" />
          <CardTitle className="text-2xl">My Learning Hub</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email to access your flashcards, homework, worksheets & lessons
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-sm">Your Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {loading ? 'Searching...' : 'Access My Materials'}
            </Button>
          </form>

          {savedEmail && (
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-3 w-3 mr-1" /> Log out ({savedEmail})
            </Button>
          )}

          {searched && !loading && teachers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No teachers found for this email. Make sure your teacher has added you as a student.
            </p>
          )}

          {teachers.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select your teacher:</p>
              {teachers.map((t, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-between h-auto py-3"
                  onClick={() => navigate(`/my/${t.token}`)}
                >
                  <span className="font-medium">{t.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentHubLanding;
