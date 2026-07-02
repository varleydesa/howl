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
      client: "Outro cliente"
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
    users.push({
      id: "cliente-teste",
      name: "Cliente Teste",
      email: "cliente@teste.com",
      role: "cliente",
      roleLabel: "Cliente",
      organization: "HOWL",
      programId: "programa-howl-atual",
      startupIds: []
    });
    activeUserId = "cliente-teste";
    activeRoute = "registration";
    render();
    ({
      startupIds: accessibleStartups().map((startup) => startup.id),
      html: document.getElementById("app").innerHTML
    });
  `,
  context
);

assert(!result.startupIds.includes("startup-externa"));
assert(result.html.includes("Programa vinculado"));
assert(!result.html.includes("Novo tipo de programa"));
assert(!result.html.includes('option value="cliente"'));
assert(!result.html.includes('value="programa-externo"'));

console.log("Escopo do perfil Cliente validado.");
