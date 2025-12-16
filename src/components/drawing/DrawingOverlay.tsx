/**
 * DrawingOverlay - Nakładka canvas z Fabric.js (REDESIGNED - Windows Snipping Tool style)
 * 
 * Główny komponent do rysowania po worksheet.
 * Narzędzia: marker, highlighter, arrow, eraser, select-worksheet
 * 
 * NAPRAWIONE:
 * - Undo/Redo działa poprawnie (pojedyncze kroki)
 * - Highlighter jest semi-transparent
 * - Arrow ma grot
 * - Marker/Highlighter paths nie są edytowalne po narysowaniu
 * - Gumka usuwa po trafieniu wizualnym
 */

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Line, FabricObject, Triangle, Group, Path } from 'fabric';
import { 
  DrawingOverlayProps, 
  DrawingState, 
  DrawingTool,
  DrawingColor,
  StrokeWidth,
  DrawingData,
  DEFAULT_DRAWING_STATE,
  DEFAULT_DRAWING_COLOR,
  DEFAULT_HIGHLIGHTER_COLOR,
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
  const currentArrowGroupRef = useRef<Group | null>(null);
  const isInitializedRef = useRef(false);

  // Stan rysowania
  const [drawingState, setDrawingState] = useState<DrawingState>({
    ...DEFAULT_DRAWING_STATE,
    activeTool: 'marker',
  });
  
  // Historia dla undo/redo - NAPRAWIONE: zaczynamy od pustego stanu
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Aktualizuj stan canUndo/canRedo i wywołaj callback
  useEffect(() => {
    // undoStack[0] to initial state, więc canUndo gdy length > 1
    const canUndo = undoStack.length > 1;
    const canRedo = redoStack.length > 0;
    
    setDrawingState(prev => ({
      ...prev,
      canUndo,
      canRedo,
    }));
    
    onHistoryChange?.(canUndo, canRedo);
  }, [undoStack.length, redoStack.length, onHistoryChange]);

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

  // Eksponuj metody przez ref
  useImperativeHandle(ref, () => ({
    undo: handleUndo,
    redo: handleRedo,
    clearAll: handleClearAll,
    getCanUndo: () => undoStack.length > 1,
    getCanRedo: () => redoStack.length > 0,
  }), [undoStack.length, redoStack.length]);

  // Inicjalizacja Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || isInitializedRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      backgroundColor: 'transparent',
      selection: false, // Wyłącz zaznaczanie obiektów
      isDrawingMode: false,
    });

    // Konfiguracja pędzla
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = DEFAULT_DRAWING_COLOR.hex;
    canvas.freeDrawingBrush.width = DEFAULT_STROKE_WIDTH.value;

    fabricCanvasRef.current = canvas;
    isInitializedRef.current = true;

    // Załaduj istniejące rysunki i zapisz initial state
    loadDrawings().then(() => {
      // NAPRAWKA: Zapisz początkowy stan jako pierwszy element undo stack
      const initialState = JSON.stringify(canvas.toJSON());
      setUndoStack([initialState]);
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
      window.removeEventListener('resize', handleResize);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      canvas.dispose();
      isInitializedRef.current = false;
    };
  }, []);

  // Aktualizuj interaktywność canvas gdy isEnabled się zmienia
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Zawsze wyłącz selection na obiektach - marker/highlighter nie można przesuwać
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

    // Narzędzia rysujące
    const drawingTools: DrawingTool[] = ['marker', 'highlighter'];
    
    if (drawingTools.includes(activeTool) && isEnabled) {
      canvas.isDrawingMode = true;
      
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      
      if (activeTool === 'marker') {
        canvas.freeDrawingBrush.color = activeColor.hex;
        canvas.freeDrawingBrush.width = strokeWidth.value * 2;
      } else if (activeTool === 'highlighter') {
        // Highlighter - użyj koloru z HIGHLIGHTER_COLORS który już ma opacity
        canvas.freeDrawingBrush.color = activeColor.hex;
        canvas.freeDrawingBrush.width = strokeWidth.value * 4;
      }
    } else {
      canvas.isDrawingMode = false;
    }

    canvas.renderAll();
  }, [drawingState.activeTool, drawingState.activeColor, drawingState.strokeWidth, isTeacher, isEnabled]);

  // Obsługa rysowania Arrow
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;

    const { activeTool, activeColor, strokeWidth } = drawingState;
    
    if (activeTool !== 'arrow') return;

    const handleMouseDown = (opt: any) => {
      if (activeTool !== 'arrow') return;
      
      isDrawingArrowRef.current = true;
      const pointer = canvas.getPointer(opt.e);
      arrowStartPointRef.current = { x: pointer.x, y: pointer.y };
      
      // Utwórz linię i grot
      const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        stroke: activeColor.hex,
        strokeWidth: strokeWidth.value,
        selectable: false,
        evented: false,
      });
      
      // Grot strzałki (trójkąt)
      const triangle = new Triangle({
        width: strokeWidth.value * 4,
        height: strokeWidth.value * 4,
        fill: activeColor.hex,
        left: pointer.x,
        top: pointer.y,
        angle: 0,
        selectable: false,
        evented: false,
      });
      
      canvas.add(line);
      canvas.add(triangle);
      
      // Przechowaj referencje
      currentArrowGroupRef.current = { line, triangle } as any;
    };

    const handleMouseMove = (opt: any) => {
      if (!isDrawingArrowRef.current || !arrowStartPointRef.current || !currentArrowGroupRef.current) return;
      
      const pointer = canvas.getPointer(opt.e);
      const startX = arrowStartPointRef.current.x;
      const startY = arrowStartPointRef.current.y;
      
      const arrowData = currentArrowGroupRef.current as any;
      const line = arrowData.line as Line;
      const triangle = arrowData.triangle as Triangle;
      
      // Aktualizuj linię
      line.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      
      // Oblicz kąt strzałki
      const angle = Math.atan2(pointer.y - startY, pointer.x - startX) * (180 / Math.PI) + 90;
      
      // Aktualizuj grot
      triangle.set({
        left: pointer.x,
        top: pointer.y,
        angle: angle,
        originX: 'center',
        originY: 'center',
      });
      
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (isDrawingArrowRef.current && currentArrowGroupRef.current) {
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
  }, [drawingState.activeTool, drawingState.activeColor, drawingState.strokeWidth, isTeacher, isEnabled]);

  // Obsługa path:created (dla marker/highlighter) - NAPRAWKA: wyłącz edycję
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher) return;

    const handlePathCreated = (e: any) => {
      // NAPRAWKA: Wyłącz możliwość edycji path po narysowaniu
      if (e.path) {
        e.path.selectable = false;
        e.path.evented = false;
      }
      
      saveToHistory();
      scheduleAutoSave();
    };

    canvas.on('path:created', handlePathCreated);

    return () => {
      canvas.off('path:created', handlePathCreated);
    };
  }, [isTeacher]);

  // Obsługa gumki - NAPRAWKA: usuwa po trafieniu wizualnym, nie bounding box
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;

    if (drawingState.activeTool !== 'eraser') return;

    let isErasing = false;

    const handleMouseDown = () => {
      isErasing = true;
    };

    const handleMouseMove = (opt: any) => {
      if (!isErasing) return;
      
      const pointer = canvas.getPointer(opt.e);
      const objectsToRemove: FabricObject[] = [];
      
      canvas.forEachObject((obj) => {
        // NAPRAWKA: Sprawdź czy punkt jest WEWNĄTRZ obiektu (nie bounding box)
        if (obj.containsPoint(pointer)) {
          objectsToRemove.push(obj);
        }
      });
      
      if (objectsToRemove.length > 0) {
        objectsToRemove.forEach(obj => canvas.remove(obj));
        canvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (isErasing) {
        saveToHistory();
        scheduleAutoSave();
      }
      isErasing = false;
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [drawingState.activeTool, isTeacher, isEnabled]);

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
  }, [worksheetId, isTeacher]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isTeacher || !isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z = Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y = Redo
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      // Skróty narzędzi
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
  }, [isTeacher, isEnabled]);

  // Funkcje pomocnicze
  const saveToHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    setUndoStack(prev => {
      const newStack = [...prev, json];
      // Ogranicz do 50 kroków
      if (newStack.length > 50) {
        return newStack.slice(-50);
      }
      return newStack;
    });
    // Wyczyść redo stack po nowej akcji
    setRedoStack([]);
  }, []);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDrawings();
    }, DRAWING_AUTOSAVE_CONFIG.debounceMs);
  }, []);

  const loadDrawings = async () => {
    try {
      const { data, error } = await supabase
        .from('worksheet_drawings')
        .select('drawing_data')
        .eq('worksheet_id', worksheetId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading drawings:', error);
        return;
      }

      if (data?.drawing_data) {
        const drawingData = data.drawing_data as unknown as DrawingData;
        if (drawingData && drawingData.objects) {
          loadDrawingsFromData(drawingData);
        }
      }
    } catch (err) {
      console.error('Error loading drawings:', err);
    }
  };

  const loadDrawingsFromData = (drawingData: DrawingData) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !drawingData.objects) return;

    canvas.loadFromJSON({ objects: drawingData.objects }, () => {
      canvas.renderAll();
      
      // Zablokuj wszystkie obiekty
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    });
  };

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
        .single();

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

  const handleToolChange = (tool: DrawingTool) => {
    setDrawingState(prev => ({ ...prev, activeTool: tool }));
  };

  const handleColorChange = (color: DrawingColor) => {
    setDrawingState(prev => ({ ...prev, activeColor: color }));
  };

  const handleStrokeWidthChange = (width: StrokeWidth) => {
    setDrawingState(prev => ({ ...prev, strokeWidth: width }));
  };

  // NAPRAWIONE: Undo cofa pojedynczy krok
  const handleUndo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || undoStack.length <= 1) return; // Minimum 1 (initial state)

    // Zapisz obecny stan do redo
    const currentState = JSON.stringify(canvas.toJSON());
    setRedoStack(prev => [...prev, currentState]);

    // Pobierz poprzedni stan (przedostatni element)
    const newUndoStack = [...undoStack];
    newUndoStack.pop(); // Usuń obecny stan
    setUndoStack(newUndoStack);

    const previousState = newUndoStack[newUndoStack.length - 1];
    
    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.renderAll();
      // Zablokuj wszystkie obiekty
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      scheduleAutoSave();
    });
  }, [undoStack, scheduleAutoSave]);

  // NAPRAWIONE: Redo działa natychmiast
  const handleRedo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || redoStack.length === 0) return;

    // Zapisz obecny stan do undo
    const currentState = JSON.stringify(canvas.toJSON());
    setUndoStack(prev => [...prev, currentState]);

    // Pobierz następny stan
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));

    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      // Zablokuj wszystkie obiekty
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      scheduleAutoSave();
    });
  }, [redoStack, scheduleAutoSave]);

  const handleClearAll = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    saveToHistory();
    canvas.clear();
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
    scheduleAutoSave();
  }, [saveToHistory, scheduleAutoSave]);

  // Nie renderuj nic jeśli nie jest włączone i nie ma nauczyciela
  if (!isEnabled && !isTeacher) return null;

  // Tryb "Select on Worksheet" - wyłącz pointer-events na canvas
  const isSelectMode = drawingState.activeTool === 'select-worksheet';

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

      {/* Canvas overlay */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 z-[30]",
          // Select on Worksheet = pointer-events-none (można zaznaczać worksheet pod spodem)
          isSelectMode ? "pointer-events-none" : (isEnabled ? "pointer-events-auto" : "pointer-events-none"),
          !isTeacher && "pointer-events-none"
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
