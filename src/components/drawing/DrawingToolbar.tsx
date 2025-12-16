/**
 * DrawingToolbar - Pasek narzędzi rysowania (wzór: Windows Snipping Tool)
 * 
 * Narzędzia: Select Worksheet | Marker ▼ | Highlighter ▼ | Arrow ▼ | Eraser
 * Akcje: Undo | Redo | Clear All | Status zapisu
 */

import { 
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
import { DrawingToolButton } from './DrawingToolButton';

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
      {DRAWING_TOOLS.map((tool, index) => (
        <div key={tool.id} className="flex items-center">
          {/* Separator po Select Worksheet i przed Eraser */}
          {(index === 1 || tool.id === 'eraser') && (
            <Separator orientation="vertical" className="h-8 mx-1" />
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DrawingToolButton
                  tool={tool.id}
                  label={tool.label}
                  isActive={activeTool === tool.id}
                  currentColor={activeColor}
                  currentStrokeWidth={strokeWidth}
                  onToolSelect={() => onToolChange(tool.id)}
                  onColorChange={onColorChange}
                  onStrokeWidthChange={onStrokeWidthChange}
                  hasColorPicker={tool.hasColorPicker}
                  hasStrokeWidth={tool.hasStrokeWidth}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.label} {tool.shortcut && <span className="text-muted-foreground">({tool.shortcut})</span>}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ))}

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
