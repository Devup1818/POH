'use server';

import { createClient } from '@/lib/supabase/server';
import type { NoteType, Result } from '@/types';

export async function addNote(
  coachId: string,
  content: string,
  noteType: NoteType,
  isImportant?: boolean,
  relatedStage?: string,
  relatedPartId?: string,
): Promise<Result<{ id: string }>> {
  if (!content.trim()) {
    return { success: false, error: 'Note content cannot be empty' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('notes')
    .insert({
      coach_id: coachId,
      created_by: user.id,
      note_type: noteType,
      content: content.trim(),
      is_important: isImportant ?? false,
      related_stage: relatedStage ?? null,
      related_part: relatedPartId ?? null,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: data.id } };
}

export async function updateNote(
  noteId: string,
  content: string,
  isImportant?: boolean,
): Promise<Result<void>> {
  if (!content.trim()) {
    return { success: false, error: 'Note content cannot be empty' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify ownership
  const { data: note } = await supabase
    .from('notes')
    .select('created_by')
    .eq('id', noteId)
    .single();

  if (!note) return { success: false, error: 'Note not found' };
  if (note.created_by !== user.id) {
    return { success: false, error: 'You can only edit your own notes' };
  }

  const { error } = await supabase
    .from('notes')
    .update({
      content: content.trim(),
      is_important: isImportant ?? false,
    })
    .eq('id', noteId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function deleteNote(noteId: string): Promise<Result<void>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify ownership
  const { data: note } = await supabase
    .from('notes')
    .select('created_by')
    .eq('id', noteId)
    .single();

  if (!note) return { success: false, error: 'Note not found' };
  if (note.created_by !== user.id) {
    return { success: false, error: 'You can only delete your own notes' };
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function toggleNoteImportant(noteId: string): Promise<Result<void>> {
  const supabase = await createClient();

  const { data: note } = await supabase
    .from('notes')
    .select('is_important')
    .eq('id', noteId)
    .single();

  if (!note) return { success: false, error: 'Note not found' };

  const { error } = await supabase
    .from('notes')
    .update({ is_important: !note.is_important })
    .eq('id', noteId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export interface NoteResult {
  id: string;
  coachId: string;
  noteType: string;
  content: string;
  isImportant: boolean;
  relatedStage: string | null;
  relatedPart: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export async function getNotesForCoach(
  coachId: string,
  filters?: { noteType?: NoteType },
): Promise<Result<NoteResult[]>> {
  const supabase = await createClient();

  let query = supabase
    .from('notes')
    .select(`
      id, coach_id, note_type, content, is_important,
      related_stage, related_part, created_by, created_at, updated_at,
      author:created_by ( full_name )
    `)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  if (filters?.noteType) {
    query = query.eq('note_type', filters.noteType);
  }

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };

  const notes: NoteResult[] = (data ?? []).map((n) => ({
    id: n.id,
    coachId: n.coach_id,
    noteType: n.note_type,
    content: n.content,
    isImportant: n.is_important,
    relatedStage: n.related_stage,
    relatedPart: n.related_part,
    createdBy: n.created_by,
    createdByName: (n.author as unknown as { full_name: string } | null)?.full_name ?? 'Unknown',
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  }));

  return { success: true, data: notes };
}

export async function searchNotesInRake(
  rakeId: string,
  searchTerm: string,
): Promise<Result<(NoteResult & { coachNumber: string })[]>> {
  if (!searchTerm.trim()) {
    return { success: false, error: 'Search term cannot be empty' };
  }

  const supabase = await createClient();

  // Get all coach IDs for this rake
  const { data: coaches, error: coachErr } = await supabase
    .from('coaches')
    .select('id, coach_number')
    .eq('rake_id', rakeId);

  if (coachErr) return { success: false, error: coachErr.message };
  if (!coaches || coaches.length === 0) return { success: true, data: [] };

  const coachIds = coaches.map((c) => c.id);
  const coachNumberMap = new Map(coaches.map((c) => [c.id, c.coach_number]));

  // Search notes across all coaches in the rake
  const { data, error } = await supabase
    .from('notes')
    .select(`
      id, coach_id, note_type, content, is_important,
      related_stage, related_part, created_by, created_at, updated_at,
      author:created_by ( full_name )
    `)
    .in('coach_id', coachIds)
    .ilike('content', `%${searchTerm.trim()}%`)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  const notes = (data ?? []).map((n) => ({
    id: n.id,
    coachId: n.coach_id,
    noteType: n.note_type,
    content: n.content,
    isImportant: n.is_important,
    relatedStage: n.related_stage,
    relatedPart: n.related_part,
    createdBy: n.created_by,
    createdByName: (n.author as unknown as { full_name: string } | null)?.full_name ?? 'Unknown',
    createdAt: n.created_at,
    updatedAt: n.updated_at,
    coachNumber: coachNumberMap.get(n.coach_id) ?? 'Unknown',
  }));

  return { success: true, data: notes };
}
