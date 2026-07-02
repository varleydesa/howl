# Regras de cálculo do HOWL Dashboard

Este documento define as regras básicas usadas para calcular notas, médias, gaps, classificações, trilhas e indicadores do HOWL Dashboard.

## 1. Escala de resposta

Cada pergunta recebe uma nota de `0` a `5`:

| Nota | Significado |
|---:|---|
| 0 | Não existe |
| 1 | Muito fraco |
| 2 | Inicial |
| 3 | Em desenvolvimento |
| 4 | Validado parcialmente |
| 5 | Validado com evidência clara |

Cada pergunta pode receber duas respostas:

- Nota do empreendedor.
- Nota do avaliador ou consultor.

## 2. Nota final de uma pergunta

A percepção do empreendedor possui peso de 40% e a avaliação do consultor possui peso de 60%.

```text
Nota final = (nota do empreendedor × 0,40)
           + (nota do avaliador × 0,60)
```

Exemplo:

```text
Nota do empreendedor = 4
Nota do avaliador = 3

Nota final = (4 × 0,40) + (3 × 0,60)
Nota final = 1,60 + 1,80
Nota final = 3,40
```

O cálculo interno mantém a precisão decimal. O arredondamento é usado apenas na apresentação dos valores.

## 3. Gap de percepção

O gap representa a diferença entre a autoavaliação do empreendedor e a avaliação do consultor.

```text
Gap = nota do empreendedor − nota do avaliador
```

Interpretação:

- Gap positivo: o empreendedor atribuiu uma nota maior.
- Gap negativo: o avaliador atribuiu uma nota maior.
- Gap próximo de zero: as percepções estão alinhadas.

### Classificação do gap

A classificação considera o valor absoluto do gap:

| Valor absoluto do gap | Classificação |
|---:|---|
| Até 0,5 | Percepção alinhada |
| Acima de 0,5 e até 1,5 | Pequena divergência |
| Acima de 1,5 e até 2,5 | Divergência relevante |
| Acima de 2,5 | Alerta de ilusão estratégica |

## 4. Jornadas

O método possui quatro jornadas:

1. Conceito.
2. Produto.
3. Negócios.
4. Crescimento.

Para cada jornada são calculados:

- Média das notas do empreendedor.
- Média das notas do consultor.
- Média das notas finais ponderadas.
- Gap médio.
- Status de maturidade.

### Média do empreendedor na jornada

```text
Média do empreendedor =
soma das notas do empreendedor ÷ quantidade de perguntas
```

### Média do consultor na jornada

```text
Média do consultor =
soma das notas do consultor ÷ quantidade de perguntas
```

### Média final da jornada

```text
Média final da jornada =
soma das notas finais ponderadas ÷ quantidade de perguntas
```

### Gap médio da jornada

```text
Gap médio =
média do empreendedor − média do consultor
```

### Status de uma jornada

| Média final | Status |
|---:|---|
| Menor que 2 | Crítico / Não estruturada |
| De 2 até menor que 3 | Inicial / Em construção |
| De 3 até menor que 4 | Em validação |
| De 4 até 4,5 | Forte |
| Acima de 4,5 | Excelente |

## 5. Média geral

As quatro jornadas possuem o mesmo peso.

```text
Média geral =
(Conceito + Produto + Negócios + Crescimento) ÷ 4
```

O resultado permanece na escala de `0` a `5`.

## 6. HOWL Score

O HOWL Score transforma a média geral de `0–5` em uma escala de `0–100`.

```text
HOWL Score = média geral × 20
```

Exemplo:

```text
Média geral = 3,25
HOWL Score = 3,25 × 20
HOWL Score = 65
```

### Classificação do HOWL Score

| HOWL Score | Classificação |
|---:|---|
| De 0 até 20 | Ideia frágil |
| Acima de 20 até 40 | Hipótese em construção |
| Acima de 40 até 60 | Validação inicial |
| Acima de 60 até 80 | Projeto estruturado |
| Acima de 80 até 100 | Alta maturidade |

## 7. Trilha atual

A trilha atual é determinada pela primeira jornada, na ordem do método, cuja média final seja menor que `3`.

Ordem de verificação:

1. Se Conceito for menor que 3, a trilha atual é `Conceito`.
2. Caso contrário, se Produto for menor que 3, a trilha atual é `Produto`.
3. Caso contrário, se Negócios for menor que 3, a trilha atual é `Negócios`.
4. Caso contrário, se Crescimento for menor que 3, a trilha atual é `Crescimento`.
5. Se nenhuma jornada estiver abaixo de 3, a trilha é `Escala / Portfólio avançado`.
6. Se todas as jornadas estiverem acima de 4, a classificação especial é `Pronta para investimento, expansão ou corporate venture`.

### Gates das jornadas

| Jornada | Gate |
|---|---|
| Conceito | Vale a pena resolver? |
| Produto | Conseguimos resolver? |
| Negócios | Conseguimos sustentar? |
| Crescimento | Conseguimos escalar? |

## 8. Evolução mensal

A evolução mensal compara o HOWL Score atual com o ciclo imediatamente anterior.

```text
Evolução mensal = HOWL Score atual − HOWL Score anterior
```

Interpretação:

- Resultado positivo: evolução.
- Resultado negativo: regressão.
- Resultado igual a zero: estabilidade.
- No primeiro ciclo, a evolução é considerada zero por não existir período anterior.

## 9. Indicadores complementares

### Jornada mais forte

É a jornada com a maior média final.

### Jornada mais fraca

É a jornada com a menor média final.

### Principal gap

É a jornada cujo gap médio possui o maior valor absoluto.

O sinal continua sendo preservado para indicar qual perfil atribuiu a maior nota.

## 10. Indicadores de portfólio

Os indicadores de portfólio utilizam o ciclo mais recente de cada startup incluída na visualização.

### Score médio do portfólio

```text
Score médio =
soma dos HOWL Scores mais recentes ÷ quantidade de startups
```

### Média do portfólio por jornada

```text
Média da jornada =
soma das médias da jornada em cada startup ÷ quantidade de startups
```

### Projetos em evolução

Quantidade de startups cuja evolução mensal seja maior que zero.

### Projetos em regressão

Quantidade de startups cuja evolução mensal seja menor que zero.

## 11. Recomendações estratégicas

A recomendação principal é determinada pela jornada mais fraca:

| Jornada mais fraca | Prioridade recomendada |
|---|---|
| Conceito | Validação do problema, entrevistas, pesquisa de mercado e definição da dor |
| Produto | Protótipo, MVP, usabilidade, proposta de valor e evidências de uso |
| Negócios | Receita, disposição de pagamento, ICP, canais, margem e ponto de equilíbrio |
| Crescimento | Tração, retenção, expansão, governança, métricas e capacidade operacional |

## 12. Persistência e recálculo

São armazenados no banco:

- Notas individuais do empreendedor e do avaliador.
- Comentários.
- Status da resposta.
- Usuário responsável.
- Data de atualização.

Não são armazenados como valores finais:

- Nota ponderada da pergunta.
- Médias das jornadas.
- Gaps.
- Média geral.
- HOWL Score.
- Classificação.
- Evolução.
- Trilha atual.
- Recomendações.

Esses resultados são recalculados quando a aplicação carrega os dados ou recebe novas respostas.

## 13. Regra para avaliações reais

Em uso real, uma nota final somente deve ser calculada quando existirem as duas notas:

- Nota do empreendedor.
- Nota do avaliador.

Enquanto uma das respostas estiver ausente, a pergunta deve permanecer como `Aguardando resposta`.

Uma avaliação incompleta não deve:

- Ser marcada como concluída.
- Participar do histórico oficial.
- Alimentar rankings.
- Alimentar indicadores do portfólio.
- Gerar relatório executivo definitivo.
- Combinar notas reais com valores simulados.

## 14. Simulação existente no MVP

O MVP possui um mecanismo provisório que gera notas quando não encontra respostas salvas.

Esse mecanismo utiliza:

1. Um valor-base de `scoreProfiles`, definido por startup, mês e jornada.
2. Uma variação por pergunta:

```text
Variação = ((posição da pergunta módulo 5) − 2) × 0,16
```

3. Um viés para a nota do empreendedor:

| Startup | Viés |
|---|---:|
| HealthFlow | +0,82 |
| AgroSense AI | +0,32 |
| Outras | +0,18 |

4. Um viés para a nota do consultor:

| Startup | Viés |
| HealthFlow | −0,42 |
| Outras | −0,08 |

As fórmulas simuladas são:

```text
Nota simulada do empreendedor =
valor-base + variação + viés do empreendedor

Nota simulada do consultor =
valor-base − variação + viés do consultor
```

Os resultados são limitados ao intervalo de `0` a `5`.

Quando existe uma resposta salva, ela substitui a nota simulada correspondente. Por isso, o comportamento atual pode misturar uma nota real com uma nota simulada.

### Restrição

O mecanismo de simulação é exclusivo para demonstração e não faz parte da regra oficial de cálculo. Ele deve ser desativado no modo real.

## 15. Princípios obrigatórios

1. As notas devem permanecer entre 0 e 5.
2. O HOWL Score deve permanecer entre 0 e 100.
3. O empreendedor possui peso de 40%.
4. O avaliador possui peso de 60%.
5. As quatro jornadas possuem pesos iguais na média geral.
6. Valores derivados devem ser recalculados a partir das respostas originais.
7. Arredondamentos de exibição não devem alterar os cálculos internos.
8. Dados simulados devem ser identificados claramente.
9. Dados reais e simulados nunca devem participar do mesmo resultado oficial.
10. Avaliações incompletas não devem ser apresentadas como concluídas.
