create or replace function private.can_view_linked_mentor_profile(target_profile_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.current_role() = 'empreendedor'::public.app_role
    and exists (
      select 1
      from public.profile_startups ps
      join public.mentor_startup_links link
        on link.startup_id = ps.startup_id
      join public.profiles mentor
        on mentor.id = link.mentor_profile_id
      where ps.profile_id = private.current_profile_id()
        and link.mentor_profile_id = target_profile_id
        and link.status = 'active'
        and mentor.role = 'avaliador'::public.app_role
        and mentor.active is not false
    ),
    false
  )
$$;

revoke all on function private.can_view_linked_mentor_profile(text) from public;
grant execute on function private.can_view_linked_mentor_profile(text) to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select
on public.profiles for select
to authenticated
using (
  id = private.current_profile_id()
  or private.can_manage_profile(id)
  or private.can_view_linked_mentor_profile(id)
);
