# Referência Lovable: metas para o HORDA oficial

Levantamento feito a partir do protótipo em `https://horda-pathfinder.lovable.app`.

Link direto para consulta futura: `https://horda-pathfinder.lovable.app/app`.

Ambiente oficial atual: `https://horda1.vercel.app`.

## Objetivo

Usar o protótipo Lovable como referência de produto para evoluir o HORDA oficial, sem tratar o Lovable como base de produção. O foco é aproveitar os fluxos de mentoria, IA, tarefas, memória estratégica e painéis por perfil, conectando tudo ao Supabase real já configurado no projeto oficial.

## Diretriz de implementação visual

Nas próximas etapas, cada tela nova deve seguir a estrutura, ordem dos blocos, abas e fluxos observados no Lovable, porque a entrega final precisa ficar equivalente ao protótipo de referência. A adaptação deve preservar a identidade visual HORDA construída no projeto oficial: marca, paleta preto/dourado, cards, botões, tipografia, espaçamentos e linguagem visual já usados no sistema.

Regra prática: antes de implementar uma área, consultar o Lovable em `https://horda-pathfinder.lovable.app/app`, mapear a tela de referência do perfil correto e só então adaptar para dados reais no Supabase com visual HORDA.

## Diagnóstico geral

O Lovable apresenta uma experiência mais completa de plataforma SaaS, com telas separadas para Gestor, Mentor e Startup/Empreendedor. A proposta visual e funcional é boa, mas o protótipo ainda parece demonstrativo:

- Usa dados fictícios, como `Startup Demo`, `HealthTech Plus`, `DataSync Pro`, `CloudOps AI` e nomes de mentores demo.
- Tem textos pendentes de tradução, como `sidebar.evolution`, `startup.desc`, `AI Agents Active`, `TO DO`, `IN PROGRESS`, `DONE` e `Mentor AI`.
- A integração real com o Supabase oficial não ficou evidente.
- Alguns botões parecem conceituais ou sem efeito produtivo completo.
- Em teste anterior, o fluxo de alternância de perfil chegou a registrar erro React minificado `#310`.

Conclusão: o Lovable deve servir como referência de escopo e experiência, não como ambiente oficial.

## Perfil Gestor do Programa

### O que existe no Lovable

- Dashboard executivo do programa.
- Indicadores de startups, mentores, sessões, avaliação média e conclusão.
- Gráficos de tendência mensal e distribuição por estágio.
- Saúde do portfólio.
- Destaques do mês.
- Abas internas:
  - Executivo
  - Visão Geral
  - Progresso
  - Sessões
  - Inscrições
  - Startups
  - Mentores
  - Analytics
  - Tarefas
  - Memória
- Área de matching AI de mentores.
- Equipe de mentores com disponibilidade, rating e sessões.
- Quadro de tarefas do programa.
- Memória estratégica.
- Coluna lateral com agentes de IA.

### O que vale trazer para o HORDA oficial

- Melhorar o dashboard com indicadores executivos reais.
- Criar aba de progresso por startup.
- Criar visão de saúde do portfólio.
- Criar matching mentor-startup.
- Criar quadro de tarefas por programa.
- Criar memória estratégica por programa/startup.
- Criar relatórios executivos com exportação.

## Perfil Startup / Empreendedor

### O que existe no Lovable

- Tela `Minha Jornada de Startup`.
- Card da startup com status, estágio, progresso, saúde e mentor vinculado.
- Próximos eventos:
  - Sessão com mentor
  - Demo Day
  - Reunião com investidor
- Jornada de crescimento por estágios:
  - Ideação
  - MVP
  - Product-Market Fit
  - Scale
- Tarefas do estágio.
- Métricas-chave, como usuários beta e NPS.
- Próximo marco da startup.
- Abas internas:
  - Jornada
  - Métricas
  - Plano de Ação
  - Mentoria
  - IA
- Plano de ação com tarefas priorizadas e opção `Gerar com IA`.
- Área de mentoria explicando o fluxo:
  - Preparar contexto
  - Análise de IA
  - Sessão ao vivo
  - Plano de ação
- Área de sessões de mentoria com próximas sessões e histórico.
- Área de recursos de aprendizado com templates, guias, vídeos e planilhas.

### O que vale trazer para o HORDA oficial

- Criar área da startup aprovada com jornada própria.
- Mostrar progresso por etapa da jornada.
- Criar tarefas da startup vindas de mentorias e avaliações.
- Permitir envio de formulário pré-sessão.
- Criar agenda e histórico de sessões.
- Criar painel de métricas por startup.
- Adicionar recursos e materiais por programa.
- Criar recomendações de IA para plano de ação.

## Perfil Mentor / Consultor

### O que existe no Lovable

- Dashboard de mentoria.
- Indicadores:
  - Startups ativas
  - Sessões por mês
  - Progresso médio
  - Rating
- Insights de IA para o mentor.
- Agenda de mentorias.
- Botão para conectar Google Calendar.
- Botão para agendar sessão.
- Portfólio de startups vinculadas.
- Analytics de impacto da mentoria.
- Fluxo do processo de mentoria:
  - Preparação da sessão
  - Sessão de mentoria
  - Criação do plano de ação
  - Atribuição de tarefas
  - Acompanhamento de progresso
- Área de recursos de mentoria com frameworks, materiais e templates.

### O que vale trazer para o HORDA oficial

- Criar dashboard específico do mentor.
- Vincular mentores a startups aprovadas.
- Criar agenda do mentor.
- Criar sessões de mentoria com status, data, duração e pauta.
- Criar registro pós-sessão com aprendizados, decisões e próximas tarefas.
- Criar visão de portfólio do mentor.
- Criar insights simples de IA com base em dados da startup e histórico.
- Deixar integração com Google Calendar como etapa posterior.

## Agentes de IA observados

O Lovable apresenta cinco agentes:

- Analisador de Estratégia: planejamento e análise estratégica.
- Processador de Dados: métricas e insights.
- Gerador de Conteúdo: documentos e relatórios.
- Mentor IA: orientação e frameworks.
- Assistente de Pesquisa: pesquisa de mercado.

### Meta para o HORDA oficial

Implementar primeiro uma IA leve e útil, evitando prometer agentes complexos antes da base operacional existir.

Prioridade sugerida:

1. Mentor IA
2. Gerador de resumo pós-mentoria
3. Gerador de plano de ação
4. Analisador de métricas da startup
5. Assistente de pesquisa de mercado

## Backlog recomendado

### Fase 1: base de mentoria

- Criar tabela de vínculos mentor-startup.
- Criar tabela de sessões de mentoria.
- Criar tela de agenda/sessões.
- Criar fluxo para registrar sessão realizada.
- Criar tarefas derivadas da sessão.
- Mostrar sessões e tarefas na área da startup.
- Mostrar portfólio e agenda na área do mentor.

### Fase 2: memória e plano de ação

- Criar memória estratégica por startup.
- Registrar aprendizados, decisões e riscos.
- Criar quadro de tarefas por startup.
- Permitir filtros por status, prioridade e prazo.
- Conectar tarefas ao histórico de mentoria.

### Fase 3: IA aplicada

- Criar briefing pré-sessão com base nos dados da startup.
- Criar resumo pós-sessão.
- Sugerir plano de ação com tarefas.
- Sugerir alertas simples, como atraso, baixa evolução ou falta de dados.
- Criar recomendações por estágio da startup.

### Fase 4: analytics e relatórios

- Evoluir dashboard executivo.
- Criar indicadores por programa.
- Criar saúde do portfólio.
- Criar evolução mensal.
- Criar exportação PDF/CSV de relatórios.

### Fase 5: integrações externas

- Avaliar Google Calendar para agenda de mentoria.
- Avaliar envio de notificações por email.
- Avaliar importação/exportação de materiais.
- Avaliar biblioteca de recursos por programa.

## Prioridade prática

Começar por `Mentorias + Mentor IA leve`.

Esse caminho aproveita melhor o que já existe no HORDA oficial:

- Login real via Supabase Auth.
- Perfis e permissões.
- Cadastro de startups.
- Cadastro de avaliadores/mentores.
- Inscrições públicas.
- Aprovação/rejeição.
- Dashboard interno.

## Primeira entrega sugerida

Uma primeira entrega pequena e valiosa seria:

- Tela `Mentorias`.
- Vínculo entre startup e mentor.
- Cadastro de sessão com data, status e pauta.
- Registro pós-sessão com resumo, decisões e próximas ações.
- Tarefas associadas a uma sessão.
- Visualização dessas tarefas na startup.

Depois disso, entra o `Mentor IA` para gerar:

- Briefing antes da sessão.
- Resumo depois da sessão.
- Plano de ação sugerido.
- Alertas simples para o gestor e mentor.

## Próximas tarefas imediatas

Estado atual em 03/09/2026:

- A tela `Mentorias` já existe no HORDA oficial.
- Os vínculos mentor-startup já usam tabela real no Supabase.
- As sessões de mentoria já usam tabela real no Supabase.
- As tarefas pós-sessão já usam tabela real no Supabase.
- A tela já foi reorganizada com abas `Agenda`, `Portfólio`, `Plano de Ação` e `Processo`.
- O cadastro de nova sessão nasce como `Agendada`.
- A alteração de status da sessão fica nas sessões cadastradas.
- A duração da sessão aceita valores inteiros entre 15 e 360 minutos.
- O dashboard do gestor já segue a estrutura Lovable, com abas executivas, painel de sessões, filtros e card de avaliação média.
- A visão da startup/empreendedor já mostra jornada, progresso, mentorias, tarefas, análise de rota e recursos com dados reais quando existirem.
- A visão do mentor/avaliador está em implementação como dashboard próprio, com startups vinculadas, agenda, tarefas e impacto do portfólio.

Próxima sequência recomendada:

1. Validar a tela `Mentorias` em produção na Vercel.
2. Testar como gestor:
   - criar vínculo mentor-startup;
   - criar sessão com duração variável;
   - alterar status da sessão na lista;
   - criar tarefa pós-sessão;
   - alterar status da tarefa no quadro.
3. Ajustar detalhes visuais percebidos na produção.
4. Criar edição de sessão já cadastrada, incluindo pauta, contexto, resumo e próximos passos.
5. Criar edição de tarefa já cadastrada, incluindo título, descrição, prioridade e prazo.
6. Validar a visão do mentor em produção:
   - dashboard próprio;
   - agenda própria;
   - startups vinculadas;
   - sessões futuras;
   - tarefas associadas às mentorias;
   - indicadores de impacto.
7. Criar edição de vínculos, sessões e tarefas sem depender de recriar registros.
8. Criar filtros para sessões e tarefas:
   - por startup;
   - por mentor;
   - por status;
   - por prazo;
   - por prioridade.
9. Criar indicadores específicos de mentoria:
   - sessões agendadas;
   - sessões concluídas;
   - tarefas abertas;
   - tarefas concluídas;
   - startups sem sessão recente;
   - mentores com maior carga.
10. Iniciar `Mentor IA` leve usando dados reais:
   - briefing pré-sessão;
   - sugestão de pauta;
   - resumo pós-sessão;
   - sugestão de tarefas;
   - alertas simples para gestor e mentor.

## Observações de qualidade

Antes de migrar qualquer ideia do Lovable, revisar:

- Traduções pendentes.
- Responsividade.
- Dados demo.
- Consistência com a identidade visual HORDA oficial.
- Regras de permissão por perfil.
- Persistência real no Supabase.
- Testes automatizados.
- Deploy no Vercel oficial.
