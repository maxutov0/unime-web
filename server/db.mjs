import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || 'mysql';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_NAME = process.env.DB_NAME || 'novaiot';

let pool;

export async function getDb(){
  if(!pool){
    pool = mysql.createPool({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, connectionLimit: 10 });
  }
  // simple test
  await pool.query('SELECT 1');
  return pool;
}

export async function queryOne(sql, params = []){
  const [rows] = await (await getDb()).query(sql, params);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export async function queryAll(sql, params = []){
  const [rows] = await (await getDb()).query(sql, params);
  return rows;
}

export async function run(sql, params = []){
  await (await getDb()).execute(sql, params);
}

export async function runMany(sql, items = []){
  const conn = await getDb();
  for(const params of items){ await conn.execute(sql, params); }
}

export async function closeDb(){
  if(pool){
    try { await pool.end(); } catch(e) { /* ignore */ }
    pool = null;
  }
}
