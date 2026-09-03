# generate-mentorship-briefing

Gera um briefing pré-sessão de mentoria usando dados reais do Supabase e OpenAI API.

## Secrets necessários

- `HOWL_SERVICE_ROLE_KEY`: legacy service_role API key do projeto Supabase.
- `OPENAI_API_KEY`: chave da OpenAI API.
- `OPENAI_MODEL`: opcional. Padrão atual: `gpt-5.6-luna`.

## Comportamento

- Aceita apenas `POST`.
- Exige sessão autenticada do Supabase.
- Permite chamada por `admin`, `cliente` do programa da sessão ou `avaliador` vinculado como mentor da sessão.
- Não grava automaticamente no banco.
- Retorna o texto do briefing para o frontend preencher o campo `Contexto pré-sessão`; o usuário revisa e salva a sessão.
