-- =====================================================================
-- Experimenta — Supabase schema
-- Replaces the Base44 entities: User, ExperimentTemplate, ExperimentRun,
-- AppSettings. Column names (created_date / updated_date / created_by)
-- intentionally match the Base44 conventions the frontend already reads.
-- Idempotent: safe to run more than once.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_date := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles (1:1 with auth.users) — replaces the Base44 User entity
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  full_name         text,
  role              text not null default 'user'
                    check (role in ('user', 'admin')),
  subscription_tier text not null default 'free'
                    check (subscription_tier in ('free', 'premium')),
  locale_preference text not null default 'he'
                    check (locale_preference in ('he', 'en')),
  created_date      timestamptz not null default now(),
  updated_date      timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- is_admin(): SECURITY DEFINER so RLS policies can call it without recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- Emails that are promoted to admin automatically on sign-up.
create table if not exists public.admin_emails (
  email text primary key
);
alter table public.admin_emails enable row level security;
-- No policies: only reachable from SECURITY DEFINER functions / service role.

insert into public.admin_emails (email)
values ('avi.paz159@gmail.com')
on conflict do nothing;

-- Create a profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email))
        then 'admin'
      else 'user'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own profile, but never their role or subscription tier.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() and (select auth.role()) <> 'service_role' then
    new.role := old.role;
    new.subscription_tier := old.subscription_tier;
    new.email := old.email;
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

drop trigger if exists profiles_set_updated_date on public.profiles;
create trigger profiles_set_updated_date
  before update on public.profiles
  for each row execute function public.set_updated_date();

-- ---------------------------------------------------------------------
-- experiment_templates — replaces ExperimentTemplate
-- ---------------------------------------------------------------------
create table if not exists public.experiment_templates (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text,
  type               text,
  category           text,
  visualization_type text default '3d',
  engine             text,
  -- [{ key, type, unit, default, min, max, step, options[], i18n_labels{he,en}, tooltip{he,en}, is_active }]
  parameters         jsonb not null default '[]'::jsonb,
  -- { he: { title, short_desc, steps[], safety_notes }, en: {...} }
  i18n_texts         jsonb not null default '{}'::jsonb,
  outputs            jsonb not null default '[]'::jsonb,
  -- [{ name_he, name_en, values{} }]
  presets            jsonb not null default '[]'::jsonb,
  tags               jsonb not null default '[]'::jsonb,
  thumbnail_url      text,
  is_active          boolean not null default true,
  -- Future gating: public = guests, registered = signed-in, premium = subscribers
  access_level       text not null default 'public'
                     check (access_level in ('public', 'registered', 'premium')),
  created_date       timestamptz not null default now(),
  updated_date       timestamptz not null default now(),
  created_by         uuid default auth.uid() references auth.users (id) on delete set null
);

create index if not exists experiment_templates_active_idx
  on public.experiment_templates (is_active);

drop trigger if exists experiment_templates_set_updated_date on public.experiment_templates;
create trigger experiment_templates_set_updated_date
  before update on public.experiment_templates
  for each row execute function public.set_updated_date();

-- ---------------------------------------------------------------------
-- experiment_runs — replaces ExperimentRun (saved simulation runs)
-- ---------------------------------------------------------------------
create table if not exists public.experiment_runs (
  id               uuid primary key default gen_random_uuid(),
  experiment_slug  text references public.experiment_templates (slug)
                   on update cascade on delete set null,
  parameters_json  text not null default '{}',
  samples_count    integer not null default 0 check (samples_count >= 0),
  notes            text default '',
  results_url      text,
  created_date     timestamptz not null default now(),
  updated_date     timestamptz not null default now(),
  created_by       uuid not null default auth.uid()
                   references auth.users (id) on delete cascade
);

create index if not exists experiment_runs_owner_date_idx
  on public.experiment_runs (created_by, created_date desc);
create index if not exists experiment_runs_slug_idx
  on public.experiment_runs (experiment_slug);

drop trigger if exists experiment_runs_set_updated_date on public.experiment_runs;
create trigger experiment_runs_set_updated_date
  before update on public.experiment_runs
  for each row execute function public.set_updated_date();

-- ---------------------------------------------------------------------
-- app_settings — replaces AppSettings (single row)
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  id                  uuid primary key default gen_random_uuid(),
  virtual_lab_enabled boolean not null default true,
  locale_default      text not null default 'he' check (locale_default in ('he', 'en')),
  created_date        timestamptz not null default now(),
  updated_date        timestamptz not null default now()
);

drop trigger if exists app_settings_set_updated_date on public.app_settings;
create trigger app_settings_set_updated_date
  before update on public.app_settings
  for each row execute function public.set_updated_date();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles             enable row level security;
alter table public.experiment_templates enable row level security;
alter table public.experiment_runs      enable row level security;
alter table public.app_settings         enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- experiment_templates -------------------------------------------------
-- Catalogue is readable by everyone (guests included) so locked experiments
-- can still be listed; gating happens in the UI by access_level.
drop policy if exists "templates: public read" on public.experiment_templates;
create policy "templates: public read" on public.experiment_templates
  for select to anon, authenticated
  using (true);

drop policy if exists "templates: admin insert" on public.experiment_templates;
create policy "templates: admin insert" on public.experiment_templates
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "templates: admin update" on public.experiment_templates;
create policy "templates: admin update" on public.experiment_templates
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "templates: admin delete" on public.experiment_templates;
create policy "templates: admin delete" on public.experiment_templates
  for delete to authenticated
  using ((select public.is_admin()));

-- experiment_runs ------------------------------------------------------
-- Guests store nothing: every operation requires an authenticated owner.
drop policy if exists "runs: read own or admin" on public.experiment_runs;
create policy "runs: read own or admin" on public.experiment_runs
  for select to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "runs: insert own" on public.experiment_runs;
create policy "runs: insert own" on public.experiment_runs
  for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "runs: update own" on public.experiment_runs;
create policy "runs: update own" on public.experiment_runs
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

drop policy if exists "runs: delete own or admin" on public.experiment_runs;
create policy "runs: delete own or admin" on public.experiment_runs
  for delete to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

-- app_settings ---------------------------------------------------------
drop policy if exists "settings: public read" on public.app_settings;
create policy "settings: public read" on public.app_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "settings: admin write" on public.app_settings;
create policy "settings: admin write" on public.app_settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Helper functions should not be callable directly by API clients.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function public.set_updated_date() from public, anon, authenticated;

-- =====================================================================
-- Seed data
-- =====================================================================
insert into public.app_settings (virtual_lab_enabled, locale_default)
select true, 'he'
where not exists (select 1 from public.app_settings);

insert into public.experiment_templates
  (slug, name, type, category, visualization_type, engine, parameters, i18n_texts, outputs, presets, tags, is_active, access_level)
values
(
  'free-fall', 'Free Fall', 'simulation', 'ClassicalMechanics', '3d', 'freeFall',
  '[
    {"key":"h0","type":"float","unit":"m","default":"50","min":"1","max":"500","step":"1","options":[],"i18n_labels":{"he":"גובה התחלתי","en":"Initial height"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"v0","type":"float","unit":"m/s","default":"0","min":"-50","max":"50","step":"0.5","options":[],"i18n_labels":{"he":"מהירות התחלתית","en":"Initial velocity"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"g","type":"float","unit":"m/s²","default":"9.81","min":"0.1","max":"30","step":"0.01","options":[],"i18n_labels":{"he":"תאוצת כובד","en":"Gravity"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"m","type":"float","unit":"kg","default":"1","min":"0.1","max":"100","step":"0.1","options":[],"i18n_labels":{"he":"מסה","en":"Mass"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"c","type":"float","unit":"kg/s","default":"0","min":"0","max":"5","step":"0.01","options":[],"i18n_labels":{"he":"מקדם גרר","en":"Drag coefficient"},"tooltip":{"he":"","en":""},"is_active":true}
  ]'::jsonb,
  '{"he":{"title":"נפילה חופשית","short_desc":"חקרו את תנועת גוף הנופל תחת השפעת כוח הכובד.","steps":["בחרו גובה התחלתי","הפעילו את הסימולציה","נתחו את הגרפים"],"safety_notes":""},
    "en":{"title":"Free Fall","short_desc":"Explore the motion of a body falling under gravity.","steps":["Choose an initial height","Run the simulation","Analyse the graphs"],"safety_notes":""}}'::jsonb,
  '["position","velocity","energy_kinetic","energy_potential"]'::jsonb,
  '[{"name_he":"כדור הארץ","name_en":"Earth","values":{"g":9.81}},{"name_he":"הירח","name_en":"Moon","values":{"g":1.62}},{"name_he":"מאדים","name_en":"Mars","values":{"g":3.71}}]'::jsonb,
  '["mechanics","gravity"]'::jsonb, true, 'public'
),
(
  'sho', 'Simple Harmonic Oscillator', 'simulation', 'ClassicalMechanics', '3d', 'sho',
  '[
    {"key":"m","type":"float","unit":"kg","default":"1","min":"0.1","max":"20","step":"0.1","options":[],"i18n_labels":{"he":"מסה","en":"Mass"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"k","type":"float","unit":"N/m","default":"10","min":"0.1","max":"200","step":"0.1","options":[],"i18n_labels":{"he":"קבוע קפיץ","en":"Spring constant"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"x0","type":"float","unit":"m","default":"1","min":"-5","max":"5","step":"0.1","options":[],"i18n_labels":{"he":"העתק התחלתי","en":"Initial displacement"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"v0","type":"float","unit":"m/s","default":"0","min":"-10","max":"10","step":"0.1","options":[],"i18n_labels":{"he":"מהירות התחלתית","en":"Initial velocity"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"c","type":"float","unit":"kg/s","default":"0","min":"0","max":"10","step":"0.05","options":[],"i18n_labels":{"he":"מקדם ריסון","en":"Damping"},"tooltip":{"he":"","en":""},"is_active":true}
  ]'::jsonb,
  '{"he":{"title":"מתנד הרמוני פשוט","short_desc":"מסה על קפיץ — חקרו תנודות, תדירות ושימור אנרגיה.","steps":["קבעו מסה וקבוע קפיץ","הפעילו את הסימולציה","השוו לנוסחה התיאורטית"],"safety_notes":""},
    "en":{"title":"Simple Harmonic Oscillator","short_desc":"A mass on a spring — explore oscillations, frequency and energy.","steps":["Set mass and spring constant","Run the simulation","Compare with theory"],"safety_notes":""}}'::jsonb,
  '["position","velocity","energy_total"]'::jsonb,
  '[{"name_he":"קפיץ רך","name_en":"Soft spring","values":{"k":2}},{"name_he":"קפיץ קשיח","name_en":"Stiff spring","values":{"k":100}},{"name_he":"מרוסן","name_en":"Damped","values":{"c":0.5}}]'::jsonb,
  '["mechanics","oscillations"]'::jsonb, true, 'public'
),
(
  'quantum-tunneling', 'Quantum Tunneling', 'simulation', 'QuantumMechanics', '3d', 'quantumTunneling',
  '[
    {"key":"v","type":"float","unit":"c","default":"0.01","min":"0.001","max":"0.1","step":"0.001","options":[],"i18n_labels":{"he":"מהירות החלקיק","en":"Particle speed"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"m","type":"float","unit":"10⁵ eV/c²","default":"5.11","min":"0.1","max":"20","step":"0.01","options":[],"i18n_labels":{"he":"מסת החלקיק","en":"Particle mass"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"V0","type":"float","unit":"eV","default":"1","min":"0.01","max":"10","step":"0.01","options":[],"i18n_labels":{"he":"גובה המחסום","en":"Barrier height"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"L","type":"float","unit":"µm","default":"0.005","min":"0.0001","max":"0.05","step":"0.0001","options":[],"i18n_labels":{"he":"רוחב המחסום","en":"Barrier width"},"tooltip":{"he":"","en":""},"is_active":true}
  ]'::jsonb,
  '{"he":{"title":"מנהור קוונטי","short_desc":"חלקיק פוגש מחסום פוטנציאל — מה ההסתברות לעבור?","steps":["בחרו גובה ורוחב מחסום","הפעילו את הסימולציה","בדקו את מקדם המעבר"],"safety_notes":""},
    "en":{"title":"Quantum Tunneling","short_desc":"A particle meets a potential barrier — what is the chance it passes?","steps":["Choose barrier height and width","Run the simulation","Inspect the transmission coefficient"],"safety_notes":""}}'::jsonb,
  '["transmission","reflection"]'::jsonb,
  '[{"name_he":"אלקטרון","name_en":"Electron","values":{"m":5.11}}]'::jsonb,
  '["quantum"]'::jsonb, true, 'public'
),
(
  'double-slit', 'Double Slit', 'simulation', 'Optics', '2d', 'doubleSlit',
  '[
    {"key":"wavelength","type":"float","unit":"nm","default":"500","min":"380","max":"750","step":"1","options":[],"i18n_labels":{"he":"אורך גל","en":"Wavelength"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"slit_separation","type":"float","unit":"nm","default":"2000","min":"500","max":"10000","step":"10","options":[],"i18n_labels":{"he":"מרחק בין הסדקים","en":"Slit separation"},"tooltip":{"he":"","en":""},"is_active":true},
    {"key":"screen_distance","type":"float","unit":"m","default":"1","min":"0.1","max":"5","step":"0.1","options":[],"i18n_labels":{"he":"מרחק למסך","en":"Screen distance"},"tooltip":{"he":"","en":""},"is_active":true}
  ]'::jsonb,
  '{"he":{"title":"ניסוי שני הסדקים","short_desc":"התאבכות אור דרך שני סדקים — הדגמה לטבע הגלי של האור.","steps":["בחרו אורך גל","שנו את המרחק בין הסדקים","צפו בדגם ההתאבכות"],"safety_notes":""},
    "en":{"title":"Double Slit","short_desc":"Light interference through two slits — the wave nature of light.","steps":["Choose a wavelength","Change the slit separation","Observe the interference pattern"],"safety_notes":""}}'::jsonb,
  '["intensity"]'::jsonb,
  '[{"name_he":"אור אדום","name_en":"Red light","values":{"wavelength":650}},{"name_he":"אור ירוק","name_en":"Green light","values":{"wavelength":530}}]'::jsonb,
  '["optics","waves"]'::jsonb, true, 'public'
)
on conflict (slug) do nothing;
