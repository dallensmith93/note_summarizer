import { useEffect, useMemo, useState } from "react";
import { Download, Edit3, MessageSquarePlus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { addTicketComment, deleteTicket, deleteTicketComment, getTicketById, getTicketComments } from "../data/ticketRepository";
import { summarizeNote } from "../ai/summarizeNote";
import type { NoteFormInput, NoteSummaryOutput } from "../types/note";
import type { Ticket, TicketComment } from "../types/ticket";
import { formatDateTime, formatRelativeDue } from "../utils/format";
import { navigate } from "../App";

function StatusBadge({ value }: { value: string }) {
  return <span className={`badge status-${value.toLowerCase()}`}>{value}</span>;
}

function PriorityBadge({ value }: { value: string }) {
  const tone = value.includes("P1") ? "critical" : value.includes("P2") ? "high" : value.includes("P3") ? "medium" : "low";
  return <span className={`badge priority-${tone}`}>{value}</span>;
}

function ticketToNoteInput(ticket: Ticket, comments: TicketComment[]): NoteFormInput {
  return {
    title: `${ticket.ticketNumber} ${ticket.subject}`,
    sourceType: ticket.status === "Escalated" ? "Escalation" : "Support ticket",
    audience: ticket.status === "Escalated" ? "Engineering" : "Tier 2 handoff",
    summaryType: ticket.status === "Escalated" ? "Escalation handoff" : "Full structured summary",
    tone: "Professional",
    customerName: ticket.accountName,
    ticketId: ticket.ticketNumber,
    productSystem: ticket.product,
    priority: ticket.priority,
    issueSummary: ticket.subject,
    troubleshootingSteps: ticket.latestWorkNote,
    errorMessages: "",
    resolution: ticket.resolution,
    openQuestionsInput: "",
    nextStepsInput: "",
    rawNotes: [
      ticket.description,
      ticket.latestWorkNote,
      ...comments.map((comment) => `${comment.visibility} note from ${comment.author}: ${comment.body}`)
    ].join("\n")
  };
}

function safeFileName(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function buildNotepadExport(ticket: Ticket, comments: TicketComment[]): string {
  const activity = comments.length
    ? comments
        .map((comment) =>
          [
            `${comment.visibility} note`,
            `Author: ${comment.author}`,
            `Created: ${formatDateTime(comment.createdAt)}`,
            comment.body
          ].join("\n")
        )
        .join("\n\n")
    : "No activity notes captured.";

  return [
    `${ticket.ticketNumber} - ${ticket.subject}`,
    "",
    "Case Information",
    ticket.description,
    "",
    "Current Work Note",
    ticket.latestWorkNote || "No internal work note captured.",
    "",
    "Resolution",
    ticket.resolution || "No confirmed resolution yet.",
    "",
    "Activity Notes",
    activity
  ].join("\r\n");
}

export function TicketDetail({ id }: { id: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [visibility, setVisibility] = useState<TicketComment["visibility"]>("Internal");
  const [summary, setSummary] = useState<NoteSummaryOutput | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const [ticketRow, commentRows] = await Promise.all([getTicketById(id), getTicketComments(id)]);
    setTicket(ticketRow);
    setComments(commentRows);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Could not load ticket."));
  }, [id]);

  const title = useMemo(() => ticket ? `${ticket.ticketNumber} - ${ticket.subject}` : "Loading ticket", [ticket]);

  async function handleAddComment() {
    if (!commentBody.trim()) {
      return;
    }
    await addTicketComment(id, commentBody, visibility);
    setCommentBody("");
    await refresh();
  }

  async function handleGenerateSummary() {
    if (!ticket) {
      return;
    }
    setLoadingSummary(true);
    try {
      setSummary(await summarizeNote(ticketToNoteInput(ticket, comments)));
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleDelete() {
    if (!ticket || !window.confirm(`Delete ${ticket.ticketNumber}?`)) {
      return;
    }
    await deleteTicket(ticket.id);
    navigate("/tickets");
  }

  function handleExportNotepad() {
    if (!ticket) {
      return;
    }

    const text = buildNotepadExport(ticket, comments);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName(ticket.ticketNumber)}-${safeFileName(ticket.subject)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteComment(comment: TicketComment) {
    if (!window.confirm("Delete this note?")) {
      return;
    }
    await deleteTicketComment(comment.id);
    await refresh();
  }

  if (error) {
    return <p className="error-line">{error}</p>;
  }

  if (!ticket) {
    return <p className="helper-line">Loading ticket...</p>;
  }

  return (
    <div className="page-stack console-page">
      <header className="record-header">
        <div>
          <p className="eyebrow">{ticket.ticketNumber}</p>
          <h1>{ticket.subject}</h1>
          <div className="record-header-meta">
            <StatusBadge value={ticket.status} />
            <PriorityBadge value={ticket.priority} />
            <span>{ticket.accountName}</span>
            <span>SLA: {formatRelativeDue(ticket.slaDueAt)}</span>
          </div>
        </div>
        <div className="action-row">
          <Button icon={<Sparkles size={16} />} disabled={loadingSummary} onClick={handleGenerateSummary}>
            {loadingSummary ? "Summarizing..." : "noteS Handoff"}
          </Button>
          <Button icon={<Download size={16} />} onClick={handleExportNotepad}>Export .txt</Button>
          <Button icon={<Edit3 size={16} />} onClick={() => navigate(`/edit-ticket/${ticket.id}`)}>Edit</Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDelete}>Delete</Button>
        </div>
      </header>

      <div className="record-layout">
        <div className="page-stack">
          <Card title={title} eyebrow="Case details">
            <dl className="metadata-grid crm-metadata">
              <div><dt>Account</dt><dd>{ticket.accountName}</dd></div>
              <div><dt>Contact</dt><dd>{ticket.contactName || "Not provided"}</dd></div>
              <div><dt>Email</dt><dd>{ticket.contactEmail || "Not provided"}</dd></div>
              <div><dt>Type</dt><dd>{ticket.type}</dd></div>
              <div><dt>Channel</dt><dd>{ticket.channel}</dd></div>
              <div><dt>Queue</dt><dd>{ticket.queue}</dd></div>
              <div><dt>Owner</dt><dd>{ticket.owner || "Unassigned"}</dd></div>
              <div><dt>Product</dt><dd>{ticket.product || "Not provided"}</dd></div>
              <div><dt>Environment</dt><dd>{ticket.environment || "Not provided"}</dd></div>
              <div><dt>Severity</dt><dd>{ticket.severity || "Not provided"}</dd></div>
              <div><dt>Created</dt><dd>{formatDateTime(ticket.createdAt)}</dd></div>
              <div><dt>Updated</dt><dd>{formatDateTime(ticket.updatedAt)}</dd></div>
            </dl>
          </Card>

          <Card title="Case Information" eyebrow="Customer issue format">
            <p className="preserve-lines">{ticket.description}</p>
          </Card>

          <Card title="Activity" eyebrow="Work notes and customer updates">
            <div className="comment-composer">
              <Field label="Add note">
                <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Add troubleshooting steps, customer update, escalation details, or next action." />
              </Field>
              <div className="action-row">
                <select className="compact-select" value={visibility} onChange={(event) => setVisibility(event.target.value as TicketComment["visibility"])}>
                  <option>Internal</option>
                  <option>Customer</option>
                </select>
                <Button icon={<MessageSquarePlus size={16} />} onClick={handleAddComment}>Add Note</Button>
              </div>
            </div>

            <div className="timeline">
              {comments.map((comment) => (
                <article className="timeline-item" key={comment.id}>
                  <div className="timeline-item-header">
                    <div>
                      <strong>{comment.author}</strong>
                      <span>{comment.visibility} | {formatDateTime(comment.createdAt)}</span>
                    </div>
                    <Button variant="ghost" icon={<Trash2 size={14} />} onClick={() => handleDeleteComment(comment)}>
                      Delete
                    </Button>
                  </div>
                  <p>{comment.body}</p>
                </article>
              ))}
            </div>
          </Card>
        </div>

        <aside className="side-panel">
          <Card title="Current Work Note" eyebrow="Latest internal context">
            <p className="preserve-lines">{ticket.latestWorkNote || "No internal note captured yet."}</p>
          </Card>

          <Card title="Resolution" eyebrow="Closure details">
            <p className="preserve-lines">{ticket.resolution || "No confirmed resolution yet."}</p>
          </Card>

          <Card title="Tags" eyebrow="Classification">
            <div className="tag-row">
              {ticket.tags.length ? ticket.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>) : <span className="helper-line">No tags</span>}
            </div>
          </Card>

          {summary ? (
            <Card title="noteS Handoff Summary" eyebrow="AI helper">
              {summary.sensitiveInfoDetected ? <p className="warning-banner">{summary.sensitiveInfoWarning}</p> : null}
              <p className="preserve-lines">{summary.summary}</p>
              <h3>Action items</h3>
              <ul className="check-list">
                {summary.actionItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <h3>Open questions</h3>
              <ul className="check-list">
                {summary.openQuestions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
