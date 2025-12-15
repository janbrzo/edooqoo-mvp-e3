/**
 * Drawing Overlay Types for Live Session
 * 
 * Ten plik zawiera wszystkie typy TypeScript dla funkcji rysowania
 * po worksheet w trybie Live Session.
 */

// ============================================
// NARZĘDZIA RYSOWANIA
// ============================================

/**
 * Dostępne narzędzia rysowania
 */
export type DrawingTool = 
  | 'select'      // Zaznaczanie i przesuwanie obiektów
  | 'pencil'      // Ołówek - cienka linia
  | 'marker'      // Pisak - grubsza linia
  | 'highlighter' // Zakreślacz - półprzezroczysty
  | 'eraser'      // Gumka - usuwanie obiektów
  | 'rectangle'   // Prostokąt
  | 'circle'      // Koło/elipsa
  | 'arrow'       // Strzałka
  | 'line'        // Linia prosta
  | 'text';       // Tekst

/**
 * Informacje o każdym narzędziu
 */
export interface DrawingToolInfo {
  id: DrawingTool;
  label: string;
  icon: string; // Lucide icon name
  shortcut?: string;
}

/**
 * Lista wszystkich narzędzi z metadanymi
 */
export const DRAWING_TOOLS: DrawingToolInfo[] = [
  { id: 'select', label: 'Select', icon: 'MousePointer2', shortcut: 'V' },
  { id: 'pencil', label: 'Pencil', icon: 'Pencil', shortcut: 'P' },
  { id: 'marker', label: 'Marker', icon: 'Pen', shortcut: 'M' },
  { id: 'highlighter', label: 'Highlighter', icon: 'Highlighter', shortcut: 'H' },
  { id: 'eraser', label: 'Eraser', icon: 'Eraser', shortcut: 'E' },
  { id: 'rectangle', label: 'Rectangle', icon: 'Square', shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: 'Circle', shortcut: 'C' },
  { id: 'arrow', label: 'Arrow', icon: 'MoveUpRight', shortcut: 'A' },
  { id: 'line', label: 'Line', icon: 'Minus', shortcut: 'L' },
  { id: 'text', label: 'Text', icon: 'Type', shortcut: 'T' },
];

// ============================================
// KOLORY
// ============================================

/**
 * Predefiniowane kolory do rysowania
 */
export interface DrawingColor {
  name: string;
  value: string; // HSL format
  hex: string;   // For Fabric.js
}

/**
 * 9 predefiniowanych kolorów
 */
export const DRAWING_COLORS: DrawingColor[] = [
  { name: 'Black', value: 'hsl(0, 0%, 0%)', hex: '#000000' },
  { name: 'Red', value: 'hsl(0, 84%, 60%)', hex: '#ef4444' },
  { name: 'Orange', value: 'hsl(25, 95%, 53%)', hex: '#f97316' },
  { name: 'Yellow', value: 'hsl(48, 96%, 53%)', hex: '#eab308' },
  { name: 'Green', value: 'hsl(142, 71%, 45%)', hex: '#22c55e' },
  { name: 'Blue', value: 'hsl(217, 91%, 60%)', hex: '#3b82f6' },
  { name: 'Purple', value: 'hsl(271, 91%, 65%)', hex: '#a855f7' },
  { name: 'Pink', value: 'hsl(330, 81%, 60%)', hex: '#ec4899' },
  { name: 'White', value: 'hsl(0, 0%, 100%)', hex: '#ffffff' },
];

/**
 * Domyślny kolor
 */
export const DEFAULT_DRAWING_COLOR = DRAWING_COLORS[0]; // Black

// ============================================
// GRUBOŚĆ LINII
// ============================================

/**
 * Grubość linii
 */
export interface StrokeWidth {
  name: string;
  value: number;
}

/**
 * 4 predefiniowane grubości
 */
export const STROKE_WIDTHS: StrokeWidth[] = [
  { name: 'Thin', value: 2 },
  { name: 'Medium', value: 4 },
  { name: 'Thick', value: 8 },
  { name: 'Extra Thick', value: 16 },
];

/**
 * Domyślna grubość
 */
export const DEFAULT_STROKE_WIDTH = STROKE_WIDTHS[1]; // Medium (4px)

// ============================================
// STAN RYSOWANIA
// ============================================

/**
 * Stan narzędzia rysowania
 */
export interface DrawingState {
  isEnabled: boolean;          // Czy rysowanie jest włączone
  activeTool: DrawingTool;     // Aktualnie wybrane narzędzie
  activeColor: DrawingColor;   // Aktualnie wybrany kolor
  strokeWidth: StrokeWidth;    // Aktualnie wybrana grubość
  canUndo: boolean;            // Czy można cofnąć
  canRedo: boolean;            // Czy można powtórzyć
  isSaving: boolean;           // Czy trwa zapisywanie
  lastSavedAt: Date | null;    // Ostatni zapis
}

/**
 * Domyślny stan
 */
export const DEFAULT_DRAWING_STATE: DrawingState = {
  isEnabled: false,
  activeTool: 'pencil',
  activeColor: DEFAULT_DRAWING_COLOR,
  strokeWidth: DEFAULT_STROKE_WIDTH,
  canUndo: false,
  canRedo: false,
  isSaving: false,
  lastSavedAt: null,
};

// ============================================
// DANE RYSUNKU (do zapisu w bazie)
// ============================================

/**
 * Struktura danych rysunku zapisywana w bazie
 */
export interface DrawingData {
  objects: FabricObjectData[];  // Obiekty Fabric.js
  version: string;              // Wersja formatu (dla kompatybilności)
  canvasWidth?: number;         // Szerokość canvas przy zapisie
  canvasHeight?: number;        // Wysokość canvas przy zapisie
}

/**
 * Pojedynczy obiekt Fabric.js (uproszczony typ)
 */
export interface FabricObjectData {
  type: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  path?: any[];           // Dla ścieżek (pencil, marker)
  text?: string;          // Dla tekstu
  points?: any[];         // Dla linii, strzałek
  [key: string]: any;     // Inne właściwości Fabric.js
}

/**
 * Domyślne dane pustego rysunku
 */
export const EMPTY_DRAWING_DATA: DrawingData = {
  objects: [],
  version: '1.0',
};

// ============================================
// REKORD BAZY DANYCH
// ============================================

/**
 * Rekord z tabeli worksheet_drawings
 */
export interface WorksheetDrawing {
  id: string;
  worksheet_id: string;
  teacher_id: string;
  drawing_data: DrawingData;
  created_at: string;
  updated_at: string;
}

// ============================================
// PROPS KOMPONENTÓW
// ============================================

/**
 * Props dla DrawingOverlay
 */
export interface DrawingOverlayProps {
  worksheetId: string;
  teacherId: string;
  isTeacher: boolean;           // Czy użytkownik jest nauczycielem
  isEnabled: boolean;           // Czy tryb rysowania jest włączony
  onDrawingChange?: (data: DrawingData) => void;
}

/**
 * Props dla DrawingToolbar
 */
export interface DrawingToolbarProps {
  state: DrawingState;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: DrawingColor) => void;
  onStrokeWidthChange: (width: StrokeWidth) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
}

/**
 * Props dla DrawingToggleButton
 */
export interface DrawingToggleButtonProps {
  isEnabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Props dla DrawingColorPicker
 */
export interface DrawingColorPickerProps {
  selectedColor: DrawingColor;
  onColorSelect: (color: DrawingColor) => void;
}

/**
 * Props dla DrawingStrokeWidth
 */
export interface DrawingStrokeWidthProps {
  selectedWidth: StrokeWidth;
  onWidthSelect: (width: StrokeWidth) => void;
}

// ============================================
// REALTIME EVENTS
// ============================================

/**
 * Typy eventów Realtime dla synchronizacji
 */
export type DrawingRealtimeEventType = 
  | 'drawing:update'    // Aktualizacja rysunku
  | 'drawing:clear'     // Wyczyszczenie wszystkiego
  | 'drawing:object:add'    // Dodanie obiektu
  | 'drawing:object:modify' // Modyfikacja obiektu
  | 'drawing:object:remove'; // Usunięcie obiektu

/**
 * Payload eventu Realtime
 */
export interface DrawingRealtimePayload {
  type: DrawingRealtimeEventType;
  worksheetId: string;
  teacherId: string;
  data: Partial<DrawingData> | FabricObjectData | null;
  timestamp: number;
}

// ============================================
// HISTORIA (Undo/Redo)
// ============================================

/**
 * Konfiguracja historii
 */
export const DRAWING_HISTORY_CONFIG = {
  maxSteps: 50,           // Maksymalna liczba kroków w historii
  debounceMs: 300,        // Debounce przed zapisem do historii
};

/**
 * Stan historii
 */
export interface DrawingHistoryState {
  undoStack: DrawingData[];
  redoStack: DrawingData[];
}

// ============================================
// AUTO-SAVE
// ============================================

/**
 * Konfiguracja auto-save
 */
export const DRAWING_AUTOSAVE_CONFIG = {
  debounceMs: 2000,       // Debounce przed zapisem do bazy (2s)
  maxRetries: 3,          // Maksymalna liczba prób zapisu
  retryDelayMs: 1000,     // Opóźnienie między próbami
};

// ============================================
// LIMITY
// ============================================

/**
 * Limity bezpieczeństwa
 */
export const DRAWING_LIMITS = {
  maxObjects: 500,        // Maksymalna liczba obiektów na canvas
  maxDataSizeKB: 1024,    // Maksymalny rozmiar danych (1MB)
};
