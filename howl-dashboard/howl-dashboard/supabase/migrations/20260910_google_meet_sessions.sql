begin;

alter table public.mentorship_sessions
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_event_url text,
  add column if not exists google_meet_url text,
  add column if not exists google_calendar_synced_at timestamptz;

create index if not exists mentorship_sessions_google_calendar_event_idx
  on public.mentorship_sessions(google_calendar_event_id)
  where google_calendar_event_id is not null;

commit;
