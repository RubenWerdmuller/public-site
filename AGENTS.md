# Samen op reis
Independent personal travel PWA. Do not apply Cockpit architecture to this repository.
Keep the Dutch notebook style, server-side duo authorization, answer privacy until both have answered, persistent PostgreSQL storage, and Europe/Amsterdam time semantics.
Keep schema in lib/schema.ts and migrations additive. Run relevant tests, typecheck and build for changes. Never commit credentials or local database files.

## Reminder for the next app discussion

Recorded at the user's request on 2026-10-08. At the start of the next discussion about this app, remind the user in Dutch of these ideas before proceeding with that discussion:

- The longer trip consists of multiple stages (etappes), with different kinds of destinations and experiences. Add this perspective alongside the existing travel preferences; do not reduce the whole trip to one destination type.
- A progress report every other day (om de dag).
- The AI in the pipeline should research concrete destinations suitable for those stages and include destination suggestions in the reports.

These are ideas to discuss later, not authorization to implement them now. After delivering the reminder, remove this reminder instruction and keep the ideas available if they have not yet been addressed.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
