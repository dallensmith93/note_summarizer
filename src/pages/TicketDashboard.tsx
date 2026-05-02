import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, FilePlus2, Inbox, ListChecks, ShieldAlert } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { getTicketMetrics, listTickets } from "../data/ticketRepository";
import type { Ticket, TicketMetrics } from "../types/ticket";
import { formatDateTime, formatRelativeDue } from "../utils/format";
import { navigate } from "../App";

function PriorityBadge({ value }: { value: string }) {
  const tone = value.includes("P1") ? "critical" : value.includes("P2") ? "high" : value.includes("P3") ? "medium" : "low";
  return <span className={`badge priority-${tone}`}>{value}</span>;
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`badge status-${value.toLowerCase()}`}>{value}</span>;
}

export function TicketDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listTickets(), getTicketMetrics()])
      .then(([ticketRows, metricRows]) => {
        setTickets(ticketRows);
        setMetrics(metricRows);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeQueue = useMemo(
    () => tickets.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status)).slice(0, 8),
    [tickets]
  );

  return (
    <div className="page-stack console-page">
      <header className="console-header">
        <div>
          <p className="eyebrow">Service console</p>
          <h1>Support ticket workspace</h1>
          <p>Practice case triage, queue ownership, SLA review, work notes, escalations, and customer updates.</p>
        </div>
        <div className="action-row">
          <Button icon={<Inbox size={16} />} onClick={() => navigate("/tickets")}>Open Queue</Button>
          <Button variant="primary" icon={<FilePlus2 size={16} />} onClick={() => navigate("/new-ticket")}>Create Ticket</Button>
        </div>
      </header>

      <div className="stats-grid compact-stats">
        <StatCard label="Total cases" value={loading ? "..." : metrics?.total ?? 0} icon={<ListChecks size={20} />} />
        <StatCard label="Open/New" value={loading ? "..." : metrics?.open ?? 0} icon={<Inbox size={20} />} />
        <StatCard label="Escalated" value={loading ? "..." : metrics?.escalated ?? 0} icon={<ShieldAlert size={20} />} />
        <StatCard label="Pending" value={loading ? "..." : metrics?.pending ?? 0} icon={<Clock3 size={20} />} />
        <StatCard label="SLA breached" value={loading ? "..." : metrics?.breached ?? 0} icon={<AlertTriangle size={20} />} />
      </div>

      <div className="console-grid">
        <Card title="My Active Queue" eyebrow="Work list">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Subject</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {activeQueue.map((ticket) => (
                  <tr key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <td><strong>{ticket.ticketNumber}</strong></td>
                    <td>{ticket.subject}</td>
                    <td>{ticket.accountName}</td>
                    <td><StatusBadge value={ticket.status} /></td>
                    <td><PriorityBadge value={ticket.priority} /></td>
                    <td>{formatRelativeDue(ticket.slaDueAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Practice Focus" eyebrow="New job prep">
          <div className="practice-list">
            <div>
              <strong>Queue discipline</strong>
              <span>Sort by SLA, priority, owner, and status before picking up a ticket.</span>
            </div>
            <div>
              <strong>Customer context</strong>
              <span>Check account, contact, product, environment, and recent work notes before replying.</span>
            </div>
            <div>
              <strong>Internal notes</strong>
              <span>Keep troubleshooting evidence clear enough for escalation or handoff.</span>
            </div>
            <div>
              <strong>Resolution hygiene</strong>
              <span>Close only when resolution and customer-facing summary are clear.</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Recently Updated" eyebrow="Latest activity">
        <div className="record-list">
          {tickets.slice(0, 5).map((ticket) => (
            <a className="record-row" href={`#/tickets/${ticket.id}`} key={ticket.id}>
              <div>
                <strong>{ticket.ticketNumber} - {ticket.subject}</strong>
                <span>{ticket.accountName} | {ticket.queue} | Updated {formatDateTime(ticket.updatedAt)}</span>
              </div>
              <StatusBadge value={ticket.status} />
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
