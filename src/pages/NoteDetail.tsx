import { useEffect, useState } from "react";
import { Copy, Edit3, Printer, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { deleteNote, getNoteById } from "../data/noteRepository";
import type { SavedNote } from "../types/note";
import { buildSummaryText, formatDateTime } from "../utils/format";
import { navigate } from "../App";

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="detail-block">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

export function NoteDetail({ id }: { id: string }) {
  const [note, setNote] = useState<SavedNote | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getNoteById(id)
      .then(setNote)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load note."));
  }, [id]);

  async function handleCopy() {
    if (!note) {
      return;
    }
    await navigator.clipboard.writeText(buildSummaryText(note));
    setStatus("Summary copied to clipboard.");
  }

  async function handleDelete() {
    if (!note || !window.confirm("Delete this saved note?")) {
      return;
    }
    await deleteNote(note.id);
    navigate("/saved");
  }

  if (error) {
    return <p className="error-line">{error}</p>;
  }

  if (!note) {
    return <p className="helper-line">Loading note...</p>;
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Note detail</p>
          <h1>{note.title}</h1>
          <p>Created {formatDateTime(note.createdAt)} | Updated {formatDateTime(note.updatedAt)}</p>
        </div>
        <div className="action-row">
          <Button icon={<Copy size={16} />} onClick={handleCopy}>Copy</Button>
          <Button icon={<Edit3 size={16} />} onClick={() => navigate(`/edit/${note.id}`)}>Edit</Button>
          <Button icon={<Printer size={16} />} onClick={() => navigate(`/print/${note.id}`)}>Print/PDF</Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDelete}>Delete</Button>
        </div>
      </header>

      {status ? <p className="status-line">{status}</p> : null}

      <Card title="Metadata" eyebrow="Context">
        <dl className="metadata-grid">
          <div><dt>Source type</dt><dd>{note.sourceType}</dd></div>
          <div><dt>Audience</dt><dd>{note.audience}</dd></div>
          <div><dt>Summary type</dt><dd>{note.summaryType}</dd></div>
          <div><dt>Tone</dt><dd>{note.tone}</dd></div>
          <div><dt>Customer/account</dt><dd>{note.customerName || "Not provided"}</dd></div>
          <div><dt>Ticket ID</dt><dd>{note.ticketId || "Not provided"}</dd></div>
          <div><dt>Product/system</dt><dd>{note.productSystem || "Not provided"}</dd></div>
          <div><dt>Priority</dt><dd>{note.priority || "Not provided"}</dd></div>
          <div><dt>AI mode</dt><dd>{note.aiMode}</dd></div>
        </dl>
      </Card>

      <div className="detail-grid">
        <Card title="Generated Summary" eyebrow="noteS output">
          <p className="preserve-lines">{note.generatedSummary}</p>
          <div className="tag-row">
            {note.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
          </div>
        </Card>

        <Card title="Raw Notes" eyebrow="Source material">
          <p className="preserve-lines">{note.rawNotes}</p>
        </Card>
      </div>

      <div className="detail-grid three">
        <DetailList title="Action Items" items={note.actionItems} />
        <DetailList title="Open Questions" items={note.openQuestions} />
        <DetailList title="Next Steps" items={note.nextSteps} />
      </div>
    </div>
  );
}
