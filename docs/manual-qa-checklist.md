# Manual QA Checklist

Use this checklist before practicing or demoing Support Desk Console.

## Main Workflow

- Open **Service Console**.
- Confirm demo ticket metrics load.
- Open **Ticket Queue**.
- Filter by status, priority, queue, owner, and account.
- Open a ticket.
- Confirm case information, work note, resolution, tags, and activity are visible.
- Add an internal note.
- Export the ticket as `.txt` and confirm the file opens cleanly in Notepad.
- Use **noteS Handoff** and confirm a structured summary appears.
- Create a new ticket.
- Confirm the Case Information section includes Customer Issue, Customer Impact, Product / Setup Details, Details Provided, Troubleshooting Completed, Steps to Reproduce, Expected Result, Actual Result, Current Status, Next Step, Tier 2 Handoff Summary, and Professional Note.
- Edit the ticket and confirm changes persist.

## Saved Notes

This workflow has been replaced by **Ticket Queue**.

## Account Context

- Open **Accounts**.
- Confirm account cards show active cases, latest update, and related cases.

## Mock Email

- Open **Email Inbox**.
- Confirm Jane Doe, Jack Doe, and Tier 1 Support email threads load from local SQLite.
- Send a reply on one thread.
- Confirm the thread changes to Waiting on customer or Waiting on sender.
- Use **Run Cycle Now**.
- Confirm Jane, Jack, or Tier 1 Support sends a follow-up that references the reply.
- Refresh the app and confirm email threads persist.

## Knowledge

- Open **Knowledge**.
- Confirm support playbooks are visible.

## Settings

- Confirm AI key guidance is clear.
- Confirm no API key input is stored in the frontend.
- Export SQLite backup if needed.

## Verification Commands

```bash
npm run test
npm run build
npm audit --json
```

Expected:

- Tests pass.
- Build passes.
- Audit reports 0 vulnerabilities.
