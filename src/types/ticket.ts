export const TICKET_STATUSES = ["New", "Open", "Pending", "Escalated", "Resolved", "Closed"] as const;
export const TICKET_PRIORITIES = ["P1 Critical", "P2 High", "P3 Medium", "P4 Low"] as const;
export const TICKET_CHANNELS = ["Portal", "Email", "Phone", "Chat", "Internal", "Monitoring"] as const;
export const TICKET_TYPES = ["Incident", "Question", "Task", "Problem", "Change Request", "Bug"] as const;
export const TICKET_QUEUES = ["Tier 1", "Tier 2", "Escalations", "Engineering", "Billing", "Customer Success"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketChannel = (typeof TICKET_CHANNELS)[number];
export type TicketType = (typeof TICKET_TYPES)[number];
export type TicketQueueName = (typeof TICKET_QUEUES)[number];

export interface TicketFormInput {
  subject: string;
  accountName: string;
  contactName: string;
  contactEmail: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  channel: TicketChannel;
  queue: TicketQueueName;
  owner: string;
  product: string;
  environment: string;
  severity: string;
  slaDueAt: string;
  description: string;
  latestWorkNote: string;
  resolution: string;
  tagsInput: string;
}

export interface Ticket extends TicketFormInput {
  id: string;
  ticketNumber: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  author: string;
  body: string;
  visibility: "Internal" | "Customer";
  createdAt: string;
}

export interface TicketFilters {
  search?: string;
  status?: TicketStatus | "All";
  priority?: TicketPriority | "All";
  queue?: TicketQueueName | "All";
  owner?: string;
  account?: string;
}

export interface TicketMetrics {
  total: number;
  open: number;
  escalated: number;
  pending: number;
  breached: number;
  resolvedToday: number;
}
