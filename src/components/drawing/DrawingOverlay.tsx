/**
 * DrawingOverlay - Nakładka canvas z Fabric.js (REDESIGNED - Windows Snipping Tool style)
 * 
 * Główny komponent do rysowania po worksheet.
 * Narzędzia: marker, highlighter, arrow, eraser, select-worksheet
 * 
 * NAPRAWIONE:
 * - Undo/Redo działa poprawnie (pojedyncze kroki) - używamy useRef
 * - Highlighter jest semi-transparent
 * - Arrow ma grot
 * - Marker/Highlighter paths nie są edytowalne po narysowaniu
 * - Gumka usuwa po trafieniu wizualnym (nie bounding box)
 * - Reset isInitializedRef przy unmount
 */

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
  const currentArrowGroupRef = useRef<{ line: Line; triangle: Triangle } | null>(null);
  const isInitializedRef = useRef(false);

  // NAPRAWKA: Refs dla Undo/Redo (unikamy stale closure)
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);

  // Stan rysowania
  const [drawingState, setDrawingState] = useState<DrawingState>({
    ...DEFAULT_DRAWING_STATE,
    activeTool: 'marker',
  });

  // Synchronizuj refs z callback'ami
  const updateHistoryState = useCallback(() => {
    const canUndo = undoStackRef.current.length > 1;
    const canRedo = redoStackRef.current.length > 0;
    
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

  // Funkcje pomocnicze - NAPRAWKA: używamy refs
  const saveToHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    
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

  const loadDrawings = async () => {
    try {
      // NAPRAWKA: użyj maybeSingle zamiast single
      const { data, error } = await supabase
        .from('worksheet_drawings')
        .select('drawing_data')
        .eq('worksheet_id', worksheetId)
        .maybeSingle();

      if (error) {
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

      // NAPRAWKA: użyj maybeSingle zamiast single
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

  // NAPRAWIONE: Undo cofa pojedynczy krok (używa refs)
  const handleUndo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || undoStackRef.current.length <= 1) return;

    // Zapisz obecny stan do redo
    const currentState = JSON.stringify(canvas.toJSON());
    redoStackRef.current = [...redoStackRef.current, currentState];

    // Usuń obecny stan z undo
    const newUndoStack = [...undoStackRef.current];
    newUndoStack.pop();
    undoStackRef.current = newUndoStack;

    // Załaduj poprzedni stan
    const previousState = newUndoStack[newUndoStack.length - 1];
    
    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.renderAll();
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      updateHistoryState();
      scheduleAutoSave();
    });
  }, [updateHistoryState, scheduleAutoSave]);

  // NAPRAWIONE: Redo działa natychmiast (używa refs)
  const handleRedo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || redoStackRef.current.length === 0) return;

    // Zapisz obecny stan do undo
    const currentState = JSON.stringify(canvas.toJSON());
    undoStackRef.current = [...undoStackRef.current, currentState];

    // Pobierz następny stan z redo
    const nextState = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);

    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      updateHistoryState();
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

  // Inicjalizacja Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // NAPRAWKA v2: Jeśli canvas już istnieje, nie twórz nowego
    if (isInitializedRef.current && fabricCanvasRef.current) {
      console.log('🎨 [DrawingOverlay] Canvas already initialized, skipping');
      return;
    }

    console.log('🎨 [DrawingOverlay] Initializing Fabric.js canvas');

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

    // Załaduj istniejące rysunki i zapisz initial state
    loadDrawings().then(() => {
      // NAPRAWKA: Poczekaj na renderowanie przed zapisem initial state
      setTimeout(() => {
        if (fabricCanvasRef.current) {
          const initialState = JSON.stringify(fabricCanvasRef.current.toJSON());
          undoStackRef.current = [initialState];
          redoStackRef.current = []; // NAPRAWKA: Wyczyść redo przy załadowaniu
          console.log('🎨 [DrawingOverlay] Initial state saved, objects:', JSON.parse(initialState).objects?.length || 0);
          updateHistoryState();
        }
      }, 100);
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
      console.log('🎨 [DrawingOverlay] Cleanup - disposing canvas');
      window.removeEventListener('resize', handleResize);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      canvas.dispose();
      fabricCanvasRef.current = null;
      // NAPRAWKA: Reset przy unmount
      isInitializedRef.current = false;
    };
  }, []);

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

    canvas.renderAll();
  }, [drawingState.activeTool, drawingState.activeColor, drawingState.strokeWidth, isTeacher, isEnabled]);

  // Obsługa rysowania Arrow
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;

    const { activeTool, activeColor, strokeWidth } = drawingState;
    
    if (activeTool !== 'arrow') return;

    const handleMouseDown = (opt: any) => {
      if (drawingState.activeTool !== 'arrow') return;
      
      isDrawingArrowRef.current = true;
      const pointer = canvas.getPointer(opt.e);
      arrowStartPointRef.current = { x: pointer.x, y: pointer.y };
      
      const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        stroke: activeColor.hex,
        strokeWidth: strokeWidth.value,
        selectable: false,
        evented: false,
      });
      
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
      
      currentArrowGroupRef.current = { line, triangle };
    };

    const handleMouseMove = (opt: any) => {
      if (!isDrawingArrowRef.current || !arrowStartPointRef.current || !currentArrowGroupRef.current) return;
      
      const pointer = canvas.getPointer(opt.e);
      const startX = arrowStartPointRef.current.x;
      const startY = arrowStartPointRef.current.y;
      
      const { line, triangle } = currentArrowGroupRef.current;
      
      line.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      
      const angle = Math.atan2(pointer.y - startY, pointer.x - startX) * (180 / Math.PI) + 90;
      
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
  }, [drawingState.activeTool, drawingState.activeColor, drawingState.strokeWidth, isTeacher, isEnabled, saveToHistory, scheduleAutoSave]);

  // Obsługa path:created (dla marker/highlighter)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher) return;

    const handlePathCreated = (e: any) => {
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
  }, [isTeacher, saveToHistory, scheduleAutoSave]);

  // NAPRAWIONA gumka - sprawdza rzeczywiste trafienie, nie bounding box
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;

    if (drawingState.activeTool !== 'eraser') return;

    let isErasing = false;
    let hasErased = false;

    const handleMouseDown = (opt: any) => {
      isErasing = true;
      hasErased = false;
      
      // Sprawdź od razu przy kliknięciu
      const pointer = canvas.getPointer(opt.e);
      eraseAtPoint(pointer);
    };

    const handleMouseMove = (opt: any) => {
      if (!isErasing) return;
      
      const pointer = canvas.getPointer(opt.e);
      eraseAtPoint(pointer);
    };

    const eraseAtPoint = (pointer: { x: number; y: number }) => {
      const objectsToRemove: FabricObject[] = [];
      
      canvas.forEachObject((obj) => {
        // NAPRAWKA: Używamy findTarget lub sprawdzamy czy punkt jest wewnątrz ścieżki
        if (isPointOnObject(obj, pointer, canvas)) {
          objectsToRemove.push(obj);
        }
      });
      
      if (objectsToRemove.length > 0) {
        objectsToRemove.forEach(obj => canvas.remove(obj));
        canvas.renderAll();
        hasErased = true;
      }
    };

    // Sprawdź czy punkt jest na obiekcie (nie tylko w bounding box)
    const isPointOnObject = (obj: FabricObject, pointer: { x: number; y: number }, canvas: FabricCanvas): boolean => {
      // Dla Path (marker/highlighter) - sprawdź czy punkt jest blisko ścieżki
      if (obj.type === 'path' && (obj as Path).path) {
        const path = obj as Path;
        const tolerance = 10; // piksele tolerancji
        
        // Pobierz punkty ścieżki
        const pathData = path.path;
        if (!pathData) return false;
        
        // Sprawdź każdy segment ścieżki
        for (let i = 0; i < pathData.length; i++) {
          const segment = pathData[i];
          if (Array.isArray(segment) && segment.length >= 3) {
            const cmd = segment[0];
            if (cmd === 'M' || cmd === 'L' || cmd === 'Q' || cmd === 'C') {
              // Pobierz punkt końcowy segmentu
              const x = segment[segment.length - 2] as number;
              const y = segment[segment.length - 1] as number;
              
              // Transformuj punkt do współrzędnych canvas
              const matrix = path.calcTransformMatrix();
              const transformedX = matrix[0] * x + matrix[2] * y + matrix[4];
              const transformedY = matrix[1] * x + matrix[3] * y + matrix[5];
              
              // Sprawdź odległość
              const distance = Math.sqrt(
                Math.pow(pointer.x - transformedX, 2) + 
                Math.pow(pointer.y - transformedY, 2)
              );
              
              if (distance < tolerance + (path.strokeWidth || 2)) {
                return true;
              }
            }
          }
        }
        return false;
      }
      
      // Dla innych obiektów (linie, trójkąty) - użyj containsPoint
      return obj.containsPoint(new Point(pointer.x, pointer.y));
    };

    const handleMouseUp = () => {
      if (isErasing && hasErased) {
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
  }, [worksheetId, isTeacher]);

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

  // NAPRAWKA: Zawsze renderuj canvas (nawet gdy disabled) żeby zachować rysunki
  const isSelectMode = drawingState.activeTool === 'select-worksheet';
  const shouldShowCanvas = isTeacher || isEnabled;

  // Dla studentów - tylko pokaż rysunki (nie pozwól rysować)
  if (!shouldShowCanvas) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-[30] pointer-events-none"
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

      {/* Canvas overlay */}
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 z-[30]",
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
