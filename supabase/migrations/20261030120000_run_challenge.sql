-- "Find the unknown" runs: a run saved while one parameter was hidden records the challenge
-- (which parameter, its true value, the student's last guess and its error). Null for ordinary runs.
-- Shape: { unknown_key, true_value, guess, error_percent, attempts, revealed } (src/simulation/challenge.ts).

alter table public.experiment_runs
  add column if not exists challenge jsonb;

alter table public.experiment_runs
  drop constraint if exists experiment_runs_challenge_size;

alter table public.experiment_runs
  add constraint experiment_runs_challenge_size
    check (challenge is null or octet_length(challenge::text) <= 4096);
