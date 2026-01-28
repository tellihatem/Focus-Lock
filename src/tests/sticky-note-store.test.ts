/**
 * Unit tests for StickyNoteStore (Zustand)
 * Tests state management for sticky notes in the UI layer
 */

import { useStickyNoteStore } from '../renderer/stores/sticky-note-store';
import { StickyNoteColor } from '../shared/types';

describe('StickyNoteStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useStickyNoteStore.getState().clearNotes();
    useStickyNoteStore.getState().setActiveNote(null);
  });

  describe('addNote', () => {
    it('should create a note with default values', () => {
      const { addNote } = useStickyNoteStore.getState();

      const noteId = addNote();

      const { notes } = useStickyNoteStore.getState();
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe(noteId);
      expect(notes[0].content).toBe('');
      expect(notes[0].color).toBe(StickyNoteColor.YELLOW);
      expect(notes[0].taskId).toBeNull();
      expect(notes[0].isAlwaysOnTop).toBe(false);
      expect(notes[0].isMinimized).toBe(false);
    });

    it('should create a note with custom values', () => {
      const { addNote } = useStickyNoteStore.getState();

      addNote({
        content: 'Test content',
        color: StickyNoteColor.BLUE,
        taskId: 'task_123',
      });

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].content).toBe('Test content');
      expect(notes[0].color).toBe(StickyNoteColor.BLUE);
      expect(notes[0].taskId).toBe('task_123');
    });

    it('should generate unique IDs', () => {
      const { addNote } = useStickyNoteStore.getState();

      const id1 = addNote();
      const id2 = addNote();

      expect(id1).not.toBe(id2);
    });

    it('should set the new note as active', () => {
      const { addNote } = useStickyNoteStore.getState();

      const noteId = addNote();

      expect(useStickyNoteStore.getState().activeNoteId).toBe(noteId);
    });

    it('should offset position for multiple notes', () => {
      const { addNote } = useStickyNoteStore.getState();

      addNote();
      addNote();

      const { notes } = useStickyNoteStore.getState();
      expect(notes[1].position.x).toBeGreaterThan(notes[0].position.x);
      expect(notes[1].position.y).toBeGreaterThan(notes[0].position.y);
    });
  });

  describe('updateNote', () => {
    it('should update note content', () => {
      const { addNote, updateNote } = useStickyNoteStore.getState();

      const noteId = addNote({ content: 'Original' });
      updateNote(noteId, { content: 'Updated' });

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].content).toBe('Updated');
    });

    it('should update note color', () => {
      const { addNote, updateNote } = useStickyNoteStore.getState();

      const noteId = addNote({ color: StickyNoteColor.YELLOW });
      updateNote(noteId, { color: StickyNoteColor.GREEN });

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].color).toBe(StickyNoteColor.GREEN);
    });

    it('should update updatedAt timestamp', () => {
      const { addNote, updateNote } = useStickyNoteStore.getState();

      const noteId = addNote();
      const originalUpdatedAt = useStickyNoteStore.getState().notes[0].updatedAt;

      // Wait a tiny bit to ensure timestamp difference
      updateNote(noteId, { content: 'New content' });

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });

    it('should merge position updates', () => {
      const { addNote, updateNote } = useStickyNoteStore.getState();

      const noteId = addNote({ position: { x: 100, y: 100, width: 200, height: 150 } });
      updateNote(noteId, { position: { x: 200 } });

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].position.x).toBe(200);
      expect(notes[0].position.y).toBe(100); // Should remain unchanged
    });
  });

  describe('deleteNote', () => {
    it('should remove note from store', () => {
      const { addNote, deleteNote } = useStickyNoteStore.getState();

      const noteId = addNote();
      deleteNote(noteId);

      const { notes } = useStickyNoteStore.getState();
      expect(notes).toHaveLength(0);
    });

    it('should clear activeNoteId if deleted note was active', () => {
      const { addNote, deleteNote } = useStickyNoteStore.getState();

      const noteId = addNote();
      deleteNote(noteId);

      expect(useStickyNoteStore.getState().activeNoteId).toBeNull();
    });

    it('should not affect other notes', () => {
      const { addNote, deleteNote } = useStickyNoteStore.getState();

      addNote({ content: 'Keep' });
      const toDelete = addNote({ content: 'Delete' });

      deleteNote(toDelete);

      const { notes } = useStickyNoteStore.getState();
      expect(notes).toHaveLength(1);
      expect(notes[0].content).toBe('Keep');
    });
  });

  describe('updatePosition', () => {
    it('should update note position', () => {
      const { addNote, updatePosition } = useStickyNoteStore.getState();

      const noteId = addNote();
      updatePosition(noteId, { x: 500, y: 300 });

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].position.x).toBe(500);
      expect(notes[0].position.y).toBe(300);
    });

    it('should update note size', () => {
      const { addNote, updatePosition } = useStickyNoteStore.getState();

      const noteId = addNote();
      updatePosition(noteId, { width: 400, height: 350 });

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].position.width).toBe(400);
      expect(notes[0].position.height).toBe(350);
    });
  });

  describe('bringToFront', () => {
    it('should move note to end of array', () => {
      const { addNote, bringToFront } = useStickyNoteStore.getState();

      const firstId = addNote({ content: 'First' });
      addNote({ content: 'Second' });
      addNote({ content: 'Third' });

      bringToFront(firstId);

      const { notes } = useStickyNoteStore.getState();
      expect(notes[notes.length - 1].id).toBe(firstId);
    });

    it('should set note as active', () => {
      const { addNote, bringToFront } = useStickyNoteStore.getState();

      const firstId = addNote();
      addNote();

      bringToFront(firstId);

      expect(useStickyNoteStore.getState().activeNoteId).toBe(firstId);
    });
  });

  describe('toggleAlwaysOnTop', () => {
    it('should toggle isAlwaysOnTop from false to true', () => {
      const { addNote, toggleAlwaysOnTop } = useStickyNoteStore.getState();

      const noteId = addNote();
      toggleAlwaysOnTop(noteId);

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].isAlwaysOnTop).toBe(true);
    });

    it('should toggle isAlwaysOnTop from true to false', () => {
      const { addNote, toggleAlwaysOnTop } = useStickyNoteStore.getState();

      const noteId = addNote();
      toggleAlwaysOnTop(noteId);
      toggleAlwaysOnTop(noteId);

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].isAlwaysOnTop).toBe(false);
    });
  });

  describe('toggleMinimized', () => {
    it('should toggle isMinimized from false to true', () => {
      const { addNote, toggleMinimized } = useStickyNoteStore.getState();

      const noteId = addNote();
      toggleMinimized(noteId);

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].isMinimized).toBe(true);
    });

    it('should toggle isMinimized from true to false', () => {
      const { addNote, toggleMinimized } = useStickyNoteStore.getState();

      const noteId = addNote();
      toggleMinimized(noteId);
      toggleMinimized(noteId);

      const { notes } = useStickyNoteStore.getState();
      expect(notes[0].isMinimized).toBe(false);
    });
  });

  describe('getNoteById', () => {
    it('should return note when found', () => {
      const { addNote, getNoteById } = useStickyNoteStore.getState();

      const noteId = addNote({ content: 'Find me' });
      const note = useStickyNoteStore.getState().getNoteById(noteId);

      expect(note).toBeDefined();
      expect(note?.content).toBe('Find me');
    });

    it('should return undefined when not found', () => {
      const { getNoteById } = useStickyNoteStore.getState();

      const note = getNoteById('nonexistent');

      expect(note).toBeUndefined();
    });
  });

  describe('getNotesByTaskId', () => {
    it('should return notes linked to task', () => {
      const { addNote, getNotesByTaskId } = useStickyNoteStore.getState();

      addNote({ taskId: 'task_1', content: 'Note 1' });
      addNote({ taskId: 'task_1', content: 'Note 2' });
      addNote({ taskId: 'task_2', content: 'Note 3' });

      const notes = useStickyNoteStore.getState().getNotesByTaskId('task_1');

      expect(notes).toHaveLength(2);
    });

    it('should return empty array when no notes linked', () => {
      const { addNote, getNotesByTaskId } = useStickyNoteStore.getState();

      addNote({ content: 'No task link' });

      const notes = useStickyNoteStore.getState().getNotesByTaskId('task_999');

      expect(notes).toHaveLength(0);
    });
  });

  describe('setNotes / clearNotes', () => {
    it('should set notes from external source', () => {
      const { setNotes } = useStickyNoteStore.getState();

      setNotes([
        {
          id: 'ext_1',
          taskId: null,
          content: 'External Note',
          color: StickyNoteColor.BLUE,
          position: { x: 0, y: 0, width: 200, height: 150 },
          isAlwaysOnTop: false,
          isMinimized: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      const { notes } = useStickyNoteStore.getState();
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('ext_1');
    });

    it('should clear all notes', () => {
      const { addNote, clearNotes } = useStickyNoteStore.getState();

      addNote();
      addNote();
      clearNotes();

      const { notes } = useStickyNoteStore.getState();
      expect(notes).toHaveLength(0);
    });
  });
});
