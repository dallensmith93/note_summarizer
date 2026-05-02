import { MockNoteProvider } from "./mockNoteProvider";
import { normalizeSummaryOutput, type NoteProvider, type NoteSummaryRequest } from "./noteProvider";
import type { NoteFormInput, NoteSummaryOutput, AiMode } from "../types/note";

class NetlifyNoteProvider implements NoteProvider {
  async summarize(request: NoteSummaryRequest): Promise<NoteSummaryOutput> {
    const response = await fetch("/.netlify/functions/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Real AI summarization failed.");
    }

    return normalizeSummaryOutput(await response.json());
  }
}

export function getConfiguredAiMode(): AiMode {
  return import.meta.env.VITE_AI_MODE === "real" ? "real" : "mock";
}

export async function summarizeNote(input: NoteFormInput): Promise<NoteSummaryOutput> {
  const request: NoteSummaryRequest = {
    ...input,
    requestedAt: new Date().toISOString()
  };
  const provider = getConfiguredAiMode() === "real" ? new NetlifyNoteProvider() : new MockNoteProvider();
  return provider.summarize(request);
}
