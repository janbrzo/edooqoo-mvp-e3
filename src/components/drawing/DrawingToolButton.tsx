/**
 * DrawingToolButton - Przycisk narzędzia z popover (wzór: Windows Snipping Tool)
 * 
 * Pierwszy klik = wybiera narzędzie
 * Drugi klik na aktywne narzędzie = otwiera popover z kolorami i grubością
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Pen, Highlighter, MoveUpRight, Eraser, MousePointer2 } from 'lucide-react';
import { 
  DrawingTool, 
  DrawingColor, 
  StrokeWidth,
  MARKER_COLORS,
  HIGHLIGHTER_COLORS,
  STROKE_WIDTHS
} from '@/types/drawing';
import { cn } from '@/lib/utils';

interface DrawingToolButtonProps {
  tool: DrawingTool;
  label: string;
  isActive: boolean;
  currentColor: DrawingColor;
  currentStrokeWidth: StrokeWidth;
  onToolSelect: () => void;
  onColorChange: (color: DrawingColor) => void;
  onStrokeWidthChange: (width: StrokeWidth) => void;
  hasColorPicker?: boolean;
  hasStrokeWidth?: boolean;
}

const iconMap: Record<DrawingTool, React.ComponentType<{ className?: string }>> = {
  'select-worksheet': MousePointer2,
  'marker': Pen,
  'highlighter': Highlighter,
  'arrow': MoveUpRight,
  'eraser': Eraser,
};

export const DrawingToolButton = ({
  tool,
  label,
  isActive,
  currentColor,
  currentStrokeWidth,
  onToolSelect,
  onColorChange,
  onStrokeWidthChange,
  hasColorPicker = false,
  hasStrokeWidth = false,
}: DrawingToolButtonProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const Icon = iconMap[tool];
  
  // Wybierz odpowiednie kolory dla narzędzia
  const availableColors = tool === 'highlighter' ? HIGHLIGHTER_COLORS : MARKER_COLORS;
  
  const handleClick = () => {
    if (isActive && (hasColorPicker || hasStrokeWidth)) {
      // Drugie kliknięcie na aktywne narzędzie = otwórz popover
      setIsPopoverOpen(true);
    } else {
      // Pierwsze kliknięcie = wybierz narzędzie
      onToolSelect();
    }
  };

  const handleStrokeWidthSlider = (value: number[]) => {
    const selectedWidth = STROKE_WIDTHS.find(sw => sw.value === value[0]) 
      || STROKE_WIDTHS.reduce((prev, curr) => 
        Math.abs(curr.value - value[0]) < Math.abs(prev.value - value[0]) ? curr : prev
      );
    onStrokeWidthChange(selectedWidth);
  };

  // Znajdź kolor do wyświetlenia w przycisku (dla wskaźnika koloru)
  const displayColor = tool === 'highlighter' 
    ? (HIGHLIGHTER_COLORS.find(c => c.name === currentColor.name) || HIGHLIGHTER_COLORS[0])
    : currentColor;

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className={cn(
            "relative h-9 px-3 gap-1",
            isActive && "bg-primary text-primary-foreground"
          )}
          onClick={handleClick}
        >
          <Icon className="h-4 w-4" />
          {/* Wskaźnik koloru pod ikoną (tylko dla narzędzi z kolorem) */}
          {hasColorPicker && (
            <div 
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
              style={{ backgroundColor: displayColor.hex }}
            />
          )}
          {/* Strzałka w dół gdy aktywne i ma popover */}
          {isActive && (hasColorPicker || hasStrokeWidth) && (
            <ChevronDown className="h-3 w-3 ml-0.5" />
          )}
        </Button>
      </PopoverTrigger>
      
      {(hasColorPicker || hasStrokeWidth) && (
        <PopoverContent className="w-56 p-3" align="start">
          {/* Siatka kolorów */}
          {hasColorPicker && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Color</p>
              <div className="grid grid-cols-5 gap-1">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    className={cn(
                      "w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
                      currentColor.name === color.name 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => {
                      onColorChange(color);
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Slider grubości */}
          {hasStrokeWidth && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Stroke: {currentStrokeWidth.name} ({currentStrokeWidth.value}px)
              </p>
              <Slider
                value={[currentStrokeWidth.value]}
                min={STROKE_WIDTHS[0].value}
                max={STROKE_WIDTHS[STROKE_WIDTHS.length - 1].value}
                step={1}
                onValueChange={handleStrokeWidthSlider}
                className="w-full"
              />
              {/* Preview line */}
              <div className="mt-2 flex items-center justify-center h-8 bg-muted/30 rounded">
                <div 
                  className="rounded-full"
                  style={{ 
                    width: Math.min(currentStrokeWidth.value * 8, 100),
                    height: currentStrokeWidth.value,
                    backgroundColor: tool === 'highlighter' ? displayColor.hex : currentColor.hex
                  }}
                />
              </div>
            </div>
          )}
        </PopoverContent>
      )}
    </Popover>
  );
};

export default DrawingToolButton;
