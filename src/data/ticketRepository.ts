import { getDatabase, persistDatabase } from "./db";
import type {
  Ticket,
  TicketComment,
  TicketFilters,
  TicketFormInput,
  TicketMetrics,
  TicketPriority,
  TicketQueueName,
  TicketStatus
} from "../types/ticket";

type DbRow = Record<string, string | number | Uint8Array | null>;

export type SaveTicketInput = Omit<TicketFormInput, "tagsInput"> & {
  tags: string[];
  id?: string;
};

const DEMO_TICKETS: Array<SaveTicketInput & { ticketNumber: string; createdAt: string; updatedAt: string }> = [
  {
    ticketNumber: "CASE-10042",
    subject: "Customer portal orders stuck in Pending Fulfillment",
    accountName: "Blue Ridge Supply",
    contactName: "Maya Chen",
    contactEmail: "maya.chen@blueridge.example",
    status: "Open",
    priority: "P2 High",
    type: "Incident",
    channel: "Portal",
    queue: "Tier 2",
    owner: "Dallen Smith",
    product: "Order Management",
    environment: "Production",
    severity: "Multiple users affected",
    slaDueAt: futureHours(5),
    description: "Warehouse users report that submitted orders remain in Pending Fulfillment and do not create pick tasks.",
    latestWorkNote: "Verified orders are submitted successfully. Fulfillment workflow logs show timeout on inventory allocation step.",
    resolution: "",
    tags: ["order-management", "workflow", "sla-watch"],
    createdAt: pastHours(3),
    updatedAt: pastMinutes(24)
  },
  {
    ticketNumber: "CASE-10051",
    subject: "Invoice PDF generation fails for custom subsidiary template",
    accountName: "Northstar Medical",
    contactName: "Jordan Patel",
    contactEmail: "jordan.patel@northstar.example",
    status: "Escalated",
    priority: "P2 High",
    type: "Bug",
    channel: "Email",
    queue: "Engineering",
    owner: "Engineering Queue",
    product: "Billing",
    environment: "Production",
    severity: "Finance team blocked",
    slaDueAt: futureHours(2),
    description: "Invoice PDFs fail only for subsidiary 08 when using the custom statement template.",
    latestWorkNote: "Reproduced in sandbox with copied template. Error references missing tax registration field. Escalated with template ID and sample invoice.",
    resolution: "",
    tags: ["billing", "pdf", "engineering"],
    createdAt: pastHours(9),
    updatedAt: pastHours(1)
  },
  {
    ticketNumber: "CASE-10057",
    subject: "New user cannot access saved search results",
    accountName: "Evergreen Retail",
    contactName: "Sam Rivera",
    contactEmail: "sam.rivera@evergreen.example",
    status: "Pending",
    priority: "P3 Medium",
    type: "Question",
    channel: "Phone",
    queue: "Tier 2",
    owner: "Dallen Smith",
    product: "Reporting",
    environment: "Production",
    severity: "Single user affected",
    slaDueAt: futureHours(16),
    description: "New analyst receives permission error when opening sales saved search from dashboard.",
    latestWorkNote: "Compared role permissions to working analyst. Waiting on customer confirmation for whether the user should see subsidiary-restricted records.",
    resolution: "",
    tags: ["permissions", "saved-search", "waiting-customer"],
    createdAt: pastHours(20),
    updatedAt: pastHours(4)
  },
  {
    ticketNumber: "CASE-10061",
    subject: "SFTP import job completed with partial failures",
    accountName: "Summit Outdoor",
    contactName: "Alicia Gomez",
    contactEmail: "alicia.gomez@summit.example",
    status: "New",
    priority: "P3 Medium",
    type: "Incident",
    channel: "Monitoring",
    queue: "Tier 1",
    owner: "Unassigned",
    product: "Integrations",
    environment: "Production",
    severity: "Data sync delayed",
    slaDueAt: futureHours(10),
    description: "Nightly SFTP customer import completed but rejected 142 rows due to invalid region code.",
    latestWorkNote: "Monitoring alert created automatically. Needs owner triage and customer file validation.",
    resolution: "",
    tags: ["integration", "sftp", "triage"],
    createdAt: pastMinutes(48),
    updatedAt: pastMinutes(48)
  },
  {
    ticketNumber: "CASE-10063",
    subject: "Close request after confirming inventory adjustment posted",
    accountName: "Pioneer Components",
    contactName: "Renee Walker",
    contactEmail: "renee.walker@pioneer.example",
    status: "Resolved",
    priority: "P4 Low",
    type: "Task",
    channel: "Chat",
    queue: "Tier 2",
    owner: "Dallen Smith",
    product: "Inventory",
    environment: "Production",
    severity: "No active impact",
    slaDueAt: pastHours(1),
    description: "Customer asked support to verify that yesterday's inventory adjustment posted to the correct location.",
    latestWorkNote: "Confirmed adjustment posted and customer approved closure.",
    resolution: "Adjustment posted to DEN-WH location and customer confirmed no further action needed.",
    tags: ["inventory", "resolved"],
    createdAt: pastHours(30),
    updatedAt: pastHours(2)
  }
];

const DEMO_COMMENTS = [
  {
    ticketNumber: "CASE-10042",
    author: "Dallen Smith",
    visibility: "Internal" as const,
    body: "Allocation timeout appears downstream of submitted order event. Need to compare workflow deployment against last successful order."
  },
  {
    ticketNumber: "CASE-10042",
    author: "Maya Chen",
    visibility: "Customer" as const,
    body: "Warehouse team is manually releasing urgent orders. Please prioritize orders for account 44019 first."
  },
  {
    ticketNumber: "CASE-10051",
    author: "Engineering Queue",
    visibility: "Internal" as const,
    body: "Engineering requested XML template export, sample invoice, and subsidiary config screenshot."
  },
  {
    ticketNumber: "CASE-10057",
    author: "Dallen Smith",
    visibility: "Internal" as const,
    body: "Likely role restriction, not saved search defect. Waiting for confirmation before changing access."
  }
];

function pastMinutes(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function pastHours(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60_000).toISOString();
}

function futureHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60_000).toISOString();
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function text(row: DbRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function rowToTicket(row: DbRow): Ticket {
  return {
    id: text(row, "id"),
    ticketNumber: text(row, "ticket_number"),
    subject: text(row, "subject"),
    accountName: text(row, "account_name"),
    contactName: text(row, "contact_name"),
    contactEmail: text(row, "contact_email"),
    status: text(row, "status") as TicketStatus,
    priority: text(row, "priority") as TicketPriority,
    type: text(row, "type") as Ticket["type"],
    channel: text(row, "channel") as Ticket["channel"],
    queue: text(row, "queue") as TicketQueueName,
    owner: text(row, "owner"),
    product: text(row, "product"),
    environment: text(row, "environment"),
    severity: text(row, "severity"),
    slaDueAt: text(row, "sla_due_at"),
    description: text(row, "description"),
    latestWorkNote: text(row, "latest_work_note"),
    resolution: text(row, "resolution"),
    tagsInput: parseJsonArray(row.tags_json).join(", "),
    tags: parseJsonArray(row.tags_json),
    createdAt: text(row, "created_at"),
    updatedAt: text(row, "updated_at")
  };
}

function rowToComment(row: DbRow): TicketComment {
  return {
    id: text(row, "id"),
    ticketId: text(row, "ticket_id"),
    author: text(row, "author"),
    body: text(row, "body"),
    visibility: text(row, "visibility") === "Customer" ? "Customer" : "Internal",
    createdAt: text(row, "created_at")
  };
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

function normalizeTags(tagsInput: string | string[]): string[] {
  const values = Array.isArray(tagsInput) ? tagsInput : tagsInput.split(",");
  return Array.from(new Set(values.map((tag) => tag.trim()).filter(Boolean))).slice(0, 12);
}

async function nextTicketNumber(): Promise<string> {
  const rows = await selectRows("SELECT ticket_number FROM tickets ORDER BY ticket_number DESC LIMIT 1");
  const current = text(rows[0] ?? {}, "ticket_number");
  const number = Number(current.replace(/\D/g, "")) || 10063;
  return `CASE-${number + 1}`;
}

export async function seedDemoTickets(): Promise<void> {
  const rows = await selectRows("SELECT COUNT(*) AS count FROM tickets");
  if (Number(rows[0]?.count ?? 0) > 0) {
    return;
  }

  const db = await getDatabase();
  const idByNumber = new Map<string, string>();

  for (const ticket of DEMO_TICKETS) {
    const id = crypto.randomUUID();
    idByNumber.set(ticket.ticketNumber, id);
    db.run(
      `INSERT INTO tickets (
        id, ticket_number, subject, account_name, contact_name, contact_email, status, priority,
        type, channel, queue, owner, product, environment, severity, sla_due_at, description,
        latest_work_note, resolution, tags_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        ticket.ticketNumber,
        ticket.subject,
        ticket.accountName,
        ticket.contactName,
        ticket.contactEmail,
        ticket.status,
        ticket.priority,
        ticket.type,
        ticket.channel,
        ticket.queue,
        ticket.owner,
        ticket.product,
        ticket.environment,
        ticket.severity,
        ticket.slaDueAt,
        ticket.description,
        ticket.latestWorkNote,
        ticket.resolution,
        JSON.stringify(ticket.tags),
        ticket.createdAt,
        ticket.updatedAt
      ]
    );
  }

  for (const comment of DEMO_COMMENTS) {
    const ticketId = idByNumber.get(comment.ticketNumber);
    if (!ticketId) {
      continue;
    }
    db.run(
      "INSERT INTO ticket_comments (id, ticket_id, author, body, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [crypto.randomUUID(), ticketId, comment.author, comment.body, comment.visibility, pastMinutes(35)]
    );
  }

  await persistDatabase();
}

export async function listTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  await seedDemoTickets();

  const where: string[] = [];
  const params: string[] = [];

  if (filters.search?.trim()) {
    const search = `%${filters.search.trim()}%`;
    where.push(`(
      ticket_number LIKE ? OR subject LIKE ? OR account_name LIKE ? OR contact_name LIKE ? OR
      product LIKE ? OR description LIKE ? OR latest_work_note LIKE ?
    )`);
    params.push(search, search, search, search, search, search, search);
  }
  if (filters.status && filters.status !== "All") {
    where.push("status = ?");
    params.push(filters.status);
  }
  if (filters.priority && filters.priority !== "All") {
    where.push("priority = ?");
    params.push(filters.priority);
  }
  if (filters.queue && filters.queue !== "All") {
    where.push("queue = ?");
    params.push(filters.queue);
  }
  if (filters.owner?.trim()) {
    where.push("owner LIKE ?");
    params.push(`%${filters.owner.trim()}%`);
  }
  if (filters.account?.trim()) {
    where.push("account_name LIKE ?");
    params.push(`%${filters.account.trim()}%`);
  }

  const rows = await selectRows(
    `SELECT * FROM tickets
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY
      CASE priority
        WHEN 'P1 Critical' THEN 1
        WHEN 'P2 High' THEN 2
        WHEN 'P3 Medium' THEN 3
        ELSE 4
      END,
      datetime(updated_at) DESC`,
    params
  );
  return rows.map(rowToTicket);
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  await seedDemoTickets();
  const rows = await selectRows("SELECT * FROM tickets WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? rowToTicket(rows[0]) : null;
}

export async function getTicketComments(ticketId: string): Promise<TicketComment[]> {
  const rows = await selectRows("SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY datetime(created_at) DESC", [ticketId]);
  return rows.map(rowToComment);
}

export async function saveTicket(input: TicketFormInput): Promise<Ticket> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  const ticketNumber = await nextTicketNumber();
  const tags = normalizeTags(input.tagsInput);

  db.run(
    `INSERT INTO tickets (
      id, ticket_number, subject, account_name, contact_name, contact_email, status, priority,
      type, channel, queue, owner, product, environment, severity, sla_due_at, description,
      latest_work_note, resolution, tags_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      ticketNumber,
      input.subject,
      input.accountName,
      input.contactName,
      input.contactEmail,
      input.status,
      input.priority,
      input.type,
      input.channel,
      input.queue,
      input.owner,
      input.product,
      input.environment,
      input.severity,
      input.slaDueAt ? new Date(input.slaDueAt).toISOString() : "",
      input.description,
      input.latestWorkNote,
      input.resolution,
      JSON.stringify(tags),
      createdAt,
      createdAt
    ]
  );

  if (input.latestWorkNote.trim()) {
    db.run(
      "INSERT INTO ticket_comments (id, ticket_id, author, body, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [crypto.randomUUID(), id, input.owner || "Support Agent", input.latestWorkNote, "Internal", createdAt]
    );
  }

  await persistDatabase();
  return { ...input, id, ticketNumber, tags, tagsInput: tags.join(", "), createdAt, updatedAt: createdAt };
}

export async function updateTicket(id: string, input: TicketFormInput): Promise<Ticket | null> {
  const existing = await getTicketById(id);
  if (!existing) {
    return null;
  }

  const db = await getDatabase();
  const updatedAt = nowIso();
  const tags = normalizeTags(input.tagsInput);

  db.run(
    `UPDATE tickets SET
      subject = ?, account_name = ?, contact_name = ?, contact_email = ?, status = ?, priority = ?,
      type = ?, channel = ?, queue = ?, owner = ?, product = ?, environment = ?, severity = ?,
      sla_due_at = ?, description = ?, latest_work_note = ?, resolution = ?, tags_json = ?, updated_at = ?
    WHERE id = ?`,
    [
      input.subject,
      input.accountName,
      input.contactName,
      input.contactEmail,
      input.status,
      input.priority,
      input.type,
      input.channel,
      input.queue,
      input.owner,
      input.product,
      input.environment,
      input.severity,
      input.slaDueAt ? new Date(input.slaDueAt).toISOString() : "",
      input.description,
      input.latestWorkNote,
      input.resolution,
      JSON.stringify(tags),
      updatedAt,
      id
    ]
  );

  await persistDatabase();
  return { ...input, id, ticketNumber: existing.ticketNumber, tags, tagsInput: tags.join(", "), createdAt: existing.createdAt, updatedAt };
}

export async function addTicketComment(ticketId: string, body: string, visibility: TicketComment["visibility"], author = "Dallen Smith"): Promise<TicketComment> {
  const db = await getDatabase();
  const createdAt = nowIso();
  const comment: TicketComment = {
    id: crypto.randomUUID(),
    ticketId,
    author,
    body,
    visibility,
    createdAt
  };

  db.run(
    "INSERT INTO ticket_comments (id, ticket_id, author, body, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [comment.id, ticketId, author, body, visibility, createdAt]
  );
  db.run("UPDATE tickets SET latest_work_note = ?, updated_at = ? WHERE id = ?", [body, createdAt, ticketId]);
  await persistDatabase();
  return comment;
}

export async function deleteTicketComment(commentId: string): Promise<void> {
  const rows = await selectRows("SELECT ticket_id, body FROM ticket_comments WHERE id = ? LIMIT 1", [commentId]);
  const comment = rows[0];
  if (!comment) {
    return;
  }

  const ticketId = text(comment, "ticket_id");
  const body = text(comment, "body");
  const ticketRows = await selectRows("SELECT latest_work_note FROM tickets WHERE id = ? LIMIT 1", [ticketId]);
  const currentLatestWorkNote = text(ticketRows[0] ?? {}, "latest_work_note");
  const db = await getDatabase();
  const updatedAt = nowIso();

  db.run("DELETE FROM ticket_comments WHERE id = ?", [commentId]);

  if (currentLatestWorkNote === body) {
    const remainingRows = await selectRows(
      "SELECT body FROM ticket_comments WHERE ticket_id = ? ORDER BY datetime(created_at) DESC LIMIT 1",
      [ticketId]
    );
    db.run("UPDATE tickets SET latest_work_note = ?, updated_at = ? WHERE id = ?", [
      text(remainingRows[0] ?? {}, "body"),
      updatedAt,
      ticketId
    ]);
  } else {
    db.run("UPDATE tickets SET updated_at = ? WHERE id = ?", [updatedAt, ticketId]);
  }

  await persistDatabase();
}

export async function deleteTicket(id: string): Promise<void> {
  const db = await getDatabase();
  db.run("DELETE FROM ticket_comments WHERE ticket_id = ?", [id]);
  db.run("DELETE FROM tickets WHERE id = ?", [id]);
  await persistDatabase();
}

export async function getTicketMetrics(): Promise<TicketMetrics> {
  const tickets = await listTickets();
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  return {
    total: tickets.length,
    open: tickets.filter((ticket) => ["New", "Open"].includes(ticket.status)).length,
    escalated: tickets.filter((ticket) => ticket.status === "Escalated").length,
    pending: tickets.filter((ticket) => ticket.status === "Pending").length,
    breached: tickets.filter((ticket) => ticket.slaDueAt && new Date(ticket.slaDueAt).getTime() < now && !["Resolved", "Closed"].includes(ticket.status)).length,
    resolvedToday: tickets.filter((ticket) => ticket.status === "Resolved" && ticket.updatedAt.slice(0, 10) === today).length
  };
}
