# generate-mentorship-briefing

Gera um briefing pré-sessão de mentoria usando dados reais do Supabase e um provedor de IA configurado por secret.

## Secrets necessários

- `HOWL_SERVICE_ROLE_KEY`: legacy service_role API key do projeto Supabase.
- `GEMINI_API_KEY`: chave do Gemini API. Quando existir, é usado por padrão.
- `GEMINI_MODEL`: opcional. Primeira tentativa do Gemini. Padrão atual: `gemini-3.6-flash`.
- `GEMINI_FALLBACK_MODELS`: opcional. Modelos extras separados por vírgula antes da lista padrão.
- `OPENAI_API_KEY`: opcional. Chave da OpenAI API para fallback ou uso explícito.
- `OPENAI_MODEL`: opcional. Padrão atual: `gpt-5.6-luna`.
- `AI_PROVIDER`: opcional. Use `gemini` ou `openai` para forçar um provedor. Se não for definido, a função usa Gemini quando `GEMINI_API_KEY` existir; caso contrário, tenta OpenAI.

## Comportamento

- Aceita apenas `POST`.
- Exige sessão autenticada do Supabase.
- Permite chamada por `admin`, `cliente` do programa da sessão ou `avaliador` vinculado como mentor da sessão.
- Gera texto simples, sem Markdown decorativo, com bullets por seção para preencher melhor o campo da sessão.
- Finaliza o briefing com `Resultado esperado da próxima sessão: ...`.
- Tenta fallback automático no Gemini quando há alta demanda, indisponibilidade, limite temporário ou modelo indisponível.
- Usa limite maior de saída no Gemini e rejeita respostas interrompidas, evitando salvar briefing cortado.
- Não grava automaticamente no banco.
- Retorna o texto do briefing para o frontend preencher o campo `Contexto pré-sessão`; o usuário revisa e salva a sessão.
