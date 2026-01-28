import React, { useState, useRef, useCallback } from 'react';
import { X, Pin, PinOff, Minimize2, Maximize2 } from 'lucide-react';
import { StickyNote as StickyNoteType, StickyNoteColor } from '../../shared/types';
import { useStickyNoteStore } from '../stores/sticky-note-store';

/**
 * Color mapping for sticky note backgrounds
 */
const COLOR_MAP: Record<StickyNoteColor, { bg: string; header: string; border: string }> = {
  [StickyNoteColor.YELLOW]: { bg: 'bg-yellow-100', header: 'bg-yellow-200', border: 'border-yellow-300' },
  [StickyNoteColor.BLUE]: { bg: 'bg-blue-100', header: 'bg-blue-200', border: 'border-blue-300' },
  [StickyNoteColor.GREEN]: { bg: 'bg-green-100', header: 'bg-green-200', border: 'border-green-300' },
  [StickyNoteColor.PINK]: { bg: 'bg-pink-100', header: 'bg-pink-200', border: 'border-pink-300' },
  [StickyNoteColor.PURPLE]: { bg: 'bg-purple-100', header: 'bg-purple-200', border: 'border-purple-300' },
  [StickyNoteColor.ORANGE]: { bg: 'bg-orange-100', header: 'bg-orange-200', border: 'border-orange-300' },
};

/**
 * Minimum dimensions for sticky notes
 */
const MIN_WIDTH = 150;
const MIN_HEIGHT = 100;

interface StickyNoteProps {
  note: StickyNoteType;
}

/**
 * StickyNote Component
 * Draggable and resizable sticky note with always-on-top toggle
 */
function StickyNote({ note }: StickyNoteProps): React.ReactElement {
  const { updateNote, updatePosition, deleteNote, toggleAlwaysOnTop, toggleMinimized, bringToFront } =
    useStickyNoteStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

  const colors = COLOR_MAP[note.color];

  /**
   * Handle mouse down for dragging
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.no-drag')) return;

      e.preventDefault();
      setIsDragging(true);
      bringToFront(note.id);

      const rect = noteRef.current?.getBoundingClientRect();
      if (rect) {
        dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    },
    [note.id, bringToFront]
  );

  /**
   * Handle mouse move for dragging
   */
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      updatePosition(note.id, {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      });
    },
    [isDragging, note.id, updatePosition]
  );

  /**
   * Handle mouse up for dragging
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle mouse down for resizing
   */
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      bringToFront(note.id);

      resizeStart.current = {
        width: note.position.width,
        height: note.position.height,
        mouseX: e.clientX,
        mouseY: e.clientY,
      };
    },
    [note.id, note.position.width, note.position.height, bringToFront]
  );

  /**
   * Handle mouse move for resizing
   */
  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - resizeStart.current.mouseX;
      const deltaY = e.clientY - resizeStart.current.mouseY;

      updatePosition(note.id, {
        width: Math.max(MIN_WIDTH, resizeStart.current.width + deltaX),
        height: Math.max(MIN_HEIGHT, resizeStart.current.height + deltaY),
      });
    },
    [isResizing, note.id, updatePosition]
  );

  /**
   * Handle mouse up for resizing
   */
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  /**
   * Handle content change
   */
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNote(note.id, { content: e.target.value });
  };

  /**
   * Attach/detach global mouse listeners for drag and resize
   */
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Minimized view
  if (note.isMinimized) {
    return (
      <div
        ref={noteRef}
        className={`fixed ${colors.bg} ${colors.border} border-2 rounded-lg shadow-lg cursor-move select-none`}
        style={{
          left: note.position.x,
          top: note.position.y,
          width: 200,
          zIndex: note.isAlwaysOnTop ? 9999 : 10,
        }}
        onMouseDown={handleDragStart}
      >
        <div className={`${colors.header} px-3 py-2 rounded-t-md flex items-center justify-between`}>
          <span className="text-gray-700 text-sm font-medium truncate flex-1">
            {note.content.slice(0, 20) || 'Empty note'}
            {note.content.length > 20 ? '...' : ''}
          </span>
          <div className="flex items-center gap-1 no-drag">
            <button
              onClick={() => toggleMinimized(note.id)}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              title="Maximize"
            >
              <Maximize2 size={14} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={noteRef}
      className={`fixed ${colors.bg} ${colors.border} border-2 rounded-lg shadow-lg select-none`}
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.position.width,
        height: note.position.height,
        zIndex: note.isAlwaysOnTop ? 9999 : 10,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header - draggable area */}
      <div
        className={`${colors.header} px-3 py-2 rounded-t-md flex items-center justify-between cursor-grab active:cursor-grabbing`}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          {note.isAlwaysOnTop && <Pin size={12} className="text-gray-600" />}
        </div>
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => toggleAlwaysOnTop(note.id)}
            className="p-1 hover:bg-white/50 rounded transition-colors"
            title={note.isAlwaysOnTop ? 'Unpin' : 'Pin on top'}
          >
            {note.isAlwaysOnTop ? (
              <PinOff size={14} className="text-gray-600" />
            ) : (
              <Pin size={14} className="text-gray-600" />
            )}
          </button>
          <button
            onClick={() => toggleMinimized(note.id)}
            className="p-1 hover:bg-white/50 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 size={14} className="text-gray-600" />
          </button>
          <button
            onClick={() => deleteNote(note.id)}
            className="p-1 hover:bg-red-200 rounded transition-colors"
            title="Delete"
          >
            <X size={14} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content - editable textarea */}
      <textarea
        value={note.content}
        onChange={handleContentChange}
        placeholder="Write your note..."
        className={`w-full h-[calc(100%-40px)] p-3 ${colors.bg} resize-none focus:outline-none text-gray-800 text-sm no-drag`}
        style={{ background: 'transparent' }}
      />

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize no-drag"
        onMouseDown={handleResizeStart}
      >
        <svg
          className="w-full h-full text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 22L12 22M22 22L22 12M22 22L16 16" />
        </svg>
      </div>
    </div>
  );
}

export default StickyNote;
