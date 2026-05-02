import { getDatabase, persistDatabase } from "./db";
import type { NoteFilters, SavedNote } from "../types/note";

type DbRow = Record<string, string | number | Uint8Array | null>;

export type SaveNoteInput = Omit<SavedNote, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function jsonString(value: string[]): string {
  return JSON.stringify(value);
}

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string" || !value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function text(row: DbRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function rowToNote(row: DbRow): SavedNote {
  return {
    id: text(row, "id"),
    title: text(row, "title"),
    sourceType: text(row, "source_type") as SavedNote["sourceType"],
    audience: text(row, "audience") as SavedNote["audience"],
    summaryType: text(row, "summary_type") as SavedNote["summaryType"],
    tone: text(row, "tone") as SavedNote["tone"],
    customerName: text(row, "customer_name"),
    ticketId: text(row, "ticket_id"),
    productSystem: text(row, "product_system"),
    priority: text(row, "priority"),
    issueSummary: text(row, "issue_summary"),
    troubleshootingSteps: text(row, "troubleshooting_steps"),
    errorMessages: text(row, "error_messages"),
    resolution: text(row, "resolution"),
    openQuestionsInput: text(row, "open_questions_input"),
    nextStepsInput: text(row, "next_steps_input"),
    rawNotes: text(row, "raw_notes"),
    generatedSummary: text(row, "generated_summary"),
    actionItems: parseJsonArray(row.action_items_json),
    openQuestions: parseJsonArray(row.open_questions_json),
    nextSteps: parseJsonArray(row.next_steps_json),
    tags: parseJsonArray(row.tags_json),
    aiMode: text(row, "ai_mode") === "real" ? "real" : "mock",
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at")
  };
}

async function selectRows(sql: string, params: Array<string | number | null> = []): Promise<DbRow[]> {
  const db = await getDatabase();
  const statement = db.prepare(sql);

  try {
    statement.bind(params);
    const rows: DbRow[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    return rows;
  } finally {
    statement.free();
  }
}

export async function saveNote(input: SaveNoteInput): Promise<SavedNote> {
  const db = await getDatabase();
  const id = input.id ?? crypto.randomUUID();
  const createdAt = nowIso();
  const updatedAt = createdAt;

  db.run(
    `INSERT INTO notes (
      id, title, source_type, audience, summary_type, tone, customer_name, ticket_id,
      product_system, priority, issue_summary, troubleshooting_steps, error_messages,
      resolution, open_questions_input, next_steps_input, raw_notes, generated_summary,
      action_items_json, open_questions_json, next_steps_json, tags_json, ai_mode,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.sourceType,
      input.audience,
      input.summaryType,
      input.tone,
      input.customerName,
      input.ticketId,
      input.productSystem,
      input.priority,
      input.issueSummary,
      input.troubleshootingSteps,
      input.errorMessages,
      input.resolution,
      input.openQuestionsInput,
      input.nextStepsInput,
      input.rawNotes,
      input.generatedSummary,
      jsonString(input.actionItems),
      jsonString(input.openQuestions),
      jsonString(input.nextSteps),
      jsonString(input.tags),
      input.aiMode,
      createdAt,
      updatedAt
    ]
  );

  await persistDatabase();
  return { ...input, id, createdAt, updatedAt };
}

export async function updateNote(id: string, input: SaveNoteInput): Promise<SavedNote | null> {
  const existing = await getNoteById(id);
  if (!existing) {
    return null;
  }

  const db = await getDatabase();
  const updatedAt = nowIso();

  db.run(
    `UPDATE notes SET
      title = ?, source_type = ?, audience = ?, summary_type = ?, tone = ?,
      customer_name = ?, ticket_id = ?, product_system = ?, priority = ?,
      issue_summary = ?, troubleshooting_steps = ?, error_messages = ?, resolution = ?,
      open_questions_input = ?, next_steps_input = ?, raw_notes = ?, generated_summary = ?,
      action_items_json = ?, open_questions_json = ?, next_steps_json = ?, tags_json = ?,
      ai_mode = ?, updated_at = ?
    WHERE id = ?`,
    [
      input.title,
      input.sourceType,
      input.audience,
      input.summaryType,
      input.tone,
      input.customerName,
      input.ticketId,
      input.productSystem,
      input.priority,
      input.issueSummary,
      input.troubleshootingSteps,
      input.errorMessages,
      input.resolution,
      input.openQuestionsInput,
      input.nextStepsInput,
      input.rawNotes,
      input.generatedSummary,
      jsonString(input.actionItems),
      jsonString(input.openQuestions),
      jsonString(input.nextSteps),
      jsonString(input.tags),
      input.aiMode,
      updatedAt,
      id
    ]
  );

  await persistDatabase();
  return { ...input, id, createdAt: existing.createdAt, updatedAt };
}

export async function listNotes(filters: NoteFilters = {}): Promise<SavedNote[]> {
  const where: string[] = [];
  const params: string[] = [];

  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;
    where.push(`(
      title LIKE ? OR raw_notes LIKE ? OR generated_summary LIKE ? OR
      customer_name LIKE ? OR ticket_id LIKE ? OR product_system LIKE ?
    )`);
    params.push(search, search, search, search, search, search);
  }

  if (filters.sourceType && filters.sourceType !== "All") {
    where.push("source_type = ?");
    params.push(filters.sourceType);
  }

  if (filters.audience && filters.audience !== "All") {
    where.push("audience = ?");
    params.push(filters.audience);
  }

  if (filters.summaryType && filters.summaryType !== "All") {
    where.push("summary_type = ?");
    params.push(filters.summaryType);
  }

  if (filters.date) {
    where.push("substr(created_at, 1, 10) = ?");
    params.push(filters.date);
  }

  const rows = await selectRows(
    `SELECT * FROM notes
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY datetime(created_at) DESC`,
    params
  );

  return rows.map(rowToNote);
}

export async function getNoteById(id: string): Promise<SavedNote | null> {
  const rows = await selectRows("SELECT * FROM notes WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? rowToNote(rows[0]) : null;
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDatabase();
  db.run("DELETE FROM notes WHERE id = ?", [id]);
  await persistDatabase();
}
