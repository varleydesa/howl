begin;

create table if not exists public.program_types (
  id text primary key,
  type text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id text primary key,
  program_type_id text not null references public.program_types(id) on delete restrict,
  name text not null,
  client text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.program_types (id, type)
values
  ('aceleracao', 'Aceleração'),
  ('advisor', 'Advisor'),
  ('residencia', 'Residência')
on conflict (id) do update set type = excluded.type;

insert into public.programs (id, program_type_id, name, client)
values ('programa-howl-atual', 'aceleracao', 'Programa HOWL Atual', 'HOWL')
on conflict (id) do nothing;

alter table public.startups
  add column if not exists program_id text references public.programs(id) on delete restrict;

update public.startups
set program_id = 'programa-howl-atual'
where program_id is null;

alter table public.startups
  alter column program_id set not null;

alter table public.profiles
  add column if not exists program_id text references public.programs(id) on delete restrict;

update public.profiles
set program_id = 'programa-howl-atual'
where role = 'avaliador'::public.app_role
  and program_id is null;

delete from public.profile_startups ps
using public.profiles p
where p.id = ps.profile_id
  and p.role = 'avaliador'::public.app_role;

create index if not exists startups_program_idx on public.startups(program_id);
create index if not exists profiles_program_idx on public.profiles(program_id);
create index if not exists programs_type_idx on public.programs(program_type_id);

drop trigger if exists program_types_set_updated_at on public.program_types;
create trigger program_types_set_updated_at
before update on public.program_types
for each row execute function private.set_updated_at();

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at
before update on public.programs
for each row execute function private.set_updated_at();

create or replace function private.can_access_program(target_program_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = private.current_profile_id()
        and p.program_id = target_program_id
    )
    or exists (
      select 1
      from public.profile_startups ps
      join public.startups s on s.id = ps.startup_id
      where ps.profile_id = private.current_profile_id()
        and s.program_id = target_program_id
    )
$$;

create or replace function private.can_access_startup(target_startup_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_admin()
    or exists (
      select 1
      from public.startups s
      join public.profiles p on p.id = private.current_profile_id()
      where s.id = target_startup_id
        and p.program_id = s.program_id
    )
    or exists (
      select 1
      from public.profile_startups ps
      where ps.profile_id = private.current_profile_id()
        and ps.startup_id = target_startup_id
    )
$$;

revoke all on function private.can_access_program(text) from public;
grant execute on function private.can_access_program(text) to authenticated;

alter table public.program_types enable row level security;
alter table public.programs enable row level security;

drop policy if exists program_types_select_authenticated on public.program_types;
create policy program_types_select_authenticated
on public.program_types for select
to authenticated
using (true);

drop policy if exists program_types_manage_admin on public.program_types;
create policy program_types_manage_admin
on public.program_types for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists programs_select_accessible on public.programs;
create policy programs_select_accessible
on public.programs for select
to authenticated
using (private.can_access_program(id));

drop policy if exists programs_manage_admin on public.programs;
create policy programs_manage_admin
on public.programs for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists startups_select_accessible on public.startups;
create policy startups_select_accessible
on public.startups for select
to authenticated
using (private.can_access_startup(id));

revoke all on public.program_types from anon;
revoke all on public.programs from anon;
grant select, insert, update, delete on public.program_types to authenticated;
grant select, insert, update, delete on public.programs to authenticated;

grant select on public.program_types to service_role;
grant select on public.programs to service_role;

commit;
