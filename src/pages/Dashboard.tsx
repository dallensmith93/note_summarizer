import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Database, FilePlus2, Files, Sparkles } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { SUPPORT_TEMPLATES } from "../data/templates";
import { listNotes } from "../data/noteRepository";
import type { SavedNote } from "../types/note";
import { getConfiguredAiMode } from "../ai/summarizeNote";
import { formatDateTime } from "../utils/format";
import { navigate } from "../App";

function isThisWeek(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return date >= start;
}

export function Dashboard() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listNotes()
      .then(setNotes)
      .finally(() => setLoading(false));
  }, []);

  const recentNotes = useMemo(() => notes.slice(0, 5), [notes]);
  const weeklyCount = useMemo(() => notes.filter((note) => isThisWeek(note.createdAt)).length, [notes]);
  const aiMode = getConfiguredAiMode();

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tier 2 support documentation</p>
          <h1>Build cleaner support notes with noteS.</h1>
          <p>
            Turn messy troubleshooting notes, ticket updates, customer calls, and handoffs into structured,
            searchable summaries you can copy or print as a PDF.
          </p>
        </div>
        <Button variant="primary" icon={<FilePlus2 size={18} />} onClick={() => navigate("/new")}>
          New Summary
        </Button>
      </header>

      {aiMode === "mock" ? (
        <div className="mode-banner">
          <Sparkles size={18} />
          <span>Mock mode is active. noteS works without an API key and uses local structured summarization.</span>
        </div>
      ) : null}

      <div className="stats-grid">
        <StatCard label="Total notes saved" value={loading ? "..." : notes.length} icon={<Files size={20} />} />
        <StatCard label="Summarized this week" value={loading ? "..." : weeklyCount} icon={<CalendarClock size={20} />} />
        <StatCard label="Local SQLite" value="IndexedDB" icon={<Database size={20} />} />
      </div>

      <div className="dashboard-grid">
        <Card
          title="Recent Notes"
          eyebrow="Saved work"
          actions={<a className="text-link" href="#/saved">View all <ArrowRight size={14} /></a>}
        >
          {recentNotes.length ? (
            <div className="note-list compact">
              {recentNotes.map((note) => (
                <a className="note-list-item" href={`#/notes/${note.id}`} key={note.id}>
                  <div>
                    <strong>{note.title}</strong>
                    <span>{note.summaryType} for {note.audience}</span>
                  </div>
                  <time>{formatDateTime(note.createdAt)}</time>
                </a>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No saved notes yet.</p>
              <Button icon={<FilePlus2 size={16} />} onClick={() => navigate("/new")}>Create your first summary</Button>
            </div>
          )}
        </Card>

        <Card title="Common Tier 2 Templates" eyebrow="Fast starts">
          <div className="template-chip-grid">
            {SUPPORT_TEMPLATES.slice(0, 6).map((template) => (
              <a className="template-chip" href="#/templates" key={template.id}>
                {template.name}
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
