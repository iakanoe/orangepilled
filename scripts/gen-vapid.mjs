// Generate a VAPID keypair for Web Push.
//
// Usage:
//   npm run gen:vapid                          # print keys (subject = mailto:you@example.com)
//   npm run gen:vapid -- tu@email.com          # print keys with your subject email
//   npm run gen:vapid -- tu@email.com --vercel # push the 3 vars to Vercel (all envs) via Vercel CLI
//   npm run gen:vapid -- tu@email.com --write  # append/update .env.local
//
// Notes:
//  - --vercel requires the Vercel CLI (`npm i -g vercel`) and a linked project
//    (`vercel link`). It sets the vars for production, preview and development.
//  - Copy the printed lines into your .env.local if you don't use a flag.
import webpush from "web-push";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const email = args.find((a) => !a.startsWith("--")) || "you@example.com";

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error(
    `\n✖ Email inválido: "${email}"\n  Uso: npm run gen:vapid -- tu@email.com\n`,
  );
  process.exit(1);
}

const keys = webpush.generateVAPIDKeys();

const vars = {
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  VAPID_SUBJECT: `mailto:${email}`,
};

console.log("\n✔ Claves VAPID generadas.\n");
for (const [k, v] of Object.entries(vars)) console.log(`${k}=${v}`);
console.log("");

// --write: persist to .env.local (creates or updates the three keys)
if (flags.has("--write")) {
  const path = ".env.local";
  let content = existsSync(path) ? readFileSync(path, "utf8") : "";
  for (const [k, v] of Object.entries(vars)) {
    const line = `${k}=${v}`;
    const re = new RegExp(`^${k}=.*$`, "m");
    content = re.test(content)
      ? content.replace(re, line)
      : `${content.replace(/\n?$/, "\n")}${line}\n`;
  }
  writeFileSync(path, content);
  console.log(`✔ Escrito en ${path}\n`);
}

// --vercel: upload each var to Vercel for all environments via the CLI
if (flags.has("--vercel")) {
  const targets = ["production", "preview", "development"];
  console.log(
    "↑ Subiendo variables a Vercel (production, preview, development)...\n",
  );
  for (const [name, value] of Object.entries(vars)) {
    for (const env of targets) {
      // Remove first so re-runs don't fail on "already exists".
      spawnSync("vercel", ["env", "rm", name, env, "-y"], { stdio: "ignore" });
      const res = spawnSync("vercel", ["env", "add", name, env], {
        input: `${value}\n`,
        stdio: ["pipe", "inherit", "inherit"],
      });
      if (res.status !== 0) {
        console.error(
          `\n✖ Falló al setear ${name} (${env}). ¿Tenés la Vercel CLI instalada y el proyecto linkeado (vercel link)?\n`,
        );
        process.exit(res.status ?? 1);
      }
    }
    console.log(`  ✔ ${name}`);
  }
  console.log("\n✔ Variables cargadas en Vercel. Redeploy para aplicarlas.\n");
}
