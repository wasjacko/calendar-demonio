#!/usr/bin/env node
/**
 * Restaure un backup local → projet Supabase courant (celui de .env.local).
 *
 * Usage:
 *   node scripts/restore-supabase.mjs                  # restaure le dernier backup
 *   node scripts/restore-supabase.mjs 2026-06-14_10-00-00   # un backup précis
 *
 * Insère via l'API REST avec on-conflict ignore (ne réécrase pas l'existant).
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BACKUP_DIR = join(process.env.HOME, "Desktop", "calendar-backups");

const TABLES = ["templates", "settings", "posts", "reminders", "push_subscriptions", "funnel_goals"];

function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

async function main() {
  const { url, key } = loadEnv();
  const arg = process.argv[2];

  let backupFile;
  if (arg) {
    backupFile = join(BACKUP_DIR, arg, "all-tables.json");
  } else {
    backupFile = join(BACKUP_DIR, "latest.json");
  }
  if (!existsSync(backupFile)) {
    console.error(`✗ Backup introuvable: ${backupFile}`);
    console.error(`  Backups dispo:`, readdirSync(BACKUP_DIR).filter((d) => /^\d{4}/.test(d)).join(", "));
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(backupFile, "utf8"));
  console.log(`Restauration depuis ${backupFile}`);
  console.log(`Vers ${url}\n`);

  for (const table of TABLES) {
    const rows = data[table];
    if (!Array.isArray(rows) || !rows.length) {
      console.log(`  ⊘ ${table}: rien à restaurer`);
      continue;
    }
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    });
    if (res.ok) {
      console.log(`  ✓ ${table}: ${rows.length} lignes restaurées`);
    } else {
      console.error(`  ✗ ${table}: HTTP ${res.status} ${await res.text()}`);
    }
  }
  console.log("\n✓ Restauration terminée.");
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
