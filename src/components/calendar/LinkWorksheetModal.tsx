import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface Worksheet {
  id: string;
  title: string;
  created_at: string;
}

interface LinkWorksheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  studentId?: string | null;
  currentWorksheetId?: string | null;
  onLink: (worksheetId: string | null) => Promise<void>;
}

export function LinkWorksheetModal({ open, onOpenChange, teacherId, studentId, currentWorksheetId, onLink }: LinkWorksheetModalProps) {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !teacherId) return;
    setLoading(true);

    const fetchWorksheets = async () => {
      let query = supabase
        .from('worksheets')
        .select('id, title, created_at')
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data } = await query;
      setWorksheets((data || []) as Worksheet[]);
      setLoading(false);
    };

    fetchWorksheets();
  }, [open, teacherId, studentId]);

  const handleSelect = async (worksheetId: string | null) => {
    setSaving(true);
    await onLink(worksheetId);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Worksheet</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {currentWorksheetId && (
            <Button variant="outline" className="w-full justify-start text-destructive" onClick={() => handleSelect(null)} disabled={saving}>
              <X className="h-4 w-4 mr-2" /> Remove current link
            </Button>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading worksheets...</p>
          ) : worksheets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No worksheets found{studentId ? ' for this student' : ''}.</p>
          ) : (
            worksheets.map(ws => (
              <Button
                key={ws.id}
                variant={ws.id === currentWorksheetId ? 'secondary' : 'ghost'}
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => handleSelect(ws.id)}
                disabled={saving}
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-medium">{ws.title || 'Untitled'}</span>
                  <span className="text-xs text-muted-foreground ml-2">{format(new Date(ws.created_at), 'MMM d, yyyy')}</span>
                </div>
                {ws.id === currentWorksheetId && <Check className="h-4 w-4 ml-auto flex-shrink-0 text-primary" />}
              </Button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
