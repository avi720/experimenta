# Experimenta

Virtual physics lab with interactive simulations (free fall, harmonic oscillator, quantum tunneling, double slit).

**Stack:** Vite + React 18 + React Router, Tailwind/shadcn UI, [Supabase](https://supabase.com) (Postgres + Auth), deployed on [Vercel](https://vercel.com).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm start` | Serve the production build (`vite preview`, port 4173) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint (enforces zero warnings) |
| `npm run lint:fix` | ESLint with automatic fixes |
| `npm test` | Run Vitest in interactive watch mode |
| `npm run test:run` | Run Vitest test suite once |
| `npm run typecheck` | TypeScript strict typecheck (`tsc -p tsconfig.json`) |

## Supabase setup

1. Create a Supabase project and link it: `supabase link --project-ref <ref>`.
2. Apply the migrations in [`supabase/migrations/`](./supabase/migrations) with `supabase db push`. The baseline migration creates:
   - `profiles` — one row per auth user (`role`, `subscription_tier`, `locale_preference`), created by a trigger on sign-up.
   - `experiment_templates` — the experiment catalogue (public read, admin write). `access_level` (`public` / `registered` / `premium`) is ready for gating experiments.
   - `experiment_runs` — saved simulation runs, private to their owner.
   - `app_settings` — global settings (single row).
   - Row Level Security on every table, plus seed data for the four built-in experiments.
3. Every new user signs up with `role = 'user'`; admins are promoted manually after they sign up:
   ```sql
   update public.profiles set role = 'admin' where email = 'someone@example.com';
   ```
4. In **Authentication → URL Configuration**, set the Site URL to your production domain and add `https://<your-domain>/**` (and `http://localhost:5173/**` for local dev) to the Redirect URLs.

## Access model

- Guests can browse every page and run the simulations, but nothing is stored for them.
- Signed-in users can save runs and see them on the **Results** page.
- Admins (`profiles.role = 'admin'`) manage the experiment catalogue under **AdminExperiments**.

## Deploying to Vercel

The repo includes `vercel.json` (Vite framework preset + SPA rewrite to `index.html`).
Set these environment variables in the Vercel project for Production and Preview:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Because Vite inlines `VITE_*` variables at build time, redeploy after changing them.
