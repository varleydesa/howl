const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "dist");
const publicFiles = [
  "index.html",
  "app.js",
  "styles.css",
  path.join("assets", "howl-logo-menu.jpg"),
  path.join("assets", "horda-login.jpg"),
];
const supabaseUrl = process.env.HOWL_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabasePublishableKey =
  process.env.HOWL_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of publicFiles) {
  fs.mkdirSync(path.dirname(path.join(output, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}

const supabaseConfig = supabaseUrl && supabasePublishableKey
  ? `window.HOWL_SUPABASE_CONFIG = ${JSON.stringify(
      {
        url: supabaseUrl,
        publishableKey: supabasePublishableKey,
      },
      null,
      2
    )};\n`
  : fs.readFileSync(path.join(root, "supabase-config.js"), "utf8");

fs.writeFileSync(path.join(output, "supabase-config.js"), supabaseConfig);

console.log(`Build concluído: ${publicFiles.length + 1} arquivos em dist/.`);
