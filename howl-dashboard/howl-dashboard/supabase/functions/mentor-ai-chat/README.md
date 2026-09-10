# mentor-ai-chat

Edge Function do MVP do **Mentor IA**.

## Segredos necessários

- `HOWL_SERVICE_ROLE_KEY`: service role do projeto Supabase.
- `GEMINI_API_KEY` ou `OPENAI_API_KEY`: provedor de IA.
- `AI_PROVIDER` opcional: `gemini` ou `openai`. Sem esse valor, a função prioriza Gemini quando `GEMINI_API_KEY` existe.
- `GEMINI_MODEL` opcional: padrão `gemini-3.6-flash`.
- `OPENAI_MODEL` opcional: padrão `gpt-5.6-luna`.

## Comportamento

A função valida o usuário logado, carrega apenas o contexto permitido para o perfil ativo e responde perguntas sobre startups, mentorias, tarefas, avaliações, riscos e próximos passos.

Esse MVP não salva histórico e não executa ações automaticamente. Ele apenas orienta o usuário com base nos dados reais disponíveis no Supabase.
