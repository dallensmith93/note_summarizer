import { useEffect, useState } from "react";
import { FilePlus2, Search } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { listTickets } from "../data/ticketRepository";
import {
  TICKET_PRIORITIES,
  TICKET_QUEUES,
  TICKET_STATUSES,
  type Ticket,
  type TicketFilters
} from "../types/ticket";
import { formatDateTime, formatRelativeDue } from "../utils/format";
import { navigate } from "../App";

function PriorityBadge({ value }: { value: string }) {
  const tone = value.includes("P1") ? "critical" : value.includes("P2") ? "high" : value.includes("P3") ? "medium" : "low";
  return <span className={`badge priority-${tone}`}>{value}</span>;
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`badge status-${value.toLowerCase()}`}>{value}</span>;
}

export function TicketQueue() {
  const [filters, setFilters] = useState<TicketFilters>({ status: "All", priority: "All", queue: "All" });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh(nextFilters = filters) {
    setLoading(true);
    setTickets(await listTickets(nextFilters));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateFilter<K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    refresh(nextFilters);
  }

  return (
    <div className="page-stack console-page">
      <header className="console-header">
        <div>
          <p className="eyebrow">Ticket queue</p>
          <h1>Cases</h1>
          <p>Practice a CRM-style case queue with filters for status, priority, queue, account, owner, and SLA.</p>
        </div>
        <Button variant="primary" icon={<FilePlus2 size={16} />} onClick={() => navigate("/new-ticket")}>New Ticket</Button>
      </header>

      <Card title="List View Filters" eyebrow="My working view">
        <div className="filters-grid ticket-filters">
          <Field label="Search">
            <div className="search-input">
              <Search size={16} />
              <input value={filters.search ?? ""} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Case, account, contact, product, subject" />
            </div>
          </Field>
          <Field label="Status">
            <select value={filters.status ?? "All"} onChange={(event) => updateFilter("status", event.target.value as TicketFilters["status"])}>
              <option>All</option>
              {TICKET_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={filters.priority ?? "All"} onChange={(event) => updateFilter("priority", event.target.value as TicketFilters["priority"])}>
              <option>All</option>
              {TICKET_PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </Field>
          <Field label="Queue">
            <select value={filters.queue ?? "All"} onChange={(event) => updateFilter("queue", event.target.value as TicketFilters["queue"])}>
              <option>All</option>
              {TICKET_QUEUES.map((queue) => <option key={queue}>{queue}</option>)}
            </select>
          </Field>
          <Field label="Owner">
            <input value={filters.owner ?? ""} onChange={(event) => updateFilter("owner", event.target.value)} placeholder="Owner name" />
          </Field>
          <Field label="Account">
            <input value={filters.account ?? ""} onChange={(event) => updateFilter("account", event.target.value)} placeholder="Account name" />
          </Field>
        </div>
      </Card>

      <Card title="Case List" eyebrow={loading ? "Loading" : `${tickets.length} records`}>
        <div className="data-table-wrap">
          <table className="data-table ticket-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Subject</th>
                <th>Account</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Queue</th>
                <th>Owner</th>
                <th>SLA</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  <td><strong>{ticket.ticketNumber}</strong></td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.accountName}</td>
                  <td><StatusBadge value={ticket.status} /></td>
                  <td><PriorityBadge value={ticket.priority} /></td>
                  <td>{ticket.queue}</td>
                  <td>{ticket.owner || "Unassigned"}</td>
                  <td>{formatRelativeDue(ticket.slaDueAt)}</td>
                  <td>{formatDateTime(ticket.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !tickets.length ? <p className="helper-line">No tickets matched this list view.</p> : null}
        </div>
      </Card>
    </div>
  );
}
