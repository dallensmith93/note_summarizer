import type { NoteFormInput, NoteSummaryOutput } from "../types/note";

export interface NoteSummaryRequest extends NoteFormInput {
  requestedAt: string;
}

export interface NoteProvider {
  summarize(request: NoteSummaryRequest): Promise<NoteSummaryOutput>;
}

export function normalizeSummaryOutput(output: Partial<NoteSummaryOutput>): NoteSummaryOutput {
  return {
    title: typeof output.title === "string" && output.title.trim() ? output.title.trim() : "Untitled support note",
    summary: typeof output.summary === "string" ? output.summary.trim() : "",
    actionItems: Array.isArray(output.actionItems) ? output.actionItems.filter((item) => typeof item === "string") : [],
    openQuestions: Array.isArray(output.openQuestions) ? output.openQuestions.filter((item) => typeof item === "string") : [],
    nextSteps: Array.isArray(output.nextSteps) ? output.nextSteps.filter((item) => typeof item === "string") : [],
    tags: Array.isArray(output.tags) ? output.tags.filter((item) => typeof item === "string") : [],
    sensitiveInfoDetected: Boolean(output.sensitiveInfoDetected),
    sensitiveInfoWarning: typeof output.sensitiveInfoWarning === "string" ? output.sensitiveInfoWarning : ""
  };
}
