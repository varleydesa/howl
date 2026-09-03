begin;

alter table if exists public.mentorship_sessions
  alter column duration_minutes set default 60;

alter table if exists public.mentorship_sessions
  drop constraint if exists mentorship_sessions_duration_minutes_check;

alter table if exists public.mentorship_sessions
  add constraint mentorship_sessions_duration_minutes_check
  check (duration_minutes between 15 and 360);

commit;
