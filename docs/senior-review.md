# Senior Review

Review date: 2026-05-01

## Critical Fixes

- Fixed TypeScript build failure in SQLite export by copying the database bytes into a concrete `ArrayBuffer` before creating the backup Blob.
- Fixed TypeScript project coverage for the Netlify function by including the shared prompt/provider files used by the function.
- Resolved the npm audit findings by upgrading Vite and Vitest, then updating the Vite React plugin to match the upgraded toolchain.

## Nice-To-Have Improvements

- Add Playwright smoke tests for the create-save-search-print workflow.
- Add template-to-form prefill so users can start from Escalation Handoff or Customer Update directly.
- Add stronger real AI response validation and retry handling in the Netlify Function.
- Add per-note export/import in addition to full SQLite backup.
- Add owner and due-date parsing for action items.
- Add optional encrypted local backup support.

## Agent Review Notes

### Senior Frontend Product Engineer

- The app has the requested dashboard, new summary, saved notes, detail, templates, settings, and print/PDF views.
- The UI is dark, responsive, and focused on support workflows.
- Print view is intentionally white and document-like.
- Remaining risk: no visual/browser smoke test was added.

### Senior Local Data Engineer

- SQL.js provides browser SQLite.
- IndexedDB persists the SQLite database bytes.
- Notes support save, list, get, update, delete, search, filter, export, and import.
- Remaining risk: IndexedDB data is browser/device local and can be lost if browser data is cleared.

### Senior AI Workflow Engineer

- noteS has a prompt, provider abstraction, mock provider, sensitive-info redaction, and optional Netlify Function path.
- Mock mode is demo-ready and does not require keys.
- Real mode is implemented as a safe server-side proxy, but it still needs real Netlify environment variables and live provider testing.

### QA TypeScript Test Engineer

- Added Vitest coverage for sensitive-info redaction and mock noteS summarization.
- Ran `npm run test`, `npm run build`, and `npm audit --json`.
- Remaining risk: full browser interaction testing is manual.

### Technical Writer

- README documents setup, Netlify deployment, AI key handling, SQLite persistence, PDF export, demo flow, interview talking points, and future improvements.
- Manual QA checklist is available in `docs/manual-qa-checklist.md`.

## 60-Second Project Explanation

Note Summeraizer is a local-first AI work note summarizer I built for Tier 2 support workflows. The AI assistant, noteS, takes messy troubleshooting notes, ticket updates, customer call notes, or escalation details and turns them into clean structured summaries with action items, open questions, next steps, tags, and PDF-ready documentation. I built it with React, Vite, TypeScript, browser-based SQLite through SQL.js, and IndexedDB persistence so notes stay local without a hosted database. The app has a mock AI provider that works without a live key, plus an optional Netlify Function path for secure real AI calls through environment variables. The goal was to improve support documentation quality without adding a heavy backend or cloud database.

## 3-Minute Technical Walkthrough

Tier 2 support notes can get messy because engineers are juggling ticket updates, customer calls, troubleshooting steps, escalations, and internal handoffs. Note Summeraizer solves that by turning raw notes into structured support documentation with help from noteS.

The frontend is a React, Vite, and TypeScript app with a dashboard, new summary form, saved notes, detail view, templates, settings, and a print/PDF view. I kept routing lightweight with hash routes so the app deploys cleanly as a static Netlify site.

For local data, I used browser-based SQLite through SQL.js. The notes table stores the raw notes, generated summary, metadata, action items, open questions, next steps, tags, AI mode, and timestamps. After writes, the SQLite database is exported and persisted to IndexedDB. That keeps the app local-first without PostgreSQL, Firebase, Supabase, or any hosted database.

For AI design, noteS uses a provider abstraction. Mock mode works without a key and extracts likely action items, open questions, next steps, and tags from the input. It also detects and redacts likely sensitive values such as API keys, passwords, tokens, bearer tokens, and private keys. The prompt rules tell noteS not to invent root causes, ticket IDs, customer names, system details, or resolutions. Real AI mode is supported through a tiny Netlify Function that reads the API key from server-side environment variables.

For reliability and demo readiness, the app can save notes locally, search and filter them, open a detail view, copy summaries, edit saved notes, export/import the SQLite database, and print a clean white document that can be saved as a PDF. Tests cover the mock summarizer and sensitive-info detection, and the production build passes.

Future improvements would be a stronger real AI provider flow, richer template-to-form prefill, ticketing system integrations, optional account sync, and workflow automation for follow-up tasks.
