begin;

alter type public.app_role add value if not exists 'cliente';

commit;

begin;

alter table public.profiles
  drop constraint if exists profiles_program_required_for_scoped_roles;
alter table public.profiles
  add constraint profiles_program_required_for_scoped_roles
  check (
    role not in ('cliente'::public.app_role, 'avaliador'::public.app_role)
    or program_id is not null
  );

create or replace function private.is_client()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_role() = 'cliente'::public.app_role, false)
$$;

create or replace function private.current_program_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.program_id
  from public.profiles p
  where p.id = private.current_profile_id()
  limit 1
$$;

create or replace function private.profile_program_id(target_profile_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    p.program_id,
    (
      select s.program_id
      from public.profile_startups ps
      join public.startups s on s.id = ps.startup_id
      where ps.profile_id = p.id
      order by ps.created_at
      limit 1
    )
  )
  from public.profiles p
  where p.id = target_profile_id
  limit 1
$$;

create or replace function private.can_manage_program(target_program_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_admin()
    or (
      private.is_client()
      and private.current_program_id() = target_program_id
    )
$$;

create or replace function private.can_manage_profile(target_profile_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.is_admin()
    or (
      private.is_client()
      and private.current_program_id() = private.profile_program_id(target_profile_id)
    )
$$;

revoke all on function private.is_client() from public;
revoke all on function private.current_program_id() from public;
revoke all on function private.profile_program_id(text) from public;
revoke all on function private.can_manage_program(text) from public;
revoke all on function private.can_manage_profile(text) from public;
grant execute on function private.is_client() to authenticated;
grant execute on function private.current_program_id() to authenticated;
grant execute on function private.profile_program_id(text) to authenticated;
grant execute on function private.can_manage_program(text) to authenticated;
grant execute on function private.can_manage_profile(text) to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
on public.profiles for select
to authenticated
using (
  id = private.current_profile_id()
  or private.can_manage_profile(id)
);

drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists profiles_update_admin_or_client on public.profiles;
create policy profiles_update_admin_or_client
on public.profiles for update
to authenticated
using (private.can_manage_profile(id))
with check (private.can_manage_profile(id));

drop policy if exists startups_manage_admin on public.startups;
drop policy if exists startups_manage_admin_or_client on public.startups;
create policy startups_manage_admin_or_client
on public.startups for all
to authenticated
using (private.can_manage_program(program_id))
with check (private.can_manage_program(program_id));

drop policy if exists profile_startups_manage_admin on public.profile_startups;
drop policy if exists profile_startups_manage_admin_or_client on public.profile_startups;
create policy profile_startups_manage_admin_or_client
on public.profile_startups for all
to authenticated
using (
  private.can_manage_profile(profile_id)
  and exists (
    select 1
    from public.startups s
    where s.id = startup_id
      and private.can_manage_program(s.program_id)
  )
)
with check (
  private.can_manage_profile(profile_id)
  and exists (
    select 1
    from public.startups s
    where s.id = startup_id
      and private.can_manage_program(s.program_id)
  )
);

drop policy if exists cycles_manage_admin on public.assessment_cycles;
drop policy if exists cycles_manage_admin_or_client on public.assessment_cycles;
create policy cycles_manage_admin_or_client
on public.assessment_cycles for all
to authenticated
using (
  exists (
    select 1
    from public.startups s
    where s.id = startup_id
      and private.can_manage_program(s.program_id)
  )
)
with check (
  exists (
    select 1
    from public.startups s
    where s.id = startup_id
      and private.can_manage_program(s.program_id)
  )
);

commit;
