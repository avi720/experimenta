-- T38 (OQ 3): Only admins may read inactive experiment templates (is_active = false).
-- Active templates (is_active = true) remain readable by everyone (anon and authenticated)
-- so locked experiments (registered / premium) appear in the Lab catalogue; running them
-- is gated by access_level in the workspace (T39).

drop policy if exists "templates: public read" on public.experiment_templates;
create policy "templates: public read" on public.experiment_templates
  for select to anon, authenticated
  using (is_active = true or (select public.is_admin()));
