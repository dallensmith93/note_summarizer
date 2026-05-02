import type { NoteSummaryOutput, SavedNote } from "../types/note";

export function formatDateTime(value: string): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatRelativeDue(value: string): string {
  if (!value) {
    return "No SLA";
  }

  const diff = new Date(value).getTime() - Date.now();
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return diff < 0 ? `${label} overdue` : `${label} left`;
}

export function buildSummaryText(note: SavedNote | NoteSummaryOutput): string {
  const title = "generatedSummary" in note ? note.title : note.title;
  const summary = "generatedSummary" in note ? note.generatedSummary : note.summary;

  return [
    title,
    "",
    "Summary",
    summary,
    "",
    "Action Items",
    ...note.actionItems.map((item) => `- ${item}`),
    "",
    "Open Questions",
    ...note.openQuestions.map((item) => `- ${item}`),
    "",
    "Next Steps",
    ...note.nextSteps.map((item) => `- ${item}`)
  ].join("\n");
}
