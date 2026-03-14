'use client';

import { useState, useMemo, useTransition } from 'react';
import { Star, Pencil, Trash2, Send, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTimeIST } from '@/lib/utils/date';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addNote, updateNote, deleteNote, toggleNoteImportant } from '@/lib/actions/notes';
import type { MockNote } from '@/lib/mock-data';
import type { NoteType } from '@/types';

export interface NotesPanelProps {
  notes: MockNote[];
  coachId: string;
  currentUserId?: string;
}

const NOTE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'General', label: 'General' },
  { value: 'Stage-Specific', label: 'Stage-Specific' },
  { value: 'Part-Specific', label: 'Part-Specific' },
];

const ADD_NOTE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'General', label: 'General' },
  { value: 'Stage-Specific', label: 'Stage-Specific' },
  { value: 'Part-Specific', label: 'Part-Specific' },
];

const noteTypeVariant: Record<NoteType, 'default' | 'info' | 'purple'> = {
  General: 'default',
  'Stage-Specific': 'info',
  'Part-Specific': 'purple',
};



export function NotesPanel({ notes: initialNotes, coachId, currentUserId }: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [typeFilter, setTypeFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<NoteType>('General');
  const [newImportant, setNewImportant] = useState(false);

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImportant, setEditImportant] = useState(false);

  const filtered = useMemo(() => {
    const list = typeFilter === 'all' ? notes : notes.filter((n) => n.noteType === typeFilter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notes, typeFilter]);

  const handleAddNote = () => {
    if (!newContent.trim()) return;

    const tempNote: MockNote = {
      id: `note-temp-${Date.now()}`,
      coachId,
      noteType: newType,
      content: newContent.trim(),
      isImportant: newImportant,
      relatedStage: null,
      relatedPart: null,
      createdBy: 'You',
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [tempNote, ...prev]);
    const content = newContent.trim();
    const type = newType;
    const important = newImportant;
    setNewContent('');
    setNewImportant(false);
    setError(null);

    startTransition(async () => {
      const result = await addNote(coachId, content, type, important);
      if (!result.success) {
        setError(result.error);
        setNotes(initialNotes);
      } else {
        setNotes((prev) =>
          prev.map((n) => (n.id === tempNote.id ? { ...n, id: result.data.id } : n)),
        );
      }
    });
  };

  const handleDelete = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setError(null);

    startTransition(async () => {
      const result = await deleteNote(noteId);
      if (!result.success) {
        setError(result.error);
        setNotes(initialNotes);
      }
    });
  };

  const handleToggleImportant = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isImportant: !n.isImportant } : n)),
    );

    startTransition(async () => {
      const result = await toggleNoteImportant(noteId);
      if (!result.success) {
        setError(result.error);
        setNotes(initialNotes);
      }
    });
  };

  const handleStartEdit = (note: MockNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditImportant(note.isImportant);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
    setEditImportant(false);
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editContent.trim()) return;

    const content = editContent.trim();
    const important = editImportant;

    // Optimistic update
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, content, isImportant: important } : n,
      ),
    );
    setEditingNoteId(null);
    setError(null);

    startTransition(async () => {
      const result = await updateNote(noteId, content, important);
      if (!result.success) {
        setError(result.error);
        setNotes(initialNotes);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add note form */}
      <Card>
        <CardHeader className="py-2.5">
          <h4 className="text-sm font-semibold text-gray-800">Add Note</h4>
        </CardHeader>
        <CardBody className="py-3 space-y-3">
          <Textarea
            placeholder="Write a note..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Select
              options={ADD_NOTE_TYPE_OPTIONS}
              value={newType}
              onChange={(e) => setNewType(e.target.value as NoteType)}
              className="w-44"
            />
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newImportant}
                onChange={(e) => setNewImportant(e.target.checked)}
                className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
              <Star className="h-3.5 w-3.5 text-yellow-500" />
              Important
            </label>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newContent.trim() || isPending}
              className="ml-auto"
            >
              <Send className="h-3.5 w-3.5" />
              Add Note
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          options={NOTE_TYPE_OPTIONS}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-44"
        />
        <span className="text-xs text-gray-400">
          {filtered.length} note{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {filtered.map((note) => {
          const isOwn = note.createdBy === 'You' || note.id.startsWith('note-temp-');
          const isEditing = editingNoteId === note.id;

          return (
            <Card key={note.id} className={cn(note.isImportant && 'border-yellow-300 bg-yellow-50/30')}>
              <CardBody className="py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={noteTypeVariant[note.noteType]} size="sm">{note.noteType}</Badge>
                    {note.isImportant && !isEditing && (
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggleImportant(note.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-yellow-500"
                        aria-label="Toggle important"
                        disabled={isPending}
                      >
                        <Star
                          className={cn(
                            'h-3.5 w-3.5',
                            note.isImportant && 'text-yellow-500 fill-yellow-500',
                          )}
                        />
                      </button>
                      {isOwn && (
                        <>
                          <button
                            onClick={() => handleStartEdit(note)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-500"
                            aria-label="Edit note"
                            disabled={isPending}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                            aria-label="Delete note"
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editImportant}
                          onChange={(e) => setEditImportant(e.target.checked)}
                          className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                        />
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        Important
                      </label>
                      <div className="ml-auto flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={!editContent.trim() || isPending}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-800">{note.content}</p>
                )}

                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span>{note.createdBy}</span>
                  <span>{formatDateTimeIST(note.createdAt)}</span>
                </div>
              </CardBody>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No notes yet.</p>
        )}
      </div>
    </div>
  );
}
