-- Admins are promoted manually (T37): new sign-ups always get role 'user'.
-- Promote with: update public.profiles set role = 'admin' where email = '...';

-- Stop reading admin_emails before dropping it, so sign-up never breaks.
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
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop table if exists public.admin_emails;
