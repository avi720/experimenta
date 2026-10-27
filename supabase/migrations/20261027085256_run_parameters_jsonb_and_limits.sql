-- T59: bound user-supplied run data and store run parameters as jsonb (Open Question 16).

-- Text that does not parse as JSON is kept as a jsonb string so nothing is lost;
-- the Results page already reports such runs as "malformed parameters".
create or replace function pg_temp.to_jsonb_lenient(value text)
returns jsonb
language plpgsql
as $$
begin
  if value is null or btrim(value) = '' then
    return '{}'::jsonb;
  end if;
  return value::jsonb;
exception when others then
  return to_jsonb(value);
end;
$$;

alter table public.experiment_runs
  alter column parameters_json drop default,
  alter column parameters_json type jsonb using pg_temp.to_jsonb_lenient(parameters_json),
  alter column parameters_json set default '{}'::jsonb;

-- Size limits: notes and parameters 64 kB each; stored samples 2 MB (500 samples use ~60 kB).
alter table public.experiment_runs
  drop constraint if exists experiment_runs_notes_size,
  drop constraint if exists experiment_runs_parameters_size,
  drop constraint if exists experiment_runs_results_size;

alter table public.experiment_runs
  add constraint experiment_runs_notes_size
    check (notes is null or octet_length(notes) <= 65536),
  add constraint experiment_runs_parameters_size
    check (octet_length(parameters_json::text) <= 65536),
  add constraint experiment_runs_results_size
    check (results_url is null or octet_length(results_url) <= 2097152);
