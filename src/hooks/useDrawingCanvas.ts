/**
 * useDrawingCanvas - Hook zarządzający logiką rysowania z Fabric.js
 * 
 * Odpowiada za:
 * - Ładowanie/zapisywanie rysunków z bazy danych
 * - Realtime broadcast dla nauczyciela
 * - Realtime subscribe dla ucznia
 * - Auto-save z debounce
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DrawingData } from '@/types/drawing';
import { useToast } from '@/hooks/use-toast';

interface UseDrawingCanvasProps {
  worksheetId: string;
  teacherId?: string;
  isTeacher: boolean;
  enabled: boolean;
}

interface UseDrawingCanvasReturn {
  // State
  drawingData: DrawingData | null;
  isSaving: boolean;
  isLoading: boolean;
  lastSavedAt: Date | null;
  
  // Actions
  saveDrawing: (data: DrawingData) => Promise<void>;
  loadDrawing: () => Promise<DrawingData | null>;
  clearDrawing: () => Promise<void>;
  
  // Realtime
  broadcastDrawing: (data: DrawingData) => void;
}

export const useDrawingCanvas = ({
  worksheetId,
  teacherId,
  isTeacher,
  enabled
}: UseDrawingCanvasProps): UseDrawingCanvasReturn => {
  const { toast } = useToast();
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Załaduj rysunek z bazy danych
  const loadDrawing = useCallback(async (): Promise<DrawingData | null> => {
    if (!worksheetId || !enabled) return null;
    
    setIsLoading(true);
    try {
      console.log('[useDrawingCanvas] Loading drawing for worksheet:', worksheetId);
      
      const { data, error } = await supabase
        .from('worksheet_drawings')
        .select('*')
        .eq('worksheet_id', worksheetId)
        .maybeSingle();
      
      if (error) {
        console.error('[useDrawingCanvas] Error loading drawing:', error);
        return null;
      }
      
      if (data) {
        const drawingDataRaw = data.drawing_data as unknown;
        const drawing = drawingDataRaw as DrawingData;
        console.log('[useDrawingCanvas] Loaded drawing with', drawing.objects?.length || 0, 'objects');
        setDrawingData(drawing);
        return drawing;
      }

      return null;
    } catch (error) {
      console.error('[useDrawingCanvas] Error loading drawing:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [worksheetId, enabled]);

  // Zapisz rysunek do bazy danych
  const saveDrawing = useCallback(async (data: DrawingData): Promise<void> => {
    if (!worksheetId || !teacherId || !isTeacher) {
      console.log('[useDrawingCanvas] Cannot save - missing worksheetId, teacherId, or not teacher');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('[useDrawingCanvas] Saving drawing with', data.objects?.length || 0, 'objects');
      
      const { error } = await supabase
        .from('worksheet_drawings')
        .upsert({
          worksheet_id: worksheetId,
          teacher_id: teacherId,
          drawing_data: data as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'worksheet_id'
        });
      
      if (error) {
        console.error('[useDrawingCanvas] Error saving drawing:', error);
        throw error;
      }
      
      setDrawingData(data);
      setLastSavedAt(new Date());
      console.log('[useDrawingCanvas] Drawing saved successfully');
    } catch (error) {
      console.error('[useDrawingCanvas] Error saving drawing:', error);
      toast({
        title: "Failed to save drawing",
        description: "Your drawing changes may not be saved.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [worksheetId, teacherId, isTeacher, toast]);

  // Wyczyść rysunek
  const clearDrawing = useCallback(async (): Promise<void> => {
    if (!worksheetId || !teacherId || !isTeacher) return;
    
    try {
      const emptyData: DrawingData = { version: '1.0', objects: [] };
      await saveDrawing(emptyData);
      
      // Broadcast clear to students
      broadcastDrawing(emptyData);
    } catch (error) {
      console.error('[useDrawingCanvas] Error clearing drawing:', error);
    }
  }, [worksheetId, teacherId, isTeacher, saveDrawing]);

  // Broadcast rysunek przez Realtime (dla nauczyciela)
  const broadcastDrawing = useCallback((data: DrawingData): void => {
    if (!channelRef.current || !isTeacher) return;
    
    console.log('[useDrawingCanvas] Broadcasting drawing update');
    channelRef.current.send({
      type: 'broadcast',
      event: 'drawing_update',
      payload: { drawingData: data }
    });
  }, [isTeacher]);

  // Ustaw Realtime channel
  useEffect(() => {
    if (!worksheetId || !enabled) return;

    const channelName = `drawing:${worksheetId}`;
    console.log('[useDrawingCanvas] Setting up Realtime channel:', channelName);

    const channel = supabase.channel(channelName);
    
    // Uczeń subskrybuje zmiany rysunku
    if (!isTeacher) {
      channel.on('broadcast', { event: 'drawing_update' }, (payload) => {
        console.log('[useDrawingCanvas] Received drawing update from teacher');
        if (payload.payload?.drawingData) {
          setDrawingData(payload.payload.drawingData);
        }
      });
    }
    
    channel.subscribe((status) => {
      console.log('[useDrawingCanvas] Realtime subscription status:', status);
    });
    
    channelRef.current = channel;

    return () => {
      console.log('[useDrawingCanvas] Cleaning up Realtime channel');
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [worksheetId, enabled, isTeacher]);

  // Załaduj rysunek przy montowaniu
  useEffect(() => {
    if (enabled && worksheetId) {
      loadDrawing();
    }
  }, [enabled, worksheetId, loadDrawing]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    drawingData,
    isSaving,
    isLoading,
    lastSavedAt,
    saveDrawing,
    loadDrawing,
    clearDrawing,
    broadcastDrawing
  };
};

export default useDrawingCanvas;
