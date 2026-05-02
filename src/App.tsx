import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { TicketDashboard } from "./pages/TicketDashboard";
import { TicketQueue } from "./pages/TicketQueue";
import { TicketDetail } from "./pages/TicketDetail";
import { TicketForm } from "./pages/TicketForm";
import { Accounts } from "./pages/Accounts";
import { Knowledge } from "./pages/Knowledge";
import { Settings } from "./pages/Settings";

type RouteName = "dashboard" | "tickets" | "ticketDetail" | "newTicket" | "editTicket" | "accounts" | "knowledge" | "settings";

interface Route {
  name: RouteName;
  id?: string;
}

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  const parts = path.split("/").filter(Boolean);

  if (!parts.length) {
    return { name: "dashboard" };
  }

  if (parts[0] === "new-ticket") {
    return { name: "newTicket" };
  }
  if (parts[0] === "tickets" && parts[1]) {
    return { name: "ticketDetail", id: parts[1] };
  }
  if (parts[0] === "edit-ticket" && parts[1]) {
    return { name: "editTicket", id: parts[1] };
  }
  if (parts[0] === "tickets") {
    return { name: "tickets" };
  }
  if (parts[0] === "accounts") {
    return { name: "accounts" };
  }
  if (parts[0] === "knowledge") {
    return { name: "knowledge" };
  }
  if (parts[0] === "settings") {
    return { name: "settings" };
  }

  return { name: "dashboard" };
}

function useHashRoute(): Route {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return useMemo(() => parseRoute(hash), [hash]);
}

export function navigate(path: string): void {
  window.location.hash = path;
}

export default function App() {
  const route = useHashRoute();

  const page = useMemo(() => {
    switch (route.name) {
      case "newTicket":
        return <TicketForm />;
      case "editTicket":
        return <TicketForm editId={route.id} />;
      case "tickets":
        return <TicketQueue />;
      case "ticketDetail":
        return route.id ? <TicketDetail id={route.id} /> : <TicketQueue />;
      case "accounts":
        return <Accounts />;
      case "knowledge":
        return <Knowledge />;
      case "settings":
        return <Settings />;
      case "dashboard":
      default:
        return <TicketDashboard />;
    }
  }, [route]);

  return <AppShell activeRoute={route.name}>{page}</AppShell>;
}
