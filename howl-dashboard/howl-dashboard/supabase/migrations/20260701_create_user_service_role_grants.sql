-- Permissões mínimas usadas pela Edge Function public.create-user.
-- O service_role continua restrito ao código seguro do servidor e ignora o RLS.
grant usage on schema public to service_role;

grant select, insert, update
on table public.profiles
to service_role;

grant select
on table public.startups
to service_role;

grant select, insert, delete
on table public.profile_startups
to service_role;
