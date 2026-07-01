const supabaseConfig = window.HOWL_SUPABASE_CONFIG || {};
const supabaseConfigured =
  Boolean(supabaseConfig.url) &&
  Boolean(supabaseConfig.publishableKey) &&
  !supabaseConfig.publishableKey.includes("COLE_AQUI");
const supabaseClient = supabaseConfigured
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
  : null;
let currentSession = null;
let loginError = "";
let assessmentCycleIds = {};
let questionIds = {};

let JOURNEYS = [
  {
    id: "conceito",
    name: "Conceito",
    description:
      "Comprovar que existe uma dor relevante, recorrente e suficientemente grande.",
    gate: "Vale a pena resolver?",
    questions: [
      "O problema está claramente definido?",
      "O problema realmente existe com evidências?",
      "O público afetado está bem identificado?",
      "A dor é frequente ou recorrente?",
      "O impacto do problema é relevante?",
      "As soluções atuais foram mapeadas?",
      "Existe uma oportunidade clara de mercado?",
      "O nicho inicial está definido?",
      "Existem dados ou pesquisas que sustentam a oportunidade?",
      "A dor justifica a criação de uma solução?",
    ],
  },
  {
    id: "produto",
    name: "Produto",
    description: "Comprovar que a solução entrega valor real aos usuários.",
    gate: "Conseguimos resolver?",
    questions: [
      "A solução está claramente descrita?",
      "A proposta de valor é fácil de entender?",
      "As funcionalidades essenciais estão definidas?",
      "Existe protótipo, MVP ou versão testável?",
      "Usuários já testaram a solução?",
      "Os usuários percebem valor na solução?",
      "A solução é simples de usar?",
      "Existe diferenciação frente às alternativas atuais?",
      "A solução é tecnicamente viável?",
      "Existem evidências de que o produto resolve o problema?",
    ],
  },
  {
    id: "negocios",
    name: "Negócios",
    description: "Comprovar que a solução pode gerar sustentabilidade econômica.",
    gate: "Conseguimos sustentar?",
    questions: [
      "Está claro quem paga pela solução?",
      "Existe disposição de pagamento validada?",
      "O modelo de receita está definido?",
      "O mercado endereçável está estimado?",
      "O segmento inicial de clientes está priorizado?",
      "Existem canais de aquisição definidos?",
      "O processo comercial está minimamente estruturado?",
      "Os custos principais da operação são conhecidos?",
      "A margem esperada é sustentável?",
      "Existe caminho claro para atingir ponto de equilíbrio?",
    ],
  },
  {
    id: "crescimento",
    name: "Crescimento",
    description:
      "Comprovar que o modelo consegue escalar com eficiência, qualidade e propósito.",
    gate: "Conseguimos escalar?",
    questions: [
      "A operação suporta aumento de clientes?",
      "Os principais gargalos de escala foram identificados?",
      "Existem canais de crescimento testados?",
      "Há estratégia para aumentar retenção?",
      "Há estratégia para aumentar ticket médio?",
      "Existem oportunidades de expansão de mercado?",
      "A startup sabe se precisará captar recursos?",
      "Existem indicadores de gestão acompanhados?",
      "A governança mínima está estruturada?",
      "O crescimento mantém qualidade, eficiência e propósito?",
    ],
  },
];

let startups = [
  {
    id: "agrosense",
    name: "AgroSense AI",
    founder: "Marina Torres",
    sector: "Agtech",
    city: "Ribeirão Preto",
    state: "SP",
    stage: "MVP",
    description:
      "Sensoriamento e inteligência preditiva para pequenos e médios produtores.",
  },
  {
    id: "healthflow",
    name: "HealthFlow",
    founder: "Daniel Nunes",
    sector: "Healthtech",
    city: "Recife",
    state: "PE",
    stage: "Piloto",
    description:
      "Orquestração de jornada assistencial para clínicas especializadas.",
  },
  {
    id: "educamatch",
    name: "EducaMatch",
    founder: "Bianca Alves",
    sector: "Edtech",
    city: "Florianópolis",
    state: "SC",
    stage: "Tração",
    description:
      "Matching de trilhas personalizadas, mentores e vagas para ensino técnico.",
  },
];

let users = [
  {
    id: "admin-ana",
    name: "Ana Martins",
    email: "ana@howl.dashboard",
    role: "admin",
    roleLabel: "Admin",
    organization: "Aceleradora",
    startupIds: ["agrosense", "healthflow", "educamatch"],
  },
  {
    id: "avaliador-rafael",
    name: "Rafael Costa",
    email: "rafael@howl.dashboard",
    role: "avaliador",
    roleLabel: "Avaliador",
    organization: "Consultoria HOWL",
    startupIds: ["agrosense", "healthflow"],
  },
  {
    id: "avaliadora-livia",
    name: "Livia Rocha",
    email: "livia@howl.dashboard",
    role: "avaliador",
    roleLabel: "Avaliador",
    organization: "Mentora associada",
    startupIds: ["educamatch"],
  },
  {
    id: "empreendedora-marina",
    name: "Marina Torres",
    email: "marina@agrosense.ai",
    role: "empreendedor",
    roleLabel: "Empreendedor",
    organization: "AgroSense AI",
    startupIds: ["agrosense"],
  },
];

const scoreProfiles = {
  agrosense: [
    [3.8, 2.3, 1.8, 1.2],
    [4.0, 2.7, 2.0, 1.5],
    [4.2, 3.1, 2.2, 1.8],
    [4.4, 3.4, 2.4, 2.1],
  ],
  healthflow: [
    [3.1, 3.7, 2.5, 2.1],
    [3.2, 3.9, 2.7, 2.3],
    [3.4, 4.1, 2.9, 2.5],
    [3.5, 4.3, 3.0, 2.7],
  ],
  educamatch: [
    [2.7, 2.5, 2.1, 1.1],
    [3.0, 2.9, 2.5, 1.4],
    [3.4, 3.2, 2.8, 1.8],
    [3.8, 3.6, 3.1, 2.2],
  ],
};

let months = [
  { month: 2, year: 2026, label: "Fev/2026" },
  { month: 3, year: 2026, label: "Mar/2026" },
  { month: 4, year: 2026, label: "Abr/2026" },
  { month: 5, year: 2026, label: "Mai/2026" },
];

const SCORE_OPTIONS = [
  { value: 0, label: "Não existe" },
  { value: 1, label: "Muito fraco" },
  { value: 2, label: "Inicial" },
  { value: 3, label: "Em desenvolvimento" },
  { value: 4, label: "Validado parcialmente" },
  { value: 5, label: "Validado com evidência clara" },
];

let activeRoute = "login";
let mobileMenuOpen = false;
let selectedStartupId = "agrosense";
let selectedMonthIndex = 3;
let activeJourney = "conceito";
let draftSaved = false;
let draftAnswers = {};
let activeUserId = "admin-ana";
let backendStatus = "Conectando ao Supabase...";
let assessmentResponses = {};

let assessments = buildAssessments();
let importStatus = "Aguardando planilha da primeira rodada.";

function clampScore(value) {
  return Math.max(0, Math.min(5, Number(value)));
}

function calculateQuestionScore(entrepreneurScore, consultantScore) {
  // HOWL formula: entrepreneur perception weighs 40%; consultant assessment weighs 60%.
  return entrepreneurScore * 0.4 + consultantScore * 0.6;
}

function calculateQuestionGap(entrepreneurScore, consultantScore) {
  return entrepreneurScore - consultantScore;
}

function classifyHowlScore(score) {
  if (score <= 20) return "Ideia frágil";
  if (score <= 40) return "Hipótese em construção";
  if (score <= 60) return "Validação inicial";
  if (score <= 80) return "Projeto estruturado";
  return "Alta maturidade";
}

function classifyJourneyStatus(avg) {
  if (avg < 2) return "Crítico / Não estruturada";
  if (avg < 3) return "Inicial / Em construção";
  if (avg < 4) return "Em validação";
  if (avg <= 4.5) return "Forte";
  return "Excelente";
}

function classifyGap(gap) {
  const abs = Math.abs(gap);
  if (abs <= 0.5) return "Percepção alinhada";
  if (abs <= 1.5) return "Pequena divergência";
  if (abs <= 2.5) return "Divergência relevante";
  return "Alerta de ilusão estratégica";
}

function statusColor(textOrScore) {
  const text = String(textOrScore);
  if (text.includes("Alta") || text.includes("Forte") || text.includes("Excelente") || text.includes("+")) return "green";
  if (text.includes("Crítico") || text.includes("frágil") || text.includes("-")) return "red";
  if (text.includes("Inicial") || text.includes("Hipótese") || text.includes("Alerta")) return "amber";
  return "blue";
}

function determineCurrentTrail(journeyResults) {
  const byId = Object.fromEntries(journeyResults.map((j) => [j.id, j.finalAverage]));
  if (Object.values(byId).every((v) => v > 4)) return "Pronta para investimento, expansão ou corporate venture";
  if (byId.conceito < 3) return "Conceito";
  if (byId.produto < 3) return "Produto";
  if (byId.negocios < 3) return "Negócios";
  if (byId.crescimento < 3) return "Crescimento";
  return "Escala / Portfólio avançado";
}

function gateForTrail(trail) {
  const journey = JOURNEYS.find((item) => item.name === trail);
  if (journey) return journey.gate;
  if (trail.includes("investimento")) return "Escalar com governança e tese de crescimento";
  return "Avançar portfólio com consistência";
}

function generateStrategicRecommendation(result) {
  const weakest = result.weakestJourney.name;
  const strong = result.strongestJourney.name;
  const lead =
    `A startup apresenta maior maturidade em ${strong}, mas a Jornada de ${weakest} concentra a principal restrição do mês. `;
  const map = {
    Conceito:
      "Priorizar validação do problema, entrevistas com usuários, pesquisa de mercado e definição clara da dor.",
    Produto:
      "Priorizar protótipo, MVP, teste de usabilidade, validação de proposta de valor e evidências de uso.",
    Negócios:
      "Priorizar modelo de receita, disposição de pagamento, ICP, canais comerciais, margem e ponto de equilíbrio.",
    Crescimento:
      "Priorizar canais de tração, retenção, expansão, governança, métricas e capacidade operacional de escala.",
  };
  return lead + map[weakest];
}

function generateNarrativeReport(startup, result) {
  const evolution =
    result.monthlyEvolution > 0
      ? `evoluiu ${fmt(result.monthlyEvolution)} pontos em relação ao mês anterior`
      : result.monthlyEvolution < 0
        ? `regrediu ${fmt(Math.abs(result.monthlyEvolution))} pontos em relação ao mês anterior`
        : "permaneceu estável em relação ao mês anterior";
  const gapDirection =
    result.mainGapJourney.gap > 0
      ? "o empreendedor está se avaliando acima da leitura do avaliador"
      : result.mainGapJourney.gap < 0
        ? "o avaliador está atribuindo notas superiores à autoavaliação do empreendedor"
        : "as percepções estão alinhadas";
  return [
    `${startup.name} encerra o ciclo de ${result.label} com HOWL Score de ${fmt(result.howlScore, 0)} pontos, classificação "${result.classification}" e trilha atual em "${result.currentTrail}". Esse posicionamento indica que a startup deve ser analisada pela consistência das jornadas anteriores antes de avançar para estágios mais sofisticados de escala, investimento ou expansão.`,
    `No comparativo mensal, a startup ${evolution}. A jornada mais forte é ${result.strongestJourney.name}, com média ${fmt(result.strongestJourney.finalAverage)}, enquanto a principal fragilidade está em ${result.weakestJourney.name}, com média ${fmt(result.weakestJourney.finalAverage)}. Essa diferença mostra onde o projeto já possui evidências mais sólidas e onde ainda precisa transformar hipóteses em validações mensuráveis.`,
    `O maior gap de percepção aparece em ${result.mainGapJourney.name}, com diferença média de ${fmt(result.mainGapJourney.gap)} ponto. Neste ponto, ${gapDirection}. Esse desalinhamento deve ser tratado em reunião de acompanhamento, porque gaps persistentes podem indicar excesso de otimismo, falta de evidências compartilhadas ou critérios de avaliação pouco claros entre os envolvidos.`,
    result.strategicRecommendation,
  ];
}

function buildAssessments() {
  const allAssessments = [];
  startups.forEach((startup) => {
    months.forEach((period, monthIndex) => {
      const journeyResults = JOURNEYS.map((journey, journeyIndex) => {
        if (!scoreProfiles[startup.id]) scoreProfiles[startup.id] = defaultScoreProfile(startups.indexOf(startup) + 1);
        const target = scoreProfiles[startup.id][monthIndex]?.[journeyIndex] ?? null;
        const questions = journey.questions.map((text, questionIndex) => {
          const wave = ((questionIndex % 5) - 2) * 0.16;
          const entrepreneurBias = startup.id === "healthflow" ? 0.82 : startup.id === "agrosense" ? 0.32 : 0.18;
          const consultantBias = startup.id === "healthflow" ? -0.42 : -0.08;
          const saved = savedQuestionResponse(startup.id, period.month, period.year, journey.id, questionIndex);
          const simulatedEntrepreneurScore = target === null ? 0 : clampScore((target + wave + entrepreneurBias).toFixed(1));
          const simulatedConsultantScore = target === null ? 0 : clampScore((target - wave + consultantBias).toFixed(1));
          const hasEntrepreneurAnswer = saved.entrepreneurScore !== null && saved.entrepreneurScore !== undefined;
          const hasConsultantAnswer = saved.consultantScore !== null && saved.consultantScore !== undefined;
          const entrepreneurScore = hasEntrepreneurAnswer ? saved.entrepreneurScore : simulatedEntrepreneurScore;
          const consultantScore = hasConsultantAnswer ? saved.consultantScore : simulatedConsultantScore;
          const finalScore = calculateQuestionScore(entrepreneurScore, consultantScore);
          return {
            id: `${startup.id}-${period.month}-${journey.id}-${questionIndex + 1}`,
            journeyId: journey.id,
            journeyName: journey.name,
            text,
            order: questionIndex + 1,
            hasResponse: hasEntrepreneurAnswer || hasConsultantAnswer,
            entrepreneurScore,
            consultantScore,
            finalScore,
            gap: calculateQuestionGap(entrepreneurScore, consultantScore),
            entrepreneurComment: saved.entrepreneurComment || "",
            consultantComment:
              saved.consultantComment ||
              (finalScore < 3
                ? "Necessário transformar hipótese em evidência mensurável."
                : "Boa base, com oportunidade de documentar aprendizados."),
            entrepreneurUpdatedAt: saved.entrepreneurUpdatedAt || null,
            consultantUpdatedAt: saved.consultantUpdatedAt || null,
          };
        });
        const entrepreneurAverage = average(questions.map((q) => q.entrepreneurScore));
        const consultantAverage = average(questions.map((q) => q.consultantScore));
        const finalAverage = average(questions.map((q) => q.finalScore));
        return {
          id: journey.id,
          name: journey.name,
          gate: journey.gate,
          hasResponses: questions.some((question) => question.hasResponse),
          entrepreneurAverage,
          consultantAverage,
          finalAverage,
          gap: entrepreneurAverage - consultantAverage,
          status: classifyJourneyStatus(finalAverage),
          questions,
        };
      });
      const previous = allAssessments.filter((a) => a.startupId === startup.id).at(-1);
      allAssessments.push(finalizeAssessment({
        id: `${startup.id}-${period.month}-${period.year}`,
        startupId: startup.id,
        month: period.month,
        year: period.year,
        label: period.label,
        hasResponses: journeyResults.some((journey) => journey.hasResponses),
        status: "Concluída",
        journeyResults,
      }, previous));
    });
  });
  return allAssessments;
}

function finalizeAssessment(assessment, previous) {
  const generalAverage = average(assessment.journeyResults.map((j) => j.finalAverage));
  const howlScore = generalAverage * 20;
  const strongestJourney = maxBy(assessment.journeyResults, "finalAverage");
  const weakestJourney = minBy(assessment.journeyResults, "finalAverage");
  const mainGapJourney = assessment.journeyResults.reduce((acc, item) =>
    Math.abs(item.gap) > Math.abs(acc.gap) ? item : acc
  );
  const currentTrail = determineCurrentTrail(assessment.journeyResults);
  const monthlyEvolution = previous ? howlScore - previous.howlScore : 0;
  const result = {
    ...assessment,
    generalAverage,
    howlScore,
    classification: classifyHowlScore(howlScore),
    strongestJourney,
    weakestJourney,
    mainGapJourney,
    currentTrail,
    monthlyEvolution,
  };
  result.strategicRecommendation = generateStrategicRecommendation(result);
  result.journeyResults = result.journeyResults.map((journey) => {
    const previousJourney = previous?.journeyResults.find((j) => j.id === journey.id);
    return {
      ...journey,
      evolution: previousJourney ? journey.finalAverage - previousJourney.finalAverage : 0,
    };
  });
  return result;
}

function average(values) {
  const numbers = values.map(Number).filter(Number.isFinite);
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function activeUser() {
  return users.find((user) => user.id === activeUserId);
}

function normalizedRole(user = activeUser()) {
  return String(user?.role || "").trim().toLowerCase();
}

function isAdmin() {
  return normalizedRole() === "admin";
}

function isEvaluator() {
  return normalizedRole() === "avaliador";
}

function canEditAssessment() {
  return isEvaluator() || normalizedRole() === "empreendedor";
}

function canEditScoreField(field) {
  const role = normalizedRole();
  if (role === "avaliador") return field === "consultantScore";
  if (role === "empreendedor") return field === "entrepreneurScore";
  return false;
}

function editableAssessmentField() {
  if (isEvaluator()) return "consultant";
  if (normalizedRole() === "empreendedor") return "entrepreneur";
  return null;
}

function accessibleStartups() {
  const user = activeUser();
  if (normalizedRole(user) === "admin") return startups;
  return startups.filter((startup) => user.startupIds.includes(startup.id));
}

function ensureAccessibleStartup() {
  const allowed = accessibleStartups();
  if (!allowed.some((startup) => startup.id === selectedStartupId)) {
    selectedStartupId = allowed[0]?.id || startups[0].id;
  }
}

function navItemsForUser() {
  const base = [
    ["dashboard", "⌂", "Dashboard"],
    ["startups", "▦", "Startups"],
    ["assessment", "✎", "Avaliações"],
    ["history", "↗", "Histórico"],
    ["compare", "⇄", "Comparativo"],
  ];
  if (isAdmin() || isEvaluator()) base.push(["reports", "□", "Relatórios"]);
  if (isAdmin()) {
    base.splice(2, 0, ["portfolio", "◈", "Portfólio"]);
    base.splice(3, 0, ["registration", "+", "Cadastro"]);
    base.push(["users", "◌", "Usuários"]);
    base.push(["settings", "⚙", "Configurações"]);
  }
  return base;
}

function routeAllowed(route) {
  return navItemsForUser().some(([itemRoute]) => itemRoute === route);
}

function maxBy(items, key) {
  return items.reduce((max, item) => (item[key] > max[key] ? item : max), items[0]);
}

function minBy(items, key) {
  return items.reduce((min, item) => (item[key] < min[key] ? item : min), items[0]);
}

function latestAssessment(startupId = selectedStartupId) {
  const history = assessments.filter((a) => a.startupId === startupId);
  return history.filter((assessment) => assessment.hasResponses).at(-1) || history.at(-1);
}

function historyFor(startupId = selectedStartupId) {
  const history = assessments.filter((a) => a.startupId === startupId);
  const answeredHistory = history.filter((assessment) => assessment.hasResponses);
  return answeredHistory.length ? answeredHistory : history;
}

function selectedPeriodAssessment(startupId = selectedStartupId) {
  const period = months[selectedMonthIndex];
  return (
    assessments.find(
      (assessment) =>
        assessment.startupId === startupId &&
        assessment.month === period?.month &&
        assessment.year === period?.year
    ) || latestAssessment(startupId)
  );
}

function fmt(value, digits = 1) {
  return Number(value).toFixed(digits);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value) {
  const slug = normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || `startup-${startups.length + 1}`;
}

function generateTemporaryPassword(length = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%";
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join("");
}

function fillGeneratedPassword(button) {
  const input = button.closest("form")?.querySelector('input[name="password"]');
  if (!input) return;
  input.value = generateTemporaryPassword();
  input.type = "text";
  input.focus();
  input.select();
}

function rebuildAssessments() {
  assessments = buildAssessments();
  draftAnswers = {};
  draftSaved = false;
}

function defaultScoreProfile() {
  return months.map(() => JOURNEYS.map(() => null));
}

function responseKey(startupId, month, year, journeyId, questionIndex) {
  return `${startupId}-${year}-${month}-${journeyId}-${questionIndex + 1}`;
}

function savedQuestionResponse(startupId, month, year, journeyId, questionIndex) {
  return assessmentResponses[responseKey(startupId, month, year, journeyId, questionIndex)] || {};
}

function requireSupabase() {
  if (!supabaseClient) {
    throw new Error("Configure a chave publicável do Supabase antes de continuar.");
  }
  return supabaseClient;
}

function throwIfSupabaseError(error) {
  if (error) throw new Error(error.message || "Erro de comunicação com o Supabase.");
}

async function loadSupabaseData() {
  const client = requireSupabase();
  const sessionResult = await client.auth.getSession();
  throwIfSupabaseError(sessionResult.error);
  currentSession = sessionResult.data.session;

  if (!currentSession) {
    activeRoute = "login";
    backendStatus = "Aguardando autenticação";
    return false;
  }

  const profileResult = await client
    .from("profiles")
    .select("*")
    .eq("auth_user_id", currentSession.user.id)
    .single();
  throwIfSupabaseError(profileResult.error);

  const [
    startupsResult,
    profilesResult,
    linksResult,
    journeysResult,
    questionsResult,
    periodsResult,
    cyclesResult,
    resultsResult,
  ] = await Promise.all([
    client.from("startups").select("*"),
    client.from("profiles").select("*"),
    client.from("profile_startups").select("*"),
    client.from("journeys").select("*").order("position"),
    client.from("questions").select("*").eq("active", true).order("position"),
    client.from("assessment_periods").select("*").order("year").order("month"),
    client.from("assessment_cycles").select("*"),
    client
      .from("assessment_question_results")
      .select("*")
      .order("year")
      .order("month")
      .order("journey_position")
      .order("question_position"),
  ]);

  [
    startupsResult,
    profilesResult,
    linksResult,
    journeysResult,
    questionsResult,
    periodsResult,
    cyclesResult,
    resultsResult,
  ].forEach((result) => throwIfSupabaseError(result.error));

  startups = (startupsResult.data || []).map((startup) => ({
    id: startup.id,
    name: startup.name,
    founder: startup.founder,
    sector: startup.sector,
    city: startup.city,
    state: startup.state,
    stage: startup.stage,
    description: startup.description,
  }));

  const questionRows = questionsResult.data || [];
  JOURNEYS = (journeysResult.data || []).map((journey) => ({
    id: journey.id,
    name: journey.name,
    description: journey.description,
    gate: journey.gate,
    questions: questionRows
      .filter((question) => question.journey_id === journey.id)
      .sort((a, b) => a.position - b.position)
      .map((question) => question.prompt),
  }));

  months = (periodsResult.data || []).map((period) => ({
    id: period.id,
    month: period.month,
    year: period.year,
    label: period.label,
  }));

  const links = linksResult.data || [];
  const roleLabels = { admin: "Admin", avaliador: "Avaliador", empreendedor: "Empreendedor" };
  users = (profilesResult.data || []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    roleLabel: roleLabels[profile.role] || "Usuário",
    organization: profile.organization,
    startupIds:
      profile.role === "admin"
        ? startups.map((startup) => startup.id)
        : links
            .filter((link) => link.profile_id === profile.id)
            .map((link) => link.startup_id),
  }));

  const signedInProfile = profileResult.data;
  activeUserId = signedInProfile.id;
  if (!users.some((user) => user.id === activeUserId)) {
    users.push({
      id: signedInProfile.id,
      name: signedInProfile.name,
      email: signedInProfile.email,
      role: signedInProfile.role,
      roleLabel: roleLabels[signedInProfile.role] || "Usuário",
      organization: signedInProfile.organization,
      startupIds: links
        .filter((link) => link.profile_id === signedInProfile.id)
        .map((link) => link.startup_id),
    });
  }

  assessmentCycleIds = Object.fromEntries(
    (cyclesResult.data || []).map((cycle) => {
      const period = months.find((item) => item.id === cycle.period_id);
      return [`${cycle.startup_id}-${period?.year}-${period?.month}`, cycle.id];
    })
  );
  questionIds = Object.fromEntries(
    questionRows.map((question) => [
      `${question.journey_id}-${question.position}`,
      question.id,
    ])
  );

  assessmentResponses = {};
  (resultsResult.data || []).forEach((row) => {
    const key = responseKey(
      row.startup_id,
      row.month,
      row.year,
      row.journey_id,
      row.question_position - 1
    );
    assessmentResponses[key] = {
      startupId: row.startup_id,
      month: row.month,
      year: row.year,
      journeyId: row.journey_id,
      questionIndex: row.question_position - 1,
      entrepreneurScore:
        row.entrepreneur_score === null ? null : Number(row.entrepreneur_score),
      entrepreneurComment: row.entrepreneur_comment || "",
      entrepreneurStatus: row.entrepreneur_status,
      entrepreneurUpdatedAt: row.entrepreneur_updated_at,
      consultantScore: row.evaluator_score === null ? null : Number(row.evaluator_score),
      consultantComment: row.evaluator_comment || "",
      consultantStatus: row.evaluator_status,
      consultantUpdatedAt: row.evaluator_updated_at,
    };
  });

  Object.keys(scoreProfiles).forEach((key) => delete scoreProfiles[key]);
  startups.forEach((startup) => {
    scoreProfiles[startup.id] = defaultScoreProfile();
  });

  backendStatus = "Supabase conectado";
  ensureAccessibleStartup();
  rebuildAssessments();
  if (activeRoute === "login") activeRoute = "dashboard";
  return true;
}

async function persistStartup(startup) {
  const client = requireSupabase();
  const startupResult = await client.from("startups").insert(startup);
  throwIfSupabaseError(startupResult.error);

  const periodsResult = await client.from("assessment_periods").select("id");
  throwIfSupabaseError(periodsResult.error);
  const cycleRows = (periodsResult.data || []).map((period) => ({
    startup_id: startup.id,
    period_id: period.id,
  }));
  if (cycleRows.length) {
    const cyclesResult = await client
      .from("assessment_cycles")
      .upsert(cycleRows, { onConflict: "startup_id,period_id" });
    throwIfSupabaseError(cyclesResult.error);
  }
}

async function persistUser(user, password) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("create-user", {
    body: {
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      startupId: user.role === "admin" ? null : user.startupIds[0],
      password,
    },
  });

  if (error) {
    let message = error.message;
    try {
      if (error.context instanceof Response) {
        const details = await error.context.clone().json();
        const diagnostic = [details?.message, details?.error, details?.version]
          .filter(Boolean)
          .join(" | ");
        message = diagnostic || message;
      }
    } catch {
      // Mantém a mensagem original do Supabase.
    }
    throw new Error(message || "Não foi possível criar o usuário.");
  }

  if (data?.error) {
    const details = [data.message, data.error, data.version].filter(Boolean).join(" | ");
    throw new Error(details || "Não foi possível criar o usuário.");
  }

  await loadSupabaseData();
  return { users };
}

async function persistQuestions() {
  const client = requireSupabase();
  const journeyRows = JOURNEYS.map((journey, index) => ({
    id: journey.id,
    position: index + 1,
    name: journey.name,
    description: journey.description,
    gate: journey.gate,
  }));
  const journeyResult = await client
    .from("journeys")
    .upsert(journeyRows, { onConflict: "id" });
  throwIfSupabaseError(journeyResult.error);

  const rows = JOURNEYS.flatMap((journey) =>
    journey.questions.map((prompt, index) => ({
      journey_id: journey.id,
      position: index + 1,
      prompt,
      active: true,
    }))
  );
  const questionsResult = await client
    .from("questions")
    .upsert(rows, { onConflict: "journey_id,position" });
  throwIfSupabaseError(questionsResult.error);
}

async function persistDatabase() {
  throw new Error(
    "A restauração JSON foi desativada após a migração. Use o backup do Supabase."
  );
}

async function persistAssessmentResponses(payload) {
  const client = requireSupabase();
  const group = editableAssessmentField();
  const isEntrepreneur = group === "entrepreneur";
  const table = isEntrepreneur ? "entrepreneur_answers" : "evaluator_answers";
  const rows = Object.values(payload.responses)
    .map((response) => {
      const score = isEntrepreneur
        ? response.entrepreneurScore
        : response.consultantScore;
      if (score === null || score === undefined) return null;
      return {
        cycle_id:
          assessmentCycleIds[
            `${response.startupId}-${response.year}-${response.month}`
          ],
        question_id:
          questionIds[`${response.journeyId}-${response.questionIndex + 1}`],
        score,
        comment: isEntrepreneur
          ? response.entrepreneurComment || ""
          : response.consultantComment || "",
        status:
          (isEntrepreneur
            ? response.entrepreneurStatus
            : response.consultantStatus
          )?.toLowerCase() || "rascunho",
        updated_by: activeUserId,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((row) => row?.cycle_id && row?.question_id);

  if (rows.length) {
    const result = await client
      .from(table)
      .upsert(rows, { onConflict: "cycle_id,question_id" });
    throwIfSupabaseError(result.error);
  }
  await loadSupabaseData();
  return { assessmentResponses };
}

function appShell(content) {
  if (activeRoute === "login") return renderLogin();
  ensureAccessibleStartup();
  if (!routeAllowed(activeRoute)) activeRoute = "dashboard";
  const nav = navItemsForUser();
  const user = activeUser();
  const allowedStartups = accessibleStartups();
  return `
    <div class="shell">
      <aside class="sidebar ${mobileMenuOpen ? "menu-open" : ""}">
        <div class="brand">
          <div class="mark">H</div>
          <div class="brand-copy"><strong>HOWL Dashboard</strong><span>Diagnóstico mensal de maturidade</span></div>
          <button
            class="mobile-menu-toggle"
            type="button"
            aria-label="${mobileMenuOpen ? "Recolher menu" : "Expandir menu"}"
            aria-expanded="${mobileMenuOpen}"
            aria-controls="main-navigation"
            onclick="toggleMobileMenu()"
          >
            <span class="mobile-menu-icon" aria-hidden="true"></span>
          </button>
        </div>
        <nav class="nav" id="main-navigation">
          ${nav
            .map(
              ([route, icon, label]) =>
                `<button class="${activeRoute === route ? "active" : ""}" aria-label="${label}" onclick="go('${route}')"><span aria-hidden="true">${icon}</span>${label}</button>`
            )
            .join("")}
        </nav>
        <div class="user-card">
          <div class="eyebrow">Perfil ativo</div>
          <strong>${user.name}</strong><br />
          <span>${user.roleLabel} • ${user.organization}</span>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <strong>${pageTitle()}</strong><br />
            <span class="subtle">Cockpit executivo para banca, investidor e hub de inovação</span>
          </div>
          <div class="topbar-actions no-print">
            <select onchange="selectStartup(this.value)" aria-label="Selecionar startup">
              ${allowedStartups
                .map((s) => `<option value="${s.id}" ${s.id === selectedStartupId ? "selected" : ""}>${s.name}</option>`)
                .join("")}
            </select>
            ${
              isAdmin()
                ? `<button class="btn download-btn" title="Baixar avaliações em CSV" aria-label="Baixar avaliações em CSV" onclick="exportCsv()">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3"></path>
                    </svg>
                    <span class="download-label">Exportar CSV</span>
                  </button>`
                : ""
            }
            <button class="btn primary" onclick="go('assessment')">${isAdmin() ? "Ver respostas" : isEvaluator() ? "Responder perguntas" : "Minha autoavaliação"}</button>
            <button class="btn" onclick="logout()">Sair</button>
          </div>
        </header>
        ${content}
      </main>
    </div>
  `;
}

function pageTitle() {
  return {
    dashboard: "Dashboard geral",
    startups: "Lista de startups",
    portfolio: "Inteligência de portfólio",
    registration: "Cadastro",
    assessment: "Nova avaliação mensal",
    history: "Histórico de evolução",
    compare: "Empreendedor x Consultor",
    reports: "Relatório executivo",
    users: "Usuários e acessos",
    settings: "Configurações",
  }[activeRoute];
}

function render() {
  if (activeRoute === "login") {
    document.getElementById("app").innerHTML = renderLogin();
    return;
  }
  ensureAccessibleStartup();
  if (!routeAllowed(activeRoute)) activeRoute = "dashboard";
  const views = {
    dashboard: renderDashboard,
    startups: renderStartups,
    portfolio: renderPortfolio,
    registration: renderRegistration,
    assessment: renderAssessment,
    history: renderHistory,
    compare: renderCompare,
    reports: renderReports,
    users: renderUsers,
    settings: renderSettings,
  };
  document.getElementById("app").innerHTML = appShell(views[activeRoute]());
}

function renderLogin() {
  const configurationMessage = supabaseConfigured
    ? ""
    : `<div class="badge amber">Falta configurar a chave publicável do Supabase.</div>`;
  return `
    <div class="login">
      <section class="login-panel">
        <div class="brand"><div class="mark">H</div><div><strong>HOWL Dashboard</strong><span>Premium venture diagnostics</span></div></div>
        <div>
          <p class="eyebrow">Método HOWL</p>
          <h1>A evolução real da startup, mês a mês.</h1>
          <p>Uma plataforma executiva para cruzar percepções, revelar gaps e orientar a próxima prioridade estratégica.</p>
        </div>
      </section>
      <form class="login-form" onsubmit="login(event)">
        <div class="section-title"><h1>Entrar</h1><p>Use o acesso cadastrado no Supabase.</p></div>
        ${configurationMessage}
        <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required /></div>
        <div class="field"><label>Senha</label><input name="password" type="password" autocomplete="current-password" required /></div>
        ${loginError ? `<div class="badge red">${escapeHtml(loginError)}</div>` : ""}
        <button class="btn primary" type="submit" ${supabaseConfigured ? "" : "disabled"}>Acessar dashboard</button>
        <span class="subtle">O acesso e as permissões são validados pelo Supabase Auth.</span>
      </form>
    </div>
  `;
}

function renderDashboard() {
  const visibleStartups = isAdmin() ? startups : accessibleStartups();
  const latestAll = startups.map((startup) => latestAssessment(startup.id));
  const latestVisible = visibleStartups.map((startup) => latestAssessment(startup.id));
  const generalStats = portfolioStats(latestAll);
  const visibleStats = portfolioStats(latestVisible);
  const ownResult = latestAssessment(selectedStartupId);
  const ownStartup = startups.find((s) => s.id === selectedStartupId);
  const isFounderDashboard = activeUser().role === "empreendedor";
  const scoreDelta = ownResult.howlScore - generalStats.avgScore;
  const introText = isFounderDashboard
    ? `Compare ${ownStartup.name} com a média geral de todos os projetos acompanhados pelo HOWL.`
    : isAdmin()
      ? "Visão executiva geral de todos os projetos avaliados na plataforma."
      : "Visão executiva das startups atribuídas ao seu perfil de avaliador.";
  return `
    <section class="page">
      <div class="hero">
        <div>
          <span class="eyebrow">Dashboard geral</span>
          <h1>${isFounderDashboard ? "Seu projeto comparado ao ecossistema." : "Inteligência geral dos projetos HOWL."}</h1>
          <p>${introText}</p>
          <div class="row wrap no-print" style="margin-top:18px">
            <button class="btn primary" onclick="go('assessment')">${isAdmin() ? "Ver respostas" : "Responder avaliação mensal"}</button>
            <button class="btn" onclick="go('startups')">${isFounderDashboard ? "Ver meu projeto" : "Ver startups"}</button>
          </div>
        </div>
        <div class="row between">
          <div>
            <span class="eyebrow">${isFounderDashboard ? "Seu HOWL Score" : "Score médio geral"}</span>
            <h2>${fmt(isFounderDashboard ? ownResult.howlScore : visibleStats.avgScore, 0)}</h2>
            <span class="badge ${statusColor(isFounderDashboard ? evolutionText(scoreDelta) : classifyHowlScore(visibleStats.avgScore))}">${isFounderDashboard ? `${scoreDelta >= 0 ? "Acima" : "Abaixo"} da média geral` : classifyHowlScore(visibleStats.avgScore)}</span>
          </div>
          ${scoreRing(isFounderDashboard ? ownResult.howlScore : visibleStats.avgScore)}
        </div>
      </div>
      <div class="grid kpis">
        ${isFounderDashboard
          ? metric("Meu HOWL Score", fmt(ownResult.howlScore, 0), `${ownResult.classification} • ${evolutionText(ownResult.monthlyEvolution)}`)
          : metric("Projetos avaliados", visibleStats.evaluated, `${visibleStartups.length} cadastrados no total`)}
        ${metric("Média geral", fmt(generalStats.avgScore, 0), `${classifyHowlScore(generalStats.avgScore)} • todos os projetos`)}
        ${isFounderDashboard
          ? metric("Diferença vs média", `${scoreDelta >= 0 ? "+" : ""}${fmt(scoreDelta, 0)}`, `${ownStartup.name} comparado ao portfólio`)
          : metric("Projetos em evolução", visibleStats.evolved, `${visibleStats.regressed} regrediram no mês`)}
        ${metric("Etapa prioritária", generalStats.weakestJourney.name, `${fmt(generalStats.weakestJourney.avg)}/5 • etapa com menor maturidade média`)}
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card pad chart-card">
          <h2>${isFounderDashboard ? "Meu projeto vs média geral" : "Média geral por jornada"}</h2>
          ${isFounderDashboard ? benchmarkJourneyBars(ownResult, generalStats) : portfolioJourneyBars(generalStats)}
        </div>
        <div class="card pad">
          <h2>Distribuição por trilha</h2>
          ${distributionChart(latestVisible)}
        </div>
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card pad chart-card">
          <h2>${isFounderDashboard ? "Evolução do meu projeto" : "Evolução média do portfólio"}</h2>
          ${isFounderDashboard ? journeyMonthlyBarChart(historyFor()) : portfolioEvolutionChart(visibleStartups)}
        </div>
        <div class="card pad">
          <h2>${isFounderDashboard ? "Leitura comparativa" : "Ranking executivo"}</h2>
          ${isFounderDashboard ? founderBenchmarkText(ownResult, generalStats, scoreDelta) : ranking(latestVisible, "monthlyEvolution")}
        </div>
      </div>
    </section>
  `;
}

function metric(label, value, detail) {
  return `<article class="card pad metric"><span class="metric-label">${label}</span><div class="metric-value">${value}</div><small>${detail}</small></article>`;
}

function scoreRing(score) {
  return `<div class="score-ring" style="--p:${score}%"><div>${fmt(score, 0)}</div></div>`;
}

function printableScoreRing(score) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return `<svg class="score-svg" viewBox="0 0 140 140" role="img" aria-label="HOWL Score ${fmt(score, 0)} de 100">
    <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#e7edf5" stroke-width="18"/>
    <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#129c66" stroke-width="18" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 70 70)"/>
    <circle cx="70" cy="70" r="42" fill="#ffffff"/>
    <text x="70" y="66" text-anchor="middle" font-size="29" font-weight="900" fill="#09192f">${fmt(score, 0)}</text>
    <text x="70" y="85" text-anchor="middle" font-size="11" font-weight="800" fill="#667085">de 100</text>
  </svg>`;
}

function portfolioStats(results) {
  const validResults = results.filter((result) => result?.hasResponses);
  const journeyAverages = JOURNEYS.map((journey) => ({
    id: journey.id,
    name: journey.name,
    avg: average(validResults.map((result) => result.journeyResults.find((item) => item.id === journey.id).finalAverage)),
  }));
  return {
    avgScore: average(validResults.map((result) => result.howlScore)),
    evaluated: validResults.length,
    evolved: validResults.filter((result) => result.monthlyEvolution > 0).length,
    regressed: validResults.filter((result) => result.monthlyEvolution < 0).length,
    strongestJourney: maxBy(journeyAverages, "avg"),
    weakestJourney: minBy(journeyAverages, "avg"),
    journeyAverages,
  };
}

function portfolioJourneyBars(stats) {
  return `<div class="chart-block">
    ${chartLegend([{ label: "Média geral dos projetos", color: "#2458ff" }])}
    <div class="journey-bars">${stats.journeyAverages.map((journey) => journeyBar({ name: journey.name, finalAverage: journey.avg })).join("")}</div>
    <p class="chart-note">Médias das quatro jornadas, em escala de 0 a 5.</p>
  </div>`;
}

function benchmarkJourneyBars(result, stats) {
  return `<div class="chart-block">
    ${chartLegend([{ label: "Meu projeto", color: "#2458ff" }, { label: "Média geral", color: "#09a9c8" }])}
    <div class="benchmark-bars">
      ${result.journeyResults
        .map((journey) => {
          const avg = stats.journeyAverages.find((item) => item.id === journey.id).avg;
          return `<div>
            <div class="bar-label"><span>${journey.name}</span><span>${fmt(journey.finalAverage)} vs ${fmt(avg)}</span></div>
            <div class="bar value"><span style="width:${journey.finalAverage * 20}%;background:var(--blue)"><b>${fmt(journey.finalAverage)}</b></span></div>
            <div class="bar slim value"><span style="width:${avg * 20}%;background:var(--cyan)"><b>${fmt(avg)}</b></span></div>
          </div>`;
        })
        .join("")}
    </div>
    <p class="chart-note">A primeira barra mostra seu projeto; a segunda mostra a média geral de todos os projetos.</p>
  </div>`;
}

function founderBenchmarkText(result, stats, scoreDelta) {
  const weakestAvg = stats.journeyAverages.find((journey) => journey.id === result.weakestJourney.id)?.avg;
  const gapText = scoreDelta >= 0
    ? `Seu projeto está ${fmt(scoreDelta, 0)} pontos acima da média geral do portfólio.`
    : `Seu projeto está ${fmt(Math.abs(scoreDelta), 0)} pontos abaixo da média geral do portfólio.`;
  return `<div class="alerts">
    <div class="alert">${gapText}</div>
    <div class="alert">Sua jornada mais fraca é ${result.weakestJourney.name}, com média ${fmt(result.weakestJourney.finalAverage)} contra ${fmt(weakestAvg)} da média geral.</div>
    <div class="alert">Para ver a leitura detalhada da sua avaliação, acesse Avaliações. Relatórios completos ficam restritos aos perfis autorizados.</div>
  </div>`;
}

function journeyBar(j) {
  return `<div><div class="bar-label"><span>${j.name}</span><span>${fmt(j.finalAverage)}/5 • ${fmt(j.finalAverage * 20, 0)}%</span></div><div class="bar value"><span style="width:${j.finalAverage * 20}%;background:linear-gradient(90deg, #2458ff, #09a9c8)"><b>${fmt(j.finalAverage)}</b></span></div></div>`;
}

function renderStartups() {
  const rows = accessibleStartups().map((startup) => {
    const result = latestAssessment(startup.id);
    const hasResponses = result?.hasResponses;
    return `<tr onclick="selectStartup('${startup.id}');go('dashboard')">
      <td><strong>${escapeHtml(startup.name)}</strong><br><span class="subtle">${escapeHtml(startup.founder)}</span></td>
      <td>${escapeHtml(startup.sector)}</td><td>${escapeHtml(startup.city)}/${escapeHtml(startup.state)}</td><td>${escapeHtml(startup.stage)}</td>
      <td><strong>${hasResponses ? fmt(result.howlScore, 0) : "—"}</strong></td>
      <td><span class="badge ${hasResponses ? "blue" : "gray"}">${hasResponses ? result.currentTrail : "Sem avaliação"}</span></td>
      <td>${hasResponses ? result.weakestJourney.name : "—"}</td>
      <td><span class="badge ${hasResponses ? statusColor(evolutionText(result.monthlyEvolution)) : "gray"}">${hasResponses ? evolutionText(result.monthlyEvolution) : "Aguardando"}</span></td>
      <td><span class="badge ${hasResponses ? statusColor(result.classification) : "gray"}">${hasResponses ? result.classification : "Sem avaliação"}</span></td>
    </tr>`;
  });
  return `
    <section class="page">
      <div class="section-title"><h1>Startups</h1><p>${isAdmin() ? "Todas as startups cadastradas e avaliadas." : "Startups atribuídas ao seu perfil de acesso."}</p></div>
      <div class="card pad" style="margin:18px 0">
        <div class="filters">
          <div class="field"><label>Setor</label><select><option>Todos</option><option>Agtech</option><option>Healthtech</option><option>Edtech</option></select></div>
          <div class="field"><label>Trilha atual</label><select><option>Todas</option>${JOURNEYS.map((j) => `<option>${j.name}</option>`).join("")}</select></div>
          <div class="field"><label>Score mínimo</label><input type="number" value="0" min="0" max="100"></div>
          <div class="field"><label>Ordenação</label><select><option>Maior score</option><option>Menor score</option><option>Maior evolução</option><option>Maior gap</option><option>Maior risco</option></select></div>
        </div>
      </div>
      ${table(["Nome", "Setor", "Cidade", "Estágio", "Score", "Trilha atual", "Etapa da jornada", "Evolução", "Status"], rows.join(""))}
    </section>
  `;
}

function renderRegistration() {
  if (!isAdmin()) return renderDashboard();
  return `
    <section class="page">
      <div class="section-title"><h1>Cadastro</h1><p>Criação operacional de startups e usuários para a rodada de avaliação.</p></div>
      <div class="grid two startup-onboarding">
        <form class="card pad startup-form" onsubmit="addStartup(event)">
          <div class="row between wrap">
            <div>
              <span class="metric-label">Cadastro de startup</span>
              <h2>Nova startup</h2>
            </div>
            <span class="badge blue">Projeto</span>
          </div>
          <div class="form-grid compact">
            <div class="field"><label>Nome da startup</label><input name="name" required placeholder="Ex.: FinFlow"></div>
            <div class="field"><label>Fundador(a)</label><input name="founder" required placeholder="Nome principal"></div>
            <div class="field"><label>Setor</label><input name="sector" required placeholder="Ex.: Fintech"></div>
            <div class="field"><label>Estágio</label><select name="stage"><option>Ideação</option><option selected>MVP</option><option>Piloto</option><option>Tração</option><option>Escala</option></select></div>
            <div class="field"><label>Cidade</label><input name="city" required placeholder="Cidade"></div>
            <div class="field"><label>UF</label><input name="state" required maxlength="2" placeholder="UF"></div>
            <div class="field wide"><label>Descrição</label><textarea name="description" placeholder="Resumo do negócio, público e solução"></textarea></div>
          </div>
          <button class="btn primary" type="submit">Cadastrar startup</button>
        </form>

        <form class="card pad startup-form" onsubmit="addUser(event)">
          <div class="row between wrap">
            <div>
              <span class="metric-label">Cadastro de usuário</span>
              <h2>Novo acesso</h2>
            </div>
            <span class="badge green">Usuário</span>
          </div>
          <div class="form-grid compact">
            <div class="field"><label>Nome</label><input name="name" required placeholder="Nome completo"></div>
            <div class="field"><label>Email</label><input name="email" type="email" required placeholder="nome@empresa.com"></div>
            <div class="field"><label>Perfil</label><select name="role"><option value="empreendedor">Empreendedor</option><option value="avaliador">Avaliador</option><option value="admin">Admin</option></select></div>
            <div class="field"><label>Startup vinculada</label><select name="startupId">${startups.map((startup) => `<option value="${startup.id}" ${startup.id === selectedStartupId ? "selected" : ""}>${escapeHtml(startup.name)}</option>`).join("")}</select></div>
            <div class="field wide"><label>Organização</label><input name="organization" placeholder="Empresa, consultoria ou hub"></div>
            <div class="field wide">
              <label>Senha temporária</label>
              <div class="row">
                <input name="password" type="password" minlength="8" required autocomplete="new-password" placeholder="Mínimo 8 caracteres">
                <button class="btn" type="button" onclick="fillGeneratedPassword(this)">Gerar</button>
              </div>
              <small class="subtle">Entregue essa senha ao usuário por um canal seguro. Ele poderá trocar depois.</small>
            </div>
          </div>
          <button class="btn primary" type="submit">Cadastrar usuário</button>
        </form>
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card pad"><h2>Últimas startups</h2>${compactStartupList()}</div>
        <div class="card pad"><h2>Usuários cadastrados</h2>${compactUserList()}</div>
      </div>
    </section>
  `;
}

function compactStartupList() {
  return `<div class="mini-list">${startups.slice(-5).reverse().map((startup) => `
    <div>
      <strong>${escapeHtml(startup.name)}</strong>
      <span>${escapeHtml(startup.sector)} • ${escapeHtml(startup.stage)} • ${escapeHtml(startup.city)}/${escapeHtml(startup.state)}</span>
    </div>
  `).join("")}</div>`;
}

function compactUserList() {
  return `<div class="mini-list">${users.slice(-5).reverse().map((user) => `
    <div>
      <strong>${escapeHtml(user.name)}</strong>
      <span>${escapeHtml(user.roleLabel)} • ${escapeHtml(user.email)}</span>
    </div>
  `).join("")}</div>`;
}

function renderPortfolio() {
  const latest = accessibleStartups().map((s) => latestAssessment(s.id));
  const evaluated = latest.filter((assessment) => assessment?.hasResponses);
  const avgScore = average(evaluated.map((a) => a.howlScore));
  const allJourneys = JOURNEYS.map((journey) => ({
    name: journey.name,
    avg: average(evaluated.map((a) => a.journeyResults.find((j) => j.id === journey.id).finalAverage)),
  }));
  const strongest = maxBy(allJourneys, "avg");
  const weakest = minBy(allJourneys, "avg");
  return `
    <section class="page">
      <div class="section-title"><h1>Portfólio</h1><p>Visão agregada para admin, aceleradora, hub de inovação e banca executiva.</p></div>
      <div class="grid kpis" style="margin-top:18px">
        ${metric("Startups avaliadas", evaluated.length, `${latest.length} cadastradas no total`)}
        ${metric("Score médio", fmt(avgScore, 0), classifyHowlScore(avgScore))}
        ${metric("Jornada média mais forte", strongest.name, `${fmt(strongest.avg)}/5`)}
        ${metric("Jornada média mais fraca", weakest.name, `${fmt(weakest.avg)}/5`)}
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card pad"><h2>Média por jornada</h2><div class="journey-bars">${allJourneys.map((j) => journeyBar({ name: j.name, finalAverage: j.avg })).join("")}</div></div>
        <div class="card pad"><h2>Distribuição por trilha atual</h2>${distributionChart(latest)}</div>
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card pad"><h2>Ranking de evolução</h2>${ranking(latest, "monthlyEvolution")}</div>
        <div class="card pad"><h2>Ranking de gap de percepção</h2>${ranking(latest, "gap")}</div>
      </div>
    </section>
  `;
}

function renderAssessment() {
  const currentJourney = JOURNEYS.find((j) => j.id === activeJourney);
  const result = selectedPeriodAssessment();
  const journeyResult = result.journeyResults.find((j) => j.id === activeJourney);
  const answeredCount = answeredQuestionsForCurrentRole();
  const totalQuestions = JOURNEYS.reduce((sum, journey) => sum + journey.questions.length, 0);
  const roleInstruction = isAdmin()
    ? "Admin tem permissão total de leitura e gestão, mas não preenche avaliações."
    : isEvaluator()
      ? "Avaliador preenche somente a coluna do consultor para as startups atribuídas."
      : "Empreendedor preenche somente sua autoavaliação para a própria startup.";
  const statusText = isAdmin()
    ? "Modo leitura • respostas detalhadas"
    : draftSaved
      ? `Rascunho salvo • ${answeredCount}/${totalQuestions} da sua parte`
      : `Em preenchimento • ${answeredCount}/${totalQuestions} da sua parte`;
  const submitLabel = "Enviar minha resposta";
  const actionHtml = isAdmin()
    ? `<span class="badge gray">Admin visualiza, mas não responde</span>`
    : `<div class="row"><button class="btn" onclick="saveDraft()">Salvar rascunho</button><button class="btn primary" onclick="completeAssessment()">${submitLabel}</button></div>`;
  return `
    <section class="page">
      <div class="section-title"><h1>${isAdmin() ? "Respostas em detalhe" : "Responder perguntas HOWL"}</h1><p>${roleInstruction}</p></div>
      <div class="card pad" style="margin-top:18px">
        <div class="form-grid">
          <div class="field"><label>Startup</label><select onchange="selectStartup(this.value)">${accessibleStartups().map((s) => `<option value="${s.id}" ${s.id === selectedStartupId ? "selected" : ""}>${s.name}</option>`).join("")}</select></div>
          <div class="field"><label>Mês</label><select onchange="selectedMonthIndex=Number(this.value)">${months.map((m, i) => `<option value="${i}" ${i === selectedMonthIndex ? "selected" : ""}>${m.label}</option>`).join("")}</select></div>
          <div class="field"><label>Status</label><input value="${statusText}" readonly></div>
          <div class="field"><label>Ações</label>${actionHtml}</div>
        </div>
      </div>
      <div class="tabs">${JOURNEYS.map((j) => `<button class="${j.id === activeJourney ? "active" : ""}" onclick="setJourney('${j.id}')">${j.name}</button>`).join("")}</div>
      <div class="card pad assessment-intro">
        <div>
          <span class="metric-label">Perguntas da jornada</span>
          <h2>${currentJourney.name}</h2>
          <p>${currentJourney.description}</p>
        </div>
        <span class="badge blue">${currentJourney.questions.length} perguntas • escala 0 a 5</span>
      </div>
      ${scoreScaleLegend()}
      <div class="card assessment-list">
        ${currentJourney.questions
          .map((q, index) => {
            const savedAnswer = journeyResult.questions[index];
            const answer = isAdmin()
              ? {
                  entrepreneurScore: savedAnswer.entrepreneurScore,
                  consultantScore: savedAnswer.consultantScore,
                  entrepreneurComment: savedAnswer.entrepreneurComment || "Sem comentário registrado.",
                  consultantComment: savedAnswer.consultantComment || "Sem comentário registrado.",
                }
              : getDraftAnswer(activeJourney, index);
            const hasBothScores = answer.entrepreneurScore !== null && answer.consultantScore !== null;
            const finalScore = hasBothScores
              ? calculateQuestionScore(answer.entrepreneurScore, answer.consultantScore)
              : null;
            const gap = hasBothScores ? calculateQuestionGap(answer.entrepreneurScore, answer.consultantScore) : null;
            return `<article class="question-card">
              <div class="question-head">
                <div class="row"><span class="question-number">${index + 1}</span><strong>${q}</strong></div>
                <span class="badge ${hasBothScores ? statusColor(classifyGap(gap)) : "gray"}">${hasBothScores ? `Gap ${fmt(gap)}` : "Aguardando resposta"}</span>
              </div>
              <div class="choice-grid">
                <div class="field">
                  <label>Resposta do empreendedor ${activeUser().role === "empreendedor" ? "• editável" : ""}</label>
                  ${scoreChoices("entrepreneurScore", activeJourney, index, answer.entrepreneurScore)}
                </div>
                <div class="field">
                  <label>Resposta do consultor ${isEvaluator() ? "• editável" : ""}</label>
                  ${scoreChoices("consultantScore", activeJourney, index, answer.consultantScore)}
                </div>
              </div>
              <div class="result-strip">
                <span><strong>Média final:</strong> ${hasBothScores ? fmt(finalScore) : "não calculada"}</span>
                <span><strong>Gap:</strong> ${hasBothScores ? `${fmt(gap)} • ${classifyGap(gap)}` : "aguardando as duas respostas"}</span>
                <div class="bar"><span style="width:${hasBothScores ? Math.min(100, Math.abs(gap) * 30) : 0}%;background:${hasBothScores && Math.abs(gap) > 1.5 ? "var(--amber)" : "var(--green)"}"></span></div>
              </div>
              <div class="score-inputs">
                <div class="field" style="grid-column:span 2"><label>Comentário empreendedor</label><textarea placeholder="Comentário opcional" ${canEditScoreField("entrepreneurScore") ? `oninput="updateDraftComment('${activeJourney}', ${index}, 'entrepreneurComment', this.value)"` : "readonly"}>${answer.entrepreneurComment}</textarea></div>
                <div class="field" style="grid-column:span 2"><label>Comentário consultor</label><textarea placeholder="Comentário opcional" ${canEditScoreField("consultantScore") ? `oninput="updateDraftComment('${activeJourney}', ${index}, 'consultantComment', this.value)"` : "readonly"}>${answer.consultantComment}</textarea></div>
              </div>
            </article>`;
          })
          .join("")}
      </div>
    </section>
  `;
}

function draftKey(journeyId, questionIndex) {
  return `${selectedStartupId}-${selectedMonthIndex}-${journeyId}-${questionIndex}`;
}

function getDraftAnswer(journeyId, questionIndex) {
  const key = draftKey(journeyId, questionIndex);
  if (!draftAnswers[key]) {
    const period = months[selectedMonthIndex];
    const saved = savedQuestionResponse(selectedStartupId, period.month, period.year, journeyId, questionIndex);
    const result = assessments.find((item) => item.startupId === selectedStartupId && item.month === period.month && item.year === period.year);
    const savedQuestion = result?.journeyResults.find((journey) => journey.id === journeyId)?.questions[questionIndex];
    const canEditEntrepreneur = canEditScoreField("entrepreneurScore");
    const canEditConsultant = canEditScoreField("consultantScore");
    draftAnswers[key] = {
      entrepreneurScore: saved.entrepreneurScore ?? (canEditEntrepreneur ? null : savedQuestion?.entrepreneurScore ?? null),
      consultantScore: saved.consultantScore ?? (canEditConsultant ? null : savedQuestion?.consultantScore ?? null),
      entrepreneurComment: saved.entrepreneurComment ?? savedQuestion?.entrepreneurComment ?? "",
      consultantComment: saved.consultantComment ?? savedQuestion?.consultantComment ?? "",
    };
  }
  return draftAnswers[key];
}

function scoreChoices(field, journeyId, questionIndex, selectedValue) {
  const locked = !canEditScoreField(field);
  return `<div class="choice-scale ${selectedValue === null ? "empty" : ""}" style="--selected-index:${selectedValue ?? 0}">
    <div class="choice-arrow" aria-hidden="true"></div>
    <div class="choice-row">${SCORE_OPTIONS.map(
    (option) =>
      `<button class="choice ${selectedValue === option.value ? "active" : ""}" ${locked ? "disabled" : ""} aria-label="Nota ${option.value}" title="${locked ? "Bloqueado para este perfil" : `Nota ${option.value}`}" ${locked ? "" : `onclick="setDraftScore('${journeyId}', ${questionIndex}, '${field}', ${option.value})"`}>${option.value}</button>`
  ).join("")}</div>
  </div>`;
}

function scoreScaleLegend() {
  return `<div class="scale-legend">
    <span class="metric-label">Legenda das respostas</span>
    <div class="scale-items">
      ${SCORE_OPTIONS.map((option) => `<span><strong>${option.value}</strong>${option.label}</span>`).join("")}
    </div>
  </div>`;
}

function answeredQuestionsForCurrentRole() {
  return JOURNEYS.flatMap((journey) =>
    journey.questions.map((_, index) => getDraftAnswer(journey.id, index))
  ).filter(isAnswerCompleteForRole).length;
}

function isAnswerCompleteForRole(answer) {
  const role = activeUser().role;
  if (role === "avaliador") return answer.consultantScore !== null;
  if (role === "empreendedor") return answer.entrepreneurScore !== null;
  return false;
}

function renderHistory() {
  const history = historyFor();
  const rows = history
    .map(
      (a) => `<tr><td>${a.label}</td>${a.journeyResults
        .map((j) => `<td>${fmt(j.finalAverage)}</td>`)
        .join("")}<td><strong>${fmt(a.howlScore, 0)}</strong></td><td>${a.currentTrail}</td><td>${a.classification}</td><td>${evolutionText(a.monthlyEvolution)}</td></tr>`
    )
    .join("");
  return `<section class="page"><div class="section-title"><h1>Histórico de evolução</h1><p>Linha do tempo mensal e comparação de maturidade por jornada.</p></div><div class="card pad" style="margin-top:18px">${journeyMonthlyBarChart(history)}</div><div style="margin-top:16px">${table(["Mês", "Conceito", "Produto", "Negócios", "Crescimento", "HOWL", "Trilha", "Classificação", "Evolução"], rows)}</div></section>`;
}

function renderCompare() {
  const result = latestAssessment();
  return `
    <section class="page">
      <div class="section-title"><h1>Comparativo empreendedor x consultor</h1><p>Leitura dos gaps de percepção e risco de desalinhamento estratégico.</p></div>
      <div class="grid two" style="margin-top:18px">
        <div class="card pad"><h2>Médias por perfil</h2>${comparisonBars(result)}</div>
        <div class="card pad"><h2>Gap médio por jornada</h2><div class="journey-bars">${result.journeyResults.map((j) => journeyBar({ name: `${j.name} • ${classifyGap(j.gap)}`, finalAverage: Math.abs(j.gap) })).join("")}</div></div>
      </div>
      <div style="margin-top:16px">${journeyTable(result)}</div>
    </section>
  `;
}

function renderReports() {
  if (!isAdmin() && !isEvaluator()) {
    return `<section class="page"><div class="section-title"><h1>Relatórios restritos</h1><p>Relatórios completos estão disponíveis apenas para Admin e Avaliador.</p></div></section>`;
  }
  const result = latestAssessment();
  const startup = startups.find((s) => s.id === selectedStartupId);
  const narrative = generateNarrativeReport(startup, result);
  return `
    <section class="page">
      <div class="row between no-print"><div class="section-title"><h1>Relatório executivo</h1><p>Relatório individual com gráficos, tabelas e análise em texto corrido.</p></div><button class="btn primary" onclick="window.print()">Gerar PDF</button></div>
      <div class="report-cover" style="margin-top:18px">
        <span class="eyebrow">Relatório HOWL</span>
        <h1>${startup.name}</h1>
        <p>${result.label} • HOWL Score ${fmt(result.howlScore, 0)} • ${result.currentTrail}</p>
      </div>
      <div class="card pad report-score" style="margin-top:16px">
        ${printableScoreRing(result.howlScore)}
        <div>
          <span class="metric-label">Média HOWL pelo método</span>
          <h2>${fmt(result.howlScore, 0)} de 100</h2>
          <p>O HOWL Score transforma a média das quatro jornadas em uma escala executiva de 0 a 100. Neste ciclo, a startup está classificada como <strong>${result.classification}</strong>, com média geral ${fmt(result.generalAverage)} em uma escala de 0 a 5.</p>
        </div>
      </div>
      <div class="card pad report-narrative" style="margin-top:16px">
        <h2>Análise executiva</h2>
        ${narrative.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card pad chart-card"><h2>Radar das jornadas</h2>${radarChart(result)}</div>
        <div class="card pad chart-card"><h2>Evolução mensal por jornada</h2>${journeyMonthlyBarChart(historyFor())}</div>
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card pad"><h2>Sumário executivo</h2><p>${result.strategicRecommendation}</p></div>
        <div class="card pad"><h2>Resultado por jornada</h2><div class="journey-bars">${result.journeyResults.map(journeyBar).join("")}</div></div>
      </div>
      <div style="margin-top:16px">${journeyTable(result)}</div>
      <div style="margin-top:16px">${criticalQuestionsTable(result)}</div>
    </section>
  `;
}

function renderUsers() {
  const roleSummary = [
    { label: "Admins", value: users.filter((user) => user.role === "admin").length, detail: "Gestão, leitura e auditoria" },
    { label: "Avaliadores", value: users.filter((user) => user.role === "avaliador").length, detail: "Respondem avaliação técnica" },
    { label: "Empreendedores", value: users.filter((user) => user.role === "empreendedor").length, detail: "Respondem autoavaliação" },
  ];
  const rows = users
    .map((user) => {
      const assigned = user.role === "admin"
        ? "Todas as startups"
        : user.startupIds.map((id) => startups.find((startup) => startup.id === id)?.name).join(", ");
      return `<tr>
        <td><strong>${user.name}</strong><br><span class="subtle">${user.email}</span></td>
        <td><span class="badge ${roleColor(user.role)}">${user.roleLabel}</span></td>
        <td>${user.organization}</td>
        <td>${assigned}</td>
        <td>${accessDescription(user.role)}</td>
      </tr>`;
    })
    .join("");
  return `
    <section class="page">
      <div class="section-title"><h1>Usuários e acessos</h1><p>Estrutura de perfis para Admin, Avaliador e Empreendedor com escopo por startup.</p></div>
      <div class="grid three" style="margin-top:18px">
        ${roleSummary.map((item) => metric(item.label, item.value, item.detail)).join("")}
      </div>
      <div class="card pad" style="margin-top:16px">
        <h2>Modelo de permissão</h2>
        <div class="access-grid">
          <div><span class="badge blue">Admin</span><p>Cria usuários e startups, vê todos os dashboards, acessa respostas em detalhe, edita configurações e exporta relatórios. Não responde avaliações.</p></div>
          <div><span class="badge green">Avaliador</span><p>Visualiza startups atribuídas, responde a avaliação do consultor e acompanha resultados dessas startups.</p></div>
          <div><span class="badge amber">Empreendedor</span><p>Visualiza apenas a própria startup e responde a autoavaliação mensal enquanto estiver em rascunho.</p></div>
        </div>
      </div>
      <div style="margin-top:16px">${table(["Usuário", "Perfil", "Organização", "Startups atribuídas", "Acesso"], rows)}</div>
    </section>
  `;
}

function roleColor(role) {
  if (role === "admin") return "blue";
  if (role === "avaliador") return "green";
  return "amber";
}

function accessDescription(role) {
  if (role === "admin") return "Gestão, leitura e auditoria. Não responde.";
  if (role === "avaliador") return "Avaliações e dashboards atribuídos";
  return "Autoavaliação e dashboard próprio";
}

function renderSettings() {
  const totalQuestions = JOURNEYS.reduce((sum, journey) => sum + journey.questions.length, 0);
  const rows = JOURNEYS.flatMap((j) =>
    j.questions.map(
      (q, i) => `<tr><td>${j.name}</td><td>${i + 1}</td><td>${escapeHtml(q)}</td><td><span class="badge green">Ativa</span></td><td>${j.gate}</td></tr>`
    )
  ).join("");
  return `
    <section class="page">
      <div class="section-title"><h1>Configurações</h1><p>Banco de dados, perguntas da rodada e parâmetros do método HOWL.</p></div>
      <div class="grid three" style="margin-top:18px">
        ${metric("Perguntas ativas", totalQuestions, `${JOURNEYS.length} jornadas`)}
        ${metric("Peso empreendedor", "40%", "Autoavaliação")}
        ${metric("Banco de dados", backendStatus, `${startups.length} startups • ${users.length} usuários`)}
      </div>
      <div class="grid two" style="margin-top:16px">
        ${questionImportPanel()}
        ${databasePanel()}
      </div>
      <div style="margin-top:16px">${table(["Jornada", "Ordem", "Pergunta", "Status", "Gate"], rows)}</div>
    </section>
  `;
}

function questionImportPanel() {
  return `<div class="card pad import-panel">
    <div class="row between wrap">
      <div>
        <span class="metric-label">Upload de perguntas</span>
        <h2>Excel da rodada</h2>
      </div>
      <span class="badge ${importStatus.includes("Importadas") ? "green" : "gray"}">${escapeHtml(importStatus)}</span>
    </div>
    <p>Use uma planilha com as colunas <strong>Jornada</strong>, <strong>Ordem</strong> e <strong>Pergunta</strong>. Aceita <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>.</p>
    <div class="upload-box">
      <input id="question-file" type="file" accept=".xlsx,.xls,.csv" onchange="importQuestionsFromFile(this.files[0])">
      <button class="btn" onclick="downloadQuestionTemplate()">Baixar modelo CSV</button>
    </div>
  </div>`;
}

function databasePanel() {
  return `<div class="card pad import-panel">
    <div class="row between wrap">
      <div>
        <span class="metric-label">Base do MVP</span>
        <h2>Banco de dados</h2>
      </div>
      <span class="badge ${backendStatus.includes("conectado") ? "green" : "amber"}">${escapeHtml(backendStatus)}</span>
    </div>
    <p>Use o JSON para backup, restauração e carga completa da base local durante a validação do MVP.</p>
    <div class="upload-box">
      <input type="file" accept=".json" onchange="importDatabaseFile(this.files[0])">
      <button class="btn" onclick="downloadDatabase()">Exportar base JSON</button>
    </div>
  </div>`;
}

function journeyTable(result) {
  const rows = result.journeyResults
    .map(
      (j) => `<tr><td><strong>${j.name}</strong><br><span class="subtle">${j.gate}</span></td><td>${fmt(j.entrepreneurAverage)}</td><td>${fmt(j.consultantAverage)}</td><td><strong>${fmt(j.finalAverage)}</strong></td><td>${fmt(j.gap)}</td><td>${evolutionText(j.evolution)}</td><td><span class="badge ${statusColor(j.status)}">${j.status}</span></td></tr>`
    )
    .join("");
  return table(["Jornada", "Média Emp.", "Média Cons.", "Média Final", "Gap", "Evolução", "Status"], rows);
}

function criticalQuestionsTable(result) {
  const rows = result.journeyResults
    .flatMap((j) => j.questions)
    .sort((a, b) => a.finalScore - b.finalScore)
    .slice(0, 5)
    .map(
      (q) => `<tr><td>${q.journeyName}</td><td>${q.text}</td><td>${fmt(q.entrepreneurScore)}</td><td>${fmt(q.consultantScore)}</td><td><strong>${fmt(q.finalScore)}</strong></td><td>${fmt(q.gap)}</td><td>${q.consultantComment}</td></tr>`
    )
    .join("");
  return table(["Jornada", "Pergunta", "Nota Emp.", "Nota Cons.", "Nota Final", "Gap", "Comentário consultor"], rows);
}

function table(headers, rows) {
  return `<div class="card table-wrap"><table class="table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function radarChart(result) {
  const cx = 160;
  const cy = 150;
  const maxR = 105;
  const pointItems = result.journeyResults.map((j, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 4;
    const r = (j.finalAverage / 5) * maxR;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      value: j.finalAverage,
    };
  });
  const points = pointItems.map((item) => `${item.x},${item.y}`);
  const axes = JOURNEYS.map((j, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 4;
    const x = cx + Math.cos(angle) * (maxR + 28);
    const y = cy + Math.sin(angle) * (maxR + 28);
    const x2 = cx + Math.cos(angle) * maxR;
    const y2 = cy + Math.sin(angle) * maxR;
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#d9e0ea"/><text x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="800" fill="#172033">${j.name}</text>`;
  }).join("");
  return `<div class="chart-block">
  ${chartLegend([{ label: "Média final atual", color: "#2458ff" }, { label: "Pontos por jornada", color: "#09a9c8" }])}
  <svg class="chart" viewBox="0 0 320 300" role="img" aria-label="Radar HOWL">
    <polygon points="160,45 265,150 160,255 55,150" fill="none" stroke="#d9e0ea"/>
    <polygon points="160,80 230,150 160,220 90,150" fill="none" stroke="#e9eef5"/>
    ${axes}
    <polygon points="${points.join(" ")}" fill="rgba(36,88,255,.18)" stroke="#2458ff" stroke-width="3"/>
    ${pointItems.map((item) => `<circle cx="${item.x}" cy="${item.y}" r="4" fill="#09a9c8"/><text x="${item.x + 7}" y="${item.y - 7}" font-size="11" font-weight="850" fill="#2458ff">${fmt(item.value)}</text>`).join("")}
  </svg>
  <p class="chart-note">Escala de 0 a 5 convertida visualmente por distância do centro.</p>
  </div>`;
}

function lineChart(history, includeJourneys) {
  const width = 720;
  const height = 300;
  const pad = 36;
  const series = [
    { name: "HOWL", color: "#2458ff", values: history.map((a) => a.howlScore) },
  ];
  if (includeJourneys) {
    JOURNEYS.forEach((j, index) =>
      series.push({
        name: j.name,
        color: ["#09a9c8", "#129c66", "#d88912", "#7558f3"][index],
        values: history.map((a) => a.journeyResults.find((r) => r.id === j.id).finalAverage * 20),
      })
    );
  }
  const max = 100;
  const x = (i) => pad + (i * (width - pad * 2)) / (history.length - 1);
  const y = (v) => height - pad - (v / max) * (height - pad * 2);
  return `<div class="chart-block">
  ${chartLegend(series.map((s) => ({ label: s.name, color: s.color })))}
  <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução mensal">
    <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#d9e0ea"/>
    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#d9e0ea"/>
    ${[0, 25, 50, 75, 100].map((v) => `<text x="8" y="${y(v) + 4}" font-size="11" fill="#667085">${v}</text><line x1="${pad}" y1="${y(v)}" x2="${width - pad}" y2="${y(v)}" stroke="#eef3f8"/>`).join("")}
    ${series
      .map((s) => {
        const d = s.values.map((v, i) => `${i ? "L" : "M"} ${x(i)} ${y(v)}`).join(" ");
        const lastValue = s.values.at(-1);
        const lastIndex = s.values.length - 1;
        return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.name === "HOWL" ? 4 : 2}" stroke-linecap="round"/>${s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${s.name === "HOWL" ? 4 : 3}" fill="${s.color}"/>`).join("")}<text x="${x(lastIndex) + 7}" y="${y(lastValue) + 4}" font-size="11" font-weight="800" fill="${s.color}">${fmt(lastValue, 0)}</text>`;
      })
      .join("")}
    ${history.map((a, i) => `<text x="${x(i)}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#667085">${a.label.split("/")[0]}</text>`).join("")}
  </svg>
  <p class="chart-note">As jornadas aparecem na mesma escala do HOWL Score, de 0 a 100.</p>
  </div>`;
}

function journeyMonthlyBarChart(history) {
  if (!history.length) {
    return `<p class="chart-note">Ainda não há avaliações preenchidas para montar a evolução mensal.</p>`;
  }
  const width = 720;
  const height = 318;
  const pad = { left: 42, right: 22, top: 28, bottom: 42 };
  const colors = ["#2458ff", "#09a9c8", "#129c66", "#d88912"];
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const groupWidth = plotWidth / history.length;
  const barWidth = Math.min(24, (groupWidth - 22) / 4);
  const y = (value) => pad.top + plotHeight - (value / 100) * plotHeight;
  const target = 85;
  const bars = history
    .map((assessment, monthIndex) => {
      const groupStart = pad.left + monthIndex * groupWidth + (groupWidth - barWidth * 4) / 2;
      return assessment.journeyResults
        .map((journey, journeyIndex) => {
          const value = journey.finalAverage * 20;
          const x = groupStart + journeyIndex * barWidth;
          const barY = y(value);
          const barHeight = pad.top + plotHeight - barY;
          return `<rect x="${x}" y="${barY}" width="${barWidth - 2}" height="${barHeight}" rx="3" fill="${colors[journeyIndex]}"/>
            <text x="${x + (barWidth - 2) / 2}" y="${barY - 6}" text-anchor="middle" font-size="10" font-weight="850" fill="${colors[journeyIndex]}">${fmt(value, 0)}%</text>`;
        })
        .join("");
    })
    .join("");
  return `<div class="chart-block">
    ${chartLegend([...JOURNEYS.map((journey, index) => ({ label: journey.name, color: colors[index] })), { label: "Meta mínima por jornada: 85%", color: "#cf3f46" }])}
    <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução mensal por jornada">
      <line x1="${pad.left}" y1="${pad.top + plotHeight}" x2="${width - pad.right}" y2="${pad.top + plotHeight}" stroke="#d9e0ea"/>
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotHeight}" stroke="#d9e0ea"/>
      ${[0, 20, 40, 60, 80, 100].map((value) => `<text x="8" y="${y(value) + 4}" font-size="11" fill="#667085">${value}%</text><line x1="${pad.left}" y1="${y(value)}" x2="${width - pad.right}" y2="${y(value)}" stroke="#eef3f8"/>`).join("")}
      <line x1="${pad.left}" y1="${y(target)}" x2="${width - pad.right}" y2="${y(target)}" stroke="#cf3f46" stroke-width="2" stroke-dasharray="7 5"/>
      <text x="${width - pad.right - 4}" y="${y(target) - 7}" text-anchor="end" font-size="11" font-weight="850" fill="#cf3f46">Meta 85%</text>
      ${bars}
      ${history.map((assessment, index) => `<text x="${pad.left + index * groupWidth + groupWidth / 2}" y="${height - 12}" text-anchor="middle" font-size="11" font-weight="750" fill="#667085">${assessment.label.split("/")[0]}</text>`).join("")}
    </svg>
    <p class="chart-note">Cada mês mostra quatro barras, uma para cada jornada, convertidas para percentual de maturidade de 0 a 100%. A linha vermelha marca a meta mínima de 85%.</p>
  </div>`;
}

function portfolioEvolutionChart(portfolioStartups) {
  const syntheticHistory = months
    .map((period) => {
      const monthlyResults = portfolioStartups
        .map((startup) =>
          assessments.find((assessment) => assessment.startupId === startup.id && assessment.month === period.month && assessment.year === period.year)
        )
        .filter((assessment) => assessment?.hasResponses);
      if (!monthlyResults.length) return null;
      return {
        label: period.label,
        howlScore: average(monthlyResults.map((result) => result.howlScore)),
        journeyResults: JOURNEYS.map((journey) => ({
          id: journey.id,
          finalAverage: average(monthlyResults.map((result) => result.journeyResults.find((item) => item.id === journey.id).finalAverage)),
        })),
      };
    })
    .filter(Boolean);
  return journeyMonthlyBarChart(syntheticHistory);
}

function chartLegend(items) {
  return `<div class="chart-legend">${items
    .map((item) => `<span><i style="background:${item.color}"></i>${item.label}</span>`)
    .join("")}</div>`;
}

function distributionChart(latest) {
  const answered = latest.filter((assessment) => assessment?.hasResponses);
  if (!answered.length) return `<p class="chart-note">Ainda não há avaliações preenchidas para distribuir por trilha.</p>`;
  const counts = answered.reduce((acc, a) => {
    acc[a.currentTrail] = (acc[a.currentTrail] || 0) + 1;
    return acc;
  }, {});
  return `<div class="journey-bars">${Object.entries(counts).map(([name, count]) => journeyBar({ name, finalAverage: (count / answered.length) * 5 })).join("")}</div>`;
}

function ranking(items, key) {
  const sorted = items.filter((item) => item?.hasResponses).sort((a, b) => {
    const av = key === "gap" ? Math.abs(a.mainGapJourney.gap) : a[key];
    const bv = key === "gap" ? Math.abs(b.mainGapJourney.gap) : b[key];
    return bv - av;
  });
  if (!sorted.length) return `<p class="chart-note">Ainda não há avaliações preenchidas para montar o ranking.</p>`;
  return `<div class="journey-bars">${sorted
    .map((a) => {
      const startup = startups.find((s) => s.id === a.startupId);
      const value = key === "gap" ? Math.abs(a.mainGapJourney.gap) : a[key];
      return journeyBar({ name: `${startup.name} • ${fmt(value)}`, finalAverage: key === "gap" ? value : Math.max(0, value / 20) });
    })
    .join("")}</div>`;
}

function comparisonBars(result) {
  return `<div class="journey-bars">${result.journeyResults
    .map(
      (j) =>
        `<div><div class="bar-label"><span>${j.name}</span><span>Emp. ${fmt(j.entrepreneurAverage)} • Cons. ${fmt(j.consultantAverage)}</span></div><div class="bar"><span style="width:${j.entrepreneurAverage * 20}%;background:var(--blue)"></span></div><div class="bar" style="margin-top:5px"><span style="width:${j.consultantAverage * 20}%;background:var(--cyan)"></span></div></div>`
    )
    .join("")}</div>`;
}

function generateAlerts(result) {
  const gapAverage = average(result.journeyResults.map((j) => Math.abs(j.gap)));
  const byId = Object.fromEntries(result.journeyResults.map((j) => [j.id, j.finalAverage]));
  const alerts = [];
  if (gapAverage > 1.5) alerts.push("Alerta: existe divergência relevante entre a percepção do empreendedor e a avaliação do consultor.");
  if (byId.negocios < 3) alerts.push("Risco: modelo econômico ainda não validado.");
  if (byId.crescimento < 2) alerts.push("Observação: o projeto ainda não demonstra capacidade de escala.");
  if (result.monthlyEvolution > 5) alerts.push("Evolução forte no mês.");
  if (result.monthlyEvolution < 0) alerts.push("Atenção: a startup regrediu em relação à avaliação anterior.");
  if (byId.conceito < 3) alerts.push("Prioridade: aprofundar validação do problema antes de avançar em produto.");
  return alerts.length ? alerts : ["Percepções alinhadas e evolução dentro do esperado para o ciclo atual."];
}

function evolutionText(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${fmt(value)} pts`;
}

function exportCsv() {
  const allowedIds = accessibleStartups().map((startup) => startup.id);
  const rows = [
    ["Startup", "Mês", "Score", "Trilha", "Classificação", "Mais forte", "Mais fraca", "Evolução"],
    ...assessments.filter((a) => allowedIds.includes(a.startupId)).map((a) => {
      const startup = startups.find((s) => s.id === a.startupId);
      return [startup.name, a.label, fmt(a.howlScore, 0), a.currentTrail, a.classification, a.strongestJourney.name, a.weakestJourney.name, fmt(a.monthlyEvolution)];
    }),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "howl-avaliacoes.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function go(route) {
  if (!routeAllowed(route) && route !== "login") {
    activeRoute = "dashboard";
    mobileMenuOpen = false;
    render();
    return;
  }
  activeRoute = route;
  mobileMenuOpen = false;
  render();
}

function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  render();
}

function selectUser(id) {
  activeUserId = id;
  ensureAccessibleStartup();
  if (!routeAllowed(activeRoute)) activeRoute = "dashboard";
  render();
}

function selectStartup(id) {
  if (accessibleStartups().some((startup) => startup.id === id)) selectedStartupId = id;
  ensureAccessibleStartup();
  render();
}

function setJourney(id) {
  activeJourney = id;
  render();
}

function setDraftScore(journeyId, questionIndex, field, value) {
  const answer = getDraftAnswer(journeyId, questionIndex);
  answer[field] = Number(value);
  draftSaved = false;
  render();
}

function updateDraftComment(journeyId, questionIndex, field, value) {
  const answer = getDraftAnswer(journeyId, questionIndex);
  answer[field] = value;
  draftSaved = false;
}

async function addStartup(event) {
  event.preventDefault();
  if (!isAdmin() && !backendStatus.includes("conectado")) {
    window.alert("Apenas Admin pode cadastrar startups.");
    return;
  }
  const data = Object.fromEntries(new FormData(event.target).entries());
  const baseId = slugify(data.name);
  let id = baseId;
  let suffix = 2;
  while (startups.some((startup) => startup.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  const startup = {
    id,
    name: String(data.name || "").trim(),
    founder: String(data.founder || "").trim(),
    sector: String(data.sector || "").trim(),
    city: String(data.city || "").trim(),
    state: String(data.state || "").trim().toUpperCase(),
    stage: String(data.stage || "MVP").trim(),
    description: String(data.description || "").trim() || "Startup cadastrada para a primeira rodada de diagnóstico HOWL.",
  };
  try {
    if (backendStatus.includes("conectado")) {
      await persistStartup(startup);
      await loadSupabaseData();
    } else {
      startups.push(startup);
      scoreProfiles[id] = defaultScoreProfile(startups.length);
    }
    selectedStartupId = id;
    rebuildAssessments();
    event.target.reset();
    window.alert(`${startup.name} cadastrada e pronta para avaliação.`);
  } catch (error) {
    window.alert(error.message || "Não foi possível cadastrar a startup.");
  }
  render();
}

async function addUser(event) {
  event.preventDefault();
  if (!isAdmin() && !backendStatus.includes("conectado")) {
    window.alert("Apenas Admin pode cadastrar usuários.");
    return;
  }
  const data = Object.fromEntries(new FormData(event.target).entries());
  const roleLabels = { admin: "Admin", avaliador: "Avaliador", empreendedor: "Empreendedor" };
  const role = String(data.role || "empreendedor");
  const password = String(data.password || "");
  if (password.length < 8) {
    window.alert("A senha temporária precisa ter pelo menos 8 caracteres.");
    return;
  }
  const linkedStartup = startups.find((startup) => startup.id === data.startupId);
  const user = {
    id: slugify(`${data.name}-${role}`),
    name: String(data.name || "").trim(),
    email: String(data.email || "").trim(),
    role,
    roleLabel: roleLabels[role] || "Usuário",
    organization: String(data.organization || "").trim() || linkedStartup?.name || "HOWL",
    startupIds: role === "admin" ? startups.map((startup) => startup.id) : [String(data.startupId || selectedStartupId)],
  };
  let id = user.id;
  let suffix = 2;
  while (users.some((item) => item.id === id)) {
    id = `${user.id}-${suffix}`;
    suffix += 1;
  }
  user.id = id;
  try {
    if (backendStatus.includes("conectado")) {
      const saved = await persistUser(user, password);
      users = saved.users;
    } else {
      users.push(user);
    }
    event.target.reset();
    window.alert(`${user.name} cadastrado com perfil ${user.roleLabel}. Entregue a senha temporária por um canal seguro.`);
  } catch (error) {
    window.alert(error.message || "Não foi possível cadastrar o usuário.");
  }
  render();
}

function downloadQuestionTemplate() {
  const header = "Jornada,Ordem,Pergunta\n";
  const rows = JOURNEYS.flatMap((journey) =>
    journey.questions.map((question, index) =>
      [journey.name, index + 1, question].map(csvCell).join(",")
    )
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo-perguntas-howl.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function importQuestionsFromFile(file) {
  if (!file) return;
  try {
    const rows = await readQuestionRows(file);
    applyImportedQuestions(rows);
    if (backendStatus.includes("conectado")) await persistQuestions();
    rebuildAssessments();
    importStatus = `Importadas ${JOURNEYS.reduce((sum, journey) => sum + journey.questions.length, 0)} perguntas`;
    window.alert("Perguntas importadas com sucesso. Dashboards e avaliações foram recalculados.");
  } catch (error) {
    importStatus = "Falha na importação";
    window.alert(error.message || "Não foi possível importar a planilha.");
  }
  render();
}

function currentDatabaseSnapshot() {
  return {
    journeys: JOURNEYS,
    startups,
    users,
    scoreProfiles,
    assessmentResponses,
    months,
    updatedAt: new Date().toISOString(),
  };
}

function downloadDatabase() {
  const blob = new Blob([JSON.stringify(currentDatabaseSnapshot(), null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "howl-mvp-database.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importDatabaseFile(file) {
  if (!file) return;
  try {
    const database = JSON.parse(await file.text());
    validateDatabase(database);
    if (backendStatus.includes("conectado")) await persistDatabase(database);
    JOURNEYS = database.journeys;
    startups = database.startups;
    users = database.users;
    Object.keys(scoreProfiles).forEach((key) => delete scoreProfiles[key]);
    Object.assign(scoreProfiles, database.scoreProfiles || {});
    assessmentResponses = database.assessmentResponses || {};
    backendStatus = backendStatus.includes("conectado") ? "Backend local conectado" : "Base JSON carregada em memória";
    ensureAccessibleStartup();
    rebuildAssessments();
    window.alert("Base importada com sucesso.");
  } catch (error) {
    window.alert(error.message || "Não foi possível importar a base JSON.");
  }
  render();
}

function validateDatabase(database) {
  if (!Array.isArray(database.journeys)) throw new Error("JSON inválido: campo journeys ausente.");
  if (!Array.isArray(database.startups)) throw new Error("JSON inválido: campo startups ausente.");
  if (!Array.isArray(database.users)) throw new Error("JSON inválido: campo users ausente.");
}

async function saveCurrentRoleResponses(status) {
  const fieldGroup = editableAssessmentField();
  if (!fieldGroup) throw new Error("Perfil sem permissão para responder avaliações.");
  const period = months[selectedMonthIndex];
  const responses = {};
  JOURNEYS.forEach((journey) => {
    journey.questions.forEach((_, questionIndex) => {
      const answer = getDraftAnswer(journey.id, questionIndex);
      const key = responseKey(selectedStartupId, period.month, period.year, journey.id, questionIndex);
      const current = assessmentResponses[key] || {};
      const next = {
        ...current,
        startupId: selectedStartupId,
        month: period.month,
        year: period.year,
        journeyId: journey.id,
        questionIndex,
      };
      if (fieldGroup === "entrepreneur") {
        next.entrepreneurScore = answer.entrepreneurScore;
        next.entrepreneurComment = answer.entrepreneurComment || "";
        next.entrepreneurStatus = status;
        next.entrepreneurUserId = activeUserId;
        next.entrepreneurUpdatedAt = new Date().toISOString();
      }
      if (fieldGroup === "consultant") {
        next.consultantScore = answer.consultantScore;
        next.consultantComment = answer.consultantComment || "";
        next.consultantStatus = status;
        next.consultantUserId = activeUserId;
        next.consultantUpdatedAt = new Date().toISOString();
      }
      responses[key] = next;
    });
  });
  if (backendStatus.includes("conectado")) {
    const saved = await persistAssessmentResponses({ responses });
    assessmentResponses = saved.assessmentResponses || assessmentResponses;
  } else {
    assessmentResponses = { ...assessmentResponses, ...responses };
  }
  rebuildAssessments();
}

async function readQuestionRows(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (extension === "csv") {
    return parseCsv(await file.text());
  }
  if (!window.XLSX) {
    throw new Error("Para importar Excel, conecte à internet ou envie o arquivo como CSV. A biblioteca XLSX não carregou.");
  }
  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((item) => item.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  const headers = rows.shift()?.map((item) => item.trim()) || [];
  return rows.map((items) =>
    Object.fromEntries(headers.map((header, index) => [header, items[index] ?? ""]))
  );
}

function applyImportedQuestions(rows) {
  const grouped = new Map(JOURNEYS.map((journey) => [normalizeText(journey.name), []]));
  rows.forEach((row, index) => {
    const fields = normalizeQuestionRow(row);
    if (!fields.question) return;
    const journeyKey = fields.journey
      ? normalizeText(fields.journey)
      : normalizeText(JOURNEYS[Math.floor(index / 10)]?.name || JOURNEYS[0].name);
    if (!grouped.has(journeyKey)) {
      throw new Error(`Jornada não reconhecida: "${fields.journey}". Use Conceito, Produto, Negócios ou Crescimento.`);
    }
    grouped.get(journeyKey).push({
      order: Number(fields.order) || grouped.get(journeyKey).length + 1,
      question: fields.question,
    });
  });
  const total = [...grouped.values()].reduce((sum, items) => sum + items.length, 0);
  if (!total) throw new Error("A planilha não trouxe perguntas válidas.");
  JOURNEYS.forEach((journey) => {
    const imported = grouped.get(normalizeText(journey.name));
    if (imported.length) {
      journey.questions = imported
        .sort((a, b) => a.order - b.order)
        .map((item) => item.question);
    }
  });
}

function normalizeQuestionRow(row) {
  const entries = Object.entries(row).map(([key, value]) => [normalizeText(key), String(value ?? "").trim()]);
  const findValue = (...names) => entries.find(([key]) => names.some((name) => key === normalizeText(name)))?.[1] || "";
  return {
    journey: findValue("Jornada", "Trilha", "Etapa"),
    order: findValue("Ordem", "Numero", "Número", "N"),
    question: findValue("Pergunta", "Questao", "Questão", "Perguntas"),
  };
}

async function saveDraft() {
  if (!canEditAssessment()) {
    window.alert("Admin acompanha os dados, mas não preenche avaliações.");
    return;
  }
  try {
    await saveCurrentRoleResponses("Rascunho");
    draftSaved = true;
  } catch (error) {
    window.alert(error.message || "Não foi possível salvar o rascunho.");
  }
  render();
}

async function completeAssessment() {
  if (isAdmin()) {
    window.alert("Admin visualiza respostas em detalhe, mas não responde avaliações.");
    return;
  }
  const incomplete = JOURNEYS.flatMap((journey) =>
    journey.questions.map((_, index) => getDraftAnswer(journey.id, index))
  ).filter((answer) => !isAnswerCompleteForRole(answer));
  if (incomplete.length) {
    window.alert(`Ainda faltam ${incomplete.length} pergunta(s) da sua responsabilidade.`);
    return;
  }
  try {
    await saveCurrentRoleResponses("Enviada");
    draftSaved = true;
    window.alert("Sua resposta foi enviada e salva no banco de dados.");
    activeRoute = "dashboard";
  } catch (error) {
    window.alert(error.message || "Não foi possível enviar sua resposta.");
  }
  render();
}

async function login(event) {
  event.preventDefault();
  loginError = "";
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());
  submitButton.disabled = true;
  submitButton.textContent = "Entrando...";

  try {
    const client = requireSupabase();
    const result = await client.auth.signInWithPassword({
      email: String(data.email || "").trim(),
      password: String(data.password || ""),
    });
    throwIfSupabaseError(result.error);
    currentSession = result.data.session;
    activeRoute = "dashboard";
    await loadSupabaseData();
  } catch (error) {
    activeRoute = "login";
    loginError =
      error.message === "Invalid login credentials"
        ? "E-mail ou senha incorretos."
        : error.message || "Não foi possível entrar.";
  }
  render();
}

async function logout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentSession = null;
  loginError = "";
  activeRoute = "login";
  backendStatus = "Aguardando autenticação";
  render();
}

async function initializeApp() {
  if (!supabaseConfigured) {
    backendStatus = "Supabase ainda não configurado";
    activeRoute = "login";
    render();
    return;
  }

  try {
    await loadSupabaseData();
  } catch (error) {
    activeRoute = "login";
    loginError = error.message || "Não foi possível conectar ao Supabase.";
    backendStatus = "Falha ao conectar ao Supabase";
  }
  render();
}

initializeApp();
