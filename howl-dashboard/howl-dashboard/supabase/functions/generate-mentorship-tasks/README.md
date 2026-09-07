# generate-mentorship-tasks

Edge Function que gera sugestões de tarefas pós-sessão a partir dos dados reais da mentoria no Supabase.

## Segredos necessários

- `HOWL_SERVICE_ROLE_KEY`: service role do projeto Supabase.
- `GEMINI_API_KEY` ou `OPENAI_API_KEY`: provedor de IA.
- `AI_PROVIDER` opcional: `gemini` ou `openai`. Sem esse valor, a função prioriza Gemini quando `GEMINI_API_KEY` existe.
- `GEMINI_MODEL` opcional: padrão `gemini-3.6-flash`.
- `OPENAI_MODEL` opcional: padrão `gpt-5.6-luna`.

## Comportamento

A função valida o usuário logado, carrega sessão, startup, mentor, avaliação recente, histórico e tarefas abertas, e retorna de 3 a 5 sugestões em JSON. Nada é salvo automaticamente: o front exibe as sugestões para revisão e só grava em `mentorship_tasks` quando o usuário confirma.
