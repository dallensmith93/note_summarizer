export const SOURCE_TYPES = [
  "Support ticket",
  "Customer call",
  "Internal meeting",
  "Troubleshooting session",
  "Escalation",
  "Bug report",
  "Knowledge base draft",
  "Other"
] as const;

export const AUDIENCES = [
  "Internal support team",
  "Customer",
  "Engineering",
  "Manager",
  "Tier 2 handoff",
  "Knowledge base"
] as const;

export const SUMMARY_TYPES = [
  "Clean support summary",
  "Escalation handoff",
  "Customer-facing update",
  "Root cause analysis",
  "Troubleshooting timeline",
  "Action items",
  "Knowledge base draft",
  "Manager update",
  "Full structured summary"
] as const;

export const TONES = [
  "Professional",
  "Concise",
  "Detailed",
  "Customer-friendly",
  "Technical",
  "Executive summary"
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];
export type Audience = (typeof AUDIENCES)[number];
export type SummaryType = (typeof SUMMARY_TYPES)[number];
export type Tone = (typeof TONES)[number];
export type AiMode = "mock" | "real";

export interface NoteFormInput {
  title: string;
  sourceType: SourceType;
  audience: Audience;
  summaryType: SummaryType;
  tone: Tone;
  customerName: string;
  ticketId: string;
  productSystem: string;
  priority: string;
  issueSummary: string;
  troubleshootingSteps: string;
  errorMessages: string;
  resolution: string;
  openQuestionsInput: string;
  nextStepsInput: string;
  rawNotes: string;
}

export interface NoteSummaryOutput {
  title: string;
  summary: string;
  actionItems: string[];
  openQuestions: string[];
  nextSteps: string[];
  tags: string[];
  sensitiveInfoDetected: boolean;
  sensitiveInfoWarning: string;
}

export interface SavedNote extends NoteFormInput {
  id: string;
  generatedSummary: string;
  actionItems: string[];
  openQuestions: string[];
  nextSteps: string[];
  tags: string[];
  aiMode: AiMode;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFilters {
  search?: string;
  sourceType?: SourceType | "All";
  audience?: Audience | "All";
  summaryType?: SummaryType | "All";
  date?: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  fields: string[];
  outputStructure: string;
}
