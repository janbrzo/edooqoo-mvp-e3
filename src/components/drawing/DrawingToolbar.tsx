/**
 * DrawingToolbar - Pasek narzędzi rysowania
 * 
 * Zawiera wszystkie narzędzia: select, pencil, marker, highlighter, eraser,
 * rectangle, circle, arrow, line, text, oraz color picker, stroke width,
 * undo/redo i clear all.
 */

import { 
  MousePointer2, 
  Pencil, 
  Pen, 
  Highlighter, 
  Eraser,
  Square,
  Circle,
  MoveUpRight,
  Minus,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DrawingToolbarProps, DrawingTool, DRAWING_TOOLS } from '@/types/drawing';
import { DrawingColorPicker } from './DrawingColorPicker';
import { DrawingStrokeWidth } from './DrawingStrokeWidth';
import { cn } from '@/lib/utils';

// Mapowanie nazw ikon na komponenty
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MousePointer2,
  Pencil,
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  MoveUpRight,
  Minus,
  Type,
};

export const DrawingToolbar = ({
  state,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onClearAll,
}: DrawingToolbarProps) => {
  const { activeTool, activeColor, strokeWidth, canUndo, canRedo, isSaving } = state;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg p-2 flex items-center gap-1 flex-wrap max-w-[95vw]">
      {/* Narzędzia rysowania */}
      <div className="flex items-center gap-0.5">
        {DRAWING_TOOLS.map((tool) => {
          const Icon = iconMap[tool.icon];
          if (!Icon) return null;
          
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-9 h-9 p-0",
                    activeTool === tool.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => onToolChange(tool.id)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tool.label} {tool.shortcut && <span className="text-muted-foreground">({tool.shortcut})</span>}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-8 mx-1" />

      {/* Color Picker */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <DrawingColorPicker
              selectedColor={activeColor}
              onColorSelect={onColorChange}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Color: {activeColor.name}</p>
        </TooltipContent>
      </Tooltip>

      {/* Stroke Width */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <DrawingStrokeWidth
              selectedWidth={strokeWidth}
              onWidthSelect={onStrokeWidthChange}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Stroke: {strokeWidth.name}</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-8 mx-1" />

      {/* Undo/Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Undo <span className="text-muted-foreground">(Ctrl+Z)</span></p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Redo <span className="text-muted-foreground">(Ctrl+Y)</span></p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-8 mx-1" />

      {/* Clear All z potwierdzeniem */}
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-9 h-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear All</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all drawings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all drawings from the worksheet. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status zapisu */}
      {isSaving && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
};

export default DrawingToolbar;
