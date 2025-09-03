import bcrypt from 'bcryptjs';
import { getDb, queryOne, run } from '../db.mjs';

async function main(){
  const email = process.env.EMAIL || process.argv[2] || 'admin@example.com';
  const password = process.env.PASSWORD || process.argv[3] || 'admin123';
  const name = process.env.NAME || process.argv[4] || 'Admin';
  await getDb();
  const exists = await queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if(exists){ console.log('User already exists:', email); return; }
  const hash = await bcrypt.hash(String(password), 10);
  await run('INSERT INTO users(name, email, password_hash, is_admin, created_at) VALUES(?,?,?,?,?)', [name, email, hash, 1, new Date().toISOString().slice(0,19).replace('T',' ')]);
  console.log('Created admin user:', email);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => { console.error(err); process.exit(1); });
}

