# Support Desk Console

Support Desk Console is a local-first ticketing practice app built to feel closer to an operational CRM/service desk workflow. It is not a Salesforce or NetSuite clone, but the layout and flow are intentionally similar enough for practice: queues, cases, accounts, statuses, priorities, SLAs, owners, work notes, customer updates, and escalations.

The original noteS AI helper remains available inside ticket detail pages for internal handoff summaries.

## What It Does

- Shows a service-console dashboard with queue metrics
- Seeds realistic practice tickets automatically
- Provides a dense ticket queue/list view with filters
- Supports ticket create, edit, detail, delete, and work-note activity
- Includes a local mock email inbox with Jane Doe, Jack Doe, and Tier 1 Support practice threads
- Runs an in-app email cycle every 15 minutes while the browser tab is open
- Exports ticket notes as `.txt` files for Windows Notepad
- Shows account/customer context across related tickets
- Includes lightweight knowledge playbooks for support practice
- Stores data locally in browser SQLite through SQL.js and IndexedDB
- Keeps AI mock mode working without an API key
- Supports optional Netlify Function AI calls for noteS handoff summaries

## Tech Stack

- React
- Vite
- TypeScript
- SQL.js browser SQLite
- IndexedDB persistence
- Netlify-ready static deployment
- Optional Netlify Function for server-side AI key handling
- Vitest

## Run Locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Verify

```bash
npm run test
npm run build
```

Current verification:

- `npm run test` passes
- `npm run build` passes

## Practice Workflow

1. Open **Service Console** to review case metrics.
2. Open **Ticket Queue** and filter by status, priority, queue, owner, or account.
3. Open or create a ticket and fill the Case Information fields using the structured customer-issue format.
4. Review the saved case information and activity notes.
5. Add internal notes or customer updates in the activity section.
6. Export a ticket as a `.txt` file and open it in Notepad for copy/paste practice.
7. Use **noteS Handoff** to generate a structured internal support summary.
8. Open **Email Inbox** to reply to Jane Doe, Jack Doe, or Tier 1 Support practice emails.
9. Use **Run Cycle Now** for a demo-safe email cycle, or leave the app open for the 15-minute automatic cycle.
10. Create or edit tickets to practice CRM-style case entry.
11. Use **Accounts** to review customer-level case history.
12. Use **Knowledge** for troubleshooting and escalation playbook practice.

## Local Data

Tickets and mock email threads are stored in browser SQLite. The database is persisted to IndexedDB on this browser profile. Clearing browser data can remove local tickets and email practice threads, so use Settings to export a SQLite backup if needed.

## Mock Email Loop

The Email Inbox is local-only training data, not a real email integration. Jane Doe and Jack Doe send simulated customer emails. Tier 1 Support sends internal help requests, triage notes, and handoff messages. While the app tab is open and visible, the React app runs one email cycle every 15 minutes. If the app is closed, there is no background worker and no email catch-up.

When you reply to a Jane, Jack, or Tier 1 thread, the reply is saved locally and queues a follow-up. The next in-app email cycle generates a response that references what you sent. **Run Cycle Now** exists so the workflow can be demonstrated without waiting 15 minutes.

## AI Key Handling

Mock mode works without a key. For real AI mode, use Netlify environment variables:

```env
VITE_AI_MODE=real
AI_PROVIDER=openai
OPENAI_API_KEY=replace_me
OPENAI_MODEL=gpt-4o-mini
```

Do not commit `.env`, `.env.example`, API keys, `.npmrc`, local agent prompts, SQLite exports, or secret files. The `.gitignore` is configured to keep those out of the first commit.

## Netlify Deployment

`netlify.toml` is configured with:

- Build command: `npm run build`
- Publish directory: `dist`
- Function directory: `netlify/functions`
- SPA redirect to `index.html`
- Node 22 for the current Vite toolchain

## Notes

This app is for practice and portfolio use. It is local-first and does not include multi-user auth, cloud sync, role-based permissions, or real CRM integrations yet.
