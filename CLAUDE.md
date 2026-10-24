# experimenta

Vite + React app on Supabase (Postgres + Auth), deployed on Vercel. Both CLIs are linked to this project (`vercel` → `experimenta`, `supabase` → ref `freuxiuhqjbtwolzyadc`).

## Branching — `dev` is the working branch

- `main` = production (Vercel deploys it). Never commit or push to `main` directly.
- `dev` = active development branch. Commit and push work directly on `dev` (`origin/dev`), verify all changes locally (`npm run dev` → `http://localhost:5173`, `npm run lint`, `npm run build`, `npm run test:run`), and once verified open a PR from `dev` → `main` for release.
- Every UI change is verified in a browser on the local dev server (`npm run dev` → `http://localhost:5173`) before opening a PR to `main`. Production is not a test environment.
- Note: `Closes #N` in a commit or PR closes the issue when merged into `main`.

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
