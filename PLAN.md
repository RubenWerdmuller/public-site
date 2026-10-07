# Samen op reis — MVP

1. Next.js App Router + TypeScript. Persistent embedded PostgreSQL (PGlite) locally, managed PostgreSQL (Neon) online. Parameterized SQL behind one small adapter instead of an ORM to avoid two separate local/hosted schemas.
2. Domain: users, avatars, hashed sessions, travel pairs, two membership slots, single-use invites, versioned questions/options, extensible attributes, answer snapshots, saved questions, daily assignments, preference estimates, insights, weekly reports, push subscriptions and idempotent delivery records.
3. Vertical slice: register/login → create/join duo → four daily dilemmas → private answer → partner answer → reveal → measured insights.
4. Add shared couch stack, history, report feedback, 60 distinct seeded questions, 12 local SVG avatars, manifest/offline shell/install guidance, Web Push and protected server scheduler.
5. Verify domain/security flows, lint, TypeScript, production build, desktop/mobile browser flows. Start local server on port 3100 for laptop and LAN phone preview.

Hosting target: Vercel Hobby + Neon Free for a personal two-person app. Use an external scheduler every 15 minutes for flexible push timing; Vercel Hobby cron alone only runs daily. Online setup requires the owner's accounts and environment values. No deployment or account provisioning is implied by local startup.
