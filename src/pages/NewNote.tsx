import { useEffect, useMemo, useState } from "react";
import { Copy, FileText, Printer, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { NotePreview } from "../components/NotePreview";
import { summarizeNote, getConfiguredAiMode } from "../ai/summarizeNote";
import { getNoteById, saveNote, updateNote } from "../data/noteRepository";
import {
  AUDIENCES,
  SOURCE_TYPES,
  SUMMARY_TYPES,
  TONES,
  type NoteFormInput,
  type NoteSummaryOutput,
  type SavedNote
} from "../types/note";
import { buildSummaryText } from "../utils/format";
import { navigate } from "../App";

const defaultForm: NoteFormInput = {
  title: "",
  sourceType: "Support ticket",
  audience: "Internal support team",
  summaryType: "Clean support summary",
  tone: "Professional",
  customerName: "",
  ticketId: "",
  productSystem: "",
  priority: "",
  issueSummary: "",
  troubleshootingSteps: "",
  errorMessages: "",
  resolution: "",
  openQuestionsInput: "",
  nextStepsInput: "",
  rawNotes: ""
};

function noteToForm(note: SavedNote): NoteFormInput {
  return {
    title: note.title,
    sourceType: note.sourceType,
    audience: note.audience,
    summaryType: note.summaryType,
    tone: note.tone,
    customerName: note.customerName,
    ticketId: note.ticketId,
    productSystem: note.productSystem,
    priority: note.priority,
    issueSummary: note.issueSummary,
    troubleshootingSteps: note.troubleshootingSteps,
    errorMessages: note.errorMessages,
    resolution: note.resolution,
    openQuestionsInput: note.openQuestionsInput,
    nextStepsInput: note.nextStepsInput,
    rawNotes: note.rawNotes
  };
}

function noteToOutput(note: SavedNote): NoteSummaryOutput {
  return {
    title: note.title,
    summary: note.generatedSummary,
    actionItems: note.actionItems,
    openQuestions: note.openQuestions,
    nextSteps: note.nextSteps,
    tags: note.tags,
    sensitiveInfoDetected: false,
    sensitiveInfoWarning: ""
  };
}

export function NewNote({ editId }: { editId?: string }) {
  const [form, setForm] = useState<NoteFormInput>(defaultForm);
  const [summary, setSummary] = useState<NoteSummaryOutput | null>(null);
  const [savedId, setSavedId] = useState<string | null>(editId ?? null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editId) {
      return;
    }

    getNoteById(editId).then((note) => {
      if (!note) {
        setError("Saved note was not found.");
        return;
      }
      setForm(noteToForm(note));
      setSummary(noteToOutput(note));
      setSavedId(note.id);
    });
  }, [editId]);

  const canGenerate = useMemo(() => form.title.trim() && form.rawNotes.trim(), [form]);

  function updateField<K extends keyof NoteFormInput>(key: K, value: NoteFormInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("");
    setError("");
  }

  async function handleGenerate() {
    if (!canGenerate) {
      setError("Add a title and raw notes before generating a summary.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const output = await summarizeNote(form);
      setSummary(output);
      setStatus(`noteS generated a ${getConfiguredAiMode()} summary.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "noteS could not generate the summary.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!summary) {
      setError("Generate a summary before saving the note.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        title: form.title || summary.title,
        generatedSummary: summary.summary,
        actionItems: summary.actionItems,
        openQuestions: summary.openQuestions,
        nextSteps: summary.nextSteps,
        tags: summary.tags,
        aiMode: getConfiguredAiMode()
      };
      const saved = savedId ? await updateNote(savedId, payload) : await saveNote(payload);

      if (!saved) {
        setError("Could not update this note because it no longer exists.");
        return;
      }

      setSavedId(saved.id);
      setStatus("Note saved locally in browser SQLite.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!summary) {
      return;
    }

    await navigator.clipboard.writeText(buildSummaryText(summary));
    setStatus("Summary copied to clipboard.");
  }

  function clearForm() {
    setForm(defaultForm);
    setSummary(null);
    setSavedId(null);
    setError("");
    setStatus("");
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{editId ? "Edit saved note" : "New note summary"}</p>
          <h1>{editId ? "Update support documentation." : "Turn messy notes into a clean support summary."}</h1>
          <p>Use noteS to structure raw Tier 2 notes into summaries, action items, open questions, and next steps.</p>
        </div>
      </header>

      <div className="workbench-grid">
        <Card title="Source Notes" eyebrow="Input">
          <div className="form-grid">
            <Field label="Note title">
              <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="VPN tunnel intermittent failure" />
            </Field>
            <Field label="Source type">
              <select value={form.sourceType} onChange={(event) => updateField("sourceType", event.target.value as NoteFormInput["sourceType"])}>
                {SOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Audience">
              <select value={form.audience} onChange={(event) => updateField("audience", event.target.value as NoteFormInput["audience"])}>
                {AUDIENCES.map((audience) => <option key={audience}>{audience}</option>)}
              </select>
            </Field>
            <Field label="Summary type">
              <select value={form.summaryType} onChange={(event) => updateField("summaryType", event.target.value as NoteFormInput["summaryType"])}>
                {SUMMARY_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Tone">
              <select value={form.tone} onChange={(event) => updateField("tone", event.target.value as NoteFormInput["tone"])}>
                {TONES.map((tone) => <option key={tone}>{tone}</option>)}
              </select>
            </Field>
            <Field label="Customer / account name">
              <input value={form.customerName} onChange={(event) => updateField("customerName", event.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Ticket ID">
              <input value={form.ticketId} onChange={(event) => updateField("ticketId", event.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Product / system">
              <input value={form.productSystem} onChange={(event) => updateField("productSystem", event.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Priority">
              <input value={form.priority} onChange={(event) => updateField("priority", event.target.value)} placeholder="Optional" />
            </Field>
          </div>

          <Field label="Raw notes">
            <textarea className="large-textarea" value={form.rawNotes} onChange={(event) => updateField("rawNotes", event.target.value)} placeholder="Paste call notes, ticket updates, logs, customer context, troubleshooting steps, blockers, and follow-ups here." />
          </Field>

          <div className="form-grid">
            <Field label="Issue summary">
              <textarea value={form.issueSummary} onChange={(event) => updateField("issueSummary", event.target.value)} />
            </Field>
            <Field label="Troubleshooting steps">
              <textarea value={form.troubleshootingSteps} onChange={(event) => updateField("troubleshootingSteps", event.target.value)} />
            </Field>
            <Field label="Error messages">
              <textarea value={form.errorMessages} onChange={(event) => updateField("errorMessages", event.target.value)} />
            </Field>
            <Field label="Resolution">
              <textarea value={form.resolution} onChange={(event) => updateField("resolution", event.target.value)} />
            </Field>
            <Field label="Open questions">
              <textarea value={form.openQuestionsInput} onChange={(event) => updateField("openQuestionsInput", event.target.value)} />
            </Field>
            <Field label="Next steps">
              <textarea value={form.nextStepsInput} onChange={(event) => updateField("nextStepsInput", event.target.value)} />
            </Field>
          </div>

          <div className="action-row">
            <Button variant="primary" icon={<Sparkles size={16} />} disabled={loading} onClick={handleGenerate}>
              {loading ? "Generating..." : "Generate Summary"}
            </Button>
            <Button icon={<Save size={16} />} disabled={saving || !summary} onClick={handleSave}>
              {saving ? "Saving..." : "Save Note"}
            </Button>
            <Button icon={<Copy size={16} />} disabled={!summary} onClick={handleCopy}>Copy Summary</Button>
            <Button icon={<RefreshCw size={16} />} disabled={loading || !summary} onClick={handleGenerate}>Regenerate</Button>
            <Button icon={<Printer size={16} />} disabled={!savedId} onClick={() => savedId && navigate(`/print/${savedId}`)}>Open Print/PDF View</Button>
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={clearForm}>Clear Form</Button>
          </div>

          {status ? <p className="status-line">{status}</p> : null}
          {error ? <p className="error-line">{error}</p> : null}
          {!savedId && summary ? <p className="helper-line">Save the note before opening the print/PDF view.</p> : null}
        </Card>

        <Card title="noteS Output" eyebrow="Structured summary">
          {summary ? (
            <NotePreview output={summary} onCopy={handleCopy} />
          ) : (
            <div className="empty-state tall">
              <FileText size={32} />
              <p>Generated summaries appear here with action items, open questions, next steps, tags, and sensitive-info warnings.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
