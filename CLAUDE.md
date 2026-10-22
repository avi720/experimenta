# experimenta

Vite + React app on Supabase (Postgres + Auth), deployed on Vercel. Both CLIs are linked to this project (`vercel` → `experimenta`, `supabase` → ref `freuxiuhqjbtwolzyadc`).

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
