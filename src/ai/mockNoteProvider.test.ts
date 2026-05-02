import { describe, expect, it } from "vitest";
import { MockNoteProvider } from "./mockNoteProvider";
import type { NoteSummaryRequest } from "./noteProvider";

const baseRequest: NoteSummaryRequest = {
  requestedAt: "2026-05-01T00:00:00.000Z",
  title: "VPN intermittent failure",
  sourceType: "Troubleshooting session",
  audience: "Tier 2 handoff",
  summaryType: "Escalation handoff",
  tone: "Technical",
  customerName: "Acme Health",
  ticketId: "TKT-1842",
  productSystem: "Remote Access Gateway",
  priority: "High",
  issueSummary: "Users intermittently lose VPN connectivity during profile sync.",
  troubleshootingSteps: "Checked gateway logs and reproduced disconnect after sync job.",
  errorMessages: "timeout waiting for profile sync ack",
  resolution: "",
  openQuestionsInput: "",
  nextStepsInput: "",
  rawNotes: [
    "Customer says disconnect happens after login?",
    "TODO escalate gateway logs to engineering",
    "Need to investigate profile sync worker retry behavior",
    "waiting on customer for affected usernames",
    "api_key=abc123456789"
  ].join("\n")
};

describe("MockNoteProvider", () => {
  it("creates structured support-note output without an API key", async () => {
    const output = await new MockNoteProvider().summarize(baseRequest);

    expect(output.title).toBe("VPN intermittent failure");
    expect(output.summary).toContain("Users intermittently lose VPN connectivity");
    expect(output.actionItems.join(" ")).toContain("escalate");
    expect(output.openQuestions.join(" ")).toContain("disconnect");
    expect(output.nextSteps.join(" ")).toContain("waiting on customer");
    expect(output.tags).toContain("Escalation handoff");
  });

  it("redacts sensitive values and flags the warning", async () => {
    const output = await new MockNoteProvider().summarize(baseRequest);

    expect(output.sensitiveInfoDetected).toBe(true);
    expect(output.sensitiveInfoWarning).toContain("api key");
    expect(output.summary).not.toContain("abc123456789");
  });
});
