import type { NoteProvider, NoteSummaryRequest } from "./noteProvider";
import { normalizeSummaryOutput } from "./noteProvider";
import { redactSensitiveInfo } from "./sensitiveInfo";
import type { NoteSummaryOutput } from "../types/note";

const ACTION_WORDS = ["todo", "action", "follow up", "next", "need to", "investigate", "escalate", "waiting on"];
const QUESTION_WORDS = ["unknown", "unclear", "need confirmation", "waiting for response", "not sure", "confirm"];

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function firstUsefulLines(lines: string[], limit: number): string[] {
  return lines.filter((line) => line.length > 12).slice(0, limit);
}

function extractActionItems(lines: string[]): string[] {
  return unique(
    lines.filter((line) => {
      const lower = line.toLowerCase();
      return ACTION_WORDS.some((word) => lower.includes(word));
    })
  ).slice(0, 8);
}

function extractOpenQuestions(lines: string[]): string[] {
  return unique(
    lines.filter((line) => {
      const lower = line.toLowerCase();
      return line.includes("?") || QUESTION_WORDS.some((word) => lower.includes(word));
    })
  ).slice(0, 8);
}

function extractNextSteps(lines: string[], input: NoteSummaryRequest): string[] {
  const explicit = splitLines(input.nextStepsInput);
  const lineMatches = lines.filter((line) => {
    const lower = line.toLowerCase();
    return lower.includes("next") || lower.includes("follow up") || lower.includes("need to") || lower.includes("waiting on");
  });

  const fallback = input.resolution.trim()
    ? ["Verify the resolution remains stable and update the ticket with the final customer-facing status."]
    : ["Confirm remaining unknowns, continue troubleshooting, and update the ticket with the latest findings."];

  return unique([...explicit, ...lineMatches, ...fallback]).slice(0, 8);
}

function buildTags(input: NoteSummaryRequest): string[] {
  return unique(
    [
      input.sourceType,
      input.summaryType,
      input.audience,
      input.productSystem,
      input.priority ? `Priority: ${input.priority}` : "",
      input.ticketId ? `Ticket: ${input.ticketId}` : ""
    ].filter(Boolean)
  ).slice(0, 10);
}

function buildSummary(input: NoteSummaryRequest, sanitizedText: string): string {
  const lines = firstUsefulLines(splitLines(sanitizedText), 5);
  const parts = [
    input.issueSummary ? `Issue: ${input.issueSummary.trim()}` : "",
    input.customerName ? `Customer/account: ${input.customerName.trim()}` : "",
    input.ticketId ? `Ticket: ${input.ticketId.trim()}` : "",
    input.productSystem ? `Product/system: ${input.productSystem.trim()}` : "",
    input.priority ? `Priority: ${input.priority.trim()}` : "",
    input.troubleshootingSteps ? `Troubleshooting completed: ${input.troubleshootingSteps.trim()}` : "",
    input.errorMessages ? `Errors observed: ${input.errorMessages.trim()}` : "",
    input.resolution
      ? `Resolution/status: ${input.resolution.trim()}`
      : "Resolution/status: No confirmed resolution was provided in the source notes.",
    lines.length ? `Key notes: ${lines.join(" ")}` : ""
  ];

  return parts.filter(Boolean).join("\n\n");
}

export class MockNoteProvider implements NoteProvider {
  async summarize(request: NoteSummaryRequest): Promise<NoteSummaryOutput> {
    const combinedText = [
      request.rawNotes,
      request.issueSummary,
      request.troubleshootingSteps,
      request.errorMessages,
      request.resolution,
      request.openQuestionsInput,
      request.nextStepsInput
    ].join("\n");
    const sensitive = redactSensitiveInfo(combinedText);
    const sanitizedRaw = redactSensitiveInfo(request.rawNotes).sanitizedText;
    const allLines = splitLines(sensitive.sanitizedText);
    const actionItems = extractActionItems(allLines);
    const openQuestions = unique([...splitLines(request.openQuestionsInput), ...extractOpenQuestions(allLines)]).slice(0, 8);
    const nextSteps = extractNextSteps(allLines, request);

    return normalizeSummaryOutput({
      title: request.title.trim() || `${request.summaryType} - ${request.sourceType}`,
      summary: buildSummary({ ...request, rawNotes: sanitizedRaw }, sensitive.sanitizedText),
      actionItems: actionItems.length ? actionItems : ["Review the summarized findings and update the ticket with any missing owner or due date."],
      openQuestions: openQuestions.length ? openQuestions : ["No explicit open questions were found in the notes."],
      nextSteps,
      tags: buildTags(request),
      sensitiveInfoDetected: sensitive.detected,
      sensitiveInfoWarning: sensitive.warning
    });
  }
}
