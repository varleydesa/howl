# create-user

Edge Function usada pelo HOWL para permitir que apenas usuários `admin` criem novos acessos.

## Segurança

- O frontend chama apenas `supabase.functions.invoke("create-user")`.
- A função valida o JWT do usuário logado.
- A função consulta `public.profiles` e só prossegue se o chamador tiver `role = 'admin'` ou `role = 'cliente'`.
- O Admin pode criar qualquer perfil; o Cliente pode criar somente Avaliadores e Empreendedores vinculados ao próprio programa.
- A chave `service_role` fica apenas como segredo da Edge Function.
- A chave `service_role` nunca deve ser colocada em `app.js`, `supabase-config.js` ou qualquer arquivo público.

## Deploy pelo painel

1. Abra o projeto no Supabase.
2. Vá em `Edge Functions`.
3. Clique em `Create a new function` ou `Deploy a function`.
4. Nomeie a função como `create-user`.
5. Cole o conteúdo de `index.ts`.
6. Publique/deploy a função.

A função usa a secret `HOWL_SERVICE_ROLE_KEY`, porque o painel do Supabase não permite criar secrets personalizadas começando com `SUPABASE_`.

## Deploy via CLI

Na pasta `howl-dashboard`, depois de instalar/logar no Supabase CLI:

```bash
supabase link --project-ref zcioptvygsvucabjynoo
supabase secrets set HOWL_SERVICE_ROLE_KEY="COLE_A_SERVICE_ROLE_KEY_AQUI"
supabase functions deploy create-user
```

Depois recarregue o HOWL e use a tela `Cadastro > Novo acesso`.
