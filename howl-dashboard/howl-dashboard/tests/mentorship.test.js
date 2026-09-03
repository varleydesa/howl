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
    currentSession = { user: { id: "auth-admin-demo" } };
    mentorStartupLinks = [
      {
        id: "link-alpha",
        programId: "programa-howl-atual",
        startupId: "agrosense",
        mentorId: "avaliador-demo-1",
        status: "active",
        notes: "Produto e validação"
      },
      {
        id: "link-beta",
        programId: "programa-howl-atual",
        startupId: "healthflow",
        mentorId: "avaliador-demo-2",
        status: "active",
        notes: "Vendas"
      }
    ];
    mentorshipSessions = [
      {
        id: "session-alpha",
        linkId: "link-alpha",
        programId: "programa-howl-atual",
        startupId: "agrosense",
        mentorId: "avaliador-demo-1",
        status: "completed",
        scheduledAt: "2026-09-10T13:00:00.000Z",
        durationMinutes: 60,
        topic: "Validação de pricing",
        agenda: "Revisar entrevistas",
        summary: "Sessão realizada",
        nextSteps: "Revisar hipótese de preço"
      },
      {
        id: "session-beta",
        linkId: "link-beta",
        programId: "programa-howl-atual",
        startupId: "healthflow",
        mentorId: "avaliador-demo-2",
        status: "completed",
        scheduledAt: "2026-09-11T13:00:00.000Z",
        durationMinutes: 60,
        topic: "Funil comercial",
        agenda: "",
        summary: "Sessão realizada",
        nextSteps: ""
      }
    ];
    mentorshipTasks = [
      {
        id: "task-alpha",
        sessionId: "session-alpha",
        programId: "programa-howl-atual",
        startupId: "agrosense",
        mentorId: "avaliador-demo-1",
        title: "Entrevistar leads",
        description: "Validar disposição de pagamento",
        priority: "high",
        status: "todo",
        dueDate: "2026-09-20"
      }
    ];
    mentorshipSessionFeedback = [
      {
        id: "feedback-alpha",
        sessionId: "session-alpha",
        programId: "programa-howl-atual",
        startupId: "agrosense",
        mentorId: "avaliador-demo-1",
        rating: 4,
        comment: "Mentoria objetiva",
        createdBy: "empreendedor-demo",
        createdAt: "2026-09-10T14:00:00.000Z",
        updatedAt: "2026-09-10T14:00:00.000Z"
      }
    ];

    activeUserId = "admin-demo";
    activeRoute = "mentorship";
    activeMentorshipTab = "agenda";
    render();
    const adminHtml = document.getElementById("app").innerHTML;
    const adminLinks = mentorshipLinksVisibleToUser().map((link) => link.id);
    mentorshipBriefingDrafts["session-alpha"] = "Situação atual: revisar pricing antes da sessão.";
    openMentorshipSessionEditor("session-alpha");
    const adminSessionEditorHtml = document.getElementById("app").innerHTML;

    activeMentorshipTab = "portfolio";
    render();
    const adminPortfolioHtml = document.getElementById("app").innerHTML;
    activeMentorshipTab = "tasks";
    render();
    openMentorshipTaskEditor("task-alpha");
    const adminTaskEditorHtml = document.getElementById("app").innerHTML;

    activeUserId = "avaliador-demo-1";
    activeRoute = "mentorship";
    activeMentorshipTab = "agenda";
    render();
    const mentorHtml = document.getElementById("app").innerHTML;
    const mentorLinks = mentorshipLinksVisibleToUser().map((link) => link.id);
    const mentorSessions = mentorshipSessionsVisibleToUser().map((session) => session.id);

    activeUserId = "empreendedor-demo";
    activeRoute = "mentorship";
    activeMentorshipTab = "agenda";
    render();
    const founderHtml = document.getElementById("app").innerHTML;
    const founderLinks = mentorshipLinksVisibleToUser().map((link) => link.id);
    const founderTasks = mentorshipTasksVisibleToUser().map((task) => task.id);

    ({
      adminHtml,
      adminLinks,
      adminSessionEditorHtml,
      adminPortfolioHtml,
      adminTaskEditorHtml,
      mentorHtml,
      mentorLinks,
      mentorSessions,
      founderHtml,
      founderLinks,
      founderTasks
    });
  `,
  context
);

assert(result.adminHtml.includes("Mentores, vínculos e mentorias"));
assert(result.adminHtml.includes("Agenda"));
assert(result.adminHtml.includes("Portfólio"));
assert(result.adminHtml.includes("Plano de Ação"));
assert(result.adminPortfolioHtml.includes("Vincular mentor a startup"));
assert(result.adminHtml.includes('name="durationMinutes" type="number" min="15" step="15" value="60"'));
assert(!result.adminHtml.includes('<label>Status</label><select name="status"'));
assert(result.adminHtml.includes("Atualizar status da sessão"));
assert(result.adminHtml.includes("Avaliação da startup"));
assert(result.adminHtml.includes("Editar sessão"));
assert(result.adminHtml.includes("Gerar briefing com IA"));
assert(result.adminSessionEditorHtml.includes("Salvar edição"));
assert(result.adminSessionEditorHtml.includes("Resumo pós-sessão"));
assert(result.adminSessionEditorHtml.includes("Briefing gerado com IA"));
assert(result.adminSessionEditorHtml.includes("Situação atual: revisar pricing antes da sessão."));
assert(result.adminTaskEditorHtml.includes("Editar tarefa"));
assert(result.adminTaskEditorHtml.includes("Descrição"));
assert.deepStrictEqual(Array.from(result.adminLinks).sort(), ["link-alpha", "link-beta"]);

assert(result.mentorHtml.includes("Dashboard de mentoria"));
assert(!result.mentorHtml.includes("Vincular mentor a startup"));
assert.deepStrictEqual(Array.from(result.mentorLinks), ["link-alpha"]);
assert.deepStrictEqual(Array.from(result.mentorSessions), ["session-alpha"]);

assert(result.founderHtml.includes("Minha mentoria"));
assert(result.founderHtml.includes("Avaliador Demo 1"));
assert(result.founderHtml.includes("Avaliação da sessão"));
assert(result.founderHtml.includes("Atualizar avaliação"));
assert.deepStrictEqual(Array.from(result.founderLinks), ["link-alpha"]);
assert.deepStrictEqual(Array.from(result.founderTasks), ["task-alpha"]);
assert.strictEqual(
  vm.runInContext(`averageSessionEvaluation(mentorshipSessionsVisibleToUser())`, context),
  4
);

const durations = vm.runInContext(
  `
    ({
      explicitSixty: parseDurationMinutes("60"),
      emptyDefault: parseDurationMinutes(""),
      tooShort: parseDurationMinutes("5"),
      tooLong: parseDurationMinutes("999")
    });
  `,
  context
);

assert.strictEqual(durations.explicitSixty, 60);
assert.strictEqual(durations.emptyDefault, 60);
assert.strictEqual(durations.tooShort, 15);
assert.strictEqual(durations.tooLong, 360);

const sessionStatus = vm.runInContext(
  `
    activeUserId = "admin-demo";
    backendStatus = "Base local";
    changeMentorshipSessionStatus("session-alpha", "completed");
    mentorshipSessions.find((session) => session.id === "session-alpha").status;
  `,
  context
);

assert.strictEqual(sessionStatus, "completed");

console.log("Mentorias, vínculos e escopos por perfil validados.");
