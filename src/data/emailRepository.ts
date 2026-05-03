import { getDatabase, persistDatabase } from "./db";
import type { Database } from "sql.js";
import {
  EMAIL_CONTACTS,
  type EmailContactKey,
  type EmailCycleResult,
  type EmailMessage,
  type EmailThread,
  type EmailThreadStatus
} from "../types/email";

type DbRow = Record<string, string | number | Uint8Array | null>;
type EmailContact = (typeof EMAIL_CONTACTS)[number];

const SUPPORT_AGENT = {
  name: "Dallen Smith",
  email: "dallen.smith@example.com"
};

const NEW_EMAIL_SCENARIOS: Record<EmailContactKey, Array<{ subject: string; body: string }>> = {
  jane: [
    {
      subject: "Portal role access still blocked",
      body: [
        "Hi Dallen,",
        "",
        "This is Jane Doe. I tried opening the saved customer report again, but the portal still says I do not have access.",
        "",
        "I can reach the dashboard now, so this looks limited to the report permissions. Can you check whether my role needs another setting?"
      ].join("\n")
    },
    {
      subject: "Order status did not update after retry",
      body: [
        "Hi Dallen,",
        "",
        "Jane Doe here. We retried the order sync for two pending orders, but both are still stuck in Processing.",
        "",
        "The warehouse team needs to know whether they should keep using the manual workaround today."
      ].join("\n")
    },
    {
      subject: "Need confirmation before closing case",
      body: [
        "Hi Dallen,",
        "",
        "I saw your latest update and want to confirm one detail before we close this out.",
        "",
        "Should the permission change also apply to the shared operations dashboard, or only to my saved report?"
      ].join("\n")
    }
  ],
  jack: [
    {
      subject: "Invoice export fails for one customer",
      body: [
        "Hi Dallen,",
        "",
        "This is Jack Doe. The invoice export works for most accounts, but one customer export fails with a template error.",
        "",
        "I can send the customer ID and the timestamp if that helps narrow it down."
      ].join("\n")
    },
    {
      subject: "SFTP import warning after nightly job",
      body: [
        "Hi Dallen,",
        "",
        "Jack Doe here. The nightly SFTP import completed, but the summary email shows several skipped rows.",
        "",
        "Can you help me understand whether the skipped rows need to be corrected in the source file?"
      ].join("\n")
    },
    {
      subject: "Follow-up on escalation notes",
      body: [
        "Hi Dallen,",
        "",
        "I reviewed the escalation notes and can reproduce the issue only when the custom template is selected.",
        "",
        "Let me know what evidence you want me to gather before this goes to engineering."
      ].join("\n")
    }
  ],
  tier1: [
    {
      subject: "Tier 1 needs help with portal login loop",
      body: [
        "Hi Dallen,",
        "",
        "Tier 1 here. We have a customer stuck in a portal login loop after password reset.",
        "",
        "We already confirmed the user can receive MFA, cleared the browser cache, and reproduced it in a private window. Can you review the auth logs and advise on the next step?"
      ].join("\n")
    },
    {
      subject: "Sending Tier 1 triage notes for invoice export",
      body: [
        "Hi Dallen,",
        "",
        "Tier 1 is sending over the initial triage notes for an invoice export issue.",
        "",
        "Customer impact: finance cannot export one customer's invoice PDF.",
        "What we checked: browser retry, alternate invoice, and standard template.",
        "What changed: issue only happens on the custom subsidiary template."
      ].join("\n")
    },
    {
      subject: "Can Tier 2 take the next customer update?",
      body: [
        "Hi Dallen,",
        "",
        "Tier 1 took the first call on a pending order sync issue. The customer is asking for the next update from Tier 2 because the workaround is getting noisy.",
        "",
        "Can you take the next response or send us the technical wording to use?"
      ].join("\n")
    }
  ]
};

function nowIso(): string {
  return new Date().toISOString();
}

function text(row: DbRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function numberValue(row: DbRow, key: string): number {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function getContact(key: string): EmailContact {
  return EMAIL_CONTACTS.find((contact) => contact.key === key) ?? EMAIL_CONTACTS[0];
}

async function selectRows(sql: string, params: Array<string | number | null> = []): Promise<DbRow[]> {
  const db = await getDatabase();
  const statement = db.prepare(sql);
  try {
    statement.bind(params);
    const rows: DbRow[] = [];
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    return rows;
  } finally {
    statement.free();
  }
}

function rowToThread(row: DbRow): EmailThread {
  return {
    id: text(row, "id"),
    contactKey: text(row, "contact_key") as EmailContactKey,
    contactName: text(row, "contact_name"),
    contactEmail: text(row, "contact_email"),
    subject: text(row, "subject"),
    status: text(row, "status") as EmailThreadStatus,
    preview: text(row, "preview"),
    unreadCount: numberValue(row, "unread_count"),
    messageCount: numberValue(row, "message_count"),
    lastMessageAt: text(row, "last_message_at"),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at")
  };
}

function rowToMessage(row: DbRow): EmailMessage {
  return {
    id: text(row, "id"),
    threadId: text(row, "thread_id"),
    direction: text(row, "direction") === "Outbound" ? "Outbound" : "Inbound",
    authorName: text(row, "author_name"),
    authorEmail: text(row, "author_email"),
    recipientName: text(row, "recipient_name"),
    recipientEmail: text(row, "recipient_email"),
    body: text(row, "body"),
    isRead: numberValue(row, "is_read") === 1,
    createdAt: text(row, "created_at")
  };
}

function getScenario(contact: EmailContact, sequenceNumber: number): { subject: string; body: string } {
  const scenarios = NEW_EMAIL_SCENARIOS[contact.key];
  return scenarios[sequenceNumber % scenarios.length];
}

function getWaitingStatus(contact: EmailContact): EmailThreadStatus {
  return contact.key === "tier1" ? "Waiting on sender" : "Waiting on customer";
}

function getReplyStatus(contact: EmailContact): EmailThreadStatus {
  return contact.key === "tier1" ? "Sender replied" : "Customer replied";
}

function insertInboundThread(db: Database, contact: EmailContact, subject: string, body: string, createdAt = nowIso()): EmailCycleResult {
  const threadId = crypto.randomUUID();
  const messageId = crypto.randomUUID();

  db.run(
    `INSERT INTO email_threads (
      id, contact_key, contact_name, contact_email, subject, status, last_message_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [threadId, contact.key, contact.name, contact.email, subject, "Unread", createdAt, createdAt, createdAt]
  );
  db.run(
    `INSERT INTO email_messages (
      id, thread_id, direction, author_name, author_email, recipient_name, recipient_email, body, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [messageId, threadId, "Inbound", contact.name, contact.email, SUPPORT_AGENT.name, SUPPORT_AGENT.email, body, 0, createdAt]
  );

  return {
    generated: true,
    kind: "new-thread",
    threadId,
    messageId,
    contactName: contact.name,
    subject
  };
}

async function seedDemoEmails(): Promise<void> {
  const rows = await selectRows("SELECT COUNT(*) AS count FROM email_threads");
  if (numberValue(rows[0] ?? {}, "count") > 0) {
    return;
  }

  const db = await getDatabase();
  const janeScenario = getScenario(EMAIL_CONTACTS[0], 0);
  const jackScenario = getScenario(EMAIL_CONTACTS[1], 0);
  const tierOneScenario = getScenario(EMAIL_CONTACTS[2], 0);
  insertInboundThread(db, EMAIL_CONTACTS[0], janeScenario.subject, janeScenario.body, new Date(Date.now() - 42 * 60_000).toISOString());
  insertInboundThread(db, EMAIL_CONTACTS[1], jackScenario.subject, jackScenario.body, new Date(Date.now() - 18 * 60_000).toISOString());
  insertInboundThread(db, EMAIL_CONTACTS[2], tierOneScenario.subject, tierOneScenario.body, new Date(Date.now() - 9 * 60_000).toISOString());
  await persistDatabase();
}

function buildContactFollowUp(contact: EmailContact, reply: string): string {
  const normalizedReply = reply.toLowerCase();
  const firstName = contact.name.split(" ")[0];

  if (contact.key === "tier1") {
    if (/\b(resolved|fixed|close|closed|working now|looks good)\b/.test(normalizedReply)) {
      return [
        "Hi Dallen,",
        "",
        "Tier 1 here. Thanks for confirming. We will notify the customer and mark our intake task complete.",
        "",
        "We will route anything else back to Tier 2 if the issue comes up again."
      ].join("\n");
    }

    if (/\b(screenshot|screen shot|log|logs|timestamp|attachment|customer id|case id|evidence)\b/.test(normalizedReply)) {
      return [
        "Hi Dallen,",
        "",
        "Tier 1 here. We gathered the evidence you asked for and added the timestamp, customer-facing error, and affected record below.",
        "",
        "Timestamp: today around 10:15 AM local time",
        "Customer-facing error: request could not be completed",
        "Affected record: sample invoice INV-1048"
      ].join("\n");
    }

    if (/\b(escalate|engineering|tier 2|investigate|bug|review)\b/.test(normalizedReply)) {
      return [
        "Hi Dallen,",
        "",
        "Tier 1 here. We will hold the customer update while Tier 2 reviews this.",
        "",
        "We added your notes to the case and will wait for your recommended customer-facing wording."
      ].join("\n");
    }

    return [
      "Hi Dallen,",
      "",
      "Tier 1 here. Thanks for the update. We still need a clear next action before we reply to the customer.",
      "",
      "Should we ask the customer for more evidence, keep troubleshooting from Tier 1, or route this fully to Tier 2?"
    ].join("\n");
  }

  if (/\b(resolved|fixed|close|closed|working now|looks good)\b/.test(normalizedReply)) {
    return [
      "Hi Dallen,",
      "",
      `Thanks, ${firstName} here. I checked again after your update and the issue looks resolved on my side.`,
      "",
      "You can mark this email thread complete unless you need anything else from me."
    ].join("\n");
  }

  if (/\b(screenshot|screen shot|log|logs|timestamp|attachment|customer id|case id)\b/.test(normalizedReply)) {
    return [
      "Hi Dallen,",
      "",
      `Thanks, this is ${firstName}. I gathered the details you asked for and added the timestamp plus the affected record information below.`,
      "",
      "Timestamp: today around 9:40 AM local time",
      "Affected user: test.user@example.com",
      "Result: same error after retry"
    ].join("\n");
  }

  if (/\b(reset|cache|retry|restart|sign out|sign back in|try these steps|permissions)\b/.test(normalizedReply)) {
    return [
      "Hi Dallen,",
      "",
      `${firstName} here. I tried the steps from your reply, including signing out and retrying after the permission refresh.`,
      "",
      "The behavior improved, but I still hit the same blocker on one record. What should I try next?"
    ].join("\n");
  }

  if (/\b(escalate|engineering|tier 2|investigate|bug)\b/.test(normalizedReply)) {
    return [
      "Hi Dallen,",
      "",
      `Thanks for the update. ${firstName} here. Please go ahead with the escalation if that is the right next step.`,
      "",
      "I can keep the workaround in place while you investigate, but I would appreciate an ETA when you have one."
    ].join("\n");
  }

  return [
    "Hi Dallen,",
    "",
    `Thanks for the reply. ${firstName} here. I read through your update and still need a little more direction before I can finish on my side.`,
    "",
    "Can you confirm the next action you want me to take?"
  ].join("\n");
}

async function deliverQueuedResponse(): Promise<EmailCycleResult | null> {
  const rows = await selectRows(
    `SELECT q.id, q.thread_id, q.contact_key, q.user_reply, t.subject, t.contact_name, t.contact_email
    FROM email_response_queue q
    INNER JOIN email_threads t ON t.id = q.thread_id
    ORDER BY datetime(q.created_at) ASC
    LIMIT 1`
  );
  const queued = rows[0];
  if (!queued) {
    return null;
  }

  const contact = getContact(text(queued, "contact_key"));
  const threadId = text(queued, "thread_id");
  const messageId = crypto.randomUUID();
  const createdAt = nowIso();
  const body = buildContactFollowUp(contact, text(queued, "user_reply"));
  const db = await getDatabase();

  db.run(
    `INSERT INTO email_messages (
      id, thread_id, direction, author_name, author_email, recipient_name, recipient_email, body, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [messageId, threadId, "Inbound", contact.name, contact.email, SUPPORT_AGENT.name, SUPPORT_AGENT.email, body, 0, createdAt]
  );
  db.run("UPDATE email_threads SET status = ?, last_message_at = ?, updated_at = ? WHERE id = ?", [
    getReplyStatus(contact),
    createdAt,
    createdAt,
    threadId
  ]);
  db.run("DELETE FROM email_response_queue WHERE id = ?", [text(queued, "id")]);
  await persistDatabase();

  return {
    generated: true,
    kind: "follow-up",
    threadId,
    messageId,
    contactName: contact.name,
    subject: text(queued, "subject")
  };
}

export async function listEmailThreads(): Promise<EmailThread[]> {
  await seedDemoEmails();
  const rows = await selectRows(
    `SELECT
      t.*,
      COALESCE((SELECT body FROM email_messages WHERE thread_id = t.id ORDER BY datetime(created_at) DESC LIMIT 1), '') AS preview,
      (SELECT COUNT(*) FROM email_messages WHERE thread_id = t.id) AS message_count,
      (SELECT COUNT(*) FROM email_messages WHERE thread_id = t.id AND direction = 'Inbound' AND is_read = 0) AS unread_count
    FROM email_threads t
    ORDER BY datetime(t.last_message_at) DESC`
  );
  return rows.map(rowToThread);
}

export async function getEmailMessages(threadId: string): Promise<EmailMessage[]> {
  const rows = await selectRows("SELECT * FROM email_messages WHERE thread_id = ? ORDER BY datetime(created_at) ASC", [threadId]);
  return rows.map(rowToMessage);
}

export async function markEmailThreadRead(threadId: string): Promise<void> {
  const updatedAt = nowIso();
  const db = await getDatabase();
  db.run("UPDATE email_messages SET is_read = 1 WHERE thread_id = ? AND direction = 'Inbound'", [threadId]);
  db.run(
    `UPDATE email_threads
    SET status = CASE WHEN status IN ('Unread', 'Customer replied', 'Sender replied') THEN 'Open' ELSE status END,
      updated_at = ?
    WHERE id = ?`,
    [updatedAt, threadId]
  );
  await persistDatabase();
}

export async function sendEmailReply(threadId: string, body: string): Promise<EmailMessage | null> {
  const threadRows = await selectRows("SELECT * FROM email_threads WHERE id = ? LIMIT 1", [threadId]);
  const thread = threadRows[0];
  if (!thread) {
    return null;
  }

  const createdAt = nowIso();
  const contact = getContact(text(thread, "contact_key"));
  const message: EmailMessage = {
    id: crypto.randomUUID(),
    threadId,
    direction: "Outbound",
    authorName: SUPPORT_AGENT.name,
    authorEmail: SUPPORT_AGENT.email,
    recipientName: text(thread, "contact_name"),
    recipientEmail: text(thread, "contact_email"),
    body: body.trim(),
    isRead: true,
    createdAt
  };
  const db = await getDatabase();

  db.run(
    `INSERT INTO email_messages (
      id, thread_id, direction, author_name, author_email, recipient_name, recipient_email, body, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.threadId,
      message.direction,
      message.authorName,
      message.authorEmail,
      message.recipientName,
      message.recipientEmail,
      message.body,
      1,
      message.createdAt
    ]
  );
  db.run("UPDATE email_threads SET status = ?, last_message_at = ?, updated_at = ? WHERE id = ?", [
    getWaitingStatus(contact),
    createdAt,
    createdAt,
    threadId
  ]);
  db.run("DELETE FROM email_response_queue WHERE thread_id = ?", [threadId]);
  db.run("INSERT INTO email_response_queue (id, thread_id, contact_key, user_reply, created_at) VALUES (?, ?, ?, ?, ?)", [
    crypto.randomUUID(),
    threadId,
    text(thread, "contact_key"),
    message.body,
    createdAt
  ]);

  await persistDatabase();
  return message;
}

export async function runAutonomousEmailCycle(): Promise<EmailCycleResult> {
  const queuedResponse = await deliverQueuedResponse();
  if (queuedResponse) {
    return queuedResponse;
  }

  const rows = await selectRows("SELECT COUNT(*) AS count FROM email_threads");
  const threadCount = numberValue(rows[0] ?? {}, "count");
  const contactCountRows = await selectRows("SELECT contact_key, COUNT(*) AS count FROM email_threads GROUP BY contact_key");
  const countByContact = new Map(contactCountRows.map((row) => [text(row, "contact_key"), numberValue(row, "count")]));
  const contact = EMAIL_CONTACTS.find((candidate) => !countByContact.has(candidate.key)) ?? EMAIL_CONTACTS[threadCount % EMAIL_CONTACTS.length];
  const contactRows = await selectRows("SELECT COUNT(*) AS count FROM email_threads WHERE contact_key = ?", [contact.key]);
  const scenario = getScenario(contact, numberValue(contactRows[0] ?? {}, "count"));
  const db = await getDatabase();
  const result = insertInboundThread(db, contact, scenario.subject, scenario.body);
  await persistDatabase();
  return result;
}

export async function deleteEmailThread(threadId: string): Promise<void> {
  const db = await getDatabase();
  db.run("DELETE FROM email_response_queue WHERE thread_id = ?", [threadId]);
  db.run("DELETE FROM email_messages WHERE thread_id = ?", [threadId]);
  db.run("DELETE FROM email_threads WHERE id = ?", [threadId]);
  await persistDatabase();
}
