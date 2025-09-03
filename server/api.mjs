import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, queryAll, queryOne, run, runMany } from './db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
// Serve static files (SPA)
app.use(express.static(rootDir));

// Seed safeguard (no-op, seeding handled by seed script)
async function ensureSeed() {
  await getDb();
  // Seeding is performed by server/seed.mjs; nothing to do here.
  return;
}

// Auth routes (SQLite)
import authRouter, { authMiddleware, optionalAuthMiddleware } from './auth.mjs';
import { runMigrations } from './migrate.mjs';
app.use('/api/auth', authRouter);

// Helpers
function rowToProduct(r){
  return {
    id: r.id,
    title: r.title,
    description: r.description || '',
    price: Number(r.price) || 0,
    currency: r.currency || 'EUR',
    category: r.category || null,
    stock: Number(r.stock || 0),
    thumbnail: r.thumbnail || '',
    images: JSON.parse(r.images_json || '[]'),
    tags: JSON.parse(r.tags_json || '[]'),
    rating: { avg: Number(r.rating_avg || 0), count: Number(r.rating_count || 0) },
    createdAt: r.created_at,
  };
}

// Health
app.get('/api/health', async (req, res) => {
  await getDb();
  res.json({ ok: true, uptime: process.uptime() });
});

// Products
app.get('/api/products', async (req, res) => {
  await ensureSeed();
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const rating = Number(req.query.rating || 0);
  const sort = String(req.query.sort || 'newest');
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize || 12)));

  const where = [];
  const args = [];
  if(q){ where.push('(p.title LIKE ? OR p.description LIKE ?)'); args.push(`%${q}%`, `%${q}%`); }
  if(category){ where.push('p.category = ?'); args.push(category); }
  const ratingCond = rating ? ' AND COALESCE(r.avg,0) >= ?' : '';
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  let orderBy = 'created_at DESC';
  if(sort === 'price-asc') orderBy = 'price ASC';
  else if(sort === 'price-desc') orderBy = 'price DESC';
  else if(sort === 'rating-desc') orderBy = 'rating_avg DESC';

  const [{ c: total } = { c: 0 }] = await queryAll(
    `SELECT COUNT(1) as c
     FROM products p
     LEFT JOIN (
       SELECT product_id, AVG(rating) as avg, COUNT(1) as cnt
       FROM reviews GROUP BY product_id
     ) r ON r.product_id = p.id
     ${whereSql}${rating ? ratingCond : ''}`,
    rating ? [...args, rating] : args
  );
  const offset = (page-1)*pageSize;
  const rows = await queryAll(
    `SELECT p.*, COALESCE(r.avg, 0) as rating_avg, COALESCE(r.cnt, 0) as rating_count
     FROM products p
     LEFT JOIN (
       SELECT product_id, AVG(rating) as avg, COUNT(1) as cnt
       FROM reviews GROUP BY product_id
     ) r ON r.product_id = p.id
     ${whereSql}${rating ? ratingCond : ''}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    rating ? [...args, rating, pageSize, offset] : [...args, pageSize, offset]
  );
  res.json({ items: rows.map(rowToProduct), total: Number(total) });
});

app.get('/api/products/:id', async (req, res) => {
  await ensureSeed();
  const { id } = req.params;
  const r = await queryOne(
    `SELECT p.*, COALESCE(r.avg, 0) as rating_avg, COALESCE(r.cnt, 0) as rating_count
     FROM products p
     LEFT JOIN (
       SELECT product_id, AVG(rating) as avg, COUNT(1) as cnt
       FROM reviews GROUP BY product_id
     ) r ON r.product_id = p.id
     WHERE p.id = ? LIMIT 1`,
    [String(id)]
  );
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(rowToProduct(r));
});

app.post('/api/products', authMiddleware(true), async (req, res) => {
  await getDb();
  const data = req.body || {};
  if (!data.id || !data.title || typeof data.price !== 'number') {
    return res.status(400).json({ error: 'id, title, price required' });
  }
  const exists = await queryOne('SELECT id FROM products WHERE id = ? LIMIT 1', [String(data.id)]);
  if (exists) return res.status(409).json({ error: 'Duplicate id' });
  const now = new Date().toISOString();
  await run(
    `INSERT INTO products(id,title,description,price,currency,category,stock,thumbnail,images_json,tags_json,rating_avg,rating_count,created_at)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      String(data.id), data.title, data.description || '', Number(data.price)||0,
      data.currency || 'EUR', data.category || 'misc', Number(data.stock||0), data.thumbnail || '',
      JSON.stringify(data.images || []), JSON.stringify(data.tags || []), 0, 0, now
    ]
  );
  const r = await queryOne('SELECT * FROM products WHERE id = ?', [String(data.id)]);
  res.status(201).json(rowToProduct(r));
});

app.put('/api/products/:id', authMiddleware(true), async (req, res) => {
  await getDb();
  const { id } = req.params;
  const r = await queryOne('SELECT * FROM products WHERE id = ? LIMIT 1', [String(id)]);
  if (!r) return res.status(404).json({ error: 'Not found' });
  const cur = rowToProduct(r);
  const next = { ...cur, ...req.body };
  await run(
    `UPDATE products SET title=?, description=?, price=?, currency=?, category=?, stock=?, thumbnail=?, images_json=?, tags_json=? WHERE id=?`,
    [ next.title, next.description || '', Number(next.price)||0, next.currency || 'EUR', next.category || null, Number(next.stock||0), next.thumbnail || '', JSON.stringify(next.images||[]), JSON.stringify(next.tags||[]), String(id) ]
  );
  const r2 = await queryOne('SELECT * FROM products WHERE id = ? LIMIT 1', [String(id)]);
  res.json(rowToProduct(r2));
});

app.delete('/api/products/:id', authMiddleware(true), async (req, res) => {
  await getDb();
  const { id } = req.params;
  const r = await queryOne('SELECT id FROM products WHERE id = ? LIMIT 1', [String(id)]);
  if (!r) return res.status(404).json({ error: 'Not found' });
  await run('DELETE FROM products WHERE id = ?', [String(id)]);
  await run('DELETE FROM reviews WHERE product_id = ?', [String(id)]);
  res.json({ ok: true });
});

// Import/Export for admin
app.get('/api/products-export', authMiddleware(true), async (req, res) => {
  await getDb();
  const rows = await queryAll(`
    SELECT p.*, COALESCE(r.avg, 0) as rating_avg, COALESCE(r.cnt, 0) as rating_count
    FROM products p
    LEFT JOIN (
      SELECT product_id, AVG(rating) as avg, COUNT(1) as cnt
      FROM reviews GROUP BY product_id
    ) r ON r.product_id = p.id
  `);
  res.json({ products: rows.map(rowToProduct) });
});

app.post('/api/products-import', authMiddleware(true), async (req, res) => {
  await getDb();
  const data = req.body || {};
  if (!Array.isArray(data.products)) {
    return res.status(400).json({ error: 'Expected { products: [] }' });
  }
  for (const p of data.products) {
    if (!p || p.id == null) continue;
    const id = String(p.id);
    const r = await queryOne('SELECT id FROM products WHERE id = ? LIMIT 1', [id]);
    if (r) {
      await run(
        `UPDATE products SET title=?, description=?, price=?, currency=?, category=?, stock=?, thumbnail=?, images_json=?, tags_json=? WHERE id=?`,
        [p.title||'', p.description||'', Number(p.price)||0, p.currency||'EUR', p.category||null, Number(p.stock||0), p.thumbnail||'', JSON.stringify(p.images||[]), JSON.stringify(p.tags||[]), id]
      );
    } else {
      await run(
        `INSERT INTO products(id,title,description,price,currency,category,stock,thumbnail,images_json,tags_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, p.title||'', p.description||'', Number(p.price)||0, p.currency||'EUR', p.category||null, Number(p.stock||0), p.thumbnail||'', JSON.stringify(p.images||[]), JSON.stringify(p.tags||[]), p.createdAt || new Date().toISOString()]
      );
    }
  }
  const cnt = (await queryOne('SELECT COUNT(1) as c FROM products'))?.c || 0;
  res.json({ ok: true, count: Number(cnt) });
});

// Categories
app.get('/api/categories', async (req, res) => {
  await getDb();
  const prodCats = (await queryAll('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category <> ""')).map(r => r.category);
  const custom = (await queryAll('SELECT name FROM custom_categories ORDER BY name')).map(r => r.name);
  const set = new Set([...(prodCats||[]), ...(custom||[])]);
  res.json({ categories: Array.from(set).sort() });
});

app.get('/api/custom-categories', async (req, res) => {
  await getDb();
  const rows = await queryAll('SELECT name FROM custom_categories ORDER BY name');
  res.json({ categories: rows.map(r => r.name) });
});
app.post('/api/custom-categories', authMiddleware(true), async (req, res) => {
  await getDb();
  const { name } = req.body || {};
  if(!name) return res.status(400).json({ error:'name required' });
  try{
    await run('INSERT IGNORE INTO custom_categories(name) VALUES(?)', [String(name)]);
    res.status(201).json({ ok:true });
  }catch(e){ res.status(400).json({ error:'failed' }); }
});
app.delete('/api/custom-categories/:name', authMiddleware(true), async (req, res) => {
  await getDb();
  const name = req.params.name;
  await run('DELETE FROM custom_categories WHERE name = ?', [String(name)]);
  res.json({ ok:true });
});

// Reviews
app.get('/api/products/:id/reviews', async (req, res) => {
  await getDb();
  const { id } = req.params;
  const rows = await queryAll('SELECT author, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC', [String(id)]);
  res.json({ reviews: rows.map(r => ({ author:r.author, rating:Number(r.rating), comment:r.comment, createdAt:r.created_at })) });
});

app.post('/api/products/:id/reviews', async (req, res) => {
  await getDb();
  const { id } = req.params;
  const body = req.body || {};
  const prod = await queryOne('SELECT id FROM products WHERE id = ? LIMIT 1', [String(id)]);
  if (!prod) return res.status(404).json({ error: 'Product not found' });
  const createdAt = new Date().toISOString();
  const author = String(body.author || 'anonymous');
  const rating = Math.max(1, Math.min(5, Number(body.rating) || 0));
  const comment = String(body.comment || '');
  await run('INSERT INTO reviews(product_id, author, rating, comment, created_at) VALUES(?,?,?,?,?)', [String(id), author, rating, comment, createdAt]);
  res.status(201).json({ author, rating, comment, createdAt });
});

// Orders
app.get('/api/orders', authMiddleware(true), async (req, res) => {
  await getDb();
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
  const [{ c: total } = { c:0 }] = await queryAll('SELECT COUNT(1) as c FROM orders');
  const offset = (page-1)*pageSize;
  const rows = await queryAll('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?', [pageSize, offset]);
  const out = [];
  for (const r of rows){
    const items = await queryAll('SELECT product_id as id, qty, price_snapshot FROM order_items WHERE order_id = ?', [r.id]);
    out.push({
      id: r.id,
      createdAt: r.created_at,
      customer: { name:r.customer_name, email:r.customer_email, phone:r.customer_phone, address:r.customer_address },
      payment: { method:r.payment_method, last4:r.payment_last4 },
      items: items.map(i => ({ id:i.id, qty:Number(i.qty), priceSnapshot:Number(i.price_snapshot) })),
      status: r.status || 'placed',
    });
  }
  res.json({ orders: out, total: Number(total) });
});

app.get('/api/my-orders', authMiddleware(false), async (req, res) => {
  await getDb();
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
  const [{ c: total } = { c:0 }] = await queryAll('SELECT COUNT(1) as c FROM orders WHERE user_id = ?', [req.user.sub]);
  const offset = (page-1)*pageSize;
  const rows = await queryAll('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.sub, pageSize, offset]);
  const out = [];
  for (const r of rows){
    const items = await queryAll('SELECT product_id as id, qty, price_snapshot FROM order_items WHERE order_id = ?', [r.id]);
    out.push({
      id: r.id,
      createdAt: r.created_at,
      customer: { name:r.customer_name, email:r.customer_email, phone:r.customer_phone, address:r.customer_address },
      payment: { method:r.payment_method, last4:r.payment_last4 },
      items: items.map(i => ({ id:i.id, qty:Number(i.qty), priceSnapshot:Number(i.price_snapshot) })),
      status: r.status || 'placed',
    });
  }
  res.json({ orders: out, total: Number(total) });
});

app.post('/api/orders', optionalAuthMiddleware(), async (req, res) => {
  await getDb();
  const order = req.body || {};
  const id = String(order.id || `ord_${Math.random().toString(36).slice(2, 8)}`);
  const createdAt = order.createdAt || new Date().toISOString();
  const customer = order.customer || {};
  const payment = order.payment || {};
  const items = Array.isArray(order.items) ? order.items : [];
  await run(
    `INSERT INTO orders(id, created_at, user_id, customer_name, customer_email, customer_phone, customer_address, payment_method, payment_last4, status)
     VALUES(?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       created_at=VALUES(created_at),
       user_id=VALUES(user_id),
       customer_name=VALUES(customer_name),
       customer_email=VALUES(customer_email),
       customer_phone=VALUES(customer_phone),
       customer_address=VALUES(customer_address),
       payment_method=VALUES(payment_method),
       payment_last4=VALUES(payment_last4),
       status=VALUES(status)`,
    [id, createdAt, req.user?.sub || null, customer.name||'', customer.email||'', customer.phone||'', customer.address||'', payment.method||'', payment.last4||'', order.status||'placed']
  );
  await run('DELETE FROM order_items WHERE order_id = ?', [id]);
  await runMany('INSERT INTO order_items(order_id, product_id, qty, price_snapshot) VALUES(?,?,?,?)', items.map(i => [id, String(i.id), Number(i.qty)||1, Number(i.priceSnapshot)||0]));
  res.status(201).json({ ...order, id, createdAt });
});

// Migration endpoint to import client-side stored data once
app.post('/api/migrate', async (req, res) => {
  await getDb();
  const body = req.body || {};
  const overrides = body.overrides || {}; // id -> product partial
  const deletions = Array.isArray(body.deletions) ? body.deletions : [];
  const orders = Array.isArray(body.orders) ? body.orders : [];
  const reviews = body.reviews || {}; // productId -> [reviews]
  const categories = Array.isArray(body.categories) ? body.categories : [];

  // Apply product deletions
  for(const id of deletions){ run('DELETE FROM products WHERE id = ?', [String(id)]); }
  // Apply product overrides
  for(const [id, p] of Object.entries(overrides)){
    const r = queryOne('SELECT id FROM products WHERE id=? LIMIT 1', [String(id)]);
    const cur = r ? queryOne('SELECT * FROM products WHERE id=?', [String(id)]) : null;
    const next = { ...(cur?rowToProduct(cur):{ id }), ...p };
    const exists = !!cur;
    if(exists){
      run(`UPDATE products SET title=?, description=?, price=?, currency=?, category=?, stock=?, thumbnail=?, images_json=?, tags_json=? WHERE id=?`,
        [ next.title||'', next.description||'', Number(next.price)||0, next.currency||'EUR', next.category||null, Number(next.stock||0), next.thumbnail||'', JSON.stringify(next.images||[]), JSON.stringify(next.tags||[]), String(id) ]);
    } else {
      run(`INSERT INTO products(id,title,description,price,currency,category,stock,thumbnail,images_json,tags_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        [ String(id), next.title||'', next.description||'', Number(next.price)||0, next.currency||'EUR', next.category||null, Number(next.stock||0), next.thumbnail||'', JSON.stringify(next.images||[]), JSON.stringify(next.tags||[]), next.createdAt || new Date().toISOString() ]);
    }
  }
  // Import orders
  for(const o of orders){
    const id = String(o.id || `ord_${Math.random().toString(36).slice(2,8)}`);
    run(
      `INSERT INTO orders(id, created_at, customer_name, customer_email, customer_phone, customer_address, payment_method, payment_last4, status)
       VALUES(?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         created_at=VALUES(created_at),
         customer_name=VALUES(customer_name),
         customer_email=VALUES(customer_email),
         customer_phone=VALUES(customer_phone),
         customer_address=VALUES(customer_address),
         payment_method=VALUES(payment_method),
         payment_last4=VALUES(payment_last4),
         status=VALUES(status)`,
      [ id, o.createdAt || new Date().toISOString(), o.customer?.name||'', o.customer?.email||'', o.customer?.phone||'', o.customer?.address||'', o.payment?.method||'', o.payment?.last4||'', o.status||'placed' ]
    );
    const items = Array.isArray(o.items) ? o.items : [];
    run('DELETE FROM order_items WHERE order_id = ?', [id]);
    runMany('INSERT INTO order_items(order_id, product_id, qty, price_snapshot) VALUES(?,?,?,?)', items.map(i => [id, String(i.id), Number(i.qty)||1, Number(i.priceSnapshot)||0]));
  }
  // Import reviews
  for(const [pid, list] of Object.entries(reviews)){
    for(const r of (list||[])){
      run('INSERT INTO reviews(product_id, author, rating, comment, created_at) VALUES(?,?,?,?,?)', [String(pid), r.name || r.author || 'anonymous', Number(r.rating)||0, r.comment || '', r.createdAt || new Date().toISOString()]);
    }
    // ratings are computed on read; no need to update products table
  }
  // Import custom categories
  for(const c of categories){ run('INSERT IGNORE INTO custom_categories(name) VALUES(?)', [String(c)]); }

  res.json({ ok:true });
});

app.listen(PORT, async () => {
  await runMigrations();
  await ensureSeed();
  console.log(`API listening on http://localhost:${PORT}`);
});
