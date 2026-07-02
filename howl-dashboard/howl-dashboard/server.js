const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8000);
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, "db.json");

const MIME_TYPES = {
  ".html": "text/html;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".json": "application/json;charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function readDatabase() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDatabase(database) {
  const next = {
    ...database,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(DB_PATH, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json;charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Payload muito grande."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
    req.on("error", reject);
  });
}

function defaultScoreProfile() {
  return [0, 1, 2, 3].map(() => [null, null, null, null]);
}

function slugify(value, fallback = "item") {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

function validateDatabase(database) {
  if (!Array.isArray(database.journeys)) throw new Error("Campo journeys ausente.");
  if (!Array.isArray(database.programTypes)) throw new Error("Campo programTypes ausente.");
  if (!Array.isArray(database.programs)) throw new Error("Campo programs ausente.");
  if (!Array.isArray(database.startups)) throw new Error("Campo startups ausente.");
  if (!Array.isArray(database.users)) throw new Error("Campo users ausente.");
  if (!database.scoreProfiles || typeof database.scoreProfiles !== "object") database.scoreProfiles = {};
  if (!database.assessmentResponses || typeof database.assessmentResponses !== "object") database.assessmentResponses = {};
}

async function handleApi(req, res, pathname) {
  try {
    const database = readDatabase();

    if (req.method === "GET" && pathname === "/api/data") {
      sendJson(res, 200, database);
      return;
    }

    if (req.method === "POST" && pathname === "/api/startups") {
      const startup = await readBody(req);
      if (!startup.name || !startup.founder || !startup.programId) throw new Error("Programa, nome da startup e fundador(a) são obrigatórios.");
      if (!database.programs.some((program) => program.id === startup.programId)) throw new Error("Programa não encontrado.");
      let id = slugify(startup.id || startup.name, "startup");
      let suffix = 2;
      while (database.startups.some((item) => item.id === id)) {
        id = `${slugify(startup.id || startup.name, "startup")}-${suffix}`;
        suffix += 1;
      }
      const nextStartup = { ...startup, id };
      database.startups.push(nextStartup);
      database.scoreProfiles[id] = defaultScoreProfile(database.startups.length);
      const saved = writeDatabase(database);
      sendJson(res, 201, { startup: nextStartup, startups: saved.startups, scoreProfiles: saved.scoreProfiles });
      return;
    }

    if (req.method === "POST" && pathname === "/api/program-types") {
      const programType = await readBody(req);
      if (!programType.type) throw new Error("Tipo do programa é obrigatório.");
      const id = slugify(programType.id || programType.type, "tipo-programa");
      if (database.programTypes.some((item) => item.id === id)) throw new Error("Tipo de programa já cadastrado.");
      const nextProgramType = { id, type: String(programType.type).trim() };
      database.programTypes.push(nextProgramType);
      const saved = writeDatabase(database);
      sendJson(res, 201, { programType: nextProgramType, programTypes: saved.programTypes });
      return;
    }

    if (req.method === "POST" && pathname === "/api/programs") {
      const program = await readBody(req);
      if (!program.name || !program.client || !program.programTypeId) throw new Error("Tipo, nome e cliente são obrigatórios.");
      if (!database.programTypes.some((item) => item.id === program.programTypeId)) throw new Error("Tipo de programa não encontrado.");
      let id = slugify(program.id || program.name, "programa");
      let suffix = 2;
      while (database.programs.some((item) => item.id === id)) {
        id = `${slugify(program.id || program.name, "programa")}-${suffix}`;
        suffix += 1;
      }
      const nextProgram = { ...program, id };
      database.programs.push(nextProgram);
      const saved = writeDatabase(database);
      sendJson(res, 201, { program: nextProgram, programs: saved.programs });
      return;
    }

    if (req.method === "POST" && pathname === "/api/users") {
      const user = await readBody(req);
      if (!user.name || !user.email || !user.role) throw new Error("Nome, email e perfil são obrigatórios.");
      if (["cliente", "avaliador"].includes(user.role) && !database.programs.some((program) => program.id === user.programId)) {
        throw new Error("Programa do Cliente/Avaliador não encontrado.");
      }
      if (user.role === "empreendedor" && !user.startupIds?.length) {
        throw new Error("Startup do empreendedor é obrigatória.");
      }
      let id = slugify(user.id || `${user.name}-${user.role}`, "usuario");
      let suffix = 2;
      while (database.users.some((item) => item.id === id)) {
        id = `${slugify(user.id || `${user.name}-${user.role}`, "usuario")}-${suffix}`;
        suffix += 1;
      }
      const nextUser = {
        ...user,
        id,
        programId: ["cliente", "avaliador"].includes(user.role) ? user.programId : null,
        startupIds: ["cliente", "avaliador"].includes(user.role) ? [] : user.startupIds || [],
      };
      database.users.push(nextUser);
      const saved = writeDatabase(database);
      sendJson(res, 201, { user: nextUser, users: saved.users });
      return;
    }

    if (req.method === "PUT" && pathname === "/api/questions") {
      const payload = await readBody(req);
      if (!Array.isArray(payload.journeys)) throw new Error("Envie journeys como array.");
      database.journeys = payload.journeys;
      const saved = writeDatabase(database);
      sendJson(res, 200, { journeys: saved.journeys });
      return;
    }

    if (req.method === "PUT" && pathname === "/api/assessment-responses") {
      const payload = await readBody(req);
      if (!payload.responses || typeof payload.responses !== "object") throw new Error("Envie responses como objeto.");
      database.assessmentResponses = database.assessmentResponses || {};
      Object.entries(payload.responses).forEach(([key, response]) => {
        database.assessmentResponses[key] = {
          ...(database.assessmentResponses[key] || {}),
          ...response,
        };
      });
      const saved = writeDatabase(database);
      sendJson(res, 200, { assessmentResponses: saved.assessmentResponses });
      return;
    }

    if (req.method === "PUT" && pathname === "/api/database") {
      const payload = await readBody(req);
      validateDatabase(payload);
      const saved = writeDatabase(payload);
      sendJson(res, 200, saved);
      return;
    }

    sendJson(res, 404, { error: "Endpoint não encontrado." });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Erro inesperado." });
  }
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(ROOT, safePath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url.pathname);
    return;
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`HOWL MVP rodando em http://localhost:${PORT}`);
});
