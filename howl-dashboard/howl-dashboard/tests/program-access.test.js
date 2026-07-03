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

    activeUserId = "admin-ana";
    activeRoute = "dashboard";
    render();
    const adminHasFilter = document
      .getElementById("app")
      .innerHTML.includes("Todos os programas");
    selectDashboardProgram("programa-externo");
    const filteredAdminIds = dashboardStartups().map((startup) => startup.id);

    activeUserId = "avaliador-rafael";
    selectedDashboardProgramId = "all";
    const evaluatorIds = accessibleStartups().map((startup) => startup.id);

    ({
      adminHasFilter,
      filteredAdminIds,
      evaluatorIds,
      currentProgramStartupIds: startups
        .filter((startup) => startup.programId === "programa-howl-atual")
        .map((startup) => startup.id)
    });
  `,
  context
);

assert(result.adminHasFilter);
assert.deepStrictEqual(Array.from(result.filteredAdminIds), ["startup-externa"]);
assert(!result.evaluatorIds.includes("startup-externa"));
assert.deepStrictEqual(
  Array.from(result.evaluatorIds).sort(),
  Array.from(result.currentProgramStartupIds).sort()
);

console.log("Filtro do Admin e escopo do Avaliador validados.");
