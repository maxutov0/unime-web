import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, queryAll } from './db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

async function main(){
  await getDb();
  const appliedRows = [];
  try { appliedRows.push(...(await queryAll('SELECT name, applied_at FROM migrations ORDER BY name'))); } catch {}
  const applied = new Set(appliedRows.map(r => r.name));
  const files = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir).filter(f => f.endsWith('.mjs')).sort() : [];
  console.log('Migrations directory:', migrationsDir);
  console.log('Applied migrations:');
  if(appliedRows.length === 0) console.log('  (none)');
  for(const r of appliedRows){ console.log(`  ${r.name} @ ${r.applied_at}`); }
  console.log('Pending migrations:');
  const pending = files.filter(f => !applied.has(f));
  if(pending.length === 0) console.log('  (none)');
  for(const f of pending){ console.log(`  ${f}`); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => { console.error(err); process.exit(1); });
}
