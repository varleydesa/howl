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

vm.runInContext(
  `
    currentSession = { user: { id: "auth-admin-demo" } };
    activeUserId = "admin-demo";
    activeRoute = "users";
    render();
  `,
  context
);

assert(appElement.innerHTML.includes("Status"));
assert(appElement.innerHTML.includes("Ações"));
assert(appElement.innerHTML.includes("Editar"));
assert(appElement.innerHTML.includes("Inativar"));
assert(appElement.innerHTML.includes("Ativo"));

vm.runInContext(`openUserEditor("avaliador-demo-1")`, context);
assert(appElement.innerHTML.includes("Alterar usuário"));
assert(appElement.innerHTML.includes("Salvar alterações"));
assert(appElement.innerHTML.includes("avaliador1@example.com"));

vm.runInContext(
  `
    users.find((user) => user.id === "avaliador-demo-1").active = false;
    editingUserId = null;
    render();
  `,
  context
);
assert(appElement.innerHTML.includes("Inativo"));

console.log("Interface de edição e inativação validada.");
