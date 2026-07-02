# manage-user

Edge Function responsável por alterar dados e inativar usuários.

- Admin gerencia qualquer usuário.
- Cliente gerencia apenas Avaliadores e Empreendedores do próprio programa.
- A própria conta não pode ser inativada.
- Inativação bloqueia o usuário no Supabase Auth e marca `profiles.active = false`.
- Requer o secret `HOWL_SERVICE_ROLE_KEY`, já usado pela função `create-user`.
