import { createLocalRepository } from "@/lib/local-data/repository";
import type { NoteRecord } from "@/lib/local-data/models/note";
import { requireNonBlank } from "@/lib/local-data/validation";

const noteRepository = createLocalRepository<NoteRecord>("notes", (note) => {
  requireNonBlank(note.content, "Note content");
});

export const createNote = noteRepository.create;
export const getNote = noteRepository.get;
export const listNotes = noteRepository.list;
export const updateNote = noteRepository.update;
export const deleteNote = noteRepository.delete;
