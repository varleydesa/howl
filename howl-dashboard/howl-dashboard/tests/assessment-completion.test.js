const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const context = {
  Blob,
  FormData,
  TextEncoder,
  URL,
  clearTimeout,
  console,
  document: { getElementById: () => ({ innerHTML: "" }) },
  setTimeout,
  window: { HOWL_SUPABASE_CONFIG: {}, crypto: crypto.webcrypto },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"), context);

const result = vm.runInContext(`
  currentSession = { user: { id: "auth-admin-demo" } };
  activeUserId = "admin-demo";
  startups = [startups[0]];
  months = [{ month: 9, year: 2026, label: "Set/2026" }];
  JOURNEYS = [{ id: "conceito", name: "Conceito", gate: "Validar", questions: ["P1", "P2"] }];
  assessmentResponses = {};
  rebuildAssessments();
  const none = latestAssessment("agrosense");
  const emptyReport = renderReports();

  const firstKey = responseKey("agrosense", 9, 2026, "conceito", 0);
  const secondKey = responseKey("agrosense", 9, 2026, "conceito", 1);
  assessmentResponses[firstKey] = { entrepreneurScore: 4 };
  assessmentResponses[secondKey] = { entrepreneurScore: 0 };
  rebuildAssessments();
  const waitingEvaluator = latestAssessment("agrosense");
  const pendingManagerDashboard = renderDashboard();
  activeUserId = "empreendedor-demo";
  const pendingFounderDashboard = renderDashboard();
  activeUserId = "admin-demo";

  assessmentResponses[firstKey] = { consultantScore: 3 };
  assessmentResponses[secondKey] = { consultantScore: 0 };
  rebuildAssessments();
  const waitingEntrepreneur = latestAssessment("agrosense");

  assessmentResponses[firstKey] = { entrepreneurScore: 4, consultantScore: 3 };
  assessmentResponses[secondKey] = {};
  rebuildAssessments();
  const waitingBoth = latestAssessment("agrosense");

  assessmentResponses[secondKey] = { entrepreneurScore: 0, consultantScore: 0 };
  rebuildAssessments();
  const complete = latestAssessment("agrosense");
  ({ none, emptyReport, waitingEvaluator, pendingManagerDashboard, pendingFounderDashboard,
     waitingEntrepreneur, waitingBoth, complete,
     completeReport: renderReports(), history: historyFor("agrosense") });
`, context);

assert.strictEqual(result.none.hasResponses, false);
assert.strictEqual(result.none.waitingLabel, "Aguardando respostas do empreendedor e do avaliador");
assert.match(result.emptyReport, /Relat.rio aguardando conclus.o/);
assert.strictEqual(result.waitingEvaluator.waitingLabel, "Aguardando respostas do avaliador");
assert.strictEqual(result.waitingEvaluator.howlScore, null);
assert.strictEqual(result.waitingEvaluator.journeyResults[0].questions[0].finalScore, null);
assert.strictEqual(result.waitingEvaluator.journeyResults[0].questions[0].consultantComment, "");
assert.match(result.pendingManagerDashboard, /Aguardando avalia..es completas/);
assert.match(result.pendingFounderDashboard, /Aguardando respostas do avaliador/);
assert.doesNotMatch(result.pendingFounderDashboard, />Cr.tico</);
assert.strictEqual(result.waitingEntrepreneur.waitingLabel, "Aguardando respostas do empreendedor");
assert.strictEqual(result.waitingBoth.waitingLabel, "Aguardando respostas do empreendedor e do avaliador");
assert.strictEqual(result.waitingBoth.hasResponses, false);
assert.strictEqual(result.complete.hasResponses, true);
assert.strictEqual(result.complete.waitingLabel, "Avaliação completa");
assert.strictEqual(result.complete.journeyResults[0].questions[1].finalScore, 0);
assert.strictEqual(result.complete.howlScore, 34);
assert.strictEqual(result.history.length, 1);
assert.match(result.completeReport, /HOWL Score 34/);

console.log("Conclusão e pendências da avaliação validadas.");
