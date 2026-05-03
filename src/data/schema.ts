export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  audience TEXT NOT NULL,
  summary_type TEXT NOT NULL,
  tone TEXT NOT NULL,
  customer_name TEXT,
  ticket_id TEXT,
  product_system TEXT,
  priority TEXT,
  issue_summary TEXT,
  troubleshooting_steps TEXT,
  error_messages TEXT,
  resolution TEXT,
  open_questions_input TEXT,
  next_steps_input TEXT,
  raw_notes TEXT NOT NULL,
  generated_summary TEXT NOT NULL,
  action_items_json TEXT NOT NULL,
  open_questions_json TEXT NOT NULL,
  next_steps_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  ai_mode TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  fields_json TEXT NOT NULL,
  output_structure TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_source_type ON notes(source_type);
CREATE INDEX IF NOT EXISTS idx_notes_audience ON notes(audience);
CREATE INDEX IF NOT EXISTS idx_notes_summary_type ON notes(summary_type);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  account_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  queue TEXT NOT NULL,
  owner TEXT,
  product TEXT,
  environment TEXT,
  severity TEXT,
  sla_due_at TEXT,
  description TEXT NOT NULL,
  latest_work_note TEXT,
  resolution TEXT,
  tags_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_queue ON tickets(queue);
CREATE INDEX IF NOT EXISTS idx_tickets_owner ON tickets(owner);
CREATE INDEX IF NOT EXISTS idx_tickets_account_name ON tickets(account_name);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);

CREATE TABLE IF NOT EXISTS email_threads (
  id TEXT PRIMARY KEY,
  contact_key TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  last_message_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES email_threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_response_queue (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  contact_key TEXT NOT NULL,
  user_reply TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES email_threads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_threads_last_message_at ON email_threads(last_message_at);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_is_read ON email_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_email_response_queue_created_at ON email_response_queue(created_at);
`;
