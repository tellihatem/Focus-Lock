/**
 * Zustand store for sticky note state management
 * Provides reactive state for sticky notes across the UI
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  StickyNote,
  StickyNoteColor,
  StickyNotePosition,
  CreateStickyNotePayload,
  UpdateStickyNotePayload,
} from '../../shared/types';

/**
 * Default sticky note dimensions and position
 */
const DEFAULT_POSITION: StickyNotePosition = {
  x: 100,
  y: 100,
  width: 250,
  height: 200,
};

/**
 * Sticky note store state interface
 */
interface StickyNoteState {
  notes: StickyNote[];
  activeNoteId: string | null;
}

/**
 * Sticky note store actions interface
 */
interface StickyNoteActions {
  // CRUD operations
  addNote: (payload?: CreateStickyNotePayload) => string;
  updateNote: (id: string, payload: UpdateStickyNotePayload) => void;
  deleteNote: (id: string) => void;

  // Position and size operations
  updatePosition: (id: string, position: Partial<StickyNotePosition>) => void;
  bringToFront: (id: string) => void;

  // Toggle operations
  toggleAlwaysOnTop: (id: string) => void;
  toggleMinimized: (id: string) => void;

  // State management
  setActiveNote: (id: string | null) => void;
  setNotes: (notes: StickyNote[]) => void;
  clearNotes: () => void;

  // Query helpers
  getNoteById: (id: string) => StickyNote | undefined;
  getNotesByTaskId: (taskId: string) => StickyNote[];
}

/**
 * Combined store type
 */
export type StickyNoteStore = StickyNoteState & StickyNoteActions;

/**
 * Generate unique sticky note ID
 */
const generateNoteId = (): string => {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sticky note store instance with localStorage persistence
 */
export const useStickyNoteStore = create<StickyNoteStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      activeNoteId: null,

      /**
       * Add a new sticky note
       * @returns The ID of the created note
       */
      addNote: (payload?: CreateStickyNotePayload): string => {
        const id = generateNoteId();
        const now = Date.now();

        // Calculate offset position if other notes exist
        const existingNotes = get().notes;
        const offsetX = (existingNotes.length % 5) * 30;
        const offsetY = (existingNotes.length % 5) * 30;

        const newNote: StickyNote = {
          id,
          taskId: payload?.taskId || null,
          content: payload?.content || '',
          color: payload?.color || StickyNoteColor.YELLOW,
          position: {
            x: payload?.position?.x ?? DEFAULT_POSITION.x + offsetX,
            y: payload?.position?.y ?? DEFAULT_POSITION.y + offsetY,
            width: payload?.position?.width ?? DEFAULT_POSITION.width,
            height: payload?.position?.height ?? DEFAULT_POSITION.height,
          },
          isAlwaysOnTop: false,
          isMinimized: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          notes: [...state.notes, newNote],
          activeNoteId: id,
        }));

        return id;
      },

      /**
       * Update an existing sticky note
       */
      updateNote: (id: string, payload: UpdateStickyNotePayload): void => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  ...payload,
                  position: payload.position
                    ? { ...note.position, ...payload.position }
                    : note.position,
                  updatedAt: Date.now(),
                }
              : note
          ),
        }));
      },

      /**
       * Delete a sticky note
       */
      deleteNote: (id: string): void => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }));
      },

      /**
       * Update sticky note position/size
       */
      updatePosition: (id: string, position: Partial<StickyNotePosition>): void => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  position: { ...note.position, ...position },
                  updatedAt: Date.now(),
                }
              : note
          ),
        }));
      },

      /**
       * Bring a note to front (make it active)
       */
      bringToFront: (id: string): void => {
        set((state) => {
          const noteIndex = state.notes.findIndex((n) => n.id === id);
          if (noteIndex === -1) return state;

          const note = state.notes[noteIndex];
          const otherNotes = state.notes.filter((n) => n.id !== id);

          return {
            notes: [...otherNotes, note],
            activeNoteId: id,
          };
        });
      },

      /**
       * Toggle always-on-top for a note
       */
      toggleAlwaysOnTop: (id: string): void => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, isAlwaysOnTop: !note.isAlwaysOnTop, updatedAt: Date.now() }
              : note
          ),
        }));
      },

      /**
       * Toggle minimized state for a note
       */
      toggleMinimized: (id: string): void => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, isMinimized: !note.isMinimized, updatedAt: Date.now() }
              : note
          ),
        }));
      },

      /**
       * Set the active note
       */
      setActiveNote: (id: string | null): void => {
        set({ activeNoteId: id });
      },

      /**
       * Set all notes (for loading from storage)
       */
      setNotes: (notes: StickyNote[]): void => {
        set({ notes });
      },

      /**
       * Clear all notes
       */
      clearNotes: (): void => {
        set({ notes: [], activeNoteId: null });
      },

      /**
       * Get a note by ID
       */
      getNoteById: (id: string): StickyNote | undefined => {
        return get().notes.find((note) => note.id === id);
      },

      /**
       * Get all notes linked to a specific task
       */
      getNotesByTaskId: (taskId: string): StickyNote[] => {
        return get().notes.filter((note) => note.taskId === taskId);
      },
    }),
    {
      name: 'focus-lock-sticky-notes',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);
