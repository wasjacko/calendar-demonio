#!/usr/bin/env node
/**
 * Auto-backup Supabase → disque local (+ option GitHub).
 *
 * Dumpe toutes les tables de l'app via l'API REST (publishable key, RLS off
 * en mode single-user) vers des fichiers JSON + un dump SQL ré-importable.
 *
 * - Aucune dépendance externe (fetch natif Node 18+).
 * - Lit les credentials depuis .env.local.
 * - Dossier horodaté par run, garde les 30 derniers, purge les + vieux.
 * - Écrit un `latest.json` consolidé + un `restore.sql` prêt à coller.
 * - Sort en code 1 si la base est injoignable (pour alerter via launchd).
 *
 * Usage:
 *   node scripts/backup-supabase.mjs
 *   npm run backup
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Dossier des backups — HORS du repo (ne jamais committer les données)
const BACKUP_DIR = join(process.env.HOME, "Desktop", "calendar-backups");
const KEEP_LAST = 30;

// Tables à sauvegarder
const TABLES = [
  "posts",
  "templates",
  "reminders",
  "settings",
  "push_subscriptions",
  "funnel_goals",
];

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.error("✗ .env.local introuvable");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("✗ URL ou clé Supabase manquante dans .env.local");
    process.exit(1);
  }
  return { url, key };
}

async function fetchTable(url, key, table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (res.status === 404) return { missing: true, rows: [] };
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
  return { missing: false, rows: await res.json() };
}

// Génère un INSERT SQL idempotent pour une table
function rowsToSql(table, rows) {
  if (!rows.length) return `-- ${table}: 0 ligne\n`;
  const cols = Object.keys(rows[0]);
  const values = rows
    .map((r) => {
      const vals = cols.map((c) => {
        const v = r[c];
        if (v === null || v === undefined) return "null";
        if (typeof v === "number") return String(v);
        if (typeof v === "boolean") return v ? "true" : "false";
        if (Array.isArray(v) || typeof v === "object")
          return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      return `  (${vals.join(", ")})`;
    })
    .join(",\n");
  return `-- ${table}: ${rows.length} lignes\ninsert into ${table} (${cols.join(", ")}) values\n${values}\non conflict (id) do nothing;\n`;
}

async function main() {
  const { url, key } = loadEnv();
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const runDir = join(BACKUP_DIR, stamp);
  mkdirSync(runDir, { recursive: true });

  const consolidated = { _meta: { url, timestamp: stamp, tables: {} } };
  const sqlParts = [
    `-- =====================================================`,
    `-- BACKUP Supabase editorial-calendar`,
    `-- Date: ${stamp}`,
    `-- Source: ${url}`,
    `-- Restaurer: coller dans le SQL editor du projet cible`,
    `-- =====================================================\n`,
  ];

  let totalRows = 0;
  let reachable = false;

  for (const table of TABLES) {
    try {
      const { missing, rows } = await fetchTable(url, key, table);
      reachable = true;
      if (missing) {
        console.log(`  ⊘ ${table} (table absente)`);
        consolidated._meta.tables[table] = "missing";
        continue;
      }
      writeFileSync(join(runDir, `${table}.json`), JSON.stringify(rows, null, 2));
      consolidated[table] = rows;
      consolidated._meta.tables[table] = rows.length;
      sqlParts.push(rowsToSql(table, rows));
      totalRows += rows.length;
      console.log(`  ✓ ${table}: ${rows.length} lignes`);
    } catch (err) {
      console.error(`  ✗ ${table}: ${err.message}`);
      consolidated._meta.tables[table] = `error: ${err.message}`;
    }
  }

  if (!reachable) {
    console.error("\n✗✗✗ BASE INJOIGNABLE — projet pausé/supprimé ? Backup vide.");
    // On garde quand même un marqueur d'échec daté
    writeFileSync(join(runDir, "_UNREACHABLE.txt"), `Base injoignable à ${stamp}\nURL: ${url}\n`);
    process.exit(1);
  }

  // Fichiers consolidés
  writeFileSync(join(runDir, "all-tables.json"), JSON.stringify(consolidated, null, 2));
  writeFileSync(join(runDir, "restore.sql"), sqlParts.join("\n"));
  // Copie "latest" pour accès rapide
  writeFileSync(join(BACKUP_DIR, "latest.json"), JSON.stringify(consolidated, null, 2));
  writeFileSync(join(BACKUP_DIR, "latest-restore.sql"), sqlParts.join("\n"));

  console.log(`\n✓ Backup complet: ${totalRows} lignes → ${runDir}`);

  // Purge: garde les KEEP_LAST plus récents
  const runs = readdirSync(BACKUP_DIR)
    .filter((d) => /^\d{4}-\d{2}-\d{2}_/.test(d))
    .sort()
    .reverse();
  const toDelete = runs.slice(KEEP_LAST);
  for (const old of toDelete) {
    rmSync(join(BACKUP_DIR, old), { recursive: true, force: true });
  }
  if (toDelete.length) console.log(`  ↳ purgé ${toDelete.length} ancien(s) backup(s)`);
}

main().catch((err) => {
  console.error("✗ Backup échoué:", err.message);
  process.exit(1);
});
