import type { ReactNode } from "react";
import { Bell, BookOpen, Building2, FilePlus2, Gauge, Inbox, Search, Settings, ShieldCheck } from "lucide-react";

const navItems = [
  { href: "#/", label: "Service Console", route: "dashboard", icon: Gauge },
  { href: "#/tickets", label: "Ticket Queue", route: "tickets", icon: Inbox },
  { href: "#/new-ticket", label: "New Ticket", route: "newTicket", icon: FilePlus2 },
  { href: "#/accounts", label: "Accounts", route: "accounts", icon: Building2 },
  { href: "#/knowledge", label: "Knowledge", route: "knowledge", icon: BookOpen },
  { href: "#/settings", label: "Settings", route: "settings", icon: Settings }
];

interface AppShellProps {
  activeRoute: string;
  children: ReactNode;
}

export function AppShell({ activeRoute, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#/">
          <span className="brand-mark"><ShieldCheck size={20} /></span>
          <span>
            <strong>Support Desk Console</strong>
            <small>Ticket practice workspace</small>
          </span>
        </a>

        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.route || (item.route === "tickets" && activeRoute === "ticketDetail");
            return (
              <a className={isActive ? "active" : ""} href={item.href} key={item.href}>
                <Icon size={18} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="global-search">
            <Search size={16} />
            <span>Search cases, accounts, contacts, products</span>
          </div>
          <div className="topbar-actions">
            <span className="environment-pill">Training Sandbox</span>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={17} />
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </section>
    </div>
  );
}
