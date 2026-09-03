const supabaseConfig = window.HOWL_SUPABASE_CONFIG || {};
const supabaseConfigured =
  Boolean(supabaseConfig.url) &&
  Boolean(supabaseConfig.publishableKey) &&
  !supabaseConfig.publishableKey.includes("COLE_AQUI");
const supabaseLibraryAvailable = Boolean(window.supabase?.createClient);
const supabaseClient = supabaseConfigured && supabaseLibraryAvailable
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;
let currentSession = null;
let loginError = "";
let assessmentCycleIds = {};
let questionIds = {};
let publicApplications = [];
let mentorStartupLinks = [];
let mentorshipSessions = [];
let mentorshipTasks = [];
let publicApplicationMessage = "";
let programTypes = [
  { id: "aceleracao", type: "Aceleração" },
  { id: "advisor", type: "Advisor" },
  { id: "residencia", type: "Residência" },
];
let programs = [
  {
    id: "programa-howl-atual",
    programTypeId: "aceleracao",
    name: "Programa Demo",
    client: "Organização Demo",
  },
];

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
    programId: "programa-howl-atual",
    name: "Startup Alpha",
    founder: "Pessoa Demo Alpha",
    sector: "Agtech",
    city: "São Paulo",
    state: "SP",
    stage: "MVP",
    description:
      "Exemplo fictício de sensoriamento e inteligência preditiva para produtores.",
  },
  {
    id: "healthflow",
    programId: "programa-howl-atual",
    name: "Startup Beta",
    founder: "Pessoa Demo Beta",
    sector: "Healthtech",
    city: "Recife",
    state: "PE",
    stage: "Piloto",
    description:
      "Exemplo fictício de orquestração de jornada assistencial.",
  },
  {
    id: "educamatch",
    programId: "programa-howl-atual",
    name: "Startup Gamma",
    founder: "Pessoa Demo Gamma",
    sector: "Edtech",
    city: "Florianópolis",
    state: "SC",
    stage: "Tração",
    description:
      "Exemplo fictício de matching de trilhas personalizadas.",
  },
];

let users = [
  {
    id: "admin-demo",
    name: "Admin Demo",
    email: "admin@example.com",
    role: "admin",
    roleLabel: "Admin",
    organization: "Organização Demo",
    programId: null,
    startupIds: ["agrosense", "healthflow", "educamatch"],
    active: true,
  },
  {
    id: "avaliador-demo-1",
    name: "Avaliador Demo 1",
    email: "avaliador1@example.com",
    role: "avaliador",
    roleLabel: "Avaliador",
    organization: "Consultoria Demo",
    programId: "programa-howl-atual",
    startupIds: [],
    active: true,
  },
  {
    id: "avaliador-demo-2",
    name: "Avaliador Demo 2",
    email: "avaliador2@example.com",
    role: "avaliador",
    roleLabel: "Avaliador",
    organization: "Mentoria Demo",
    programId: "programa-howl-atual",
    startupIds: [],
    active: true,
  },
  {
    id: "empreendedor-demo",
    name: "Empreendedor Demo",
    email: "empreendedor@example.com",
    role: "empreendedor",
    roleLabel: "Empreendedor",
    organization: "Startup Alpha",
    programId: null,
    startupIds: ["agrosense"],
    active: true,
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

const PUBLIC_ROUTES = new Set(["home", "pitch", "startupApply", "mentorApply"]);
const ROUTE_ALIASES = {
  "/": "home",
  "/pitch": "pitch",
  "/apply": "startupApply",
  "/mentor-apply": "mentorApply",
  "/auth": "login",
  "/app": "dashboard",
  "/app/mentorship": "mentorship",
};

function initialRoute() {
  const hashRoute = window.location?.hash?.replace("#", "") || "home";
  return ROUTE_ALIASES[hashRoute] || hashRoute || "home";
}

const initialRouteWasExplicit = Boolean(window.location?.hash?.replace("#", ""));
let activeRoute = initialRoute();
let mobileMenuOpen = false;
let selectedStartupId = "agrosense";
let selectedDashboardProgramId = "all";
let selectedMonthIndex = 3;
let activeJourney = "conceito";
let draftSaved = false;
let draftAnswers = {};
let activeUserId = "admin-demo";
let backendStatus = "Conectando ao Supabase...";
let assessmentResponses = {};
let editingUserId = null;

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

function isClient() {
  return normalizedRole() === "cliente";
}

function isManager() {
  return isAdmin() || isClient();
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
  if (user?.programId) {
    return startups.filter((startup) => startup.programId === user.programId);
  }
  return startups.filter((startup) => user.startupIds.includes(startup.id));
}

function dashboardStartups() {
  const allowed = accessibleStartups();
  if (!isAdmin() || selectedDashboardProgramId === "all") return allowed;
  return allowed.filter((startup) => startup.programId === selectedDashboardProgramId);
}

function programById(programId) {
  return programs.find((program) => program.id === programId);
}

function programTypeById(programTypeId) {
  return programTypes.find((programType) => programType.id === programTypeId);
}

function programLabel(programId) {
  const program = programById(programId);
  return program ? `${program.name} • ${program.client}` : "Sem programa";
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
    ["mentorship", "✦", "Mentorias"],
    ["assessment", "✎", "Avaliações"],
    ["history", "↗", "Histórico"],
    ["compare", "⇄", "Comparativo"],
  ];
  if (isManager() || isEvaluator()) base.push(["reports", "□", "Relatórios"]);
  if (isManager()) {
    base.splice(2, 0, ["portfolio", "◈", "Portfólio"]);
    base.splice(3, 0, ["registration", "+", "Cadastro"]);
    base.push(["applications", "◇", "Inscrições"]);
    base.push(["users", "◌", "Usuários"]);
  }
  if (isAdmin()) {
    base.push(["settings", "⚙", "Configurações"]);
  }
  return base;
}

function routeAllowed(route) {
  if (PUBLIC_ROUTES.has(route) || route === "login") return true;
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
    throw new Error(
      supabaseConfigured
        ? "A biblioteca do Supabase não carregou. Recarregue a página e verifique sua conexão."
        : "Configure a chave publicável do Supabase antes de continuar."
    );
  }
  return supabaseClient;
}

function throwIfSupabaseError(error) {
  if (error) throw new Error(error.message || "Erro de comunicação com o Supabase.");
}

function isMissingSupabaseRelation(error) {
  const message = error?.message || "";
  return error?.code === "42P01"
    || error?.code === "PGRST205"
    || message.includes("Could not find the table")
    || message.includes("relation") && message.includes("does not exist");
}

async function loadSupabaseData() {
  const client = requireSupabase();
  const sessionResult = await client.auth.getSession();
  throwIfSupabaseError(sessionResult.error);
  currentSession = sessionResult.data.session;

  if (!currentSession) {
    if (!PUBLIC_ROUTES.has(activeRoute)) activeRoute = "login";
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
    programTypesResult,
    programsResult,
    startupsResult,
    profilesResult,
    linksResult,
    journeysResult,
    questionsResult,
    periodsResult,
    cyclesResult,
    resultsResult,
    applicationsResult,
    mentorLinksResult,
    mentorshipSessionsResult,
    mentorshipTasksResult,
  ] = await Promise.all([
    client.from("program_types").select("*").order("type"),
    client.from("programs").select("*").order("name"),
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
    client
      .from("horda_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    client
      .from("mentor_startup_links")
      .select("*")
      .order("created_at", { ascending: false }),
    client
      .from("mentorship_sessions")
      .select("*")
      .order("scheduled_at", { ascending: false }),
    client
      .from("mentorship_tasks")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  [
    programTypesResult,
    programsResult,
    startupsResult,
    profilesResult,
    linksResult,
    journeysResult,
    questionsResult,
    periodsResult,
    cyclesResult,
    resultsResult,
  ].forEach((result) => throwIfSupabaseError(result.error));

  if (applicationsResult.error && !isMissingSupabaseRelation(applicationsResult.error)) {
    throwIfSupabaseError(applicationsResult.error);
  }
  [mentorLinksResult, mentorshipSessionsResult, mentorshipTasksResult].forEach((result) => {
    if (result.error && !isMissingSupabaseRelation(result.error)) {
      throwIfSupabaseError(result.error);
    }
  });

  programTypes = (programTypesResult.data || []).map((programType) => ({
    id: programType.id,
    type: programType.type,
  }));

  programs = (programsResult.data || []).map((program) => ({
    id: program.id,
    programTypeId: program.program_type_id,
    name: program.name,
    client: program.client,
  }));

  startups = (startupsResult.data || []).map((startup) => ({
    id: startup.id,
    programId: startup.program_id,
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
  const roleLabels = { admin: "Admin", cliente: "Cliente", avaliador: "Avaliador", empreendedor: "Empreendedor" };
  users = (profilesResult.data || []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    roleLabel: roleLabels[profile.role] || "Usuário",
    organization: profile.organization,
    programId: profile.program_id || null,
    authUserId: profile.auth_user_id || null,
    active: profile.active !== false,
    startupIds:
      profile.role === "admin"
        ? startups.map((startup) => startup.id)
        : links
            .filter((link) => link.profile_id === profile.id)
            .map((link) => link.startup_id),
  }));

  publicApplications = applicationsResult.error ? [] : (applicationsResult.data || []).map((application) => ({
    id: application.id,
    type: application.application_type,
    status: application.status,
    name: application.name,
    contactName: application.contact_name || "",
    email: application.email,
    phone: application.phone || "",
    organization: application.organization || "",
    sector: application.sector || "",
    stage: application.stage || "",
    city: application.city || "",
    state: application.state || "",
    availability: application.availability || "",
    experience: application.experience || "",
    pitch: application.pitch || "",
    programId: application.program_id || null,
    approvedStartupId: application.approved_startup_id || null,
    approvedProfileId: application.approved_profile_id || null,
    reviewedBy: application.reviewed_by || null,
    reviewedAt: application.reviewed_at || null,
    rejectionReason: application.rejection_reason || "",
    createdAt: application.created_at,
  }));

  mentorStartupLinks = mentorLinksResult.error ? [] : (mentorLinksResult.data || []).map((link) => ({
    id: link.id,
    programId: link.program_id,
    startupId: link.startup_id,
    mentorId: link.mentor_profile_id,
    status: link.status,
    notes: link.notes || "",
    createdBy: link.created_by || null,
    createdAt: link.created_at,
    updatedAt: link.updated_at,
  }));

  mentorshipSessions = mentorshipSessionsResult.error ? [] : (mentorshipSessionsResult.data || []).map((session) => ({
    id: session.id,
    linkId: session.link_id,
    programId: session.program_id,
    startupId: session.startup_id,
    mentorId: session.mentor_profile_id,
    status: session.status,
    scheduledAt: session.scheduled_at,
    durationMinutes: session.duration_minutes,
    topic: session.topic || "",
    agenda: session.agenda || "",
    summary: session.summary || "",
    decisions: session.decisions || "",
    nextSteps: session.next_steps || "",
    createdBy: session.created_by || null,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  }));

  mentorshipTasks = mentorshipTasksResult.error ? [] : (mentorshipTasksResult.data || []).map((task) => ({
    id: task.id,
    sessionId: task.session_id,
    programId: task.program_id,
    startupId: task.startup_id,
    mentorId: task.mentor_profile_id,
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    dueDate: task.due_date || "",
    createdBy: task.created_by || null,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
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
      programId: signedInProfile.program_id || null,
      authUserId: signedInProfile.auth_user_id || null,
      active: signedInProfile.active !== false,
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
  if (activeRoute === "login" || (!initialRouteWasExplicit && activeRoute === "home")) {
    activeRoute = "dashboard";
    syncRouteHash(activeRoute);
  }
  return true;
}

async function persistStartup(startup) {
  const client = requireSupabase();
  const startupResult = await client.from("startups").insert({
    id: startup.id,
    program_id: startup.programId,
    name: startup.name,
    founder: startup.founder,
    sector: startup.sector,
    city: startup.city,
    state: startup.state,
    stage: startup.stage,
    description: startup.description,
  });
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

async function persistProgramType(programType) {
  const client = requireSupabase();
  const result = await client.from("program_types").insert(programType);
  throwIfSupabaseError(result.error);
}

async function persistProgram(program) {
  const client = requireSupabase();
  const result = await client.from("programs").insert({
    id: program.id,
    program_type_id: program.programTypeId,
    name: program.name,
    client: program.client,
  });
  throwIfSupabaseError(result.error);
}

async function persistPublicApplication(application) {
  const client = requireSupabase();
  const result = await client.from("horda_applications").insert({
    id: application.id,
    application_type: application.type,
    status: "pending",
    name: application.name,
    contact_name: application.contactName,
    email: application.email,
    phone: application.phone,
    organization: application.organization,
    sector: application.sector,
    stage: application.stage,
    city: application.city,
    state: application.state,
    availability: application.availability,
    experience: application.experience,
    pitch: application.pitch,
  });
  if (isMissingSupabaseRelation(result.error)) {
    throw new Error("A migration de inscrições públicas ainda não foi aplicada no Supabase.");
  }
  throwIfSupabaseError(result.error);
}

async function updatePublicApplication(applicationId, payload) {
  const client = requireSupabase();
  const result = await client
    .from("horda_applications")
    .update({
      ...payload,
      reviewed_by: activeUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);
  if (isMissingSupabaseRelation(result.error)) {
    throw new Error("A migration de inscrições públicas ainda não foi aplicada no Supabase.");
  }
  throwIfSupabaseError(result.error);
}

async function persistMentorStartupLink(link) {
  const client = requireSupabase();
  const result = await client.from("mentor_startup_links").insert({
    id: link.id,
    program_id: link.programId,
    startup_id: link.startupId,
    mentor_profile_id: link.mentorId,
    status: link.status,
    notes: link.notes,
    created_by: activeUserId,
  });
  if (isMissingSupabaseRelation(result.error)) {
    throw new Error("A migration de mentorias ainda não foi aplicada no Supabase.");
  }
  throwIfSupabaseError(result.error);
}

async function updateMentorStartupLink(linkId, payload) {
  const client = requireSupabase();
  const result = await client
    .from("mentor_startup_links")
    .update(payload)
    .eq("id", linkId);
  if (isMissingSupabaseRelation(result.error)) {
    throw new Error("A migration de mentorias ainda não foi aplicada no Supabase.");
  }
  throwIfSupabaseError(result.error);
}

async function persistMentorshipSession(session) {
  const client = requireSupabase();
  const result = await client.from("mentorship_sessions").insert({
    id: session.id,
    link_id: session.linkId,
    program_id: session.programId,
    startup_id: session.startupId,
    mentor_profile_id: session.mentorId,
    status: session.status,
    scheduled_at: session.scheduledAt,
    duration_minutes: session.durationMinutes,
    topic: session.topic,
    agenda: session.agenda,
    summary: session.summary,
    decisions: session.decisions,
    next_steps: session.nextSteps,
    created_by: activeUserId,
  });
  if (isMissingSupabaseRelation(result.error)) {
    throw new Error("A migration de mentorias ainda não foi aplicada no Supabase.");
  }
  throwIfSupabaseError(result.error);
}

async function updateMentorshipSession(sessionId, payload) {
  const client = requireSupabase();
  const result = await client
    .from("mentorship_sessions")
    .update(payload)
    .eq("id", sessionId);
  if (isMissingSupabaseRelation(result.error)) {
    throw new Error("A migration de mentorias ainda não foi aplicada no Supabase.");
  }
  throwIfSupabaseError(result.error);
}

async function persistMentorshipTask(task) {
  const client = requireSupabase();
  const result = await client.from("mentorship_tasks").insert({
    id: task.id,
    session_id: task.sessionId,
    program_id: task.programId,
    startup_id: task.startupId,
    mentor_profile_id: task.mentorId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate || null,
    created_by: activeUserId,
  });
  if (isMissingSupabaseRelation(result.error)) {
    throw new Error("A migration de mentorias ainda não foi aplicada no Supabase.");
  }
  throwIfSupabaseError(result.error);
}

async function updateMentorshipTask(taskId, payload) {
  const client = requireSupabase();
  const result = await client
    .from("mentorship_tasks")
    .update(payload)
    .eq("id", taskId);
  if (isMissingSupabaseRelation(result.error)) {
    throw new Error("A migration de mentorias ainda não foi aplicada no Supabase.");
  }
  throwIfSupabaseError(result.error);
}

async function persistUser(user, password) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("create-user", {
    body: {
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      startupId: user.role === "empreendedor" ? user.startupIds[0] : null,
      programId: ["cliente", "avaliador"].includes(user.role) ? user.programId : null,
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

async function persistManagedUser(payload) {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("manage-user", {
    body: payload,
  });

  if (error) {
    let message = error.message;
    try {
      if (error.context instanceof Response) {
        const details = await error.context.clone().json();
        message = details?.message || details?.error || message;
      }
    } catch {
      // Mantém a mensagem original do Supabase.
    }
    throw new Error(message || "Não foi possível gerenciar o usuário.");
  }
  if (data?.error) {
    throw new Error(data.message || data.error);
  }

  await loadSupabaseData();
  return data;
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

function publicBrand() {
  return `
    <button class="public-brand" type="button" onclick="go('home')" aria-label="HORDA Home">
      <img class="public-brand-logo" src="./assets/howl-logo-menu.jpg" alt="HORDA" />
    </button>
  `;
}

function publicTopbar() {
  const items = [
    ["home", "Plataforma"],
    ["pitch", "Pitch"],
    ["startupApply", "Startup"],
    ["mentorApply", "Mentor"],
  ];
  return `
    <header class="public-topbar">
      ${publicBrand()}
      <nav class="public-nav" aria-label="Navegação pública">
        ${items
          .map(
            ([route, label]) =>
              `<button class="${activeRoute === route ? "active" : ""}" type="button" onclick="go('${route}')">${label}</button>`
          )
          .join("")}
      </nav>
      <div class="public-actions">
        <button class="btn" type="button" onclick="go('login')">Entrar</button>
        <button class="btn primary" type="button" onclick="go('login')">Acessar HOWL</button>
      </div>
    </header>
  `;
}

function publicDashboardPreview() {
  return `
    <div class="public-product-shot" aria-label="Prévia da plataforma HORDA">
      <div class="public-shot-header">
        <div class="public-shot-dots"><span></span><span></span><span></span></div>
        <b>HORDA / HOWL Dashboard</b>
      </div>
      <div class="public-shot-body">
        <aside class="public-shot-sidebar">
          ${["Dashboard", "Startups", "Avaliações", "Portfólio", "Relatórios", "Usuários"]
            .map(
              (item, index) =>
                `<div class="public-shot-nav-item ${index === 0 ? "active" : ""}"><span>${["DB", "ST", "AV", "PF", "RE", "US"][index]}</span>${item}</div>`
            )
            .join("")}
        </aside>
        <main class="public-shot-main">
          <b>Dashboard do Programa</b>
          <div class="public-mini-grid">
            <div class="public-mini-card"><b>42</b><small>Startups ativas</small></div>
            <div class="public-mini-card"><b>118</b><small>Mentorias ativas</small></div>
            <div class="public-mini-card"><b>84</b><small>HOWL Score médio</small></div>
          </div>
          <div class="public-chart">
            <svg viewBox="0 0 620 180" role="img" aria-label="Gráfico de impacto">
              <path class="path-blue" d="M24 132 C90 126 112 90 168 94 S252 128 310 78 S404 40 466 58 S548 88 596 38" />
              <path class="path-green" d="M24 148 C102 132 130 138 196 112 S290 96 350 104 S444 72 504 82 S556 64 596 54" />
            </svg>
          </div>
          <div class="public-list">
            <div class="public-list-row"><div><b>Matching IA de Mentores</b><span>3 mentores recomendados para Startup Alpha</span></div><span class="badge blue">IA</span></div>
            <div class="public-list-row"><div><b>Alerta de Impacto</b><span>Score evoluiu depois da revisão de rota</span></div><span class="badge green">Alto</span></div>
          </div>
        </main>
      </div>
    </div>
  `;
}

function renderPublicHome() {
  return `
    <div class="public-shell">
      ${publicTopbar()}
      <section class="public-section public-hero">
        <div>
          <span class="public-eyebrow">Com precisão de IA para aceleração e mentoria</span>
          <h1>HORDA</h1>
          <p>A HORDA conecta startups, mentores e gestores em uma jornada inteligente de crescimento. O HOWL Dashboard entra como o módulo de diagnóstico, score, avaliação e relatório executivo.</p>
          <div class="public-hero-actions">
            <button class="btn primary" type="button" onclick="go('login')">Acessar plataforma</button>
            <button class="btn" type="button" onclick="go('pitch')">Ver pitch</button>
          </div>
          <div class="public-metric-strip">
            <div class="public-metric"><strong>76%</strong><span>tarefas concluídas</span></div>
            <div class="public-metric"><strong>42</strong><span>startups ativas</span></div>
            <div class="public-metric"><strong>84</strong><span>score médio</span></div>
          </div>
        </div>
        ${publicDashboardPreview()}
      </section>
      <section class="public-section">
        <div class="public-section-heading">
          <h2>Da sessão ao plano de ação rastreável.</h2>
          <p>A plataforma combina pré-mentoria, análise por IA, sessões ao vivo, OKRs, tarefas, relatórios e dashboards executivos.</p>
        </div>
        <div class="public-cards-grid">
          <article class="card"><h3>HORDA</h3><p>Orquestra programas de aceleração, mentorias, matching, tarefas e acompanhamento do ecossistema.</p></article>
          <article class="card"><h3>HOWL Dashboard</h3><p>Concentra diagnóstico, autoavaliação, avaliação consultiva, score, evolução e relatórios.</p></article>
          <article class="card"><h3>Permissões Reais</h3><p>Supabase Auth, perfis e RLS controlam o que admin, cliente, avaliador e empreendedor podem acessar.</p></article>
        </div>
      </section>
      <section class="public-section public-role-band">
        <div class="public-section-heading">
          <h2>Uma experiência para cada papel.</h2>
          <p>Gestores, mentores e startups operam na mesma base de dados, mas com fluxos personalizados.</p>
        </div>
        <div class="public-cards-grid">
          <article class="card"><h3>Gestor</h3><p>Aprova, acompanha portfólio, consulta relatórios e mede impacto do programa.</p></article>
          <article class="card"><h3>Mentor</h3><p>Acessa contexto da startup, responde avaliações e acompanha evolução.</p></article>
          <article class="card"><h3>Startup</h3><p>Visualiza sua jornada, responde autoavaliação e acompanha próximos passos.</p></article>
        </div>
      </section>
      <section class="public-section">
        <div class="public-section-heading">
          <h2>Fluxo de mentoria orquestrado.</h2>
        </div>
        <div class="public-workflow">
          ${[
            ["Onboarding", "Startups e mentores se inscrevem e gestores aprovam o programa."],
            ["Matching IA", "Pares mentor-startup são sugeridos por especialidade e necessidade."],
            ["Pré-mentoria", "Contexto, métricas e objetivos são enviados antes da sessão."],
            ["Sessão", "Mentor valida insights e define prioridades com a startup."],
            ["Impacto", "Tarefas, scores e relatórios mostram evolução ao longo do tempo."],
          ]
            .map(
              ([title, text], index) => `
                <div class="public-step">
                  <div class="public-step-number">${index + 1}</div>
                  <b>${title}</b>
                  <p>${text}</p>
                </div>
              `
            )
            .join("")}
        </div>
      </section>
      ${publicFooter()}
    </div>
  `;
}

function renderPublicPitch() {
  return `
    <div class="public-shell">
      ${publicTopbar()}
      <section class="public-section public-pitch-hero">
        <span class="public-eyebrow">White-label para aceleradoras, VCs e inovação corporativa</span>
        <h1>Harmonização Orquestrada de Redes, Dados e Ações.</h1>
        <p>Programas de mentoria deixam de operar no artesanal e passam a trabalhar com inteligência, dados, automação e mensuração de ROI.</p>
      </section>
      <section class="public-section">
        <div class="public-section-heading"><h2>Problemas que a HORDA resolve</h2></div>
        <div class="public-cards-grid">
          <article class="card"><h3>Mentores mal alocados</h3><p>Matching manual perde contexto e distribui expertise de forma desigual.</p></article>
          <article class="card"><h3>Sem métricas de impacto</h3><p>Gestores ficam sem visibilidade de evolução, tarefas e retorno do programa.</p></article>
          <article class="card"><h3>Contexto reaprendido</h3><p>Mentores precisam reconstruir histórico a cada encontro, reduzindo profundidade.</p></article>
        </div>
      </section>
      <section class="public-section">
        <div class="public-section-heading"><h2>Agentes de IA da plataforma</h2></div>
        <div class="public-cards-grid">
          <article class="card"><h3>Analista de Sessão</h3><p>Extrai aprendizados, ações e próximos passos de reuniões e transcrições.</p></article>
          <article class="card"><h3>Analisador de Rota</h3><p>Compara mudanças estratégicas e calcula impacto de decisões.</p></article>
          <article class="card"><h3>Matching Mentor-Startup</h3><p>Recomenda mentores por setor, etapa, disponibilidade e necessidade.</p></article>
        </div>
      </section>
      ${publicFooter()}
    </div>
  `;
}

function renderPublicApplication(type) {
  const mentor = type === "mentor";
  const messageHtml = publicApplicationMessage
    ? `<div class="badge ${publicApplicationMessage.includes("enviada") ? "green" : "amber"}">${escapeHtml(publicApplicationMessage)}</div>`
    : "";
  return publicFormShell(
    mentor ? "Cadastro de Mentor" : "Inscrição de Startup",
    mentor
      ? "Compartilhe sua experiência para atuar nas jornadas da HORDA."
      : "Preencha os dados iniciais da sua startup para entrar no programa.",
    `
      ${messageHtml}
      <form class="public-application-form" onsubmit="submitPublicApplication(event, '${mentor ? "mentor" : "startup"}')">
        <div class="form-grid">
          <div class="field"><label>${mentor ? "Nome do Mentor" : "Nome da Startup"}</label><input name="name" required placeholder="${mentor ? "Ex: Pessoa Mentora" : "Ex: Startup Demo"}" /></div>
          <div class="field"><label>${mentor ? "E-mail" : "Contato principal"}</label><input name="${mentor ? "email" : "contactName"}" ${mentor ? "type=\"email\"" : ""} required placeholder="${mentor ? "nome@empresa.com" : "Nome completo"}" /></div>
          <div class="field"><label>${mentor ? "Telefone" : "E-mail"}</label><input name="${mentor ? "phone" : "email"}" ${mentor ? "" : "type=\"email\""} required placeholder="${mentor ? "(00) 00000-0000" : "nome@startup.com"}" /></div>
          <div class="field"><label>${mentor ? "Organização" : "Telefone"}</label><input name="${mentor ? "organization" : "phone"}" placeholder="${mentor ? "Empresa, consultoria ou hub" : "(00) 00000-0000"}" /></div>
          <div class="field"><label>${mentor ? "Especialidade" : "Setor"}</label><input name="sector" required placeholder="${mentor ? "Produto, growth, finanças..." : "SaaS, IA, fintech..."}" /></div>
          <div class="field"><label>${mentor ? "Anos de experiência" : "Estágio"}</label><input name="${mentor ? "experience" : "stage"}" placeholder="${mentor ? "10" : "MVP, piloto, tração..."}" /></div>
          <div class="field"><label>Cidade</label><input name="city" placeholder="Cidade" /></div>
          <div class="field"><label>UF</label><input name="state" maxlength="2" placeholder="UF" /></div>
          <div class="field wide"><label>Disponibilidade</label><input name="availability" placeholder="${mentor ? "2 sessões por mês" : "Melhores horários para contato"}" /></div>
          <div class="field wide"><label>${mentor ? "Sobre você como mentor" : "Pitch resumido"}</label><textarea name="pitch" required placeholder="${mentor ? "Conte sua trajetória, metodologia e motivação." : "Em 2-3 frases, descreva sua startup."}"></textarea></div>
        </div>
        <div class="public-hero-actions">
          <button class="btn primary" type="submit">Enviar cadastro</button>
          <button class="btn" type="button" onclick="go('login')">Acessar HOWL</button>
        </div>
      </form>
    `
  );
}

function publicFormShell(title, subtitle, body) {
  return `
    <div class="public-shell">
      ${publicTopbar()}
      <main class="public-form-page">
        <section class="public-form-card">
          <h1>${title}</h1>
          <p>${subtitle}</p>
          ${body}
        </section>
      </main>
    </div>
  `;
}

function publicFooter() {
  return `
    <footer class="public-footer">
      <span>HORDA. Plataforma para aceleração de negócios e mentorias.</span>
      <span>HOWL Dashboard como módulo de diagnóstico e score.</span>
    </footer>
  `;
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
          <img class="brand-logo" src="./assets/howl-logo-menu.jpg" alt="Horda" />
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
              isManager()
                ? `<button class="btn download-btn" title="Baixar avaliações em CSV" aria-label="Baixar avaliações em CSV" onclick="exportCsv()">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3"></path>
                    </svg>
                    <span class="download-label">Exportar CSV</span>
                  </button>`
                : ""
            }
            <button class="btn primary" onclick="go('assessment')">${isManager() ? "Ver respostas" : isEvaluator() ? "Responder perguntas" : "Minha autoavaliação"}</button>
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
    mentorship: "Mentorias",
    portfolio: "Inteligência de portfólio",
    registration: "Cadastro",
    assessment: "Nova avaliação mensal",
    history: "Histórico de evolução",
    compare: "Empreendedor x Consultor",
    reports: "Relatório executivo",
    applications: "Inscrições",
    users: "Usuários e acessos",
    settings: "Configurações",
  }[activeRoute];
}

function render() {
  if (activeRoute === "home") {
    document.getElementById("app").innerHTML = renderPublicHome();
    return;
  }
  if (activeRoute === "pitch") {
    document.getElementById("app").innerHTML = renderPublicPitch();
    return;
  }
  if (activeRoute === "startupApply") {
    document.getElementById("app").innerHTML = renderPublicApplication("startup");
    return;
  }
  if (activeRoute === "mentorApply") {
    document.getElementById("app").innerHTML = renderPublicApplication("mentor");
    return;
  }
  if (activeRoute === "login") {
    document.getElementById("app").innerHTML = renderLogin();
    return;
  }
  if (!currentSession) {
    activeRoute = "login";
    document.getElementById("app").innerHTML = renderLogin();
    return;
  }
  ensureAccessibleStartup();
  if (!routeAllowed(activeRoute)) activeRoute = "dashboard";
  const views = {
    dashboard: renderDashboard,
    startups: renderStartups,
    mentorship: renderMentorship,
    portfolio: renderPortfolio,
    registration: renderRegistration,
    assessment: renderAssessment,
    history: renderHistory,
    compare: renderCompare,
    reports: renderReports,
    applications: renderApplications,
    users: renderUsers,
    settings: renderSettings,
  };
  document.getElementById("app").innerHTML = appShell(views[activeRoute]());
}

function renderLogin() {
  const configurationMessage = !supabaseConfigured
    ? `<div class="badge amber">Falta configurar a chave publicável do Supabase.</div>`
    : !supabaseClient
      ? `<div class="badge amber">A biblioteca do Supabase não carregou. Recarregue a página e verifique sua conexão.</div>`
      : "";
  return `
    <div class="login">
      <section class="login-panel">
        <img
          class="login-logo"
          src="./assets/horda-login.jpg"
          alt="Horda — Plataforma para aceleração de negócios e mentorias, um negócio do Grupo Creative Pack"
        />
      </section>
      <form class="login-form" onsubmit="login(event)">
        <div class="section-title"><h1>Entrar</h1><p>Use o acesso cadastrado no Supabase.</p></div>
        ${configurationMessage}
        <div class="field"><label>E-mail</label><input name="email" type="email" autocomplete="email" required /></div>
        <div class="field"><label>Senha</label><input name="password" type="password" autocomplete="current-password" required /></div>
        ${loginError ? `<div class="badge red">${escapeHtml(loginError)}</div>` : ""}
        <button class="btn primary" type="submit" ${supabaseClient ? "" : "disabled"}>Acessar dashboard</button>
        <span class="subtle">O acesso e as permissões são validados pelo Supabase Auth.</span>
      </form>
    </div>
  `;
}

function renderDashboard() {
  const visibleStartups = dashboardStartups();
  const latestAll = startups.map((startup) => latestAssessment(startup.id));
  const latestVisible = visibleStartups.map((startup) => latestAssessment(startup.id));
  const generalStats = portfolioStats(latestAll);
  const visibleStats = portfolioStats(latestVisible);
  const dashboardStats = isAdmin() || isClient() || isEvaluator() ? visibleStats : generalStats;
  const ownResult = latestAssessment(selectedStartupId);
  const ownStartup = startups.find((s) => s.id === selectedStartupId);
  const isFounderDashboard = activeUser().role === "empreendedor";
  const scoreDelta = ownResult.howlScore - generalStats.avgScore;
  const selectedProgram = programById(selectedDashboardProgramId);
  const programFilterActive = isAdmin() && selectedDashboardProgramId !== "all";
  const introText = isFounderDashboard
    ? `Compare ${ownStartup.name} com a média geral de todos os projetos acompanhados pelo HOWL.`
    : isAdmin()
      ? programFilterActive
        ? `Visão executiva das startups do programa ${selectedProgram?.name || ""}.`
        : "Visão executiva geral de todos os projetos avaliados na plataforma."
      : isClient()
        ? `Visão executiva das startups do programa ${programById(activeUser().programId)?.name || ""}.`
      : "Visão executiva das startups atribuídas ao seu perfil de avaliador.";
  return `
    <section class="page">
      <div class="hero">
        <div>
          <span class="eyebrow">Dashboard geral</span>
          <h1>${isFounderDashboard ? "Seu projeto comparado ao ecossistema." : "Inteligência geral dos projetos HOWL."}</h1>
          <p>${introText}</p>
          ${isAdmin() ? `<div class="field no-print" style="max-width:420px;margin-top:16px">
            <label>Filtrar dashboard por programa</label>
            <select onchange="selectDashboardProgram(this.value)">
              <option value="all" ${selectedDashboardProgramId === "all" ? "selected" : ""}>Todos os programas</option>
              ${programs.map((program) => `<option value="${program.id}" ${program.id === selectedDashboardProgramId ? "selected" : ""}>${escapeHtml(program.name)} • ${escapeHtml(program.client)}</option>`).join("")}
            </select>
          </div>` : ""}
          <div class="row wrap no-print" style="margin-top:18px">
            <button class="btn primary" onclick="go('assessment')">${isManager() ? "Ver respostas" : "Responder avaliação mensal"}</button>
            <button class="btn" onclick="go('startups')">${isFounderDashboard ? "Ver meu projeto" : "Ver startups"}</button>
          </div>
        </div>
        <div class="row between">
          <div>
            <span class="eyebrow">${isFounderDashboard ? "Seu HOWL Score" : isClient() || programFilterActive ? "Score médio do programa" : "Score médio geral"}</span>
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
        ${metric(isClient() || programFilterActive ? "Média do programa" : "Média geral", fmt(dashboardStats.avgScore, 0), `${classifyHowlScore(dashboardStats.avgScore)} • ${isClient() || programFilterActive ? "startups do programa" : "todos os projetos"}`)}
        ${isFounderDashboard
          ? metric("Diferença vs média", `${scoreDelta >= 0 ? "+" : ""}${fmt(scoreDelta, 0)}`, `${ownStartup.name} comparado ao portfólio`)
          : metric("Projetos em evolução", visibleStats.evolved, `${visibleStats.regressed} regrediram no mês`)}
        ${metric("Etapa prioritária", dashboardStats.weakestJourney.name, `${fmt(dashboardStats.weakestJourney.avg)}/5 • etapa com menor maturidade média`)}
      </div>
      <div class="grid two" style="margin-top:16px">
        <div class="card pad chart-card">
          <h2>${isFounderDashboard ? "Meu projeto vs média geral" : isClient() || programFilterActive ? "Média do programa por jornada" : "Média geral por jornada"}</h2>
          ${isFounderDashboard ? benchmarkJourneyBars(ownResult, generalStats) : portfolioJourneyBars(dashboardStats)}
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
      <td>${escapeHtml(programById(startup.programId)?.name || "—")}</td>
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
      <div class="section-title"><h1>Startups</h1><p>${isAdmin() ? "Todas as startups cadastradas e avaliadas." : isClient() || isEvaluator() ? "Startups do seu programa." : "Sua startup vinculada."}</p></div>
      <div class="card pad" style="margin:18px 0">
        <div class="filters">
          <div class="field"><label>Setor</label><select><option>Todos</option><option>Agtech</option><option>Healthtech</option><option>Edtech</option></select></div>
          <div class="field"><label>Trilha atual</label><select><option>Todas</option>${JOURNEYS.map((j) => `<option>${j.name}</option>`).join("")}</select></div>
          <div class="field"><label>Score mínimo</label><input type="number" value="0" min="0" max="100"></div>
          <div class="field"><label>Ordenação</label><select><option>Maior score</option><option>Menor score</option><option>Maior evolução</option><option>Maior gap</option><option>Maior risco</option></select></div>
        </div>
      </div>
      ${table(["Nome", "Programa", "Setor", "Cidade", "Estágio", "Score", "Trilha atual", "Etapa da jornada", "Evolução", "Status"], rows.join(""))}
    </section>
  `;
}

function renderMentorship() {
  const visibleLinks = mentorshipLinksVisibleToUser();
  const activeLinks = visibleLinks.filter((link) => link.status === "active");
  const visibleSessions = mentorshipSessionsVisibleToUser();
  const visibleTasks = mentorshipTasksVisibleToUser();
  const openTasks = visibleTasks.filter((task) => task.status !== "done");
  const scheduledSessions = visibleSessions.filter((session) => session.status === "scheduled");
  const completedSessions = visibleSessions.filter((session) => session.status === "completed");
  const title = isManager()
    ? "Mentores, vínculos e mentorias"
    : isEvaluator()
      ? "Dashboard de mentoria"
      : "Minha mentoria";
  const subtitle = isManager()
    ? "Vincule mentores a startups, agende sessões e acompanhe tarefas pós-sessão."
    : isEvaluator()
      ? "Acompanhe suas startups vinculadas, sessões e próximos itens de ação."
      : "Veja seu mentor, próximas sessões e tarefas combinadas.";
  return `
    <section class="page">
      <div class="section-title"><h1>${title}</h1><p>${subtitle}</p></div>
      <div class="grid kpis" style="margin-top:18px">
        ${metric("Vínculos ativos", activeLinks.length, "mentor-startup")}
        ${metric("Sessões agendadas", scheduledSessions.length, "próximas mentorias")}
        ${metric("Sessões concluídas", completedSessions.length, "histórico registrado")}
        ${metric("Tarefas abertas", openTasks.length, "plano de ação")}
      </div>
      ${
        isManager()
          ? `<div class="grid two startup-onboarding">
              ${mentorLinkForm()}
              ${mentorshipSessionForm(activeLinks)}
            </div>
            <div class="grid two startup-onboarding">
              ${mentorshipTaskForm(visibleSessions)}
              ${mentorshipWorkflowCard()}
            </div>`
          : `<div class="grid two startup-onboarding">
              ${mentorPortfolioCard(activeLinks)}
              ${mentorshipWorkflowCard()}
            </div>`
      }
      <div class="grid two" style="margin-top:16px">
        ${mentorLinksCard(visibleLinks)}
        ${mentorshipSessionsCard(visibleSessions)}
      </div>
      <div style="margin-top:16px">${mentorshipTasksCard(visibleTasks)}</div>
    </section>
  `;
}

function mentorLinkForm() {
  const visibleStartups = accessibleStartups();
  const mentors = mentorUsersForManager();
  return `<form class="card pad startup-form" onsubmit="addMentorStartupLink(event)">
    <div class="row between wrap">
      <div>
        <span class="metric-label">Matching operacional</span>
        <h2>Vincular mentor a startup</h2>
      </div>
      <span class="badge blue">Dados reais</span>
    </div>
    <div class="form-grid compact">
      <div class="field wide"><label>Startup</label><select name="startupId" required>${visibleStartups.map((startup) => `<option value="${startup.id}">${escapeHtml(startup.name)} • ${escapeHtml(programById(startup.programId)?.name || "")}</option>`).join("")}</select></div>
      <div class="field wide"><label>Mentor</label><select name="mentorId" required>${mentors.map((mentor) => `<option value="${mentor.id}">${escapeHtml(mentor.name)} • ${escapeHtml(mentor.organization || "Mentor")}</option>`).join("")}</select></div>
      <div class="field wide"><label>Observações</label><textarea name="notes" placeholder="Ex.: foco em produto, vendas, captação ou estratégia."></textarea></div>
    </div>
    <button class="btn primary" type="submit" ${visibleStartups.length && mentors.length ? "" : "disabled"}>Vincular mentor</button>
  </form>`;
}

function mentorshipSessionForm(activeLinks) {
  return `<form class="card pad startup-form" onsubmit="addMentorshipSession(event)">
    <div class="row between wrap">
      <div>
        <span class="metric-label">Agenda de mentoria</span>
        <h2>Nova sessão</h2>
      </div>
      <span class="badge green">Sessão</span>
    </div>
    <div class="form-grid compact">
      <div class="field wide"><label>Vínculo</label><select name="linkId" required>${activeLinks.map((link) => `<option value="${link.id}">${escapeHtml(startupName(link.startupId))} • ${escapeHtml(mentorName(link.mentorId))}</option>`).join("")}</select></div>
      <div class="field"><label>Data e hora</label><input name="scheduledAt" type="datetime-local" required></div>
      <div class="field"><label>Duração</label><input name="durationMinutes" type="number" min="15" step="15" value="60" required></div>
      <div class="field wide"><label>Pauta</label><input name="topic" required placeholder="Ex.: validação de pricing, vendas enterprise, roadmap"></div>
      <div class="field wide"><label>Contexto pré-sessão</label><textarea name="agenda" placeholder="Contexto, métricas e perguntas para preparar a mentoria."></textarea></div>
      <div class="field wide"><label>Resumo pós-sessão</label><textarea name="summary" placeholder="Preencha depois da sessão, quando houver."></textarea></div>
      <div class="field wide"><label>Decisões e próximos passos</label><textarea name="nextSteps" placeholder="Decisões tomadas, responsáveis e próximos passos."></textarea></div>
    </div>
    <button class="btn primary" type="submit" ${activeLinks.length ? "" : "disabled"}>Salvar sessão</button>
  </form>`;
}

function mentorshipTaskForm(visibleSessions) {
  const sessions = visibleSessions.filter((session) => session.status !== "canceled");
  return `<form class="card pad startup-form" onsubmit="addMentorshipTask(event)">
    <div class="row between wrap">
      <div>
        <span class="metric-label">Plano de ação</span>
        <h2>Tarefa pós-sessão</h2>
      </div>
      <span class="badge amber">Execução</span>
    </div>
    <div class="form-grid compact">
      <div class="field wide"><label>Sessão relacionada</label><select name="sessionId" required>${sessions.map((session) => `<option value="${session.id}">${escapeHtml(startupName(session.startupId))} • ${escapeHtml(session.topic)} • ${formatDate(session.scheduledAt)}</option>`).join("")}</select></div>
      <div class="field wide"><label>Tarefa</label><input name="title" required placeholder="Ex.: entrevistar 10 clientes do ICP"></div>
      <div class="field"><label>Prioridade</label><select name="priority"><option value="high">Alta</option><option value="medium" selected>Média</option><option value="low">Baixa</option></select></div>
      <div class="field"><label>Prazo</label><input name="dueDate" type="date"></div>
      <div class="field wide"><label>Descrição</label><textarea name="description" placeholder="Detalhe evidência esperada, responsável ou critério de conclusão."></textarea></div>
    </div>
    <button class="btn primary" type="submit" ${sessions.length ? "" : "disabled"}>Criar tarefa</button>
  </form>`;
}

function mentorshipWorkflowCard() {
  const steps = [
    ["Preparação", "Startup compartilha contexto, métricas e dúvidas antes da sessão."],
    ["Sessão", "Mentor conduz a conversa e registra aprendizados, decisões e riscos."],
    ["Plano de ação", "Próximos passos viram tarefas rastreáveis para a startup."],
    ["Acompanhamento", "Gestor e mentor monitoram progresso até a próxima mentoria."],
  ];
  return `<div class="card pad">
    <span class="metric-label">Fluxo inspirado no Lovable</span>
    <h2>Processo de mentoria</h2>
    <div class="alerts">${steps.map(([name, description], index) => `<div class="alert"><strong>${index + 1}. ${name}</strong><br>${description}</div>`).join("")}</div>
  </div>`;
}

function mentorPortfolioCard(activeLinks) {
  const ownLinks = activeLinks.length ? activeLinks : mentorshipLinksVisibleToUser().filter((link) => link.status === "active");
  if (!ownLinks.length) {
    return `<div class="card pad empty-state">
      <span class="metric-label">${isEvaluator() ? "Portfólio do mentor" : "Mentoria"}</span>
      <h2>Nenhum vínculo ativo ainda.</h2>
      <p>${isEvaluator() ? "O gestor do programa ainda não vinculou startups ao seu perfil." : "O gestor do programa ainda não vinculou um mentor à sua startup."}</p>
    </div>`;
  }
  return `<div class="card pad">
    <span class="metric-label">${isEvaluator() ? "Portfólio do mentor" : "Mentor vinculado"}</span>
    <h2>${isEvaluator() ? "Startups acompanhadas" : mentorName(ownLinks[0].mentorId)}</h2>
    <div class="mini-list">${ownLinks.map((link) => `<div class="mini-item"><strong>${escapeHtml(startupName(link.startupId))}</strong><span>${escapeHtml(programById(link.programId)?.name || "")} • ${escapeHtml(link.notes || "Mentoria ativa")}</span></div>`).join("")}</div>
  </div>`;
}

function mentorLinksCard(links) {
  if (!links.length) {
    return `<div class="card pad empty-state"><span class="metric-label">Vínculos</span><h2>Nenhum vínculo mentor-startup.</h2><p>Crie o primeiro vínculo para habilitar agenda, sessões e tarefas de mentoria.</p></div>`;
  }
  const rows = links.map((link) => `<tr>
    <td><strong>${escapeHtml(startupName(link.startupId))}</strong><br><span class="subtle">${escapeHtml(programById(link.programId)?.name || "")}</span></td>
    <td>${escapeHtml(mentorName(link.mentorId))}</td>
    <td>${escapeHtml(link.notes || "—")}</td>
    <td><span class="badge ${link.status === "active" ? "green" : "gray"}">${link.status === "active" ? "Ativo" : "Inativo"}</span></td>
    <td>${isManager() && link.status === "active" ? `<button class="btn" type="button" onclick='deactivateMentorStartupLink(${JSON.stringify(link.id)})'>Desativar</button>` : ""}</td>
  </tr>`).join("");
  return `<div><div class="section-title compact-title"><h2>Vínculos mentor-startup</h2><p>Relações reais que definem portfólio e permissões de mentoria.</p></div>${table(["Startup", "Mentor", "Observações", "Status", "Ações"], rows)}</div>`;
}

function mentorshipSessionsCard(sessions) {
  if (!sessions.length) {
    return `<div class="card pad empty-state"><span class="metric-label">Sessões</span><h2>Nenhuma sessão registrada.</h2><p>Agende a primeira mentoria para começar o histórico operacional.</p></div>`;
  }
  const rows = sessions.map((session) => `<tr>
    <td><strong>${escapeHtml(session.topic)}</strong><br><span class="subtle">${escapeHtml(startupName(session.startupId))}</span></td>
    <td>${escapeHtml(mentorName(session.mentorId))}</td>
    <td>${formatDateTime(session.scheduledAt)}</td>
    <td>${session.durationMinutes} min</td>
    <td><span class="badge ${mentorshipStatusColor(session.status)}">${mentorshipStatusLabel(session.status)}</span></td>
    <td>${escapeHtml(session.summary || session.agenda || "—")}</td>
    <td>${isManager() || isEvaluator() ? mentorshipStatusSelect(session) : ""}</td>
  </tr>`).join("");
  return `<div><div class="section-title compact-title"><h2>Sessões de mentoria</h2><p>Agenda e histórico com contexto pré-sessão e resumo pós-sessão.</p></div>${table(["Pauta", "Mentor", "Data", "Duração", "Status", "Registro", "Atualizar"], rows)}</div>`;
}

function mentorshipTasksCard(tasks) {
  if (!tasks.length) {
    return `<div class="card pad empty-state"><span class="metric-label">Tarefas pós-sessão</span><h2>Nenhuma tarefa criada.</h2><p>As decisões da mentoria viram ações acompanháveis aqui.</p></div>`;
  }
  const rows = tasks.map((task) => `<tr>
    <td><strong>${escapeHtml(task.title)}</strong><br><span class="subtle">${escapeHtml(task.description || "Sem descrição")}</span></td>
    <td>${escapeHtml(startupName(task.startupId))}</td>
    <td>${escapeHtml(mentorName(task.mentorId))}</td>
    <td><span class="badge ${priorityColor(task.priority)}">${priorityLabel(task.priority)}</span></td>
    <td>${task.dueDate ? formatDate(task.dueDate) : "Sem prazo"}</td>
    <td><span class="badge ${task.status === "done" ? "green" : task.status === "in_progress" ? "blue" : "amber"}">${taskStatusLabel(task.status)}</span></td>
    <td>${isManager() || isEvaluator() ? taskStatusSelect(task) : ""}</td>
  </tr>`).join("");
  return `<div><div class="section-title compact-title"><h2>Plano de ação</h2><p>Tarefas geradas a partir das sessões de mentoria.</p></div>${table(["Tarefa", "Startup", "Mentor", "Prioridade", "Prazo", "Status", "Atualizar"], rows)}</div>`;
}

function renderRegistration() {
  if (!isManager()) return renderDashboard();
  const visiblePrograms = isAdmin()
    ? programs
    : programs.filter((program) => program.id === activeUser().programId);
  const visibleStartups = accessibleStartups();
  const userRoleOptions = isAdmin()
    ? `<option value="empreendedor">Empreendedor</option><option value="avaliador">Avaliador</option><option value="cliente">Cliente</option><option value="admin">Admin</option>`
    : `<option value="empreendedor">Empreendedor</option><option value="avaliador">Avaliador</option>`;
  const programRows = visiblePrograms
    .map((program) => {
      const programType = programTypeById(program.programTypeId);
      const startupCount = startups.filter((startup) => startup.programId === program.id).length;
      const evaluatorCount = users.filter(
        (user) => user.role === "avaliador" && user.programId === program.id
      ).length;
      return `<tr>
        <td><strong>${escapeHtml(program.name)}</strong></td>
        <td>${escapeHtml(programType?.type || "—")}</td>
        <td>${escapeHtml(program.client)}</td>
        <td>${startupCount}</td>
        <td>${evaluatorCount}</td>
      </tr>`;
    })
    .join("");
  const programManagementHtml = isAdmin()
    ? `<div class="grid two startup-onboarding">
        <form class="card pad startup-form" onsubmit="addProgramType(event)">
          <div>
            <span class="metric-label">Catálogo</span>
            <h2>Novo tipo de programa</h2>
          </div>
          <div class="field"><label>Tipo</label><input name="type" required placeholder="Ex.: Aceleração"></div>
          <button class="btn primary" type="submit">Cadastrar tipo</button>
        </form>
        <form class="card pad startup-form" onsubmit="addProgram(event)">
          <div>
            <span class="metric-label">Programa</span>
            <h2>Novo programa</h2>
          </div>
          <div class="form-grid compact">
            <div class="field wide"><label>Nome do programa</label><input name="name" required placeholder="Ex.: Edital Maraintech"></div>
            <div class="field"><label>Tipo</label><select name="programTypeId" required>${programTypes.map((programType) => `<option value="${programType.id}">${escapeHtml(programType.type)}</option>`).join("")}</select></div>
            <div class="field"><label>Cliente</label><input name="client" required placeholder="Ex.: FAPEMA"></div>
          </div>
          <button class="btn primary" type="submit" ${programTypes.length ? "" : "disabled"}>Cadastrar programa</button>
        </form>
      </div>`
    : `<div class="card pad" style="margin-top:18px">
        <span class="metric-label">Programa vinculado</span>
        <h2>${escapeHtml(visiblePrograms[0]?.name || "Programa")}</h2>
        <p>${escapeHtml(programTypeById(visiblePrograms[0]?.programTypeId)?.type || "")} • ${escapeHtml(visiblePrograms[0]?.client || "")}</p>
      </div>`;
  return `
    <section class="page">
      <div class="section-title"><h1>Cadastro</h1><p>Gestão de programas, startups e usuários da plataforma.</p></div>
      ${programManagementHtml}
      <div style="margin-top:16px">${table(["Programa", "Tipo", "Cliente", "Startups", "Avaliadores"], programRows)}</div>
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
            <div class="field wide"><label>Programa</label><select name="programId" required>${visiblePrograms.map((program) => `<option value="${program.id}">${escapeHtml(programLabel(program.id))}</option>`).join("")}</select></div>
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
            <div class="field"><label>E-mail</label><input name="email" type="email" required placeholder="nome@empresa.com"></div>
            <div class="field"><label>Perfil</label><select name="role" onchange="updateUserLinkFields(this.value)">${userRoleOptions}</select></div>
            <div class="field" id="user-startup-field"><label>Startup vinculada</label><select name="startupId">${visibleStartups.map((startup) => `<option value="${startup.id}" ${startup.id === selectedStartupId ? "selected" : ""}>${escapeHtml(startup.name)} • ${escapeHtml(programById(startup.programId)?.name || "")}</option>`).join("")}</select></div>
            <div class="field" id="user-program-field" hidden><label>Programa vinculado</label><select name="programId" disabled>${visiblePrograms.map((program) => `<option value="${program.id}">${escapeHtml(programLabel(program.id))}</option>`).join("")}</select></div>
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
      <span>${escapeHtml(programById(startup.programId)?.name || "Sem programa")} • ${escapeHtml(startup.sector)} • ${escapeHtml(startup.stage)}</span>
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
      <div class="section-title"><h1>Portfólio</h1><p>${isClient() ? "Visão agregada das startups do seu programa." : "Visão agregada para admin, aceleradora, hub de inovação e banca executiva."}</p></div>
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
  const roleInstruction = isManager()
    ? `${isAdmin() ? "Admin" : "Cliente"} tem permissão de leitura e gestão, mas não preenche avaliações.`
    : isEvaluator()
      ? "Avaliador preenche a coluna do consultor para qualquer startup do seu programa."
      : "Empreendedor preenche somente sua autoavaliação para a própria startup.";
  const statusText = isManager()
    ? "Modo leitura • respostas detalhadas"
    : draftSaved
      ? `Rascunho salvo • ${answeredCount}/${totalQuestions} da sua parte`
      : `Em preenchimento • ${answeredCount}/${totalQuestions} da sua parte`;
  const submitLabel = "Enviar minha resposta";
  const actionHtml = isManager()
    ? `<span class="badge gray">${isAdmin() ? "Admin" : "Cliente"} visualiza, mas não responde</span>`
    : `<div class="row"><button class="btn" onclick="saveDraft()">Salvar rascunho</button><button class="btn primary" onclick="completeAssessment()">${submitLabel}</button></div>`;
  return `
    <section class="page">
      <div class="section-title"><h1>${isManager() ? "Respostas em detalhe" : "Responder perguntas HOWL"}</h1><p>${roleInstruction}</p></div>
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
            const answer = isManager()
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
  if (!isManager() && !isEvaluator()) {
    return `<section class="page"><div class="section-title"><h1>Relatórios restritos</h1><p>Relatórios completos estão disponíveis apenas para Admin, Cliente e Avaliador.</p></div></section>`;
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

function canManageUser(user) {
  if (!user) return false;
  if (isAdmin()) return true;
  if (!isClient() || !["avaliador", "empreendedor"].includes(user.role)) return false;
  const targetProgramId =
    user.programId ||
    startups.find((startup) => user.startupIds.includes(startup.id))?.programId;
  return targetProgramId === activeUser().programId;
}

function renderUserEditor() {
  const user = users.find((item) => item.id === editingUserId);
  if (!user || !canManageUser(user) || !user.active) return "";
  const visiblePrograms = isAdmin()
    ? programs
    : programs.filter((program) => program.id === activeUser().programId);
  const visibleStartups = accessibleStartups();
  const roleOptions = isAdmin()
    ? ["admin", "cliente", "avaliador", "empreendedor"]
    : ["avaliador", "empreendedor"];
  const roleLabels = {
    admin: "Admin",
    cliente: "Cliente",
    avaliador: "Avaliador",
    empreendedor: "Empreendedor",
  };
  const needsStartup = user.role === "empreendedor";
  const needsProgram = ["cliente", "avaliador"].includes(user.role);
  return `
    <form class="card pad startup-form" style="margin-top:16px" onsubmit="editUser(event)">
      <div class="row between wrap">
        <div>
          <span class="metric-label">Alterar usuário</span>
          <h2>${escapeHtml(user.name)}</h2>
        </div>
        <button class="btn" type="button" onclick="closeUserEditor()">Cancelar</button>
      </div>
      <input type="hidden" name="profileId" value="${escapeHtml(user.id)}">
      <div class="form-grid compact">
        <div class="field"><label>Nome</label><input name="name" required value="${escapeHtml(user.name)}"></div>
        <div class="field"><label>E-mail</label><input name="email" type="email" required value="${escapeHtml(user.email)}"></div>
        <div class="field"><label>Perfil</label><select name="role" ${user.id === activeUserId ? "disabled" : `onchange="updateEditUserLinkFields(this.value)"`}>${roleOptions.map((role) => `<option value="${role}" ${role === user.role ? "selected" : ""}>${roleLabels[role]}</option>`).join("")}</select></div>
        <div class="field" id="edit-user-startup-field" ${needsStartup ? "" : "hidden"}>
          <label>Startup vinculada</label>
          <select name="startupId" ${needsStartup ? "required" : "disabled"}>${visibleStartups.map((startup) => `<option value="${startup.id}" ${user.startupIds.includes(startup.id) ? "selected" : ""}>${escapeHtml(startup.name)} • ${escapeHtml(programById(startup.programId)?.name || "")}</option>`).join("")}</select>
        </div>
        <div class="field" id="edit-user-program-field" ${needsProgram ? "" : "hidden"}>
          <label>Programa vinculado</label>
          <select name="programId" ${needsProgram ? "required" : "disabled"}>${visiblePrograms.map((program) => `<option value="${program.id}" ${program.id === user.programId ? "selected" : ""}>${escapeHtml(programLabel(program.id))}</option>`).join("")}</select>
        </div>
        <div class="field wide"><label>Organização</label><input name="organization" value="${escapeHtml(user.organization)}"></div>
      </div>
      <button class="btn primary" type="submit">Salvar alterações</button>
    </form>
  `;
}

function renderUsers() {
  const activeUsers = users.filter((user) => user.active !== false);
  const roleSummary = [
    { label: "Admins", value: activeUsers.filter((user) => user.role === "admin").length, detail: "Ativos • gestão e auditoria" },
    { label: "Clientes", value: activeUsers.filter((user) => user.role === "cliente").length, detail: "Ativos • gestão do programa" },
    { label: "Avaliadores", value: activeUsers.filter((user) => user.role === "avaliador").length, detail: "Ativos • avaliação técnica" },
    { label: "Empreendedores", value: activeUsers.filter((user) => user.role === "empreendedor").length, detail: "Ativos • autoavaliação" },
  ];
  const rows = users
    .map((user) => {
      const assigned = user.role === "admin"
        ? "Todas as startups"
        : user.role === "cliente" || user.role === "avaliador"
          ? programLabel(user.programId)
          : user.startupIds.map((id) => startups.find((startup) => startup.id === id)?.name).join(", ");
      const manageable = canManageUser(user);
      const isActive = user.active !== false;
      const canDeactivate = manageable && isActive && user.id !== activeUserId;
      return `<tr>
        <td><strong>${user.name}</strong><br><span class="subtle">${user.email}</span></td>
        <td><span class="badge ${roleColor(user.role)}">${user.roleLabel}</span></td>
        <td>${user.organization}</td>
        <td>${assigned}</td>
        <td>${accessDescription(user.role)}</td>
        <td><span class="badge ${isActive ? "green" : "gray"}">${isActive ? "Ativo" : "Inativo"}</span></td>
        <td><div class="row wrap">
          ${manageable && isActive ? `<button class="btn" type="button" onclick='openUserEditor(${JSON.stringify(user.id)})'>Editar</button>` : ""}
          ${canDeactivate ? `<button class="btn" type="button" onclick='deactivateUser(${JSON.stringify(user.id)})'>Inativar</button>` : ""}
        </div></td>
      </tr>`;
    })
    .join("");
  return `
    <section class="page">
      <div class="section-title"><h1>Usuários e acessos</h1><p>Clientes administram o próprio programa; avaliadores acessam suas startups; empreendedores, a própria startup.</p></div>
      <div class="grid kpis" style="margin-top:18px">
        ${roleSummary.map((item) => metric(item.label, item.value, item.detail)).join("")}
      </div>
      ${renderUserEditor()}
      <div class="card pad" style="margin-top:16px">
        <h2>Modelo de permissão</h2>
        <div class="access-grid">
          <div><span class="badge blue">Admin</span><p>Cria usuários e startups, vê todos os dashboards, acessa respostas em detalhe, edita configurações e exporta relatórios. Não responde avaliações.</p></div>
          <div><span class="badge blue">Cliente</span><p>Administra usuários, startups, dashboards e relatórios exclusivamente do programa vinculado.</p></div>
          <div><span class="badge green">Avaliador</span><p>Visualiza e avalia todas as startups do programa ao qual está vinculado.</p></div>
          <div><span class="badge amber">Empreendedor</span><p>Visualiza apenas a própria startup e responde a autoavaliação mensal enquanto estiver em rascunho.</p></div>
        </div>
      </div>
      <div style="margin-top:16px">${table(["Usuário", "Perfil", "Organização", "Escopo", "Acesso", "Status", "Ações"], rows)}</div>
    </section>
  `;
}

function renderApplications() {
  const visibleApplications = applicationsVisibleToUser();
  const pending = visibleApplications.filter((application) => application.status === "pending").length;
  const approved = visibleApplications.filter((application) => application.status === "approved").length;
  const rejected = visibleApplications.filter((application) => application.status === "rejected").length;
  const visiblePrograms = isAdmin()
    ? programs
    : programs.filter((program) => program.id === activeUser().programId);
  const applicationCards = visibleApplications.length
    ? visibleApplications.map((application) => renderApplicationCard(application, visiblePrograms)).join("")
    : `<div class="card pad empty-state">
        <span class="metric-label">Fila vazia</span>
        <h2>Nenhuma inscrição recebida ainda.</h2>
        <p>Quando alguém se cadastrar pelas páginas públicas da HORDA, a solicitação aparecerá aqui para triagem.</p>
      </div>`;

  return `
    <section class="page">
      <div class="row between wrap">
        <div class="section-title"><h1>Inscrições</h1><p>Triagem de startups e mentores que chegaram pelas páginas públicas da HORDA.</p></div>
        <button class="btn" type="button" onclick="refreshApplications()">Atualizar inscrições</button>
      </div>
      <div class="grid kpis" style="margin-top:18px">
        ${metric("Pendentes", pending, "Aguardando análise")}
        ${metric("Aprovadas", approved, "Convertidas em cadastro")}
        ${metric("Rejeitadas", rejected, "Fora do escopo atual")}
      </div>
      <div class="application-list">${applicationCards}</div>
    </section>
  `;
}

function applicationsVisibleToUser() {
  if (isAdmin()) return publicApplications;
  const programId = activeUser().programId;
  return publicApplications.filter((application) => application.programId === programId);
}

function mentorUsersForManager() {
  return users
    .filter((user) => user.active !== false && user.role === "avaliador")
    .filter((user) => isAdmin() || user.programId === activeUser().programId);
}

function mentorshipLinksVisibleToUser() {
  if (isAdmin()) return mentorStartupLinks;
  const user = activeUser();
  if (isClient()) {
    return mentorStartupLinks.filter((link) => link.programId === user.programId);
  }
  if (isEvaluator()) {
    return mentorStartupLinks.filter((link) => link.mentorId === user.id);
  }
  return mentorStartupLinks.filter((link) => user.startupIds.includes(link.startupId));
}

function mentorshipSessionsVisibleToUser() {
  const visibleLinkIds = new Set(mentorshipLinksVisibleToUser().map((link) => link.id));
  return mentorshipSessions.filter((session) => visibleLinkIds.has(session.linkId));
}

function mentorshipTasksVisibleToUser() {
  const visibleSessionIds = new Set(mentorshipSessionsVisibleToUser().map((session) => session.id));
  return mentorshipTasks.filter((task) => visibleSessionIds.has(task.sessionId));
}

function startupName(startupId) {
  return startups.find((startup) => startup.id === startupId)?.name || "Startup removida";
}

function mentorName(mentorId) {
  return users.find((user) => user.id === mentorId)?.name || "Mentor removido";
}

function mentorshipStatusLabel(status) {
  if (status === "completed") return "Concluída";
  if (status === "canceled") return "Cancelada";
  return "Agendada";
}

function mentorshipStatusColor(status) {
  if (status === "completed") return "green";
  if (status === "canceled") return "gray";
  return "blue";
}

function mentorshipStatusSelect(session) {
  return `<select aria-label="Atualizar status da sessão" onchange='changeMentorshipSessionStatus(${JSON.stringify(session.id)}, this.value)'>
    <option value="scheduled" ${session.status === "scheduled" ? "selected" : ""}>Agendada</option>
    <option value="completed" ${session.status === "completed" ? "selected" : ""}>Concluída</option>
    <option value="canceled" ${session.status === "canceled" ? "selected" : ""}>Cancelada</option>
  </select>`;
}

function priorityLabel(priority) {
  if (priority === "high") return "Alta";
  if (priority === "low") return "Baixa";
  return "Média";
}

function priorityColor(priority) {
  if (priority === "high") return "red";
  if (priority === "low") return "gray";
  return "amber";
}

function taskStatusLabel(status) {
  if (status === "done") return "Concluída";
  if (status === "in_progress") return "Em andamento";
  return "A fazer";
}

function taskStatusSelect(task) {
  return `<select aria-label="Atualizar status da tarefa" onchange='changeMentorshipTaskStatus(${JSON.stringify(task.id)}, this.value)'>
    <option value="todo" ${task.status === "todo" ? "selected" : ""}>A fazer</option>
    <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>Em andamento</option>
    <option value="done" ${task.status === "done" ? "selected" : ""}>Concluída</option>
  </select>`;
}

function formatDateTime(value) {
  if (!value) return "sem data";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function refreshApplications() {
  if (!currentSession) {
    activeRoute = "login";
    render();
    return;
  }

  try {
    backendStatus = "Atualizando Supabase...";
    render();
    await loadSupabaseData();
  } catch (error) {
    backendStatus = "Falha ao atualizar Supabase";
    window.alert(error.message || "Não foi possível atualizar as inscrições.");
  }
  render();
}

function renderApplicationCard(application, visiblePrograms) {
  const isMentorApplication = application.type === "mentor";
  const disabled = application.status !== "pending" || !visiblePrograms.length;
  const approvedReference = application.approvedStartupId || application.approvedProfileId;
  return `
    <article class="card pad application-card">
      <div class="row between wrap">
        <div>
          <span class="metric-label">${applicationTypeLabel(application.type)} • ${formatDate(application.createdAt)}</span>
          <h2>${escapeHtml(application.name)}</h2>
          <p>${escapeHtml(application.email)}${application.phone ? ` • ${escapeHtml(application.phone)}` : ""}</p>
        </div>
        <span class="badge ${applicationStatusColor(application.status)}">${applicationStatusLabel(application.status)}</span>
      </div>
      <div class="application-details">
        <div><strong>${isMentorApplication ? "Especialidade" : "Setor"}</strong><span>${escapeHtml(application.sector || "Não informado")}</span></div>
        <div><strong>${isMentorApplication ? "Experiência" : "Estágio"}</strong><span>${escapeHtml((isMentorApplication ? application.experience : application.stage) || "Não informado")}</span></div>
        <div><strong>Localização</strong><span>${escapeHtml([application.city, application.state].filter(Boolean).join(" / ") || "Não informada")}</span></div>
        <div><strong>Disponibilidade</strong><span>${escapeHtml(application.availability || "Não informada")}</span></div>
      </div>
      <p class="application-pitch">${escapeHtml(application.pitch || "Sem pitch informado.")}</p>
      ${
        approvedReference
          ? `<span class="badge green">Cadastro criado: ${escapeHtml(approvedReference)}</span>`
          : ""
      }
      ${
        application.status === "pending"
          ? `<form class="application-actions" onsubmit='approveApplication(event, ${JSON.stringify(application.id)})'>
              <div class="field">
                <label>Programa de destino</label>
                <select name="programId" required ${disabled ? "disabled" : ""}>
                  ${visiblePrograms.map((program) => `<option value="${program.id}" ${program.id === application.programId ? "selected" : ""}>${escapeHtml(programLabel(program.id))}</option>`).join("")}
                </select>
              </div>
              ${
                isMentorApplication
                  ? `<div class="field">
                      <label>Senha temporária</label>
                      <div class="row">
                        <input name="password" type="password" minlength="8" required autocomplete="new-password" placeholder="Mínimo 8 caracteres" ${disabled ? "disabled" : ""}>
                        <button class="btn" type="button" onclick="fillGeneratedPassword(this)" ${disabled ? "disabled" : ""}>Gerar</button>
                      </div>
                    </div>`
                  : ""
              }
              <div class="row wrap">
                <button class="btn primary" type="submit" ${disabled ? "disabled" : ""}>Aprovar</button>
                <button class="btn" type="button" onclick='rejectApplication(${JSON.stringify(application.id)})'>Rejeitar</button>
              </div>
            </form>`
          : `<span class="subtle">Revisada em ${formatDate(application.reviewedAt)}.</span>`
      }
    </article>
  `;
}

function applicationTypeLabel(type) {
  return type === "mentor" ? "Mentor" : "Startup";
}

function applicationStatusLabel(status) {
  if (status === "approved") return "Aprovada";
  if (status === "rejected") return "Rejeitada";
  return "Pendente";
}

function applicationStatusColor(status) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "amber";
}

function formatDate(value) {
  if (!value) return "sem data";
  return new Date(value).toLocaleDateString("pt-BR");
}

function roleColor(role) {
  if (role === "admin" || role === "cliente") return "blue";
  if (role === "avaliador") return "green";
  return "amber";
}

function accessDescription(role) {
  if (role === "admin") return "Gestão, leitura e auditoria. Não responde.";
  if (role === "cliente") return "Gestão e leitura do programa vinculado";
  if (role === "avaliador") return "Avaliações e dashboards do programa";
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
  if (PUBLIC_ROUTES.has(route) || route === "login") {
    if (route !== activeRoute) publicApplicationMessage = "";
    activeRoute = route;
    mobileMenuOpen = false;
    syncRouteHash(activeRoute);
    render();
    return;
  }
  if (!currentSession) {
    activeRoute = "login";
    mobileMenuOpen = false;
    syncRouteHash(activeRoute);
    render();
    return;
  }
  if (!routeAllowed(route)) {
    activeRoute = "dashboard";
    mobileMenuOpen = false;
    syncRouteHash(activeRoute);
    render();
    return;
  }
  activeRoute = route;
  mobileMenuOpen = false;
  syncRouteHash(activeRoute);
  render();
}

function syncRouteHash(route) {
  if (!window.location) return;
  const hash = route === "home" ? "" : `#${route}`;
  if (window.location.hash === hash) return;

  if (window.history?.replaceState) {
    const path = window.location.pathname || "";
    const search = window.location.search || "";
    window.history.replaceState(null, "", `${path}${search}${hash}` || hash || "/");
    return;
  }

  window.location.hash = hash;
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

function selectDashboardProgram(programId) {
  if (!isAdmin()) return;
  if (programId === "all" || programs.some((program) => program.id === programId)) {
    selectedDashboardProgramId = programId;
  }
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

function updateUserLinkFields(role) {
  const startupField = document.getElementById("user-startup-field");
  const programField = document.getElementById("user-program-field");
  if (!startupField || !programField) return;
  const startupSelect = startupField.querySelector("select");
  const programSelect = programField.querySelector("select");
  const needsStartup = role === "empreendedor";
  const needsProgram = role === "avaliador" || role === "cliente";
  startupField.hidden = !needsStartup;
  programField.hidden = !needsProgram;
  startupSelect.disabled = !needsStartup;
  startupSelect.required = needsStartup;
  programSelect.disabled = !needsProgram;
  programSelect.required = needsProgram;
}

function openUserEditor(userId) {
  const user = users.find((item) => item.id === userId);
  if (!canManageUser(user) || user?.active === false) return;
  editingUserId = userId;
  render();
}

function closeUserEditor() {
  editingUserId = null;
  render();
}

function updateEditUserLinkFields(role) {
  const startupField = document.getElementById("edit-user-startup-field");
  const programField = document.getElementById("edit-user-program-field");
  if (!startupField || !programField) return;
  const startupSelect = startupField.querySelector("select");
  const programSelect = programField.querySelector("select");
  const needsStartup = role === "empreendedor";
  const needsProgram = role === "cliente" || role === "avaliador";
  startupField.hidden = !needsStartup;
  programField.hidden = !needsProgram;
  startupSelect.disabled = !needsStartup;
  startupSelect.required = needsStartup;
  programSelect.disabled = !needsProgram;
  programSelect.required = needsProgram;
}

async function editUser(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const user = users.find((item) => item.id === data.profileId);
  if (!canManageUser(user) || user?.active === false) {
    window.alert("Você não tem permissão para alterar esse usuário.");
    return;
  }
  const role = String(data.role || user.role);
  const payload = {
    action: "update",
    profileId: user.id,
    name: String(data.name || "").trim(),
    email: String(data.email || "").trim().toLowerCase(),
    role,
    organization: String(data.organization || "").trim(),
    startupId: role === "empreendedor" ? String(data.startupId || "") : null,
    programId: ["cliente", "avaliador"].includes(role)
      ? String(data.programId || "")
      : null,
  };

  try {
    if (backendStatus.includes("conectado")) {
      await persistManagedUser(payload);
    } else {
      user.name = payload.name;
      user.email = payload.email;
      user.role = payload.role;
      user.roleLabel = { admin: "Admin", cliente: "Cliente", avaliador: "Avaliador", empreendedor: "Empreendedor" }[payload.role];
      user.organization = payload.organization;
      user.programId = payload.programId;
      user.startupIds = payload.startupId ? [payload.startupId] : [];
    }
    editingUserId = null;
    window.alert("Dados do usuário alterados com sucesso.");
  } catch (error) {
    window.alert(error.message || "Não foi possível alterar o usuário.");
  }
  render();
}

async function deactivateUser(userId) {
  const user = users.find((item) => item.id === userId);
  if (!canManageUser(user) || user?.active === false || user.id === activeUserId) return;
  if (!window.confirm(`Inativar o acesso de ${user.name}? Essa pessoa não poderá mais entrar na plataforma.`)) {
    return;
  }
  try {
    if (backendStatus.includes("conectado")) {
      await persistManagedUser({ action: "deactivate", profileId: user.id });
    } else {
      user.active = false;
    }
    if (editingUserId === user.id) editingUserId = null;
    window.alert(`${user.name} foi inativado.`);
  } catch (error) {
    window.alert(error.message || "Não foi possível inativar o usuário.");
  }
  render();
}

async function submitPublicApplication(event, type) {
  event.preventDefault();
  publicApplicationMessage = "";
  if (!supabaseConfigured) {
    publicApplicationMessage = "Supabase ainda não configurado. A inscrição não foi enviada.";
    render();
    return;
  }

  const data = Object.fromEntries(new FormData(event.target).entries());
  const application = {
    id: createApplicationId(),
    type,
    name: String(data.name || "").trim(),
    contactName: String(data.contactName || data.name || "").trim(),
    email: String(data.email || "").trim().toLowerCase(),
    phone: String(data.phone || "").trim(),
    organization: String(data.organization || "").trim(),
    sector: String(data.sector || "").trim(),
    stage: String(data.stage || "").trim(),
    city: String(data.city || "").trim(),
    state: String(data.state || "").trim().toUpperCase(),
    availability: String(data.availability || "").trim(),
    experience: String(data.experience || "").trim(),
    pitch: String(data.pitch || "").trim(),
  };

  try {
    await persistPublicApplication(application);
    event.target.reset();
    publicApplicationMessage = "Inscrição enviada. A equipe HORDA vai revisar sua solicitação.";
  } catch (error) {
    publicApplicationMessage = error.message || "Não foi possível enviar a inscrição.";
  }
  render();
}

async function approveApplication(event, applicationId) {
  event.preventDefault();
  if (!isManager()) {
    window.alert("Apenas Admin ou Cliente pode aprovar inscrições.");
    return;
  }
  const application = publicApplications.find((item) => item.id === applicationId);
  if (!application || application.status !== "pending") return;
  const data = Object.fromEntries(new FormData(event.target).entries());
  const programId = String(data.programId || application.programId || "");
  if (!programs.some((program) => program.id === programId)) {
    window.alert("Selecione um programa válido para aprovar a inscrição.");
    return;
  }
  if (isClient() && programId !== activeUser().programId) {
    window.alert("Você só pode aprovar inscrições para o seu programa.");
    return;
  }

  try {
    if (application.type === "mentor") {
      if (!backendStatus.includes("conectado")) {
        window.alert("Conecte o Supabase para aprovar mentores e criar acessos.");
        return;
      }
      const password = String(data.password || "");
      if (password.length < 8) {
        window.alert("A senha temporária precisa ter pelo menos 8 caracteres.");
        return;
      }
      await persistUser(
        {
          id: slugify(`${application.name}-avaliador`),
          name: application.name,
          email: application.email,
          role: "avaliador",
          roleLabel: "Avaliador",
          organization: application.organization || application.sector || "HORDA",
          programId,
          startupIds: [],
        },
        password
      );
      const savedProfile = users.find((user) => user.email === application.email);
      await updatePublicApplication(application.id, {
        status: "approved",
        program_id: programId,
        approved_profile_id: savedProfile?.id || null,
      });
    } else {
      const startup = {
        id: uniqueStartupId(application.name),
        programId,
        name: application.name,
        founder: application.contactName || application.name,
        sector: application.sector || "Não informado",
        city: application.city || "Não informada",
        state: application.state || "",
        stage: application.stage || "MVP",
        description: application.pitch || "Startup aprovada a partir da inscrição pública da HORDA.",
      };
      if (backendStatus.includes("conectado")) {
        await persistStartup(startup);
        await updatePublicApplication(application.id, {
          status: "approved",
          program_id: programId,
          approved_startup_id: startup.id,
        });
      } else {
        startups.push(startup);
        scoreProfiles[startup.id] = defaultScoreProfile();
        application.status = "approved";
        application.programId = programId;
        application.approvedStartupId = startup.id;
      }
    }
    if (backendStatus.includes("conectado")) {
      await loadSupabaseData();
    } else {
      rebuildAssessments();
    }
    window.alert(`${applicationTypeLabel(application.type)} aprovado com sucesso.`);
  } catch (error) {
    window.alert(error.message || "Não foi possível aprovar a inscrição.");
  }
  render();
}

async function rejectApplication(applicationId) {
  if (!isManager()) {
    window.alert("Apenas Admin ou Cliente pode rejeitar inscrições.");
    return;
  }
  const application = publicApplications.find((item) => item.id === applicationId);
  if (!application || application.status !== "pending") return;
  if (!window.confirm(`Rejeitar a inscrição de ${application.name}?`)) return;

  try {
    if (backendStatus.includes("conectado")) {
      await updatePublicApplication(application.id, { status: "rejected" });
      await loadSupabaseData();
    } else {
      application.status = "rejected";
      application.reviewedBy = activeUserId;
      application.reviewedAt = new Date().toISOString();
    }
    window.alert("Inscrição rejeitada.");
  } catch (error) {
    window.alert(error.message || "Não foi possível rejeitar a inscrição.");
  }
  render();
}

function createApplicationId() {
  if (window.crypto?.randomUUID) return `application-${window.crypto.randomUUID()}`;
  return `application-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMentorshipId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseDurationMinutes(value) {
  const minutes = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(minutes)) return 60;
  return Math.max(15, Math.min(360, minutes));
}

function uniqueStartupId(name) {
  const baseId = slugify(name);
  let id = baseId;
  let suffix = 2;
  while (startups.some((startup) => startup.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return id;
}

async function addProgramType(event) {
  event.preventDefault();
  if (!isAdmin()) {
    window.alert("Apenas Admin pode cadastrar tipos de programa.");
    return;
  }
  const data = Object.fromEntries(new FormData(event.target).entries());
  const type = String(data.type || "").trim();
  const programType = { id: slugify(type), type };
  if (programTypes.some((item) => item.id === programType.id || normalizeText(item.type) === normalizeText(type))) {
    window.alert("Esse tipo de programa já está cadastrado.");
    return;
  }
  try {
    if (backendStatus.includes("conectado")) {
      await persistProgramType(programType);
      await loadSupabaseData();
    } else {
      programTypes.push(programType);
    }
    event.target.reset();
    window.alert(`${programType.type} cadastrado como tipo de programa.`);
  } catch (error) {
    window.alert(error.message || "Não foi possível cadastrar o tipo de programa.");
  }
  render();
}

async function addProgram(event) {
  event.preventDefault();
  if (!isAdmin()) {
    window.alert("Apenas Admin pode cadastrar programas.");
    return;
  }
  const data = Object.fromEntries(new FormData(event.target).entries());
  const baseId = slugify(data.name);
  let id = baseId;
  let suffix = 2;
  while (programs.some((program) => program.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  const program = {
    id,
    programTypeId: String(data.programTypeId || ""),
    name: String(data.name || "").trim(),
    client: String(data.client || "").trim(),
  };
  try {
    if (backendStatus.includes("conectado")) {
      await persistProgram(program);
      await loadSupabaseData();
    } else {
      programs.push(program);
    }
    event.target.reset();
    window.alert(`${program.name} cadastrado para ${program.client}.`);
  } catch (error) {
    window.alert(error.message || "Não foi possível cadastrar o programa.");
  }
  render();
}

async function addStartup(event) {
  event.preventDefault();
  if (!isManager()) {
    window.alert("Apenas Admin ou Cliente pode cadastrar startups.");
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
    programId: String(data.programId || ""),
    name: String(data.name || "").trim(),
    founder: String(data.founder || "").trim(),
    sector: String(data.sector || "").trim(),
    city: String(data.city || "").trim(),
    state: String(data.state || "").trim().toUpperCase(),
    stage: String(data.stage || "MVP").trim(),
    description: String(data.description || "").trim() || "Startup cadastrada para a primeira rodada de diagnóstico HOWL.",
  };
  if (isClient() && startup.programId !== activeUser().programId) {
    window.alert("Você só pode cadastrar startups no seu programa.");
    return;
  }
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

async function addMentorStartupLink(event) {
  event.preventDefault();
  if (!isManager()) {
    window.alert("Apenas Admin ou Cliente pode vincular mentores a startups.");
    return;
  }
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const startup = startups.find((item) => item.id === data.startupId);
  const mentor = users.find((item) => item.id === data.mentorId && item.role === "avaliador" && item.active !== false);
  if (!startup || !mentor) {
    window.alert("Selecione uma startup e um mentor válidos.");
    return;
  }
  if (isClient() && startup.programId !== activeUser().programId) {
    window.alert("Você só pode vincular startups do seu programa.");
    return;
  }
  if (mentor.programId !== startup.programId) {
    window.alert("O mentor precisa estar no mesmo programa da startup.");
    return;
  }
  const alreadyLinked = mentorStartupLinks.some(
    (link) =>
      link.startupId === startup.id &&
      link.mentorId === mentor.id &&
      link.status === "active"
  );
  if (alreadyLinked) {
    window.alert("Esse mentor já está vinculado a essa startup.");
    return;
  }

  const link = {
    id: createMentorshipId("mentor-link"),
    programId: startup.programId,
    startupId: startup.id,
    mentorId: mentor.id,
    status: "active",
    notes: String(data.notes || "").trim(),
    createdBy: activeUserId,
    createdAt: new Date().toISOString(),
  };
  try {
    if (backendStatus.includes("conectado")) {
      await persistMentorStartupLink(link);
      await loadSupabaseData();
    } else {
      mentorStartupLinks.unshift(link);
    }
    form.reset();
    window.alert(`${mentor.name} vinculado a ${startup.name}.`);
  } catch (error) {
    window.alert(error.message || "Não foi possível criar o vínculo de mentoria.");
  }
  render();
}

async function deactivateMentorStartupLink(linkId) {
  if (!isManager()) {
    window.alert("Apenas Admin ou Cliente pode desativar vínculos.");
    return;
  }
  const link = mentorStartupLinks.find((item) => item.id === linkId);
  if (!link || link.status !== "active") return;
  if (isClient() && link.programId !== activeUser().programId) {
    window.alert("Você só pode alterar vínculos do seu programa.");
    return;
  }
  if (!window.confirm(`Desativar o vínculo entre ${mentorName(link.mentorId)} e ${startupName(link.startupId)}?`)) {
    return;
  }
  try {
    if (backendStatus.includes("conectado")) {
      await updateMentorStartupLink(link.id, { status: "inactive" });
      await loadSupabaseData();
    } else {
      link.status = "inactive";
    }
    window.alert("Vínculo desativado.");
  } catch (error) {
    window.alert(error.message || "Não foi possível desativar o vínculo.");
  }
  render();
}

async function addMentorshipSession(event) {
  event.preventDefault();
  if (!isManager() && !isEvaluator()) {
    window.alert("Apenas gestores e mentores podem criar sessões de mentoria.");
    return;
  }
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const link = mentorshipLinksVisibleToUser().find((item) => item.id === data.linkId && item.status === "active");
  if (!link) {
    window.alert("Selecione um vínculo ativo.");
    return;
  }
  const scheduledAt = new Date(String(data.scheduledAt || ""));
  if (Number.isNaN(scheduledAt.getTime())) {
    window.alert("Informe uma data válida para a sessão.");
    return;
  }
  const session = {
    id: createMentorshipId("mentorship-session"),
    linkId: link.id,
    programId: link.programId,
    startupId: link.startupId,
    mentorId: link.mentorId,
    status: "scheduled",
    scheduledAt: scheduledAt.toISOString(),
    durationMinutes: parseDurationMinutes(data.durationMinutes),
    topic: String(data.topic || "").trim(),
    agenda: String(data.agenda || "").trim(),
    summary: String(data.summary || "").trim(),
    decisions: "",
    nextSteps: String(data.nextSteps || "").trim(),
    createdBy: activeUserId,
    createdAt: new Date().toISOString(),
  };
  try {
    if (backendStatus.includes("conectado")) {
      await persistMentorshipSession(session);
      await loadSupabaseData();
    } else {
      mentorshipSessions.unshift(session);
    }
    form.reset();
    window.alert("Sessão de mentoria salva.");
  } catch (error) {
    window.alert(error.message || "Não foi possível salvar a sessão.");
  }
  render();
}

async function changeMentorshipSessionStatus(sessionId, status) {
  const session = mentorshipSessionsVisibleToUser().find((item) => item.id === sessionId);
  if (!session || (!isManager() && !isEvaluator())) return;
  try {
    if (backendStatus.includes("conectado")) {
      await updateMentorshipSession(session.id, { status });
      await loadSupabaseData();
    } else {
      session.status = status;
    }
  } catch (error) {
    window.alert(error.message || "Não foi possível atualizar a sessão.");
  }
  render();
}

async function addMentorshipTask(event) {
  event.preventDefault();
  if (!isManager() && !isEvaluator()) {
    window.alert("Apenas gestores e mentores podem criar tarefas pós-sessão.");
    return;
  }
  const data = Object.fromEntries(new FormData(event.target).entries());
  const session = mentorshipSessionsVisibleToUser().find((item) => item.id === data.sessionId && item.status !== "canceled");
  if (!session) {
    window.alert("Selecione uma sessão válida.");
    return;
  }
  const task = {
    id: createMentorshipId("mentorship-task"),
    sessionId: session.id,
    programId: session.programId,
    startupId: session.startupId,
    mentorId: session.mentorId,
    title: String(data.title || "").trim(),
    description: String(data.description || "").trim(),
    priority: String(data.priority || "medium"),
    status: "todo",
    dueDate: String(data.dueDate || ""),
    createdBy: activeUserId,
    createdAt: new Date().toISOString(),
  };
  try {
    if (backendStatus.includes("conectado")) {
      await persistMentorshipTask(task);
      await loadSupabaseData();
    } else {
      mentorshipTasks.unshift(task);
    }
    event.target.reset();
    window.alert("Tarefa pós-sessão criada.");
  } catch (error) {
    window.alert(error.message || "Não foi possível criar a tarefa.");
  }
  render();
}

async function changeMentorshipTaskStatus(taskId, status) {
  const task = mentorshipTasksVisibleToUser().find((item) => item.id === taskId);
  if (!task || (!isManager() && !isEvaluator())) return;
  try {
    if (backendStatus.includes("conectado")) {
      await updateMentorshipTask(task.id, { status });
      await loadSupabaseData();
    } else {
      task.status = status;
    }
  } catch (error) {
    window.alert(error.message || "Não foi possível atualizar a tarefa.");
  }
  render();
}

async function addUser(event) {
  event.preventDefault();
  if (!isManager()) {
    window.alert("Apenas Admin ou Cliente pode cadastrar usuários.");
    return;
  }
  const data = Object.fromEntries(new FormData(event.target).entries());
  const roleLabels = { admin: "Admin", cliente: "Cliente", avaliador: "Avaliador", empreendedor: "Empreendedor" };
  const role = String(data.role || "empreendedor");
  if (isClient() && !["avaliador", "empreendedor"].includes(role)) {
    window.alert("O perfil Cliente pode cadastrar apenas avaliadores e empreendedores.");
    return;
  }
  const password = String(data.password || "");
  if (password.length < 8) {
    window.alert("A senha temporária precisa ter pelo menos 8 caracteres.");
    return;
  }
  const linkedStartup = startups.find((startup) => startup.id === data.startupId);
  const linkedProgram = programs.find((program) => program.id === data.programId);
  const user = {
    id: slugify(`${data.name}-${role}`),
    name: String(data.name || "").trim(),
    email: String(data.email || "").trim(),
    role,
    roleLabel: roleLabels[role] || "Usuário",
    organization:
      String(data.organization || "").trim() ||
      linkedStartup?.name ||
      linkedProgram?.client ||
      "HOWL",
    programId: ["cliente", "avaliador"].includes(role) ? String(data.programId || "") : null,
    startupIds:
      role === "admin"
        ? startups.map((startup) => startup.id)
        : role === "empreendedor"
          ? [String(data.startupId || selectedStartupId)]
          : [],
  };
  const targetProgramId =
    role === "empreendedor" ? linkedStartup?.programId : user.programId;
  if (isClient() && targetProgramId !== activeUser().programId) {
    window.alert("Você só pode cadastrar usuários vinculados ao seu programa.");
    return;
  }
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
    programTypes,
    programs,
    startups,
    users,
    mentorStartupLinks,
    mentorshipSessions,
    mentorshipTasks,
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
    programTypes = database.programTypes;
    programs = database.programs;
    startups = database.startups;
    users = database.users;
    mentorStartupLinks = database.mentorStartupLinks || [];
    mentorshipSessions = database.mentorshipSessions || [];
    mentorshipTasks = database.mentorshipTasks || [];
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
  if (!Array.isArray(database.programTypes)) throw new Error("JSON inválido: campo programTypes ausente.");
  if (!Array.isArray(database.programs)) throw new Error("JSON inválido: campo programs ausente.");
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
    window.alert("Este perfil acompanha os dados, mas não preenche avaliações.");
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
  if (isManager()) {
    window.alert(`${isAdmin() ? "Admin" : "Cliente"} visualiza respostas em detalhe, mas não responde avaliações.`);
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
    syncRouteHash(activeRoute);
    await loadSupabaseData();
  } catch (error) {
    activeRoute = "login";
    syncRouteHash(activeRoute);
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
  syncRouteHash(activeRoute);
  render();
}

async function initializeApp() {
  if (!supabaseClient) {
    backendStatus = supabaseConfigured
      ? "Biblioteca do Supabase indisponível"
      : "Supabase ainda não configurado";
    if (!PUBLIC_ROUTES.has(activeRoute)) activeRoute = "login";
    render();
    return;
  }

  try {
    await loadSupabaseData();
  } catch (error) {
    if (!PUBLIC_ROUTES.has(activeRoute)) activeRoute = "login";
    loginError = error.message || "Não foi possível conectar ao Supabase.";
    backendStatus = "Falha ao conectar ao Supabase";
  }
  render();
}

initializeApp();
