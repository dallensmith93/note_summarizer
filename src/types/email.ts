export const EMAIL_CONTACTS = [
  {
    key: "jane",
    name: "Jane Doe",
    email: "jane.doe@example.com"
  },
  {
    key: "jack",
    name: "Jack Doe",
    email: "jack.doe@example.com"
  },
  {
    key: "tier1",
    name: "Tier 1 Support",
    email: "tier1.queue@example.com"
  }
] as const;

export type EmailContactKey = (typeof EMAIL_CONTACTS)[number]["key"];
export type EmailDirection = "Inbound" | "Outbound";
export type EmailThreadStatus = "Unread" | "Open" | "Waiting on customer" | "Waiting on sender" | "Customer replied" | "Sender replied";
export type EmailCycleKind = "new-thread" | "follow-up";

export interface EmailThread {
  id: string;
  contactKey: EmailContactKey;
  contactName: string;
  contactEmail: string;
  subject: string;
  status: EmailThreadStatus;
  preview: string;
  unreadCount: number;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  direction: EmailDirection;
  authorName: string;
  authorEmail: string;
  recipientName: string;
  recipientEmail: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmailCycleResult {
  generated: boolean;
  kind?: EmailCycleKind;
  threadId?: string;
  messageId?: string;
  contactName?: string;
  subject?: string;
}
