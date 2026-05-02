import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { listTickets } from "../data/ticketRepository";
import type { Ticket } from "../types/ticket";
import { formatDateTime } from "../utils/format";

interface AccountSummary {
  accountName: string;
  tickets: Ticket[];
}

export function Accounts() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    listTickets().then(setTickets);
  }, []);

  const accounts = useMemo<AccountSummary[]>(() => {
    const map = new Map<string, Ticket[]>();
    for (const ticket of tickets) {
      map.set(ticket.accountName, [...(map.get(ticket.accountName) ?? []), ticket]);
    }
    return Array.from(map.entries())
      .map(([accountName, accountTickets]) => ({ accountName, tickets: accountTickets }))
      .sort((a, b) => a.accountName.localeCompare(b.accountName));
  }, [tickets]);

  return (
    <div className="page-stack console-page">
      <header className="console-header">
        <div>
          <p className="eyebrow">Accounts</p>
          <h1>Customer context</h1>
          <p>Practice checking account-level ticket history before updating or escalating a case.</p>
        </div>
      </header>

      <div className="account-grid">
        {accounts.map((account) => {
          const active = account.tickets.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status)).length;
          const latest = [...account.tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

          return (
            <Card title={account.accountName} eyebrow={`${account.tickets.length} case${account.tickets.length === 1 ? "" : "s"}`} key={account.accountName}>
              <dl className="mini-metadata">
                <div><dt>Active cases</dt><dd>{active}</dd></div>
                <div><dt>Latest update</dt><dd>{latest ? formatDateTime(latest.updatedAt) : "None"}</dd></div>
                <div><dt>Primary contact</dt><dd>{latest?.contactName || "Not provided"}</dd></div>
              </dl>
              <div className="record-list">
                {account.tickets.slice(0, 3).map((ticket) => (
                  <a className="record-row compact-row" href={`#/tickets/${ticket.id}`} key={ticket.id}>
                    <div>
                      <strong>{ticket.ticketNumber}</strong>
                      <span>{ticket.subject}</span>
                    </div>
                    <span className={`badge status-${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                  </a>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
