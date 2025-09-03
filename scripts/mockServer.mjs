import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 4000);

// Minimal sample catalog to drive UI
const products = [
  {
    id: 'hub-100',
    title: 'Nova Hub X1',
    description: 'Central hub for your NovaIoT smart home.',
    price: 129.99,
    currency: 'EUR',
    category: 'hubs',
    stock: 24,
    thumbnail: '/assets/images/placeholder-400x300.svg',
    images: ['/assets/images/placeholder-400x300.svg'],
    tags: ['zigbee', 'wifi'],
    rating: { avg: 4.6, count: 241 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sensor-200',
    title: 'Door/Window Sensor',
    description: 'Slim contact sensor for doors and windows.',
    price: 19.99,
    currency: 'EUR',
    category: 'sensors',
    stock: 140,
    thumbnail: '/assets/images/placeholder-400x300.svg',
    images: ['/assets/images/placeholder-400x300.svg'],
    tags: ['security'],
    rating: { avg: 4.2, count: 81 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sensor-201',
    title: 'Motion Sensor',
    description: 'Wide-angle PIR motion detection for rooms and hallways.',
    price: 24.99,
    currency: 'EUR',
    category: 'sensors',
    stock: 96,
    thumbnail: '/assets/images/placeholder-400x300.svg',
    images: ['/assets/images/placeholder-400x300.svg'],
    tags: ['security'],
    rating: { avg: 4.3, count: 66 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'camera-310',
    title: 'Indoor Camera 1080p',
    description: 'Crystal-clear indoor camera with night vision.',
    price: 49.99,
    currency: 'EUR',
    category: 'cameras',
    stock: 52,
    thumbnail: '/assets/images/placeholder-400x300.svg',
    images: ['/assets/images/placeholder-400x300.svg'],
    tags: ['security', 'night-vision'],
    rating: { avg: 4.1, count: 110 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'plug-410',
    title: 'Smart Plug Mini',
    description: 'Compact Wi‑Fi smart plug for appliances.',
    price: 14.99,
    currency: 'EUR',
    category: 'power',
    stock: 300,
    thumbnail: '/assets/images/placeholder-400x300.svg',
    images: ['/assets/images/placeholder-400x300.svg'],
    tags: ['energy'],
    rating: { avg: 4.0, count: 203 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bulb-500',
    title: 'Color Bulb E27',
    description: 'Millions of colors with voice control.',
    price: 12.99,
    currency: 'EUR',
    category: 'lighting',
    stock: 500,
    thumbnail: '/assets/images/placeholder-400x300.svg',
    images: ['/assets/images/placeholder-400x300.svg'],
    tags: ['rgb', 'dimmable'],
    rating: { avg: 4.4, count: 512 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'thermo-610',
    title: 'Smart Thermostat',
    description: 'Room thermostat with schedules and presence detection.',
    price: 89.0,
    currency: 'EUR',
    category: 'climate',
    stock: 44,
    thumbnail: '/assets/images/placeholder-400x300.svg',
    images: ['/assets/images/placeholder-400x300.svg'],
    tags: ['hvac'],
    rating: { avg: 4.5, count: 171 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lock-720',
    title: 'Smart Lock Pro',
    description: 'Keyless entry with auto‑unlock and logs.',
    price: 179.0,
    currency: 'EUR',
    category: 'security',
    stock: 18,
    thumbnail: '/assets/images/placeholder-400x300.svg',
    images: ['/assets/images/placeholder-400x300.svg'],
    tags: ['bluetooth', 'wifi'],
    rating: { avg: 4.2, count: 59 },
    createdAt: new Date().toISOString(),
  },
];

const app = express();
app.use(express.json());

// Serve SPA assets from project root
app.use(express.static(rootDir));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Products
app.get('/api/products', (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize || 12)));
  const offset = (page - 1) * pageSize;
  const items = products.slice(offset, offset + pageSize);
  res.json({ items, total: products.length });
});

app.get('/api/products/:id', (req, res) => {
  const p = products.find(x => String(x.id) === String(req.params.id));
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// Categories
app.get('/api/categories', (req, res) => {
  const set = new Set(products.map(p => p.category).filter(Boolean));
  res.json({ categories: Array.from(set).sort() });
});

// Reviews
app.get('/api/products/:id/reviews', (req, res) => {
  res.json({ reviews: [] });
});

// Custom categories
app.get('/api/custom-categories', (req, res) => {
  res.json({ categories: [] });
});

// Orders (minimal)
const orders = [];
app.get('/api/orders', (req, res) => {
  // admin list
  res.json({ orders, total: orders.length });
});
app.post('/api/orders', (req, res) => {
  const order = req.body || {};
  const id = String(order.id || `ord_${Math.random().toString(36).slice(2,8)}`);
  const createdAt = order.createdAt || new Date().toISOString();
  const normalized = { ...order, id, createdAt };
  const idx = orders.findIndex(o => o.id === id);
  if(idx >= 0) orders[idx] = normalized; else orders.push(normalized);
  res.status(201).json(normalized);
});

app.listen(PORT, () => {
  console.log(`Mock server running at http://localhost:${PORT}`);
});
