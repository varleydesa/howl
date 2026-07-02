begin;

alter table public.profiles
  add column if not exists active boolean not null default true;

create index if not exists profiles_active_idx
  on public.profiles(active);

create or replace function private.current_profile_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
    and p.active
  limit 1
$$;

create or replace function private.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
    and p.active
  limit 1
$$;

drop policy if exists program_types_select_authenticated on public.program_types;
create policy program_types_select_authenticated
on public.program_types for select
to authenticated
using (private.current_profile_id() is not null);

drop policy if exists journeys_select_authenticated on public.journeys;
create policy journeys_select_authenticated
on public.journeys for select
to authenticated
using (private.current_profile_id() is not null);

drop policy if exists questions_select_authenticated on public.questions;
create policy questions_select_authenticated
on public.questions for select
to authenticated
using (private.current_profile_id() is not null);

drop policy if exists periods_select_authenticated on public.assessment_periods;
create policy periods_select_authenticated
on public.assessment_periods for select
to authenticated
using (private.current_profile_id() is not null);

commit;
