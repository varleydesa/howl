# mentor-ai-chat

Edge Function do MVP do **Mentor IA**.

## Segredos necessários

- `HOWL_SERVICE_ROLE_KEY`: service role do projeto Supabase.
- `GEMINI_API_KEY` ou `OPENAI_API_KEY`: provedor de IA.
- `AI_PROVIDER` opcional: `gemini` ou `openai`. Sem esse valor, a função prioriza Gemini quando `GEMINI_API_KEY` existe.
- `GEMINI_MODEL` opcional: primeira tentativa do Gemini. Padrão `gemini-3.6-flash`.
- `GEMINI_FALLBACK_MODELS` opcional: modelos extras separados por vírgula antes da lista padrão.
- `OPENAI_MODEL` opcional: padrão `gpt-5.6-luna`.

## Comportamento

A função valida o usuário logado, carrega apenas o contexto permitido para o perfil ativo e responde perguntas sobre startups, mentorias, tarefas, avaliações, riscos e próximos passos.

Quando o Gemini retorna indisponibilidade, alta demanda, limite temporário ou modelo indisponível, a função tenta automaticamente a sequência `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-2.5-flash` e `gemini-2.5-flash-lite`. A mensagem de erro só volta ao app se todos os candidatos falharem.

Esse MVP não salva histórico e não executa ações automaticamente. Ele apenas orienta o usuário com base nos dados reais disponíveis no Supabase.
