/**
 * DrawingOverlay - Nakładka canvas z Fabric.js (REDESIGNED - Windows Snipping Tool style)
 * 
 * Główny komponent do rysowania po worksheet.
 * Narzędzia: marker, highlighter, arrow, eraser, select-worksheet
 * 
 * NAPRAWIONE v4.0:
 * - Gumka sprawdza odległość od SEGMENTÓW ścieżki (nie tylko punktów końcowych)
 * - Undo/Redo działa poprawnie z wymuszonym re-renderem
 * - Dodano prop isVisible do kontroli widoczności CSS
 */

console.log('🎨 DrawingOverlay v4.0 loaded');

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Line, FabricObject, Triangle, Path, Point } from 'fabric';
import { 
  DrawingOverlayProps, 
  DrawingState, 
  DrawingTool,
  DrawingColor,
  StrokeWidth,
  DrawingData,
  DEFAULT_DRAWING_STATE,
  DEFAULT_DRAWING_COLOR,
  DEFAULT_STROKE_WIDTH,
  DRAWING_LIMITS,
  DRAWING_AUTOSAVE_CONFIG,
} from '@/types/drawing';
import { DrawingToolbar } from './DrawingToolbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/** Rozszerzone props z opcjonalnym zewnętrznym sterowaniem */
export interface DrawingOverlayExternalProps extends DrawingOverlayProps {
  externalTool?: DrawingTool;
  externalColor?: DrawingColor;
  externalStrokeWidth?: StrokeWidth;
  hideToolbar?: boolean;
  /** NOWE: Kontrola widoczności CSS (niezależna od isEnabled) */
  isVisible?: boolean;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onSaveStatusChange?: (isSaving: boolean, lastSavedAt: Date | null) => void;
  /** Callback gdy Select on Worksheet jest aktywne (do wyłączenia pointer-events) */
  onSelectWorksheetMode?: (isActive: boolean) => void;
}

/** Metody eksponowane przez ref */
export interface DrawingOverlayRef {
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  getCanUndo: () => boolean;
  getCanRedo: () => boolean;
}

export const DrawingOverlay = forwardRef<DrawingOverlayRef, DrawingOverlayExternalProps>(({
  worksheetId,
  teacherId,
  isTeacher,
  isEnabled,
  isVisible = true,
  onDrawingChange,
  externalTool,
  externalColor,
  externalStrokeWidth,
  hideToolbar = false,
  onHistoryChange,
  onSaveStatusChange,
  onSelectWorksheetMode
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDrawingArrowRef = useRef(false);
  const arrowStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentArrowGroupRef = useRef<{ line: Line; triangle: Triangle } | null>(null);
  const isInitializedRef = useRef(false);

  // NAPRAWKA v4: Refs dla Undo/Redo (unikamy stale closure)
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  // Force re-render counter
  const [, forceUpdate] = useState(0);

  // Stan rysowania
  const [drawingState, setDrawingState] = useState<DrawingState>({
    ...DEFAULT_DRAWING_STATE,
    activeTool: 'marker',
  });

  // Synchronizuj refs z callback'ami
  const updateHistoryState = useCallback(() => {
    const canUndo = undoStackRef.current.length > 1;
    const canRedo = redoStackRef.current.length > 0;
    
    console.log('🎨 [History] Update state:', { undoLength: undoStackRef.current.length, redoLength: redoStackRef.current.length, canUndo, canRedo });
    
    setDrawingState(prev => ({
      ...prev,
      canUndo,
      canRedo,
    }));
    
    onHistoryChange?.(canUndo, canRedo);
  }, [onHistoryChange]);

  // Synchronizuj z zewnętrznymi props
  useEffect(() => {
    if (externalTool !== undefined) {
      setDrawingState(prev => ({ ...prev, activeTool: externalTool }));
    }
  }, [externalTool]);

  useEffect(() => {
    if (externalColor !== undefined) {
      setDrawingState(prev => ({ ...prev, activeColor: externalColor }));
    }
  }, [externalColor]);

  useEffect(() => {
    if (externalStrokeWidth !== undefined) {
      setDrawingState(prev => ({ ...prev, strokeWidth: externalStrokeWidth }));
    }
  }, [externalStrokeWidth]);

  // Powiadom o trybie Select on Worksheet
  useEffect(() => {
    onSelectWorksheetMode?.(drawingState.activeTool === 'select-worksheet');
  }, [drawingState.activeTool, onSelectWorksheetMode]);

  // NAPRAWKA v4: Zapisz do historii
  const saveToHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    
    console.log('🎨 [History] Saving to history, current length:', undoStackRef.current.length);
    
    // Dodaj do undo stack
    undoStackRef.current = [...undoStackRef.current, json];
    
    // Ogranicz do 50 kroków
    if (undoStackRef.current.length > 50) {
      undoStackRef.current = undoStackRef.current.slice(-50);
    }
    
    // Wyczyść redo stack po nowej akcji
    redoStackRef.current = [];
    
    updateHistoryState();
  }, [updateHistoryState]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDrawings();
    }, DRAWING_AUTOSAVE_CONFIG.debounceMs);
  }, []);

  // NAPRAWKA v4: loadDrawingsFromData zwraca Promise - resolve W CALLBACKU
  const loadDrawingsFromData = useCallback((drawingData: DrawingData): Promise<void> => {
    return new Promise((resolve) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !drawingData.objects || drawingData.objects.length === 0) {
        console.log('🎨 [Load] No objects to load or no canvas');
        resolve();
        return;
      }

      console.log('🎨 [Load] Loading', drawingData.objects.length, 'objects from data');

      canvas.loadFromJSON({ objects: drawingData.objects }, () => {
        canvas.renderAll();
        
        // Zablokuj wszystkie obiekty
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        
        console.log('🎨 [Load] Objects loaded and locked, count:', canvas.getObjects().length);
        resolve();
      });
    });
  }, []);

  // NAPRAWKA v4: loadDrawings czeka na loadDrawingsFromData
  const loadDrawings = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎨 [Load] Loading drawings for worksheet:', worksheetId);
      
      const { data, error } = await supabase
        .from('worksheet_drawings')
        .select('drawing_data')
        .eq('worksheet_id', worksheetId)
        .maybeSingle();

      if (error) {
        console.error('🎨 [Load] Error loading drawings:', error);
        return false;
      }

      if (data?.drawing_data) {
        const drawingData = data.drawing_data as unknown as DrawingData;
        if (drawingData && drawingData.objects && drawingData.objects.length > 0) {
          await loadDrawingsFromData(drawingData);
          console.log('🎨 [Load] Drawings loaded successfully');
          return true;
        }
      }
      
      console.log('🎨 [Load] No drawings found');
      return false;
    } catch (err) {
      console.error('🎨 [Load] Error loading drawings:', err);
      return false;
    }
  }, [worksheetId, loadDrawingsFromData]);

  const saveDrawings = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher) return;

    setDrawingState(prev => ({ ...prev, isSaving: true }));
    onSaveStatusChange?.(true, drawingState.lastSavedAt);

    try {
      const objects = canvas.toJSON().objects || [];
      
      if (objects.length > DRAWING_LIMITS.maxObjects) {
        toast.error(`Too many objects (max ${DRAWING_LIMITS.maxObjects})`);
        setDrawingState(prev => ({ ...prev, isSaving: false }));
        onSaveStatusChange?.(false, drawingState.lastSavedAt);
        return;
      }

      const drawingData: DrawingData = {
        objects,
        version: '1.0',
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      };

      const { data: existing } = await supabase
        .from('worksheet_drawings')
        .select('id')
        .eq('worksheet_id', worksheetId)
        .maybeSingle();

      let error;
      
      if (existing) {
        const result = await supabase
          .from('worksheet_drawings')
          .update({
            drawing_data: JSON.parse(JSON.stringify(drawingData)),
            updated_at: new Date().toISOString(),
          })
          .eq('worksheet_id', worksheetId);
        error = result.error;
      } else {
        const result = await supabase
          .from('worksheet_drawings')
          .insert([{
            worksheet_id: worksheetId,
            teacher_id: teacherId,
            drawing_data: JSON.parse(JSON.stringify(drawingData)),
          }]);
        error = result.error;
      }

      if (error) throw error;

      const now = new Date();
      setDrawingState(prev => ({ 
        ...prev, 
        isSaving: false,
        lastSavedAt: now,
      }));
      onSaveStatusChange?.(false, now);

      onDrawingChange?.(drawingData);
    } catch (err) {
      console.error('Error saving drawings:', err);
      toast.error('Failed to save drawing');
      setDrawingState(prev => ({ ...prev, isSaving: false }));
      onSaveStatusChange?.(false, drawingState.lastSavedAt);
    }
  };

  // NAPRAWIONE v4: Undo cofa pojedynczy krok
  const handleUndo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      console.log('🎨 [Undo] No canvas');
      return;
    }
    
    if (undoStackRef.current.length <= 1) {
      console.log('🎨 [Undo] Nothing to undo, stack length:', undoStackRef.current.length);
      return;
    }

    console.log('🎨 [Undo] Undoing, stack length:', undoStackRef.current.length);

    // Pobierz obecny stan (ostatni w stacku) i przenieś do redo
    const currentState = undoStackRef.current[undoStackRef.current.length - 1];
    redoStackRef.current = [...redoStackRef.current, currentState];

    // Usuń obecny stan z undo (pop)
    undoStackRef.current = undoStackRef.current.slice(0, -1);

    // Załaduj poprzedni stan (teraz ostatni w stacku)
    const previousState = undoStackRef.current[undoStackRef.current.length - 1];
    
    console.log('🎨 [Undo] Loading previous state, objects:', JSON.parse(previousState).objects?.length || 0);
    
    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.renderAll();
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      console.log('🎨 [Undo] State restored, undo stack length:', undoStackRef.current.length, 'redo stack length:', redoStackRef.current.length);
      updateHistoryState();
      // Force React re-render
      forceUpdate(n => n + 1);
      scheduleAutoSave();
    });
  }, [updateHistoryState, scheduleAutoSave]);

  // NAPRAWIONE v4: Redo działa natychmiast
  const handleRedo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      console.log('🎨 [Redo] No canvas');
      return;
    }
    
    if (redoStackRef.current.length === 0) {
      console.log('🎨 [Redo] Nothing to redo');
      return;
    }

    console.log('🎨 [Redo] Redoing, redo stack length:', redoStackRef.current.length);

    // Pobierz stan do przywrócenia (ostatni w redo stacku)
    const nextState = redoStackRef.current[redoStackRef.current.length - 1];
    
    // Usuń ze stosu redo
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    
    // Dodaj obecny stan do undo (przed załadowaniem nowego)
    undoStackRef.current = [...undoStackRef.current, nextState];

    console.log('🎨 [Redo] Loading state, objects:', JSON.parse(nextState).objects?.length || 0);

    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      console.log('🎨 [Redo] State restored, undo stack length:', undoStackRef.current.length, 'redo stack length:', redoStackRef.current.length);
      updateHistoryState();
      // Force React re-render
      forceUpdate(n => n + 1);
      scheduleAutoSave();
    });
  }, [updateHistoryState, scheduleAutoSave]);

  const handleClearAll = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    saveToHistory();
    canvas.clear();
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
    scheduleAutoSave();
  }, [saveToHistory, scheduleAutoSave]);

  // Eksponuj metody przez ref
  useImperativeHandle(ref, () => ({
    undo: handleUndo,
    redo: handleRedo,
    clearAll: handleClearAll,
    getCanUndo: () => undoStackRef.current.length > 1,
    getCanRedo: () => redoStackRef.current.length > 0,
  }), [handleUndo, handleRedo, handleClearAll]);

  // NAPRAWKA v4: Inicjalizacja Fabric.js canvas z poprawnym ładowaniem
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Jeśli canvas już istnieje, nie twórz nowego
    if (isInitializedRef.current && fabricCanvasRef.current) {
      console.log('🎨 [Init] Canvas already initialized, skipping');
      return;
    }

    console.log('🎨 [Init] Initializing Fabric.js canvas for worksheet:', worksheetId);

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      backgroundColor: 'transparent',
      selection: false,
      isDrawingMode: false,
    });

    // Konfiguracja pędzla
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = DEFAULT_DRAWING_COLOR.hex;
    canvas.freeDrawingBrush.width = DEFAULT_STROKE_WIDTH.value;

    fabricCanvasRef.current = canvas;
    isInitializedRef.current = true;

    // NAPRAWKA v4: Załaduj rysunki i zapisz initial state PO załadowaniu
    loadDrawings().then((hasDrawings) => {
      if (fabricCanvasRef.current) {
        // Zapisz initial state PO faktycznym załadowaniu
        const initialState = JSON.stringify(fabricCanvasRef.current.toJSON());
        undoStackRef.current = [initialState];
        redoStackRef.current = [];
        console.log('🎨 [Init] Initial state saved, has drawings:', hasDrawings, 'objects:', JSON.parse(initialState).objects?.length || 0);
        updateHistoryState();
      }
    });

    // Obsługa resize
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;
      
      const newWidth = containerRef.current.offsetWidth;
      const newHeight = containerRef.current.offsetHeight;
      
      fabricCanvasRef.current.setDimensions({
        width: newWidth,
        height: newHeight
      });
      fabricCanvasRef.current.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      console.log('🎨 [Init] Cleanup - disposing canvas');
      window.removeEventListener('resize', handleResize);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      canvas.dispose();
      fabricCanvasRef.current = null;
      isInitializedRef.current = false;
    };
  }, [worksheetId]); // Dodane worksheetId jako dependency

  // Aktualizuj interaktywność canvas gdy isEnabled się zmienia
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.selection = false;
    canvas.forEachObject((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });
    
    canvas.renderAll();
  }, [isTeacher, isEnabled]);

  // Obsługa zmiany narzędzia (marker, highlighter)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher) return;

    const { activeTool, activeColor, strokeWidth } = drawingState;

    const drawingTools: DrawingTool[] = ['marker', 'highlighter'];
    
    if (drawingTools.includes(activeTool) && isEnabled) {
      canvas.isDrawingMode = true;
      
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      
      if (activeTool === 'marker') {
        canvas.freeDrawingBrush.color = activeColor.hex;
        canvas.freeDrawingBrush.width = strokeWidth.value * 2;
      } else if (activeTool === 'highlighter') {
        canvas.freeDrawingBrush.color = activeColor.hex;
        canvas.freeDrawingBrush.width = strokeWidth.value * 4;
      }
    } else {
      canvas.isDrawingMode = false;
    }
  }, [drawingState.activeTool, drawingState.activeColor, drawingState.strokeWidth, isTeacher, isEnabled]);

  // Obsługa path:created - zapisz do historii po narysowaniu
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handlePathCreated = (e: any) => {
      const path = e.path;
      if (path) {
        // Zablokuj edycję path
        path.selectable = false;
        path.evented = false;
        
        console.log('🎨 [Path] Created, saving to history');
        saveToHistory();
        scheduleAutoSave();
      }
    };

    canvas.on('path:created', handlePathCreated);
    
    return () => {
      canvas.off('path:created', handlePathCreated);
    };
  }, [saveToHistory, scheduleAutoSave]);

  // Obsługa strzałki (arrow tool)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;
    if (drawingState.activeTool !== 'arrow') return;

    const { activeColor, strokeWidth } = drawingState;

    const handleMouseDown = (e: any) => {
      if (!e.pointer) return;
      
      isDrawingArrowRef.current = true;
      arrowStartPointRef.current = { x: e.pointer.x, y: e.pointer.y };
      
      // Utwórz linię
      const line = new Line(
        [e.pointer.x, e.pointer.y, e.pointer.x, e.pointer.y],
        {
          stroke: activeColor.hex,
          strokeWidth: strokeWidth.value * 2,
          selectable: false,
          evented: false,
        }
      );
      
      // Utwórz grot strzałki
      const triangle = new Triangle({
        left: e.pointer.x,
        top: e.pointer.y,
        width: strokeWidth.value * 6,
        height: strokeWidth.value * 8,
        fill: activeColor.hex,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      
      currentArrowGroupRef.current = { line, triangle };
      canvas.add(line);
      canvas.add(triangle);
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawingArrowRef.current || !arrowStartPointRef.current || !currentArrowGroupRef.current || !e.pointer) return;
      
      const { line, triangle } = currentArrowGroupRef.current;
      const start = arrowStartPointRef.current;
      const end = e.pointer;
      
      // Aktualizuj linię
      line.set({ x2: end.x, y2: end.y });
      
      // Oblicz kąt strzałki
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90;
      
      // Aktualizuj grot
      triangle.set({
        left: end.x,
        top: end.y,
        angle: angle,
      });
      
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (isDrawingArrowRef.current && currentArrowGroupRef.current) {
        const { line, triangle } = currentArrowGroupRef.current;
        line.selectable = false;
        line.evented = false;
        triangle.selectable = false;
        triangle.evented = false;
        
        console.log('🎨 [Arrow] Created, saving to history');
        saveToHistory();
        scheduleAutoSave();
      }
      
      isDrawingArrowRef.current = false;
      arrowStartPointRef.current = null;
      currentArrowGroupRef.current = null;
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [drawingState.activeTool, drawingState.activeColor, drawingState.strokeWidth, isTeacher, isEnabled, saveToHistory, scheduleAutoSave]);

  // NAPRAWKA v4: Gumka - sprawdza odległość od SEGMENTÓW ścieżki
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;
    if (drawingState.activeTool !== 'eraser') return;

    canvas.isDrawingMode = false;
    let isErasing = false;
    let hasErased = false;

    // Oblicz odległość punktu od odcinka
    const pointToSegmentDistance = (
      px: number, py: number,
      x1: number, y1: number,
      x2: number, y2: number
    ): number => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lengthSquared = dx * dx + dy * dy;
      
      if (lengthSquared === 0) {
        return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
      }
      
      let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
      t = Math.max(0, Math.min(1, t));
      
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      
      return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    };

    // NAPRAWKA v4: Sprawdź czy punkt jest na obiekcie (sprawdzaj SEGMENTY, nie tylko punkty)
    const isPointOnObject = (obj: FabricObject, pointer: { x: number; y: number }): boolean => {
      const tolerance = 15;
      
      // Dla Line (część strzałki) - oblicz odległość od linii
      if (obj.type === 'line') {
        const line = obj as Line;
        const matrix = line.calcTransformMatrix();
        
        // Transformuj punkty linii
        const x1 = line.x1 || 0;
        const y1 = line.y1 || 0;
        const x2 = line.x2 || 0;
        const y2 = line.y2 || 0;
        
        // Zastosuj transformację
        const startX = matrix[0] * x1 + matrix[2] * y1 + matrix[4];
        const startY = matrix[1] * x1 + matrix[3] * y1 + matrix[5];
        const endX = matrix[0] * x2 + matrix[2] * y2 + matrix[4];
        const endY = matrix[1] * x2 + matrix[3] * y2 + matrix[5];
        
        const distance = pointToSegmentDistance(pointer.x, pointer.y, startX, startY, endX, endY);
        return distance < tolerance + (line.strokeWidth || 2);
      }
      
      // Dla Triangle (grot strzałki) - sprawdź bounding box (jest mały)
      if (obj.type === 'triangle') {
        const bounds = obj.getBoundingRect();
        const padding = tolerance;
        return (
          pointer.x >= bounds.left - padding &&
          pointer.x <= bounds.left + bounds.width + padding &&
          pointer.y >= bounds.top - padding &&
          pointer.y <= bounds.top + bounds.height + padding
        );
      }
      
      // NAPRAWKA v4: Dla Path (marker/highlighter) - sprawdź SEGMENTY ścieżki
      if (obj.type === 'path' && (obj as Path).path) {
        const path = obj as Path;
        const pathData = path.path;
        if (!pathData || pathData.length === 0) return false;
        
        const matrix = path.calcTransformMatrix();
        const strokeTolerance = tolerance + (path.strokeWidth || 2);
        
        // Przechowuj poprzedni punkt do tworzenia segmentów
        let prevX = 0;
        let prevY = 0;
        let isFirstPoint = true;
        
        // Sprawdź każdy segment ścieżki
        for (let i = 0; i < pathData.length; i++) {
          const segment = pathData[i];
          if (!Array.isArray(segment) || segment.length < 3) continue;
          
          const cmd = segment[0];
          
          if (cmd === 'M') {
            // Move to - początek nowej ścieżki
            prevX = segment[1] as number;
            prevY = segment[2] as number;
            isFirstPoint = false;
          } else if (cmd === 'L' || cmd === 'Q' || cmd === 'C') {
            // Line to, Quadratic, Cubic - mamy segment
            const x = segment[segment.length - 2] as number;
            const y = segment[segment.length - 1] as number;
            
            if (!isFirstPoint) {
              // Transformuj oba punkty segmentu
              const startX = matrix[0] * prevX + matrix[2] * prevY + matrix[4];
              const startY = matrix[1] * prevX + matrix[3] * prevY + matrix[5];
              const endX = matrix[0] * x + matrix[2] * y + matrix[4];
              const endY = matrix[1] * x + matrix[3] * y + matrix[5];
              
              // Sprawdź odległość od segmentu
              const distance = pointToSegmentDistance(pointer.x, pointer.y, startX, startY, endX, endY);
              
              if (distance < strokeTolerance) {
                console.log('🎨 [Eraser] Hit path segment, distance:', distance.toFixed(2));
                return true;
              }
            }
            
            prevX = x;
            prevY = y;
            isFirstPoint = false;
          }
        }
        return false;
      }
      
      // Dla innych obiektów - użyj containsPoint z tolerancją
      return obj.containsPoint(new Point(pointer.x, pointer.y));
    };

    const handleMouseDown = (e: any) => {
      if (!e.pointer) return;
      isErasing = true;
      hasErased = false;
      eraseAtPoint(e.pointer);
    };

    const handleMouseMove = (e: any) => {
      if (!isErasing || !e.pointer) return;
      eraseAtPoint(e.pointer);
    };

    const eraseAtPoint = (pointer: { x: number; y: number }) => {
      const objectsToRemove: FabricObject[] = [];
      
      canvas.forEachObject((obj) => {
        if (isPointOnObject(obj, pointer)) {
          objectsToRemove.push(obj);
        }
      });
      
      if (objectsToRemove.length > 0) {
        console.log('🎨 [Eraser] Removing', objectsToRemove.length, 'objects');
        objectsToRemove.forEach(obj => canvas.remove(obj));
        canvas.renderAll();
        hasErased = true;
      }
    };

    const handleMouseUp = () => {
      if (isErasing && hasErased) {
        console.log('🎨 [Eraser] Erased objects, saving to history');
        saveToHistory();
        scheduleAutoSave();
      }
      isErasing = false;
      hasErased = false;
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [drawingState.activeTool, isTeacher, isEnabled, saveToHistory, scheduleAutoSave]);

  // Realtime subscription dla ucznia
  useEffect(() => {
    if (isTeacher) return;

    const channel = supabase
      .channel(`drawing:${worksheetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worksheet_drawings',
          filter: `worksheet_id=eq.${worksheetId}`,
        },
        (payload) => {
          if (payload.new && 'drawing_data' in payload.new) {
            const drawingData = payload.new.drawing_data as unknown as DrawingData;
            if (drawingData && drawingData.objects) {
              loadDrawingsFromData(drawingData);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [worksheetId, isTeacher, loadDrawingsFromData]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isTeacher || !isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        const toolShortcuts: Record<string, DrawingTool> = {
          'v': 'select-worksheet',
          'm': 'marker',
          'h': 'highlighter',
          'a': 'arrow',
          'e': 'eraser',
        };
        
        const tool = toolShortcuts[e.key.toLowerCase()];
        if (tool) {
          setDrawingState(prev => ({ ...prev, activeTool: tool }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTeacher, isEnabled, handleUndo, handleRedo]);

  const handleToolChange = (tool: DrawingTool) => {
    setDrawingState(prev => ({ ...prev, activeTool: tool }));
  };

  const handleColorChange = (color: DrawingColor) => {
    setDrawingState(prev => ({ ...prev, activeColor: color }));
  };

  const handleStrokeWidthChange = (width: StrokeWidth) => {
    setDrawingState(prev => ({ ...prev, strokeWidth: width }));
  };

  const isSelectMode = drawingState.activeTool === 'select-worksheet';

  // NAPRAWKA v4: Kontrola widoczności przez prop isVisible
  // Dla studentów - tylko pokaż rysunki (nie pozwól rysować)
  if (!isTeacher && !isEnabled) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 z-[30] pointer-events-none",
          !isVisible && "hidden"
        )}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <>
      {/* Toolbar - tylko dla nauczyciela gdy włączone i nie ukryty */}
      {isTeacher && isEnabled && !hideToolbar && (
        <DrawingToolbar
          state={drawingState}
          onToolChange={handleToolChange}
          onColorChange={handleColorChange}
          onStrokeWidthChange={handleStrokeWidthChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearAll={handleClearAll}
        />
      )}

      {/* Canvas overlay - NAPRAWKA v4: kontrola widoczności przez CSS */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 z-[30]",
          isSelectMode ? "pointer-events-none" : (isEnabled ? "pointer-events-auto" : "pointer-events-none"),
          !isTeacher && "pointer-events-none",
          !isVisible && "hidden"
        )}
        style={{
          touchAction: isEnabled && isTeacher && !isSelectMode ? 'none' : 'auto',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </>
  );
});

DrawingOverlay.displayName = 'DrawingOverlay';

export default DrawingOverlay;
