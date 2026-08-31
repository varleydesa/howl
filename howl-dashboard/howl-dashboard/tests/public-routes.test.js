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
    location: { hash: "" },
  },
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"),
  context
);

assert(appElement.innerHTML.includes("HORDA"));
assert(appElement.innerHTML.includes("HOWL Dashboard"));
assert(!appElement.innerHTML.includes("Email"));

vm.runInContext(`go("pitch")`, context);
assert(appElement.innerHTML.includes("Harmonizacao Orquestrada"));

vm.runInContext(`go("dashboard")`, context);
assert(appElement.innerHTML.includes("Entrar"));
assert(appElement.innerHTML.includes("Supabase Auth"));

console.log("Rotas publicas e bloqueio do dashboard validados.");
