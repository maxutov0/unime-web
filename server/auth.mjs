import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, queryOne, run } from './db.mjs';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret-change-me';
const ADMIN_KEY = process.env.ADMIN_KEY || 'NOVA-ADMIN';

function signToken(user){
  return jwt.sign({ sub: user.id, email: user.email, isAdmin: !!user.is_admin }, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(requireAdmin = false){
  return (req, res, next) => {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/.exec(h);
    if(!m) return res.status(401).json({ error: 'Unauthorized' });
    try{
      const payload = jwt.verify(m[1], JWT_SECRET);
      req.user = payload;
      if(requireAdmin && !payload.isAdmin){ return res.status(403).json({ error: 'Forbidden' }); }
      next();
    }catch(e){ return res.status(401).json({ error: 'Invalid token' }); }
  };
}

export function optionalAuthMiddleware(){
  return (req, _res, next) => {
    const h = req.headers['authorization'] || '';
    const m = /^Bearer\s+(.+)$/.exec(h);
    if(m){
      try { req.user = jwt.verify(m[1], JWT_SECRET); } catch { /* ignore invalid */ }
    }
    next();
  };
}

router.post('/register', async (req, res) => {
  await getDb();
  const { name, email, password, adminKey } = req.body || {};
  if(!name || !email || !password){ return res.status(400).json({ error: 'name, email, password required' }); }
  const existing = await queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
  if(existing && existing.id){ return res.status(409).json({ error: 'Email already registered' }); }
  const hash = await bcrypt.hash(String(password), 10);
  const isAdmin = adminKey && String(adminKey) === ADMIN_KEY ? 1 : 0;
  const createdAt = new Date().toISOString();
  await run('INSERT INTO users(name, email, password_hash, is_admin, created_at) VALUES(?,?,?,?,?)', [name, email.trim().toLowerCase(), hash, isAdmin, createdAt]);
  const user = await queryOne('SELECT id, name, email, is_admin, created_at FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
  const token = signToken(user);
  res.status(201).json({ token, user: { id:user.id, name:user.name, email:user.email, isAdmin: !!user.is_admin, createdAt: user.created_at } });
});

router.post('/login', async (req, res) => {
  await getDb();
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await queryOne('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
  if(!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(String(password), user.password_hash);
  if(!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user: { id:user.id, name:user.name, email:user.email, isAdmin: !!user.is_admin, createdAt: user.created_at } });
});

router.get('/me', authMiddleware(false), async (req, res) => {
  await getDb();
  const user = await queryOne('SELECT id, name, email, is_admin, created_at FROM users WHERE id = ? LIMIT 1', [req.user.sub]);
  if(!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id:user.id, name:user.name, email:user.email, isAdmin: !!user.is_admin, createdAt: user.created_at } });
});

// Update current user's profile (name/email, and optionally change password)
router.put('/me', authMiddleware(false), async (req, res) => {
  await getDb();
  const userId = req.user.sub;
  const { name, email, password, newPassword } = req.body || {};
  const updates = [];
  const args = [];

  // If changing email, ensure it is not used by another user
  if(email){
    const existing = await queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [String(email).trim().toLowerCase()]);
    if(existing && existing.id && Number(existing.id) !== Number(userId)){
      return res.status(409).json({ error: 'Email already in use' });
    }
    updates.push('email = ?'); args.push(String(email).trim().toLowerCase());
  }
  if(name){ updates.push('name = ?'); args.push(String(name)); }

  // Password change: require current password and newPassword
  if(newPassword){
    if(!password) return res.status(400).json({ error: 'Current password required' });
    const cur = await queryOne('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
    if(!cur) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(String(password), cur.password_hash);
    if(!ok) return res.status(401).json({ error: 'Invalid current password' });
    const hash = await bcrypt.hash(String(newPassword), 10);
    updates.push('password_hash = ?'); args.push(hash);
  }

  if(updates.length === 0){
    // Nothing to update
    const out = await queryOne('SELECT id, name, email, is_admin, created_at FROM users WHERE id = ? LIMIT 1', [userId]);
    const token = signToken(out);
    return res.json({ token, user: { id: out.id, name: out.name, email: out.email, isAdmin: !!out.is_admin, createdAt: out.created_at } });
  }

  args.push(userId);
  await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args);
  const out = await queryOne('SELECT id, name, email, is_admin, created_at FROM users WHERE id = ? LIMIT 1', [userId]);
  const token = signToken(out);
  res.json({ token, user: { id: out.id, name: out.name, email: out.email, isAdmin: !!out.is_admin, createdAt: out.created_at } });
});

export default router;
