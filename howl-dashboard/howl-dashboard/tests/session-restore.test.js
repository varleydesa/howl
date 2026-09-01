const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appElement = { innerHTML: "" };
let createClientOptions = null;
const authSession = { user: { id: "auth-admin-demo" } };

function queryResult(table) {
  const rows = {
    program_types: [{ id: "aceleracao", type: "Aceleração" }],
    programs: [{
      id: "programa-howl-atual",
      program_type_id: "aceleracao",
      name: "Programa HOWL Atual",
      client: "HOWL",
    }],
    startups: [{
      id: "agrosense",
      program_id: "programa-howl-atual",
      name: "AgroSense AI",
      founder: "Pessoa Fundadora",
      sector: "Agtech",
      city: "São Luís",
      state: "MA",
      stage: "MVP",
      description: "Startup de teste.",
    }],
    profiles: [{
      id: "admin-demo",
      auth_user_id: "auth-admin-demo",
      name: "Admin Demo",
      email: "admin@example.com",
      role: "admin",
      organization: "HOWL",
      program_id: null,
      active: true,
    }],
    profile_startups: [],
    journeys: [
      { id: "conceito", name: "Conceito", description: "Desc", gate: "Gate", position: 1 },
      { id: "produto", name: "Produto", description: "Desc", gate: "Gate", position: 2 },
      { id: "negocios", name: "Negócios", description: "Desc", gate: "Gate", position: 3 },
      { id: "crescimento", name: "Crescimento", description: "Desc", gate: "Gate", position: 4 },
    ],
    questions: [
      { id: "q1", journey_id: "conceito", prompt: "Pergunta 1", position: 1, active: true },
      { id: "q2", journey_id: "produto", prompt: "Pergunta 2", position: 1, active: true },
      { id: "q3", journey_id: "negocios", prompt: "Pergunta 3", position: 1, active: true },
      { id: "q4", journey_id: "crescimento", prompt: "Pergunta 4", position: 1, active: true },
    ],
    assessment_periods: [
      { id: "p1", month: 2, year: 2026, label: "Fev/2026" },
      { id: "p2", month: 3, year: 2026, label: "Mar/2026" },
      { id: "p3", month: 4, year: 2026, label: "Abr/2026" },
      { id: "p4", month: 5, year: 2026, label: "Mai/2026" },
    ],
    assessment_cycles: [],
    assessment_question_results: [],
    horda_applications: [],
  }[table] || [];
  return { data: rows, error: null };
}

function createQuery(table) {
  return {
    eq() {
      return this;
    },
    order() {
      return this;
    },
    select() {
      return this;
    },
    single() {
      if (table === "profiles") return Promise.resolve({ data: queryResult(table).data[0], error: null });
      return Promise.resolve(queryResult(table));
    },
    then(resolve, reject) {
      return Promise.resolve(queryResult(table)).then(resolve, reject);
    },
  };
}

const context = {
  Blob,
  FormData,
  TextEncoder,
  URL,
  clearTimeout,
  console,
  document: {
    createElement() {
      return {};
    },
    getElementById() {
      return appElement;
    },
  },
  setTimeout,
  window: {
    HOWL_SUPABASE_CONFIG: {
      publishableKey: "sb_publishable_test",
      url: "https://example.supabase.co",
    },
    alert() {},
    crypto: crypto.webcrypto,
    history: {
      replaceState(_state, _title, url) {
        const hashIndex = String(url).indexOf("#");
        context.window.location.hash = hashIndex >= 0 ? String(url).slice(hashIndex) : "";
      },
    },
    location: { hash: "", pathname: "/", search: "" },
    supabase: {
      createClient(_url, _key, options) {
        createClientOptions = options;
        return {
          auth: {
            getSession() {
              return Promise.resolve({ data: { session: authSession }, error: null });
            },
            signOut() {
              return Promise.resolve({ error: null });
            },
          },
          from(table) {
            return createQuery(table);
          },
        };
      },
    },
  },
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"),
  context
);

setTimeout(() => {
  assert.strictEqual(vm.runInContext("activeRoute", context), "dashboard");
  assert.strictEqual(context.window.location.hash, "#dashboard");
  assert.strictEqual(createClientOptions.auth.persistSession, true);
  assert.strictEqual(createClientOptions.auth.autoRefreshToken, true);
  assert(appElement.innerHTML.includes("Dashboard"));
  console.log("Sessão autenticada restaurada após F5.");
}, 0);
