import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Mail, RefreshCw, Reply, Send, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import {
  deleteEmailThread,
  getEmailMessages,
  listEmailThreads,
  markEmailThreadRead,
  runAutonomousEmailCycle,
  sendEmailReply
} from "../data/emailRepository";
import type { EmailMessage, EmailThread } from "../types/email";
import { formatDateTime } from "../utils/format";

function ThreadStatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replace(/\s+/g, "-");
  return <span className={`badge email-status-${normalized}`}>{value}</span>;
}

function getCycleStatus(resultContactName?: string, resultSubject?: string): string {
  if (!resultContactName || !resultSubject) {
    return "No new email was generated.";
  }
  return `${resultContactName} sent "${resultSubject}".`;
}

export function EmailInbox() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [cycling, setCycling] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads]
  );

  const refreshThreads = useCallback(async (preferredThreadId?: string) => {
    const rows = await listEmailThreads();
    setThreads(rows);

    const nextSelectedId =
      preferredThreadId && rows.some((thread) => thread.id === preferredThreadId)
        ? preferredThreadId
        : rows[0]?.id ?? "";
    setSelectedThreadId((current) => {
      if (current && rows.some((thread) => thread.id === current)) {
        return current;
      }
      return nextSelectedId;
    });
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    const rows = await getEmailMessages(threadId);
    await markEmailThreadRead(threadId);
    setMessages(rows);
    setThreads(await listEmailThreads());
  }, []);

  useEffect(() => {
    refreshThreads()
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load email inbox."))
      .finally(() => setLoading(false));
  }, [refreshThreads]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }

    loadMessages(selectedThreadId).catch((err) => setError(err instanceof Error ? err.message : "Could not load email thread."));
  }, [loadMessages, selectedThreadId]);

  useEffect(() => {
    const handleEmailUpdate = () => {
      refreshThreads(selectedThreadId)
        .then(() => selectedThreadId ? loadMessages(selectedThreadId) : undefined)
        .catch((err) => setError(err instanceof Error ? err.message : "Could not refresh email inbox."));
    };

    window.addEventListener("email:updated", handleEmailUpdate);
    return () => window.removeEventListener("email:updated", handleEmailUpdate);
  }, [loadMessages, refreshThreads, selectedThreadId]);

  async function handleRunCycle() {
    setCycling(true);
    setError("");
    try {
      const result = await runAutonomousEmailCycle();
      window.dispatchEvent(new Event("email:updated"));
      await refreshThreads(result.threadId);
      if (result.threadId) {
        setSelectedThreadId(result.threadId);
      }
      setStatus(getCycleStatus(result.contactName, result.subject));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run the email cycle.");
    } finally {
      setCycling(false);
    }
  }

  async function handleSendReply() {
    if (!selectedThread || !replyBody.trim()) {
      return;
    }

    setSending(true);
    setError("");
    try {
      await sendEmailReply(selectedThread.id, replyBody);
      setReplyBody("");
      await refreshThreads(selectedThread.id);
      await loadMessages(selectedThread.id);
      setStatus(`Reply sent to ${selectedThread.contactName}. Their next response is queued for the next open-app email cycle.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reply.");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteThread(thread: EmailThread) {
    if (!window.confirm(`Delete email thread "${thread.subject}"?`)) {
      return;
    }

    await deleteEmailThread(thread.id);
    setMessages([]);
    await refreshThreads();
  }

  return (
    <div className="page-stack console-page">
      <header className="console-header">
        <div>
          <p className="eyebrow">Mock email</p>
          <h1>Email inbox</h1>
          <p>Jane Doe, Jack Doe, and Tier 1 Support send local practice emails while this browser tab is open.</p>
        </div>
        <div className="action-row">
          <span className="environment-pill"><Clock3 size={14} /> 15 min cycle</span>
          <Button icon={<RefreshCw size={16} />} disabled={cycling} onClick={handleRunCycle}>
            {cycling ? "Running..." : "Run Cycle Now"}
          </Button>
        </div>
      </header>

      {status ? <p className="status-line">{status}</p> : null}
      {error ? <p className="error-line">{error}</p> : null}

      <div className="email-layout">
        <Card title="Inbox" eyebrow={loading ? "Loading" : `${threads.length} conversations`}>
          <div className="email-thread-list">
            {threads.map((thread) => (
              <button
                className={`email-thread-button ${thread.id === selectedThreadId ? "active" : ""}`.trim()}
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
              >
                <span className="email-thread-topline">
                  <strong>{thread.contactName}</strong>
                  <span>{formatDateTime(thread.lastMessageAt)}</span>
                </span>
                <span className="email-thread-subject">
                  {thread.unreadCount ? <span className="unread-dot" aria-label={`${thread.unreadCount} unread`} /> : null}
                  {thread.subject}
                </span>
                <span className="email-preview">{thread.preview}</span>
                <span className="email-thread-footer">
                  <ThreadStatusBadge value={thread.status} />
                  <span>{thread.messageCount} messages</span>
                </span>
              </button>
            ))}
          </div>
          {!loading && !threads.length ? <p className="helper-line">No email conversations yet.</p> : null}
        </Card>

        <Card
          title={selectedThread?.subject ?? "Select an email"}
          eyebrow={selectedThread ? `${selectedThread.contactName} | ${selectedThread.contactEmail}` : "Conversation"}
          actions={selectedThread ? <ThreadStatusBadge value={selectedThread.status} /> : null}
        >
          {selectedThread ? (
            <div className="email-thread-panel">
              <div className="email-thread-actions">
                <span><Mail size={15} /> {selectedThread.contactName}</span>
                <Button variant="ghost" icon={<Trash2 size={14} />} onClick={() => handleDeleteThread(selectedThread)}>
                  Delete
                </Button>
              </div>

              <div className="email-message-list">
                {messages.map((message) => (
                  <article className={`email-message ${message.direction.toLowerCase()}`} key={message.id}>
                    <div className="email-message-header">
                      <strong>{message.authorName}</strong>
                      <span>{formatDateTime(message.createdAt)}</span>
                    </div>
                    <p className="email-body">{message.body}</p>
                  </article>
                ))}
              </div>

              <div className="email-reply-composer">
                <Field label={`Reply to ${selectedThread.contactName}`}>
                  <textarea
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Write the customer response you would send from the support queue."
                  />
                </Field>
                <div className="action-row">
                  <Button variant="primary" icon={<Send size={16} />} disabled={sending || !replyBody.trim()} onClick={handleSendReply}>
                    {sending ? "Sending..." : "Send Reply"}
                  </Button>
                  <Button icon={<Reply size={16} />} onClick={() => setReplyBody("Thanks for the details. Please send a screenshot, timestamp, and the affected record ID so I can compare it against the logs.")}>
                    Use Support Reply
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state tall">
              <Mail size={28} />
              <span>Select a Jane Doe, Jack Doe, or Tier 1 Support email thread.</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
