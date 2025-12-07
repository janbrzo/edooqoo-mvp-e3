import React, { useEffect, useCallback } from 'react';
import { X, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectWordModeProps {
  isActive: boolean;
  onWordSelected: (word: string) => void;
  onCancel: () => void;
}

export const SelectWordMode = ({
  isActive,
  onWordSelected,
  onCancel
}: SelectWordModeProps) => {
  const handleMouseUp = useCallback(() => {
    if (!isActive) return;
    
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0 && selectedText.length < 200) {
      onWordSelected(selectedText);
      selection?.removeAllRanges();
    }
  }, [isActive, onWordSelected]);
  
  useEffect(() => {
    if (isActive) {
      document.addEventListener('mouseup', handleMouseUp);
      // Add custom cursor style
      document.body.style.cursor = 'text';
      
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isActive, handleMouseUp]);
  
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Top banner */}
      <div className="absolute top-0 left-0 right-0 bg-green-600 text-white py-3 px-4 flex items-center justify-center gap-3 pointer-events-auto shadow-lg">
        <MousePointer2 className="h-5 w-5 animate-pulse" />
        <span className="font-medium">Select a word or phrase from the worksheet</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-white hover:bg-green-700 ml-4"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
      
      {/* Semi-transparent overlay to indicate selection mode - but allows clicks through */}
      <div 
        className="absolute inset-0 bg-green-500/5 pointer-events-none"
        style={{ top: '50px' }}
      />
    </div>
  );
};
