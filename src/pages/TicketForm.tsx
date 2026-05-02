import { useEffect, useState } from "react";
import { ClipboardList, Save, X } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { getTicketById, saveTicket, updateTicket } from "../data/ticketRepository";
import { type Ticket, type TicketFormInput } from "../types/ticket";
import { navigate } from "../App";

interface ProfessionalNoteFields {
  customerIssue: string;
  customerImpact: string;
  productSetupDetails: string;
  detailsProvided: string;
  troubleshootingCompleted: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  currentStatus: string;
  nextStep: string;
  tier2HandoffSummary: string;
  professionalNote: string;
}

const NOTE_SECTIONS: Array<{
  key: keyof ProfessionalNoteFields;
  title: string;
  placeholder: string;
}> = [
  { key: "customerIssue", title: "Customer Issue", placeholder: "Brief summary of the issue" },
  { key: "customerImpact", title: "Customer Impact", placeholder: "How the issue affects the customer, if known" },
  {
    key: "productSetupDetails",
    title: "Product / Setup Details",
    placeholder: "Machine model, pump type, software/firmware version, error message, batch type, food type, environment, accessories, if known"
  },
  { key: "detailsProvided", title: "Details Provided", placeholder: "Relevant customer statements" },
  { key: "troubleshootingCompleted", title: "Troubleshooting Completed", placeholder: "Steps already attempted" },
  { key: "stepsToReproduce", title: "Steps to Reproduce", placeholder: "1. Step 1 based only on provided information\n2. Step 2\n3. Step 3" },
  { key: "expectedResult", title: "Expected Result", placeholder: "What should normally happen" },
  { key: "actualResult", title: "Actual Result", placeholder: "What the customer reports is happening" },
  { key: "currentStatus", title: "Current Status", placeholder: "Resolved, unresolved, partially resolved, awaiting customer response, escalated, etc." },
  { key: "nextStep", title: "Next Step", placeholder: "Recommended next action" },
  { key: "tier2HandoffSummary", title: "Tier 2 Handoff Summary", placeholder: "Short technical summary for a senior support rep or technician" },
  { key: "professionalNote", title: "Professional Note", placeholder: "One polished paragraph Dallen can copy and paste into the support system" }
];

const defaultNoteFields: ProfessionalNoteFields = {
  customerIssue: "",
  customerImpact: "",
  productSetupDetails: "",
  detailsProvided: "",
  troubleshootingCompleted: "",
  stepsToReproduce: "",
  expectedResult: "",
  actualResult: "",
  currentStatus: "Unresolved",
  nextStep: "",
  tier2HandoffSummary: "",
  professionalNote: ""
};

const defaultTicket: TicketFormInput = {
  subject: "",
  accountName: "",
  contactName: "",
  contactEmail: "",
  status: "New",
  priority: "P3 Medium",
  type: "Incident",
  channel: "Portal",
  queue: "Tier 2",
  owner: "Dallen Smith",
  product: "",
  environment: "Production",
  severity: "",
  slaDueAt: "",
  description: "",
  latestWorkNote: "",
  resolution: "",
  tagsInput: ""
};

function toLocalDateTime(value: string): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function emptyValue(value: string): string {
  return value.trim() || "[Not provided]";
}

function buildProfessionalNote(fields: ProfessionalNoteFields): string {
  return NOTE_SECTIONS.map((section) => `${section.title}:\n${emptyValue(fields[section.key])}`).join("\n\n");
}

function shortText(value: string, fallback: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, 120) : fallback;
}

function inferStatus(value: string): TicketFormInput["status"] {
  const lower = value.toLowerCase();
  if (lower.includes("resolved")) {
    return "Resolved";
  }
  if (lower.includes("awaiting") || lower.includes("waiting")) {
    return "Pending";
  }
  if (lower.includes("escalated")) {
    return "Escalated";
  }
  return "Open";
}

function readSection(text: string, title: string): string {
  const startToken = `${title}:`;
  const start = text.indexOf(startToken);
  if (start === -1) {
    return "";
  }

  const contentStart = start + startToken.length;
  const laterSectionIndexes = NOTE_SECTIONS.map((section) => text.indexOf(`${section.title}:`, contentStart))
    .filter((index) => index > -1);
  const end = laterSectionIndexes.length ? Math.min(...laterSectionIndexes) : text.length;
  const value = text.slice(contentStart, end).trim();
  return value === "[Not provided]" ? "" : value;
}

function parseProfessionalNote(description: string): ProfessionalNoteFields {
  const parsed = { ...defaultNoteFields };
  let foundStructuredSection = false;

  for (const section of NOTE_SECTIONS) {
    const value = readSection(description, section.title);
    if (value) {
      foundStructuredSection = true;
      parsed[section.key] = value;
    }
  }

  if (!foundStructuredSection && description.trim()) {
    parsed.customerIssue = description.trim();
  }

  return parsed;
}

function ticketToForm(ticket: Ticket): TicketFormInput {
  return {
    subject: ticket.subject,
    accountName: ticket.accountName,
    contactName: ticket.contactName,
    contactEmail: ticket.contactEmail,
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    channel: ticket.channel,
    queue: ticket.queue,
    owner: ticket.owner,
    product: ticket.product,
    environment: ticket.environment,
    severity: ticket.severity,
    slaDueAt: toLocalDateTime(ticket.slaDueAt),
    description: ticket.description,
    latestWorkNote: ticket.latestWorkNote,
    resolution: ticket.resolution,
    tagsInput: ticket.tags.join(", ")
  };
}

export function TicketForm({ editId }: { editId?: string }) {
  const [form, setForm] = useState<TicketFormInput>(defaultTicket);
  const [noteFields, setNoteFields] = useState<ProfessionalNoteFields>(defaultNoteFields);
  const [ticketNumber, setTicketNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editId) {
      return;
    }
    getTicketById(editId).then((ticket) => {
      if (!ticket) {
        setError("Ticket was not found.");
        return;
      }
      setTicketNumber(ticket.ticketNumber);
      setForm(ticketToForm(ticket));
      setNoteFields(parseProfessionalNote(ticket.description));
    });
  }, [editId]);

  function updateNoteField<K extends keyof ProfessionalNoteFields>(key: K, value: ProfessionalNoteFields[K]) {
    setNoteFields((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function handleSave() {
    if (!noteFields.customerIssue.trim()) {
      setError("Customer Issue is required.");
      return;
    }

    const payload: TicketFormInput = {
      ...form,
      subject: form.subject.trim() || shortText(noteFields.customerIssue, "Customer support issue"),
      accountName: form.accountName.trim() || "Customer not provided",
      status: inferStatus(noteFields.currentStatus),
      product: form.product.trim() || shortText(noteFields.productSetupDetails, ""),
      severity: form.severity.trim() || shortText(noteFields.customerImpact, ""),
      latestWorkNote: form.latestWorkNote.trim() || [noteFields.troubleshootingCompleted, noteFields.nextStep].filter(Boolean).join("\n"),
      resolution: form.resolution.trim() || (noteFields.currentStatus.toLowerCase().includes("resolved") ? noteFields.currentStatus : ""),
      tagsInput: form.tagsInput.trim() || "case-information",
      description: buildProfessionalNote(noteFields)
    };

    setSaving(true);
    try {
      const saved = editId ? await updateTicket(editId, payload) : await saveTicket(payload);
      if (!saved) {
        setError("Could not update this ticket.");
        return;
      }
      navigate(`/tickets/${saved.id}`);
    } finally {
      setSaving(false);
    }
  }

  function resetProfessionalNoteFields() {
    setNoteFields(defaultNoteFields);
  }

  return (
    <div className="page-stack console-page">
      <header className="console-header">
        <div>
          <p className="eyebrow">{editId ? ticketNumber : "New case"}</p>
          <h1>{editId ? "Edit ticket" : "Create ticket"}</h1>
          <p>Practice capturing the exact support-note sections used in your ticketing workflow.</p>
        </div>
        <div className="action-row">
          <Button icon={<X size={16} />} onClick={() => navigate(editId ? `/tickets/${editId}` : "/tickets")}>Cancel</Button>
          <Button variant="primary" icon={<Save size={16} />} disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Ticket"}
          </Button>
        </div>
      </header>

      {error ? <p className="error-line">{error}</p> : null}

      <div className="case-information-layout">
        <Card
          title="Case Information"
          eyebrow="Customer issue format"
          actions={<Button icon={<ClipboardList size={16} />} onClick={resetProfessionalNoteFields}>Clear Fields</Button>}
        >
          <div className="professional-note-field-grid">
            {NOTE_SECTIONS.map((section) => (
              <Field key={section.key} label={section.title}>
                <textarea
                  className={section.key === "professionalNote" ? "polished-note-textarea" : ""}
                  value={noteFields[section.key]}
                  onChange={(event) => updateNoteField(section.key, event.target.value)}
                  placeholder={section.placeholder}
                />
              </Field>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
