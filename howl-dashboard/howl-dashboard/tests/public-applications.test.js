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
    publicApplications = [
      {
        id: "application-pending-admin",
        type: "startup",
        status: "pending",
        name: "Startup Sem Programa",
        contactName: "Fundadora",
        email: "fundadora@example.com",
        phone: "",
        organization: "",
        sector: "SaaS",
        stage: "MVP",
        city: "Recife",
        state: "PE",
        availability: "Manhã",
        experience: "",
        pitch: "Plataforma B2B em validação.",
        programId: null,
        approvedStartupId: null,
        approvedProfileId: null,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: "",
        createdAt: "2026-08-31T04:00:00.000Z"
      },
      {
        id: "application-program-client",
        type: "mentor",
        status: "pending",
        name: "Mentora Programa",
        contactName: "Mentora Programa",
        email: "mentora@example.com",
        phone: "",
        organization: "Consultoria",
        sector: "Produto",
        stage: "",
        city: "São Paulo",
        state: "SP",
        availability: "2 sessões/mês",
        experience: "12 anos",
        pitch: "Apoio em discovery e estratégia.",
        programId: "programa-howl-atual",
        approvedStartupId: null,
        approvedProfileId: null,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: "",
        createdAt: "2026-08-31T05:00:00.000Z"
      }
    ];

    currentSession = { user: { id: "auth-admin-demo" } };
    activeUserId = "admin-demo";
    activeRoute = "applications";
    render();
    const adminHtml = document.getElementById("app").innerHTML;
    const adminVisible = applicationsVisibleToUser().map((application) => application.id);

    users.push({
      id: "cliente-aplicacoes",
      name: "Cliente Aplicações",
      email: "cliente.aplicacoes@example.com",
      role: "cliente",
      roleLabel: "Cliente",
      organization: "HOWL",
      programId: "programa-howl-atual",
      startupIds: []
    });

    activeUserId = "cliente-aplicacoes";
    render();
    const clientHtml = document.getElementById("app").innerHTML;
    const clientVisible = applicationsVisibleToUser().map((application) => application.id);

    ({
      adminHtml,
      adminVisible,
      clientHtml,
      clientVisible
    });
  `,
  context
);

assert.deepStrictEqual(
  Array.from(result.adminVisible).sort(),
  ["application-pending-admin", "application-program-client"].sort()
);
assert(result.adminHtml.includes("Inscrições"));
assert(result.adminHtml.includes("Startup Sem Programa"));
assert(result.adminHtml.includes("Mentora Programa"));
assert(result.adminHtml.includes("Programa de destino"));

assert.deepStrictEqual(Array.from(result.clientVisible), ["application-program-client"]);
assert(!result.clientHtml.includes("Startup Sem Programa"));
assert(result.clientHtml.includes("Mentora Programa"));
assert(result.clientHtml.includes("Senha temporária"));

const migration = fs.readFileSync(
  path.join(__dirname, "..", "supabase", "migrations", "20260831_public_applications.sql"),
  "utf8"
);

assert(migration.includes("create table if not exists public.horda_applications"));
assert(migration.includes("to anon, authenticated"));
assert(migration.includes("and program_id is null"));
assert(migration.includes("private.can_manage_program(program_id)"));

assert.strictEqual(
  vm.runInContext(`isMissingSupabaseRelation({ code: "PGRST205", message: "Could not find the table 'public.horda_applications' in the schema cache" })`, context),
  true
);

console.log("Fila de inscrições públicas validada.");
