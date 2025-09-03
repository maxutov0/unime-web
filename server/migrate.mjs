import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, run, queryAll, queryOne } from './db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

async function ensureTable(){
  await getDb();
  await run('CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(255) PRIMARY KEY, applied_at DATETIME NOT NULL)');
}

export async function runMigrations(){
  await ensureTable();
  const files = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir).filter(f => f.endsWith('.mjs')).sort() : [];
  const applied = new Set((await queryAll('SELECT name FROM migrations')).map(r => r.name));
  for(const file of files){
    if(applied.has(file)) continue;
    const mod = await import(path.join(migrationsDir, file));
    if(typeof mod.up !== 'function'){ console.warn('Skipping migration without up():', file); continue; }
    console.log('Applying migration', file);
    await mod.up({ run, queryOne, queryAll });
    await run('INSERT INTO migrations(name, applied_at) VALUES(?, ?)', [file, new Date().toISOString().slice(0,19).replace('T',' ')]);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(()=>{ console.log('Migrations complete'); }).catch(err => { console.error(err); process.exit(1); });
}
