begin;

create table if not exists public.horda_applications (
  id text primary key,
  application_type text not null check (application_type in ('startup', 'mentor')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  name text not null,
  contact_name text not null default '',
  email text not null check (email = lower(email)),
  phone text not null default '',
  organization text not null default '',
  sector text not null default '',
  stage text not null default '',
  city text not null default '',
  state text not null default '',
  availability text not null default '',
  experience text not null default '',
  pitch text not null default '',
  program_id text references public.programs(id) on delete set null,
  approved_startup_id text references public.startups(id) on delete set null,
  approved_profile_id text references public.profiles(id) on delete set null,
  reviewed_by text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists horda_applications_status_idx
  on public.horda_applications(status);

create index if not exists horda_applications_type_idx
  on public.horda_applications(application_type);

create index if not exists horda_applications_program_idx
  on public.horda_applications(program_id);

drop trigger if exists horda_applications_set_updated_at on public.horda_applications;
create trigger horda_applications_set_updated_at
before update on public.horda_applications
for each row execute function private.set_updated_at();

alter table public.horda_applications enable row level security;

drop policy if exists horda_applications_insert_public on public.horda_applications;
create policy horda_applications_insert_public
on public.horda_applications for insert
to anon, authenticated
with check (
  status = 'pending'
  and program_id is null
  and reviewed_by is null
  and reviewed_at is null
  and approved_startup_id is null
  and approved_profile_id is null
  and rejection_reason = ''
);

drop policy if exists horda_applications_select_manager on public.horda_applications;
create policy horda_applications_select_manager
on public.horda_applications for select
to authenticated
using (
  private.is_admin()
  or (
    program_id is not null
    and private.can_manage_program(program_id)
  )
);

drop policy if exists horda_applications_update_manager on public.horda_applications;
create policy horda_applications_update_manager
on public.horda_applications for update
to authenticated
using (
  private.is_admin()
  or (
    program_id is not null
    and private.can_manage_program(program_id)
  )
)
with check (
  private.is_admin()
  or (
    program_id is not null
    and private.can_manage_program(program_id)
  )
);

revoke all on public.horda_applications from anon;
revoke all on public.horda_applications from authenticated;
grant insert on public.horda_applications to anon;
grant insert, select, update on public.horda_applications to authenticated;
grant select, insert, update, delete on public.horda_applications to service_role;

commit;
