import { useEffect, useState } from "react";
import { ExternalLink, Search, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { AUDIENCES, SOURCE_TYPES, SUMMARY_TYPES, type NoteFilters, type SavedNote } from "../types/note";
import { deleteNote, listNotes } from "../data/noteRepository";
import { formatDateTime } from "../utils/format";

const allFilters = {
  sourceType: "All",
  audience: "All",
  summaryType: "All"
} as const;

export function SavedNotes() {
  const [filters, setFilters] = useState<NoteFilters>(allFilters);
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      setNotes(await listNotes(nextFilters));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load saved notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateFilter<K extends keyof NoteFilters>(key: K, value: NoteFilters[K]) {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    refresh(nextFilters);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this saved note?")) {
      return;
    }

    await deleteNote(id);
    refresh();
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Saved notes</p>
          <h1>Search your local support-note library.</h1>
          <p>Saved notes are stored in browser SQLite and persisted through IndexedDB on this device.</p>
        </div>
      </header>

      <Card title="Filters" eyebrow="Find notes">
        <div className="filters-grid">
          <Field label="Search">
            <div className="search-input">
              <Search size={16} />
              <input value={filters.search ?? ""} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Title, ticket, customer, product, or summary" />
            </div>
          </Field>
          <Field label="Source type">
            <select value={filters.sourceType ?? "All"} onChange={(event) => updateFilter("sourceType", event.target.value as NoteFilters["sourceType"])}>
              <option>All</option>
              {SOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Audience">
            <select value={filters.audience ?? "All"} onChange={(event) => updateFilter("audience", event.target.value as NoteFilters["audience"])}>
              <option>All</option>
              {AUDIENCES.map((audience) => <option key={audience}>{audience}</option>)}
            </select>
          </Field>
          <Field label="Summary type">
            <select value={filters.summaryType ?? "All"} onChange={(event) => updateFilter("summaryType", event.target.value as NoteFilters["summaryType"])}>
              <option>All</option>
              {SUMMARY_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Created date">
            <input type="date" value={filters.date ?? ""} onChange={(event) => updateFilter("date", event.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Notes" eyebrow={loading ? "Loading" : `${notes.length} result${notes.length === 1 ? "" : "s"}`}>
        {error ? <p className="error-line">{error}</p> : null}
        {loading ? <p className="helper-line">Loading saved notes...</p> : null}
        {!loading && !notes.length ? (
          <div className="empty-state">
            <p>No notes matched the current filters.</p>
            <a className="text-link" href="#/new">Create a new summary</a>
          </div>
        ) : null}
        <div className="note-list">
          {notes.map((note) => (
            <article className="note-list-item full" key={note.id}>
              <a href={`#/notes/${note.id}`}>
                <strong>{note.title}</strong>
                <span>{note.summaryType} | {note.sourceType} | {formatDateTime(note.createdAt)}</span>
                <p>{note.generatedSummary.slice(0, 180)}{note.generatedSummary.length > 180 ? "..." : ""}</p>
              </a>
              <div className="row-actions">
                <Button icon={<ExternalLink size={16} />} onClick={() => { window.location.hash = `/notes/${note.id}`; }}>Open</Button>
                <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => handleDelete(note.id)}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
