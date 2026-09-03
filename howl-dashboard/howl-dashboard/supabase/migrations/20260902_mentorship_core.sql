begin;

create table if not exists public.mentor_startup_links (
  id text primary key,
  program_id text not null references public.programs(id) on delete cascade,
  startup_id text not null references public.startups(id) on delete cascade,
  mentor_profile_id text not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text not null default '',
  created_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentorship_sessions (
  id text primary key,
  link_id text not null references public.mentor_startup_links(id) on delete cascade,
  program_id text not null references public.programs(id) on delete cascade,
  startup_id text not null references public.startups(id) on delete cascade,
  mentor_profile_id text not null references public.profiles(id) on delete cascade,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'canceled')),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 360),
  topic text not null,
  agenda text not null default '',
  summary text not null default '',
  decisions text not null default '',
  next_steps text not null default '',
  created_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentorship_tasks (
  id text primary key,
  session_id text not null references public.mentorship_sessions(id) on delete cascade,
  program_id text not null references public.programs(id) on delete cascade,
  startup_id text not null references public.startups(id) on delete cascade,
  mentor_profile_id text not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  created_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mentor_startup_links_program_idx
  on public.mentor_startup_links(program_id);
create index if not exists mentor_startup_links_startup_idx
  on public.mentor_startup_links(startup_id);
create index if not exists mentor_startup_links_mentor_idx
  on public.mentor_startup_links(mentor_profile_id);
create unique index if not exists mentor_startup_links_unique_active_idx
  on public.mentor_startup_links(startup_id, mentor_profile_id)
  where status = 'active';

create index if not exists mentorship_sessions_link_idx
  on public.mentorship_sessions(link_id);
create index if not exists mentorship_sessions_program_idx
  on public.mentorship_sessions(program_id);
create index if not exists mentorship_sessions_startup_idx
  on public.mentorship_sessions(startup_id);
create index if not exists mentorship_sessions_mentor_idx
  on public.mentorship_sessions(mentor_profile_id);
create index if not exists mentorship_sessions_scheduled_idx
  on public.mentorship_sessions(scheduled_at);

create index if not exists mentorship_tasks_session_idx
  on public.mentorship_tasks(session_id);
create index if not exists mentorship_tasks_program_idx
  on public.mentorship_tasks(program_id);
create index if not exists mentorship_tasks_startup_idx
  on public.mentorship_tasks(startup_id);
create index if not exists mentorship_tasks_mentor_idx
  on public.mentorship_tasks(mentor_profile_id);
create index if not exists mentorship_tasks_status_idx
  on public.mentorship_tasks(status);

drop trigger if exists mentor_startup_links_set_updated_at on public.mentor_startup_links;
create trigger mentor_startup_links_set_updated_at
before update on public.mentor_startup_links
for each row execute function private.set_updated_at();

drop trigger if exists mentorship_sessions_set_updated_at on public.mentorship_sessions;
create trigger mentorship_sessions_set_updated_at
before update on public.mentorship_sessions
for each row execute function private.set_updated_at();

drop trigger if exists mentorship_tasks_set_updated_at on public.mentorship_tasks;
create trigger mentorship_tasks_set_updated_at
before update on public.mentorship_tasks
for each row execute function private.set_updated_at();

alter table public.mentor_startup_links enable row level security;
alter table public.mentorship_sessions enable row level security;
alter table public.mentorship_tasks enable row level security;

drop policy if exists mentor_startup_links_select_scoped on public.mentor_startup_links;
create policy mentor_startup_links_select_scoped
on public.mentor_startup_links for select
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
        and ps.startup_id = mentor_startup_links.startup_id
    )
  )
);

drop policy if exists mentor_startup_links_manage_program on public.mentor_startup_links;
create policy mentor_startup_links_manage_program
on public.mentor_startup_links for all
to authenticated
using (private.can_manage_program(program_id))
with check (
  private.can_manage_program(program_id)
  and exists (
    select 1
    from public.startups s
    where s.id = startup_id
      and s.program_id = program_id
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = mentor_profile_id
      and p.role = 'avaliador'::public.app_role
      and p.program_id = program_id
      and p.active is not false
  )
);

drop policy if exists mentorship_sessions_select_scoped on public.mentorship_sessions;
create policy mentorship_sessions_select_scoped
on public.mentorship_sessions for select
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
        and ps.startup_id = mentorship_sessions.startup_id
    )
  )
);

drop policy if exists mentorship_sessions_insert_scoped on public.mentorship_sessions;
create policy mentorship_sessions_insert_scoped
on public.mentorship_sessions for insert
to authenticated
with check (
  (
    private.can_manage_program(program_id)
    or mentor_profile_id = private.current_profile_id()
  )
  and exists (
    select 1
    from public.mentor_startup_links link
    where link.id = link_id
      and link.status = 'active'
      and link.program_id = program_id
      and link.startup_id = startup_id
      and link.mentor_profile_id = mentor_profile_id
  )
);

drop policy if exists mentorship_sessions_update_scoped on public.mentorship_sessions;
create policy mentorship_sessions_update_scoped
on public.mentorship_sessions for update
to authenticated
using (
  private.can_manage_program(program_id)
  or mentor_profile_id = private.current_profile_id()
)
with check (
  (
    private.can_manage_program(program_id)
    or mentor_profile_id = private.current_profile_id()
  )
  and exists (
    select 1
    from public.mentor_startup_links link
    where link.id = link_id
      and link.program_id = program_id
      and link.startup_id = startup_id
      and link.mentor_profile_id = mentor_profile_id
  )
);

drop policy if exists mentorship_tasks_select_scoped on public.mentorship_tasks;
create policy mentorship_tasks_select_scoped
on public.mentorship_tasks for select
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
        and ps.startup_id = mentorship_tasks.startup_id
    )
  )
);

drop policy if exists mentorship_tasks_insert_scoped on public.mentorship_tasks;
create policy mentorship_tasks_insert_scoped
on public.mentorship_tasks for insert
to authenticated
with check (
  (
    private.can_manage_program(program_id)
    or mentor_profile_id = private.current_profile_id()
  )
  and exists (
    select 1
    from public.mentorship_sessions session
    where session.id = session_id
      and session.program_id = program_id
      and session.startup_id = startup_id
      and session.mentor_profile_id = mentor_profile_id
      and session.status <> 'canceled'
  )
);

drop policy if exists mentorship_tasks_update_scoped on public.mentorship_tasks;
create policy mentorship_tasks_update_scoped
on public.mentorship_tasks for update
to authenticated
using (
  private.can_manage_program(program_id)
  or mentor_profile_id = private.current_profile_id()
)
with check (
  private.can_manage_program(program_id)
  or mentor_profile_id = private.current_profile_id()
);

revoke all on public.mentor_startup_links from anon;
revoke all on public.mentorship_sessions from anon;
revoke all on public.mentorship_tasks from anon;

grant select, insert, update, delete on public.mentor_startup_links to authenticated;
grant select, insert, update, delete on public.mentorship_sessions to authenticated;
grant select, insert, update, delete on public.mentorship_tasks to authenticated;

grant select, insert, update, delete on public.mentor_startup_links to service_role;
grant select, insert, update, delete on public.mentorship_sessions to service_role;
grant select, insert, update, delete on public.mentorship_tasks to service_role;

commit;
