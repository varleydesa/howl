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
        status: "scheduled",
        scheduledAt: "2026-09-10T13:00:00.000Z",
        durationMinutes: 60,
        topic: "Validação de pricing",
        agenda: "Revisar entrevistas",
        summary: "",
        nextSteps: ""
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

    activeUserId = "admin-demo";
    activeRoute = "mentorship";
    render();
    const adminHtml = document.getElementById("app").innerHTML;
    const adminLinks = mentorshipLinksVisibleToUser().map((link) => link.id);

    activeUserId = "avaliador-demo-1";
    activeRoute = "mentorship";
    render();
    const mentorHtml = document.getElementById("app").innerHTML;
    const mentorLinks = mentorshipLinksVisibleToUser().map((link) => link.id);
    const mentorSessions = mentorshipSessionsVisibleToUser().map((session) => session.id);

    activeUserId = "empreendedor-demo";
    activeRoute = "mentorship";
    render();
    const founderHtml = document.getElementById("app").innerHTML;
    const founderLinks = mentorshipLinksVisibleToUser().map((link) => link.id);
    const founderTasks = mentorshipTasksVisibleToUser().map((task) => task.id);

    ({
      adminHtml,
      adminLinks,
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
assert(result.adminHtml.includes("Vincular mentor a startup"));
assert.deepStrictEqual(Array.from(result.adminLinks).sort(), ["link-alpha", "link-beta"]);

assert(result.mentorHtml.includes("Dashboard de mentoria"));
assert(!result.mentorHtml.includes("Vincular mentor a startup"));
assert.deepStrictEqual(Array.from(result.mentorLinks), ["link-alpha"]);
assert.deepStrictEqual(Array.from(result.mentorSessions), ["session-alpha"]);

assert(result.founderHtml.includes("Minha mentoria"));
assert(result.founderHtml.includes("Avaliador Demo 1"));
assert.deepStrictEqual(Array.from(result.founderLinks), ["link-alpha"]);
assert.deepStrictEqual(Array.from(result.founderTasks), ["task-alpha"]);

console.log("Mentorias, vínculos e escopos por perfil validados.");
