# Segurança do repositório público

Este repositório não deve conter credenciais reais, senhas, tokens pessoais,
chaves privadas ou chaves Supabase `service_role`/`secret`.

## Supabase

- `howl-dashboard/howl-dashboard/supabase-config.js` usa placeholders `COLE_AQUI_*` por padrão.
- A chave publicável do Supabase pode ser configurada no ambiente de deploy.
- A chave `HOWL_SERVICE_ROLE_KEY` deve existir apenas nos Secrets das Edge Functions.
- Nunca commit arquivos `.env` ou exports locais com credenciais reais.

## Dados de demonstração

Os dados seedados em `app.js`, `db.json` e nas migrations usam nomes, empresas e
e-mails fictícios. Dados reais de clientes, startups, mentores, avaliadores ou
empreendedores devem ser criados diretamente no Supabase do ambiente apropriado.
