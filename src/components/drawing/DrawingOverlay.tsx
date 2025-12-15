/**
 * DrawingOverlay - Nakładka canvas z Fabric.js
 * 
 * Główny komponent do rysowania po worksheet.
 * Nauczyciel może rysować, uczeń tylko widzi (read-only).
 * Obsługuje touch dla mobile/tablet.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, PencilBrush, CircleBrush, Circle, Rect, Line, IText, FabricObject } from 'fabric';
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
  DRAWING_COLORS,
  STROKE_WIDTHS,
  DRAWING_LIMITS,
  DRAWING_AUTOSAVE_CONFIG,
  EMPTY_DRAWING_DATA
} from '@/types/drawing';
import { DrawingToolbar } from './DrawingToolbar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const DrawingOverlay = ({
  worksheetId,
  teacherId,
  isTeacher,
  isEnabled,
  onDrawingChange
}: DrawingOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDrawingShapeRef = useRef(false);
  const shapeStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentShapeRef = useRef<FabricObject | null>(null);

  // Stan rysowania
  const [drawingState, setDrawingState] = useState<DrawingState>(DEFAULT_DRAWING_STATE);
  
  // Historia dla undo/redo
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Aktualizuj stan canUndo/canRedo
  useEffect(() => {
    setDrawingState(prev => ({
      ...prev,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
    }));
  }, [undoStack.length, redoStack.length]);

  // Inicjalizacja Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      backgroundColor: 'transparent',
      selection: isTeacher,
      isDrawingMode: false,
    });

    // Konfiguracja pędzla
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = DEFAULT_DRAWING_COLOR.hex;
    canvas.freeDrawingBrush.width = DEFAULT_STROKE_WIDTH.value;

    fabricCanvasRef.current = canvas;

    // Załaduj istniejące rysunki
    loadDrawings();

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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      canvas.dispose();
    };
  }, []);

  // Aktualizuj interaktywność canvas gdy isTeacher/isEnabled się zmienia
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const canDraw = isTeacher && isEnabled;
    
    canvas.selection = canDraw;
    canvas.forEachObject((obj) => {
      obj.selectable = canDraw;
      obj.evented = canDraw;
    });
    
    canvas.renderAll();
  }, [isTeacher, isEnabled]);

  // Obsługa zmiany narzędzia
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher) return;

    const { activeTool, activeColor, strokeWidth } = drawingState;

    // Wyłącz tryb rysowania dla wszystkich narzędzi kształtów
    const drawingTools: DrawingTool[] = ['pencil', 'marker', 'highlighter'];
    const shapeTools: DrawingTool[] = ['rectangle', 'circle', 'arrow', 'line'];
    
    if (drawingTools.includes(activeTool)) {
      canvas.isDrawingMode = true;
      
      // Konfiguruj pędzel w zależności od narzędzia
      if (activeTool === 'pencil') {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = activeColor.hex;
        canvas.freeDrawingBrush.width = strokeWidth.value;
      } else if (activeTool === 'marker') {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = activeColor.hex;
        canvas.freeDrawingBrush.width = strokeWidth.value * 2;
      } else if (activeTool === 'highlighter') {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = activeColor.hex;
        canvas.freeDrawingBrush.width = strokeWidth.value * 3;
        // Highlighter ma mniejszą opacity - dodaj to do stroke
      }
    } else {
      canvas.isDrawingMode = false;
    }

    canvas.renderAll();
  }, [drawingState.activeTool, drawingState.activeColor, drawingState.strokeWidth, isTeacher]);

  // Obsługa rysowania kształtów (mouse events)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;

    const { activeTool, activeColor, strokeWidth } = drawingState;
    const shapeTools: DrawingTool[] = ['rectangle', 'circle', 'arrow', 'line'];
    
    if (!shapeTools.includes(activeTool)) return;

    const handleMouseDown = (opt: any) => {
      if (!shapeTools.includes(activeTool)) return;
      
      isDrawingShapeRef.current = true;
      const pointer = canvas.getPointer(opt.e);
      shapeStartPointRef.current = { x: pointer.x, y: pointer.y };
      
      let shape: FabricObject | null = null;
      
      if (activeTool === 'rectangle') {
        shape = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: activeColor.hex,
          strokeWidth: strokeWidth.value,
        });
      } else if (activeTool === 'circle') {
        shape = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: 'transparent',
          stroke: activeColor.hex,
          strokeWidth: strokeWidth.value,
        });
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: activeColor.hex,
          strokeWidth: strokeWidth.value,
        });
      }
      
      if (shape) {
        currentShapeRef.current = shape;
        canvas.add(shape);
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isDrawingShapeRef.current || !shapeStartPointRef.current || !currentShapeRef.current) return;
      
      const pointer = canvas.getPointer(opt.e);
      const startX = shapeStartPointRef.current.x;
      const startY = shapeStartPointRef.current.y;
      
      if (activeTool === 'rectangle') {
        const rect = currentShapeRef.current as Rect;
        const width = pointer.x - startX;
        const height = pointer.y - startY;
        
        rect.set({
          left: width > 0 ? startX : pointer.x,
          top: height > 0 ? startY : pointer.y,
          width: Math.abs(width),
          height: Math.abs(height),
        });
      } else if (activeTool === 'circle') {
        const circle = currentShapeRef.current as Circle;
        const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)) / 2;
        
        circle.set({
          radius: radius,
          left: startX + (pointer.x - startX) / 2 - radius,
          top: startY + (pointer.y - startY) / 2 - radius,
        });
      } else if (activeTool === 'line' || activeTool === 'arrow') {
        const line = currentShapeRef.current as Line;
        line.set({
          x2: pointer.x,
          y2: pointer.y,
        });
      }
      
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (isDrawingShapeRef.current && currentShapeRef.current) {
        saveToHistory();
        scheduleAutoSave();
      }
      
      isDrawingShapeRef.current = false;
      shapeStartPointRef.current = null;
      currentShapeRef.current = null;
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

  // Obsługa path:created (dla pencil/marker/highlighter)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher) return;

    const handlePathCreated = () => {
      saveToHistory();
      scheduleAutoSave();
    };

    canvas.on('path:created', handlePathCreated);
    canvas.on('object:modified', handlePathCreated);

    return () => {
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:modified', handlePathCreated);
    };
  }, [isTeacher]);

  // Obsługa narzędzia eraser
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;

    if (drawingState.activeTool !== 'eraser') return;

    const handleClick = (opt: any) => {
      const target = opt.target;
      if (target) {
        canvas.remove(target);
        saveToHistory();
        scheduleAutoSave();
      }
    };

    canvas.on('mouse:down', handleClick);

    return () => {
      canvas.off('mouse:down', handleClick);
    };
  }, [drawingState.activeTool, isTeacher, isEnabled]);

  // Obsługa narzędzia text
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher || !isEnabled) return;

    if (drawingState.activeTool !== 'text') return;

    const handleClick = (opt: any) => {
      const pointer = canvas.getPointer(opt.e);
      
      const text = new IText('Type here...', {
        left: pointer.x,
        top: pointer.y,
        fontSize: 20,
        fill: drawingState.activeColor.hex,
        fontFamily: 'Arial',
      });
      
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      
      saveToHistory();
      scheduleAutoSave();
    };

    canvas.on('mouse:down', handleClick);

    return () => {
      canvas.off('mouse:down', handleClick);
    };
  }, [drawingState.activeTool, drawingState.activeColor, isTeacher, isEnabled]);

  // Realtime subscription dla ucznia
  useEffect(() => {
    if (isTeacher) return; // Nauczyciel nie potrzebuje subskrypcji

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
          'v': 'select',
          'p': 'pencil',
          'm': 'marker',
          'h': 'highlighter',
          'e': 'eraser',
          'r': 'rectangle',
          'c': 'circle',
          'a': 'arrow',
          'l': 'line',
          't': 'text',
        };
        
        const tool = toolShortcuts[e.key.toLowerCase()];
        if (tool) {
          setDrawingState(prev => ({ ...prev, activeTool: tool }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTeacher, isEnabled, undoStack, redoStack]);

  // Funkcje pomocnicze
  const saveToHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    setUndoStack(prev => [...prev.slice(-49), json]); // Max 50 kroków
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
      
      // Jeśli nie jest nauczycielem lub nie jest enabled, zablokuj obiekty
      if (!isTeacher || !isEnabled) {
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
      }
    });
  };

  const saveDrawings = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isTeacher) return;

    setDrawingState(prev => ({ ...prev, isSaving: true }));

    try {
      const objects = canvas.toJSON().objects || [];
      
      // Sprawdź limit obiektów
      if (objects.length > DRAWING_LIMITS.maxObjects) {
        toast.error(`Too many objects (max ${DRAWING_LIMITS.maxObjects})`);
        return;
      }

      const drawingData: DrawingData = {
        objects,
        version: '1.0',
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
      };

      // Najpierw sprawdź czy istnieje
      const { data: existing } = await supabase
        .from('worksheet_drawings')
        .select('id')
        .eq('worksheet_id', worksheetId)
        .single();

      let error;
      
      if (existing) {
        // Update
        const result = await supabase
          .from('worksheet_drawings')
          .update({
            drawing_data: JSON.parse(JSON.stringify(drawingData)),
            updated_at: new Date().toISOString(),
          })
          .eq('worksheet_id', worksheetId);
        error = result.error;
      } else {
        // Insert
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

      setDrawingState(prev => ({ 
        ...prev, 
        isSaving: false,
        lastSavedAt: new Date(),
      }));

      onDrawingChange?.(drawingData);
    } catch (err) {
      console.error('Error saving drawings:', err);
      toast.error('Failed to save drawing');
      setDrawingState(prev => ({ ...prev, isSaving: false }));
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

  const handleUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || undoStack.length === 0) return;

    const currentState = JSON.stringify(canvas.toJSON());
    setRedoStack(prev => [...prev, currentState]);

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.renderAll();
      scheduleAutoSave();
    });
  };

  const handleRedo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || redoStack.length === 0) return;

    const currentState = JSON.stringify(canvas.toJSON());
    setUndoStack(prev => [...prev, currentState]);

    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));

    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      scheduleAutoSave();
    });
  };

  const handleClearAll = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    saveToHistory();
    canvas.clear();
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
    scheduleAutoSave();
  };

  // Nie renderuj nic jeśli nie jest włączone i nie ma nauczyciela
  if (!isEnabled && !isTeacher) return null;

  return (
    <>
      {/* Toolbar - tylko dla nauczyciela gdy włączone */}
      {isTeacher && isEnabled && (
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
          "absolute inset-0 z-[50]",
          isEnabled ? "pointer-events-auto" : "pointer-events-none",
          // Dla ucznia zawsze pointer-events-none (tylko widzi)
          !isTeacher && "pointer-events-none"
        )}
        style={{
          touchAction: isEnabled && isTeacher ? 'none' : 'auto',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </>
  );
};

export default DrawingOverlay;
