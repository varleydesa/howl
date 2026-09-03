const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appElement = { innerHTML: "" };
const context = {
  Blob,
  FormData,
  TextEncoder,
  URL,
  clearTimeout,
  console,
  document: {
    getElementById() {
      return appElement;
    },
  },
  setTimeout,
  window: {
    HOWL_SUPABASE_CONFIG: {},
    alert() {},
    confirm() {
      return false;
    },
    crypto: crypto.webcrypto,
  },
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"),
  context
);

const result = vm.runInContext(
  `
    programs.push({
      id: "programa-externo",
      programTypeId: "aceleracao",
      name: "Programa Externo",
      client: "Cliente Externo"
    });
    startups.push({
      id: "startup-externa",
      programId: "programa-externo",
      name: "Startup Externa",
      founder: "Teste",
      sector: "Teste",
      city: "Teste",
      state: "SP",
      stage: "MVP",
      description: ""
    });

    currentSession = { user: { id: "auth-admin-demo" } };
    activeUserId = "admin-demo";
    activeRoute = "dashboard";
    render();
    const adminDashboardHtml = document.getElementById("app").innerHTML;
    activeProgramDashboardTab = "sessions";
    render();
    const adminSessionsHtml = document.getElementById("app").innerHTML;
    const adminHasFilter = adminDashboardHtml.includes("Todos os programas");
    selectDashboardProgram("programa-externo");
    const filteredAdminIds = dashboardStartups().map((startup) => startup.id);

    mentorStartupLinks = [
      {
        id: "link-mentor-dashboard",
        programId: "programa-howl-atual",
        startupId: "agrosense",
        mentorId: "avaliador-demo-1",
        status: "active",
        notes: "Go-to-market e validação"
      }
    ];
    mentorshipSessions = [
      {
        id: "session-mentor-dashboard",
        linkId: "link-mentor-dashboard",
        programId: "programa-howl-atual",
        startupId: "agrosense",
        mentorId: "avaliador-demo-1",
        status: "scheduled",
        scheduledAt: "2026-09-15T13:00:00.000Z",
        durationMinutes: 60,
        topic: "Revisão de tração",
        agenda: "Métricas comerciais",
        summary: "",
        nextSteps: ""
      }
    ];
    mentorshipTasks = [
      {
        id: "task-mentor-dashboard",
        sessionId: "session-mentor-dashboard",
        programId: "programa-howl-atual",
        startupId: "agrosense",
        mentorId: "avaliador-demo-1",
        title: "Validar ICP prioritário",
        description: "Revisar entrevistas e consolidar aprendizados",
        priority: "high",
        status: "todo",
        dueDate: "2026-09-22"
      }
    ];

    activeUserId = "avaliador-demo-1";
    activeRoute = "dashboard";
    selectedDashboardProgramId = "all";
    const evaluatorIds = accessibleStartups().map((startup) => startup.id);
    render();
    const mentorDashboardHtml = document.getElementById("app").innerHTML;
    const mentorNavLabels = navItemsForUser().map((item) => item[2]);

    activeUserId = "empreendedor-demo";
    activeRoute = "dashboard";
    selectedStartupId = "agrosense";
    render();
    const founderDashboardHtml = document.getElementById("app").innerHTML;
    const founderNavLabels = navItemsForUser().map((item) => item[2]);

    ({
      adminDashboardHtml,
      adminSessionsHtml,
      adminHasFilter,
      filteredAdminIds,
      evaluatorIds,
      mentorDashboardHtml,
      mentorNavLabels,
      founderDashboardHtml,
      founderNavLabels,
      currentProgramStartupIds: startups
        .filter((startup) => startup.programId === "programa-howl-atual")
        .map((startup) => startup.id)
    });
  `,
  context
);

assert(result.adminHasFilter);
assert(result.adminDashboardHtml.includes("Dashboard do Programa"));
assert(result.adminDashboardHtml.includes("AI Analytics (em Breve)"));
assert(result.adminDashboardHtml.includes("Agentes de IA"));
assert(result.adminDashboardHtml.includes("Executivo"));
assert(result.adminDashboardHtml.includes("Memória"));
assert(result.adminSessionsHtml.includes("Total de Sessões"));
assert(result.adminSessionsHtml.includes("Avaliação Média"));
assert(result.adminSessionsHtml.includes("Buscar por título, startup ou mentor"));
assert(result.adminSessionsHtml.includes("Nenhuma sessão encontrada"));
assert(result.mentorDashboardHtml.includes("Dashboard do Mentor"));
assert(result.mentorDashboardHtml.includes("Mentor IA (em Breve)"));
assert(result.mentorDashboardHtml.includes("Avaliador Demo 1"));
assert(result.mentorDashboardHtml.includes("Startup Alpha"));
assert(result.mentorDashboardHtml.includes("Revisão de tração"));
assert(result.mentorDashboardHtml.includes("Validar ICP prioritário"));
assert.deepStrictEqual(Array.from(result.mentorNavLabels), [
  "Dashboard",
  "Agenda",
  "Portfólio",
  "Avaliações",
  "Histórico",
  "Relatórios",
]);
assert(result.founderDashboardHtml.includes("Minha Jornada de Startup"));
assert(result.founderDashboardHtml.includes("Próximos Eventos"));
assert(result.founderDashboardHtml.includes("Jornada de Crescimento"));
assert(result.founderDashboardHtml.includes("Agentes de IA"));
assert.deepStrictEqual(Array.from(result.founderNavLabels), [
  "Minha Jornada",
  "Plano de Ação",
  "Avaliação",
  "Análise de Rota",
  "Evolução",
]);
assert.deepStrictEqual(Array.from(result.filteredAdminIds), ["startup-externa"]);
assert(!result.evaluatorIds.includes("startup-externa"));
assert.deepStrictEqual(
  Array.from(result.evaluatorIds).sort(),
  Array.from(result.currentProgramStartupIds).sort()
);

console.log("Filtro do Admin e escopo do Avaliador validados.");
