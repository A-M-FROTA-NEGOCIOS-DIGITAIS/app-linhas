-- Busca a conta pelo e-mail sem listar usuários. O auth.admin.listUsers() devolve
-- só a primeira página (50), então quem estivesse além dela não seria encontrado.
-- Só o service_role executa (usado pelas Edge Functions).
create or replace function public.user_id_por_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1
$$;

revoke execute on function public.user_id_por_email(text) from public, anon, authenticated;
grant execute on function public.user_id_por_email(text) to service_role;
