const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "dist");
const publicFiles = [
  "index.html",
  "app.js",
  "styles.css",
  "supabase-config.js",
  path.join("assets", "howl-logo-menu.jpg"),
  path.join("assets", "horda-login.jpg"),
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of publicFiles) {
  fs.mkdirSync(path.dirname(path.join(output, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}

console.log(`Build concluído: ${publicFiles.length} arquivos em dist/.`);
