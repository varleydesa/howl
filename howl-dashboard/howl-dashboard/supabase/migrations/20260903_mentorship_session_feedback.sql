begin;

create table if not exists public.mentorship_session_feedback (
  id text primary key,
  session_id text not null references public.mentorship_sessions(id) on delete cascade,
  program_id text not null references public.programs(id) on delete cascade,
  startup_id text not null references public.startups(id) on delete cascade,
  mentor_profile_id text not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mentorship_session_feedback_session_idx
  on public.mentorship_session_feedback(session_id);
create index if not exists mentorship_session_feedback_startup_idx
  on public.mentorship_session_feedback(startup_id);
create index if not exists mentorship_session_feedback_mentor_idx
  on public.mentorship_session_feedback(mentor_profile_id);

drop trigger if exists mentorship_session_feedback_set_updated_at on public.mentorship_session_feedback;
create trigger mentorship_session_feedback_set_updated_at
before update on public.mentorship_session_feedback
for each row execute function private.set_updated_at();

alter table public.mentorship_session_feedback enable row level security;

drop policy if exists mentorship_session_feedback_select_scoped on public.mentorship_session_feedback;
create policy mentorship_session_feedback_select_scoped
on public.mentorship_session_feedback for select
to authenticated
using (
  private.can_manage_program(program_id)
  or mentor_profile_id = private.current_profile_id()
  or (
    private.current_role() = 'empreendedor'::public.app_role
    and exists (
      select 1
      from public.profile_startups ps
      where ps.profile_id = private.current_profile_id()
        and ps.startup_id = mentorship_session_feedback.startup_id
    )
  )
);

drop policy if exists mentorship_session_feedback_insert_scoped on public.mentorship_session_feedback;
create policy mentorship_session_feedback_insert_scoped
on public.mentorship_session_feedback for insert
to authenticated
with check (
  (
    private.can_manage_program(program_id)
    or (
      private.current_role() = 'empreendedor'::public.app_role
      and exists (
        select 1
        from public.profile_startups ps
        where ps.profile_id = private.current_profile_id()
          and ps.startup_id = mentorship_session_feedback.startup_id
      )
    )
  )
  and exists (
    select 1
    from public.mentorship_sessions session
    where session.id = session_id
      and session.program_id = program_id
      and session.startup_id = startup_id
      and session.mentor_profile_id = mentor_profile_id
      and session.status = 'completed'
  )
);

drop policy if exists mentorship_session_feedback_update_scoped on public.mentorship_session_feedback;
create policy mentorship_session_feedback_update_scoped
on public.mentorship_session_feedback for update
to authenticated
using (
  private.can_manage_program(program_id)
  or (
    private.current_role() = 'empreendedor'::public.app_role
    and exists (
      select 1
      from public.profile_startups ps
      where ps.profile_id = private.current_profile_id()
        and ps.startup_id = mentorship_session_feedback.startup_id
    )
  )
)
with check (
  (
    private.can_manage_program(program_id)
    or (
      private.current_role() = 'empreendedor'::public.app_role
      and exists (
        select 1
        from public.profile_startups ps
        where ps.profile_id = private.current_profile_id()
          and ps.startup_id = mentorship_session_feedback.startup_id
      )
    )
  )
  and exists (
    select 1
    from public.mentorship_sessions session
    where session.id = session_id
      and session.program_id = program_id
      and session.startup_id = startup_id
      and session.mentor_profile_id = mentor_profile_id
      and session.status = 'completed'
  )
);

revoke all on public.mentorship_session_feedback from anon;
grant select, insert, update, delete on public.mentorship_session_feedback to authenticated;
grant select, insert, update, delete on public.mentorship_session_feedback to service_role;

commit;
