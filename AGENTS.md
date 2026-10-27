# AGENTS.md — experimenta

Guidance for coding agents working in this repository. Claude Code reads it through the
one-line `CLAUDE.md` next to it (`@AGENTS.md`); every nested `AGENTS.md` needs the same
companion — add one whenever you add a nested `AGENTS.md`.

Vite + React app on Supabase (Postgres + Auth), deployed on Vercel. Both CLIs are linked to this project (`vercel` → `experimenta`, `supabase` → ref `freuxiuhqjbtwolzyadc`).

## Branching — `dev` is the working branch

- `main` = production (Vercel deploys it). Never commit or push to `main` directly.
- `dev` = active development branch. Commit and push work directly on `dev` (`origin/dev`), verify all changes locally (`npm run dev` → `http://localhost:5173`, `npm run lint`, `npm run build`, `npm run test:run`), and once verified open a PR from `dev` → `main` for release.
- Every UI change is verified in a browser on the local dev server (`npm run dev` → `http://localhost:5173`) before opening a PR to `main`. Production is not a test environment.
- Note: `Closes #N` in a commit or PR closes the issue when merged into `main`.

## QA test user

- A dedicated QA account (admin role) exists for browser checks of signed-in and admin pages.
- Its credentials live only in the gitignored `.env.local` as `QA_USER_EMAIL` / `QA_USER_PASSWORD` — never commit them (the repo is public).
- Local dev (`npm run dev`) and production share the same Supabase project, so this is a real production account: use it for read/verify flows and clean up any runs or templates you create.

## Database changes — migration files only

The schema's source of truth is `supabase/migrations/`. Never edit the production schema through the SQL editor or MCP `apply_migration`/`execute_sql` DDL.

1. `supabase migration new <short_name>` — creates a timestamped file.
2. Write idempotent-friendly SQL in it (RLS policies for every new table).
3. Review the plan: `supabase db push --dry-run`.
4. Apply: `supabase db push` (ask the user before pushing to production).
5. Commit the migration file together with the code that needs it.

- `supabase db pull` / `db diff` need Docker, which is not installed on this machine — write migrations by hand instead.
- The Supabase GitHub integration's "Deploy to production" and "Automatic branching" stay OFF (branching compute is billed outside the spend cap).
- Regenerate types after schema changes with `supabase gen types typescript --linked` if the app starts using them.
