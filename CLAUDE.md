# experimenta

Vite + React app on Supabase (Postgres + Auth), deployed on Vercel. Both CLIs are linked to this project (`vercel` → `experimenta`, `supabase` → ref `freuxiuhqjbtwolzyadc`).

## Branching — `dev` is the working branch

- `main` = production (Vercel deploys it). Never commit or push to `main` directly.
- `dev` = integration branch. Feature / remediation branches (e.g. `tech-debt/phase-1`) are cut from `dev` and merged back into `dev` via PR.
- Every UI change is verified in a browser on the local dev server (`npm run dev` → `http://localhost:5173`) before it is pushed. Production is not a test environment.
- `dev` → `main` is a separate PR, opened only after the work on `dev` has been verified locally and the owner approves the release.
- Note: `Closes #N` in a commit closes the issue only when it reaches `main`.

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
