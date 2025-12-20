/**
 * DrawingOverlay - Nakładka canvas z Fabric.js (REDESIGNED v6 - Complete Rewrite)
 * 
 * Główny komponent do rysowania po worksheet.
 * Narzędzia: marker, highlighter, arrow, eraser, select-worksheet
 * 
 * NAPRAWIONE v6.0:
 * - ZAWSZE montowany (kontrola widoczności przez CSS)
 * - Gumka przepisana od nowa z useRef (continuous erasing)
 * - Undo/Redo przepisane od nowa z poprawną logiką stosu
 * - Strzałki jako fabric.Group (jeden obiekt do usunięcia)
 * - Poprawiona detekcja kolizji dla wszystkich obiektów
 */

console.log('🎨 DrawingOverlay v6.0 loaded');

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Line, FabricObject, Triangle, Path, Point, Group } from 'fabric';
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
  /** Kontrola widoczności CSS (niezależna od isEnabled) */
  isVisible?: boolean;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onSaveStatusChange?: (isSaving: boolean, lastSavedAt: Date | null) => void;
  /** Callback gdy Select on Worksheet jest aktywne */
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
  const isInitializedRef = useRef(false);
  
  // === ARROW REFS ===
  const isDrawingArrowRef = useRef(false);
  const arrowStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentArrowGroupRef = useRef<Group | null>(null);
  
  // === ERASER REFS (v6: useRef zamiast zmiennych lokalnych) ===
  const isErasingRef = useRef(false);
  const hasErasedInSessionRef = useRef(false);

  // === HISTORY v6: Przepisane od nowa ===
  // currentStateRef = obecny stan canvas (to co widzimy)
  // undoStackRef = poprzednie stany (możemy do nich wrócić)
  // redoStackRef = cofnięte stany (możemy przywrócić)
  const currentStateRef = useRef<string>('');
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  
  const [, forceUpdate] = useState(0);

  // Stan rysowania
  const [drawingState, setDrawingState] = useState<DrawingState>({
    ...DEFAULT_DRAWING_STATE,
    activeTool: 'marker',
  });

  // === HISTORY v6: Aktualizacja UI ===
  const updateHistoryState = useCallback(() => {
    const canUndo = undoStackRef.current.length > 0;
    const canRedo = redoStackRef.current.length > 0;
    
    console.log('🎨 [History v6] State:', { 
      currentExists: !!currentStateRef.current,
      undoLength: undoStackRef.current.length, 
      redoLength: redoStackRef.current.length, 
      canUndo, 
      canRedo 
    });
    
    setDrawingState(prev => ({
      ...prev,
      canUndo,
      canRedo,
    }));
    
    onHistoryChange?.(canUndo, canRedo);
  }, [onHistoryChange]);

  // === HISTORY v6: Zapisz stan PO każdej akcji ===
  const saveToHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newState = JSON.stringify(canvas.toJSON());
    
    // Przenieś obecny stan do undo stack (jeśli istnieje)
    if (currentStateRef.current) {
      undoStackRef.current = [...undoStackRef.current, currentStateRef.current];
      
      // Ogranicz do 50 kroków
      if (undoStackRef.current.length > 50) {
        undoStackRef.current = undoStackRef.current.slice(-50);
      }
    }
    
    // Nowy stan to obecny stan
    currentStateRef.current = newState;
    
    // Wyczyść redo stack (nowa akcja anuluje redo)
    redoStackRef.current = [];
    
    console.log('🎨 [History v6] Saved - undoStack:', undoStackRef.current.length);
    updateHistoryState();
  }, [updateHistoryState]);

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

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDrawings();
    }, DRAWING_AUTOSAVE_CONFIG.debounceMs);
  }, []);

  // Załaduj rysunki z danych
  const loadDrawingsFromData = useCallback((drawingData: DrawingData): Promise<boolean> => {
    return new Promise((resolve) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || !drawingData.objects || drawingData.objects.length === 0) {
        console.log('🎨 [Load] No objects to load or no canvas');
        resolve(false);
        return;
      }

      console.log('🎨 [Load] Loading', drawingData.objects.length, 'objects');

      canvas.loadFromJSON({ objects: drawingData.objects }, () => {
        canvas.renderAll();
        
        // Zablokuj wszystkie obiekty
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        
        console.log('🎨 [Load] Objects loaded, count:', canvas.getObjects().length);
        resolve(true);
      });
    });
  }, []);

  // Załaduj rysunki z bazy
  const loadDrawings = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎨 [Load] Loading drawings for worksheet:', worksheetId);
      
      const { data, error } = await supabase
        .from('worksheet_drawings')
        .select('drawing_data')
        .eq('worksheet_id', worksheetId)
        .maybeSingle();

      if (error) {
        console.error('🎨 [Load] Error:', error);
        return false;
      }

      if (data?.drawing_data) {
        const drawingData = data.drawing_data as unknown as DrawingData;
        if (drawingData && drawingData.objects && drawingData.objects.length > 0) {
          await loadDrawingsFromData(drawingData);
          return true;
        }
      }
      
      console.log('🎨 [Load] No drawings found');
      return false;
    } catch (err) {
      console.error('🎨 [Load] Error:', err);
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

  // === UNDO v6: Przepisane od nowa ===
  const handleUndo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      console.log('🎨 [Undo v6] No canvas');
      return;
    }
    
    if (undoStackRef.current.length === 0) {
      console.log('🎨 [Undo v6] Nothing to undo');
      return;
    }

    console.log('🎨 [Undo v6] Undoing...');

    // 1. Przenieś obecny stan do redo
    if (currentStateRef.current) {
      redoStackRef.current = [...redoStackRef.current, currentStateRef.current];
    }

    // 2. Weź ostatni stan z undo stack
    const previousState = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);

    // 3. Ustaw jako obecny i załaduj
    currentStateRef.current = previousState;
    
    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.renderAll();
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      console.log('🎨 [Undo v6] Restored, objects:', canvas.getObjects().length);
      updateHistoryState();
      forceUpdate(n => n + 1);
      scheduleAutoSave();
    });
  }, [updateHistoryState, scheduleAutoSave]);

  // === REDO v6: Przepisane od nowa ===
  const handleRedo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      console.log('🎨 [Redo v6] No canvas');
      return;
    }
    
    if (redoStackRef.current.length === 0) {
      console.log('🎨 [Redo v6] Nothing to redo');
      return;
    }

    console.log('🎨 [Redo v6] Redoing...');

    // 1. Przenieś obecny stan do undo
    if (currentStateRef.current) {
      undoStackRef.current = [...undoStackRef.current, currentStateRef.current];
    }

    // 2. Weź ostatni stan z redo stack
    const nextState = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);

    // 3. Ustaw jako obecny i załaduj
    currentStateRef.current = nextState;
    
    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      console.log('🎨 [Redo v6] Restored, objects:', canvas.getObjects().length);
      updateHistoryState();
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
    getCanUndo: () => undoStackRef.current.length > 0,
    getCanRedo: () => redoStackRef.current.length > 0,
  }), [handleUndo, handleRedo, handleClearAll]);

  // === INICJALIZACJA v6 ===
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    if (isInitializedRef.current && fabricCanvasRef.current) {
      console.log('🎨 [Init v6] Canvas already initialized');
      return;
    }

    console.log('🎨 [Init v6] Initializing canvas for worksheet:', worksheetId);

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      backgroundColor: 'transparent',
      selection: false,
      isDrawingMode: false,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = DEFAULT_DRAWING_COLOR.hex;
    canvas.freeDrawingBrush.width = DEFAULT_STROKE_WIDTH.value;

    fabricCanvasRef.current = canvas;
    isInitializedRef.current = true;

    // Załaduj rysunki i ustaw initial state
    loadDrawings().then((hasDrawings) => {
      if (fabricCanvasRef.current) {
        // Zapisz początkowy stan (pusty lub z rysunkami)
        currentStateRef.current = JSON.stringify(fabricCanvasRef.current.toJSON());
        undoStackRef.current = [];
        redoStackRef.current = [];
        console.log('🎨 [Init v6] Initial state saved, hasDrawings:', hasDrawings);
        updateHistoryState();
      }
    });

    // Obsługa resize
    const handleResize = () => {
      if (!containerRef.current || !fabricCanvasRef.current) return;
      
      fabricCanvasRef.current.setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
      fabricCanvasRef.current.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      console.log('🎨 [Init v6] Cleanup');
      window.removeEventListener('resize', handleResize);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      canvas.dispose();
      fabricCanvasRef.current = null;
      isInitializedRef.current = false;
    };
  }, [worksheetId, loadDrawings, updateHistoryState]);

  // Aktualizuj interaktywność canvas
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

  // Obsługa narzędzi rysowania (marker, highlighter)
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

  // Obsługa path:created
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handlePathCreated = (e: any) => {
      const path = e.path;
      if (path) {
        path.selectable = false;
        path.evented = false;
        
        console.log('🎨 [Path] Created');
        saveToHistory();
        scheduleAutoSave();
      }
    };

    canvas.on('path:created', handlePathCreated);
    
    return () => {
      canvas.off('path:created', handlePathCreated);
    };
  }, [saveToHistory, scheduleAutoSave]);

  // === STRZAŁKA v6: Grupowane jako jeden obiekt ===
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
      
      // Utwórz grot
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
      
      // v6: Utwórz grupę (strzałka = jeden obiekt)
      const arrowGroup = new Group([line, triangle], {
        selectable: false,
        evented: false,
      });
      
      currentArrowGroupRef.current = arrowGroup;
      canvas.add(arrowGroup);
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawingArrowRef.current || !arrowStartPointRef.current || !currentArrowGroupRef.current || !e.pointer) return;
      
      const group = currentArrowGroupRef.current;
      const objects = group.getObjects();
      const line = objects[0] as Line;
      const triangle = objects[1] as Triangle;
      
      const start = arrowStartPointRef.current;
      const end = e.pointer;
      
      // Musimy usunąć grupę, zmodyfikować i dodać ponownie
      canvas.remove(group);
      
      // Aktualizuj linię
      line.set({ x2: end.x - start.x, y2: end.y - start.y });
      
      // Oblicz kąt
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90;
      
      // Aktualizuj grot
      triangle.set({
        left: end.x - start.x,
        top: end.y - start.y,
        angle: angle,
      });
      
      // Utwórz nową grupę
      const newGroup = new Group([line, triangle], {
        left: start.x,
        top: start.y,
        selectable: false,
        evented: false,
      });
      
      currentArrowGroupRef.current = newGroup;
      canvas.add(newGroup);
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (isDrawingArrowRef.current && currentArrowGroupRef.current) {
        currentArrowGroupRef.current.selectable = false;
        currentArrowGroupRef.current.evented = false;
        
        console.log('🎨 [Arrow v6] Created as group');
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

  // === GUMKA v6: Przepisana od nowa ===
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    
    if (!canvas || !isTeacher || !isEnabled || drawingState.activeTool !== 'eraser') {
      return;
    }

    console.log('🎨 [Eraser v6] ACTIVE');
    canvas.isDrawingMode = false;

    // Sprawdź czy obiekt jest pod kursorem (prosta detekcja bbox)
    const isObjectUnderCursor = (obj: FabricObject, pointer: { x: number; y: number }): boolean => {
      const tolerance = 15;
      
      // Pobierz bounding rect (działa dla wszystkich typów)
      const bounds = obj.getBoundingRect();
      const padding = tolerance;
      
      const hit = (
        pointer.x >= bounds.left - padding &&
        pointer.x <= bounds.left + bounds.width + padding &&
        pointer.y >= bounds.top - padding &&
        pointer.y <= bounds.top + bounds.height + padding
      );
      
      return hit;
    };

    const eraseAtPoint = (pointer: { x: number; y: number }) => {
      const objectsToRemove: FabricObject[] = [];
      
      canvas.forEachObject((obj) => {
        if (isObjectUnderCursor(obj, pointer)) {
          console.log('🎨 [Eraser v6] Hit:', obj.type);
          objectsToRemove.push(obj);
        }
      });
      
      if (objectsToRemove.length > 0) {
        objectsToRemove.forEach(obj => canvas.remove(obj));
        canvas.renderAll();
        hasErasedInSessionRef.current = true;
      }
    };

    const handleMouseDown = (e: any) => {
      if (!e.pointer) return;
      console.log('🎨 [Eraser v6] Mouse down');
      isErasingRef.current = true;
      hasErasedInSessionRef.current = false;
      eraseAtPoint(e.pointer);
    };

    const handleMouseMove = (e: any) => {
      // v6: Sprawdzaj ref zamiast zmiennej lokalnej!
      if (!isErasingRef.current || !e.pointer) return;
      eraseAtPoint(e.pointer);
    };

    const handleMouseUp = () => {
      console.log('🎨 [Eraser v6] Mouse up, erased:', hasErasedInSessionRef.current);
      if (hasErasedInSessionRef.current) {
        saveToHistory();
        scheduleAutoSave();
      }
      isErasingRef.current = false;
      hasErasedInSessionRef.current = false;
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      isErasingRef.current = false;
    };
  }, [drawingState.activeTool, isTeacher, isEnabled, saveToHistory, scheduleAutoSave]);

  // Realtime dla ucznia
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

  // v6: Komponent jest ZAWSZE renderowany, widoczność przez CSS
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

      {/* Canvas overlay - v6: widoczność przez CSS, nie conditional rendering */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 z-[30]",
          isSelectMode ? "pointer-events-none" : (isEnabled && isTeacher ? "pointer-events-auto" : "pointer-events-none"),
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
