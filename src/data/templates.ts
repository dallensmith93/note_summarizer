import type { TemplateDefinition } from "../types/note";

export const SUPPORT_TEMPLATES: TemplateDefinition[] = [
  {
    id: "escalation-handoff",
    name: "Escalation Handoff",
    description: "Use when Tier 2 needs to hand a ticket to engineering, a vendor, or a senior support owner.",
    fields: ["Customer impact", "Ticket ID", "Environment", "Reproduction steps", "Logs/errors", "What has been ruled out", "Requested owner action"],
    outputStructure: "Issue, impact, timeline, attempted fixes, current blocker, evidence, next owner, urgency."
  },
  {
    id: "customer-update",
    name: "Customer Update",
    description: "Use when sending a clear non-internal progress update to a customer.",
    fields: ["Customer name", "Current status", "Actions taken", "Known impact", "Next step", "ETA or follow-up window"],
    outputStructure: "Short greeting, status, what we checked, next step, what we need from the customer, follow-up timing."
  },
  {
    id: "bug-reproduction",
    name: "Bug Reproduction Notes",
    description: "Use when documenting repeatable product behavior for engineering review.",
    fields: ["Product/system", "Version", "Expected behavior", "Actual behavior", "Steps to reproduce", "Screenshots/logs", "Frequency"],
    outputStructure: "Environment, reproduction steps, expected result, actual result, evidence, workaround, open questions."
  },
  {
    id: "root-cause-analysis",
    name: "Root Cause Analysis",
    description: "Use after the likely cause is known and needs to be documented without overstating certainty.",
    fields: ["Symptoms", "Confirmed cause", "Evidence", "Resolution", "Prevention", "Customer impact"],
    outputStructure: "Summary, impact, root cause, contributing factors, resolution, prevention, follow-up items."
  },
  {
    id: "troubleshooting-timeline",
    name: "Troubleshooting Timeline",
    description: "Use when the order of investigation matters or another engineer needs to understand what happened.",
    fields: ["Timestamped steps", "Commands/actions", "Results", "Decision points", "Pending checks"],
    outputStructure: "Chronological timeline, findings per step, ruled-out causes, current status, next checks."
  },
  {
    id: "knowledge-base-draft",
    name: "Knowledge Base Draft",
    description: "Use when repeated issue handling should become reusable internal or customer-facing documentation.",
    fields: ["Problem statement", "Applies to", "Symptoms", "Cause if known", "Resolution steps", "Verification", "Related tickets"],
    outputStructure: "Title, overview, symptoms, cause, resolution steps, verification, escalation criteria."
  },
  {
    id: "manager-status",
    name: "Manager Status Update",
    description: "Use for concise leadership updates where impact, risk, and next action matter most.",
    fields: ["Customer/account", "Severity", "Impact", "Status", "Owner", "Risk", "Next update"],
    outputStructure: "One-paragraph status, impact, current owner, risks, next action, next update timing."
  },
  {
    id: "post-call-summary",
    name: "Post-Call Summary",
    description: "Use after a customer or internal troubleshooting call to capture outcomes and action items.",
    fields: ["Attendees", "Issue discussed", "Findings", "Decisions", "Action items", "Open questions"],
    outputStructure: "Call purpose, key findings, decisions, action items with owners, open questions, follow-up plan."
  },
  {
    id: "engineering-handoff",
    name: "Engineering Handoff",
    description: "Use when engineering needs a precise, evidence-backed technical summary.",
    fields: ["Ticket ID", "Affected component", "Logs", "Reproduction", "Expected vs actual", "Customer impact", "Support checks"],
    outputStructure: "Technical summary, reproduction path, evidence, affected scope, support findings, requested engineering help."
  },
  {
    id: "daily-work-notes",
    name: "Daily Work Notes",
    description: "Use to turn daily messy work notes into searchable summaries for later ticket follow-up.",
    fields: ["Tickets touched", "Blocked items", "Follow-ups", "Escalations", "Customer responses", "Internal notes"],
    outputStructure: "Daily summary, ticket updates, completed work, blocked items, follow-ups, carryover notes."
  }
];
