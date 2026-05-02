import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { exportDatabaseBytes, replaceDatabase } from "../data/db";
import { getConfiguredAiMode } from "../ai/summarizeNote";

export function Settings() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const aiMode = getConfiguredAiMode();

  async function downloadDatabase() {
    setError("");
    const bytes = await exportDatabaseBytes();
    const arrayBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(arrayBuffer).set(bytes);
    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `note-summeraizer-export-${new Date().toISOString().slice(0, 10)}.sqlite`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("SQLite database export downloaded.");
  }

  async function importDatabase(file: File | null) {
    if (!file) {
      return;
    }

    setError("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await replaceDatabase(bytes);
      setStatus("SQLite database import completed. Refresh saved notes if another page is open.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import database.");
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Console settings</h1>
          <p>Keep the ticket practice workspace local, and only use server-side environment variables for real AI calls.</p>
        </div>
      </header>

      <Card title="noteS AI Helper" eyebrow="Optional handoff summaries">
        <dl className="metadata-grid">
          <div><dt>Current frontend mode</dt><dd>{aiMode}</dd></div>
          <div><dt>Mock mode</dt><dd>Runs locally without an API key for ticket handoff practice.</dd></div>
          <div><dt>Real mode</dt><dd>Uses `/.netlify/functions/summarize` so the browser never receives the API key.</dd></div>
        </dl>
        <div className="settings-copy">
          <p>Set local mode in `.env` using `VITE_AI_MODE=mock` or `VITE_AI_MODE=real`.</p>
          <p>For real AI on Netlify, add `AI_PROVIDER`, `OPENAI_API_KEY`, and `OPENAI_MODEL` in Netlify environment variables.</p>
          <p>Do not commit `.env`, paste production keys into frontend code, or store API keys in SQLite.</p>
        </div>
      </Card>

      <Card title="Local Ticket Database Backup" eyebrow="Browser storage">
        <p>
          Tickets are stored in a SQLite database in this browser through IndexedDB. Export a copy before clearing
          browser data or moving to another machine.
        </p>
        <div className="action-row">
          <Button icon={<Download size={16} />} onClick={downloadDatabase}>Export SQLite Backup</Button>
          <Button icon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>Import SQLite Backup</Button>
          <input
            ref={fileInputRef}
            className="hidden-input"
            type="file"
            accept=".sqlite,.sqlite3,.db,application/octet-stream"
            onChange={(event) => importDatabase(event.target.files?.[0] ?? null)}
          />
        </div>
        {status ? <p className="status-line">{status}</p> : null}
        {error ? <p className="error-line">{error}</p> : null}
      </Card>

      <Card title="Deployment Notes" eyebrow="Netlify">
        <ul className="check-list">
          <li>Build command: `npm run build`</li>
          <li>Publish directory: `dist`</li>
          <li>Function directory: `netlify/functions`</li>
          <li>SPA redirect sends all routes to `index.html`</li>
        </ul>
      </Card>
    </div>
  );
}
