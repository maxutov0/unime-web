// No utils imports needed here

// Default to same-origin; can override via window.__API_BASE__
const API_URL = (typeof window !== 'undefined' && window.__API_BASE__ != null) ? window.__API_BASE__ : '';
let authToken = null;
let cache = { products: null };

export async function loadProducts(){
  if(cache.products) return cache.products;
  const res = await fetch(`${API_URL}/api/products?page=1&pageSize=1000&sort=newest`);
  if(!res.ok) throw new Error('Failed to load products');
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  cache.products = items;
  return items;
}

export async function getProducts({ search='', filters={}, sort='relevance', page=1, pageSize=12 }={}){
  const qs = new URLSearchParams();
  if(search) qs.set('q', search);
  if(filters.category) qs.set('category', filters.category);
  if(filters.rating) qs.set('rating', String(filters.rating));
  if(sort) qs.set('sort', sort);
  qs.set('page', String(page));
  qs.set('pageSize', String(pageSize));
  const res = await fetch(`${API_URL}/api/products?${qs.toString()}`);
  if(!res.ok) throw new Error('Failed to load products');
  return await res.json();
}

export async function getProductById(id){
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}`);
  if(res.status === 404) return null;
  if(!res.ok) throw new Error('Failed to load product');
  return await res.json();
}

export async function createProduct(data){
  const res = await fetch(`${API_URL}/api/products`, { method:'POST', headers:{ ...authHeader(), 'Content-Type':'application/json' }, body: JSON.stringify(data) });
  if(!res.ok) throw new Error('Failed to create product');
  cache.products = null; // bust cache so next load reflects changes
  return await res.json();
}

export async function updateProduct(id, data){
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, { method:'PUT', headers:{ ...authHeader(), 'Content-Type':'application/json' }, body: JSON.stringify(data) });
  if(!res.ok) throw new Error('Failed to update product');
  cache.products = null; return await res.json();
}

export async function deleteProduct(id){
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(id)}`, { method:'DELETE', headers: authHeader() });
  if(!res.ok) throw new Error('Failed to delete product');
  cache.products = null; return true;
}

export function listCategories(products){
  const s = new Set(products.map(p => p.category));
  return Array.from(s).sort();
}

export async function getOrders({ page=1, pageSize=20 }={}){
  const res = await fetch(`${API_URL}/api/my-orders?page=${page}&pageSize=${pageSize}`, { headers: authHeader() });
  if(!res.ok) throw new Error('Failed to load orders');
  const data = await res.json();
  return { items: Array.isArray(data.orders) ? data.orders : [], total: data.total || 0 };
}
export async function getAllOrders({ page=1, pageSize=20 }={}){
  const res = await fetch(`${API_URL}/api/orders?page=${page}&pageSize=${pageSize}`, { headers: authHeader() });
  if(!res.ok) throw new Error('Failed to load all orders');
  const data = await res.json();
  return { items: Array.isArray(data.orders) ? data.orders : [], total: data.total || 0 };
}
export async function saveOrder(order){
  const res = await fetch(`${API_URL}/api/orders`, { method:'POST', headers:{ ...authHeader(), 'Content-Type':'application/json' }, body: JSON.stringify(order) });
  if(!res.ok) throw new Error('Failed to save order');
  return await res.json();
}

// Reviews API (localStorage only)
export async function getReviews(productId){
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(productId)}/reviews`);
  if(!res.ok) throw new Error('Failed to load reviews');
  const data = await res.json();
  return Array.isArray(data.reviews) ? data.reviews : [];
}
export async function addReview(productId, review){
  const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(productId)}/reviews`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(review) });
  if(!res.ok) throw new Error('Failed to add review');
  const newReview = await res.json();
  return await getReviews(productId);
}

// Admin import/export helpers
export async function exportProducts(){
  const res = await fetch(`${API_URL}/api/products-export`, { headers: authHeader() });
  if(!res.ok) throw new Error('Failed to export');
  return await res.json();
}
export async function importProducts(data){
  if(!data || !Array.isArray(data.products)) throw new Error('Invalid data');
  const res = await fetch(`${API_URL}/api/products-import`, { method:'POST', headers:{ ...authHeader(), 'Content-Type':'application/json' }, body: JSON.stringify(data) });
  if(!res.ok) throw new Error('Failed to import');
  cache.products = null; return true;
}

// Auth helpers
export function setAuthToken(token){ authToken = token || null; }
function authHeader(){ return authToken ? { Authorization: `Bearer ${authToken}` } : {}; }
export async function registerUser({ name, email, password }){
  const res = await fetch(`${API_URL}/api/auth/register`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ name, email, password }) });
  if(!res.ok) throw new Error('Registration failed');
  return await res.json();
}
export async function loginUser({ email, password }){
  const res = await fetch(`${API_URL}/api/auth/login`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) });
  if(!res.ok) throw new Error('Login failed');
  return await res.json();
}

export async function updateProfile(data){
  const res = await fetch(`${API_URL}/api/auth/me`, { method:'PUT', headers:{ ...authHeader(), 'Content-Type':'application/json' }, body: JSON.stringify(data||{}) });
  if(!res.ok) throw new Error((await res.json().catch(()=>({})))?.error || 'Update failed');
  return await res.json();
}

// Server-backed categories
export async function getServerCustomCategories(){
  const res = await fetch(`${API_URL}/api/custom-categories`);
  if(!res.ok) throw new Error('Failed to load custom categories');
  const data = await res.json();
  return Array.isArray(data.categories) ? data.categories : [];
}
export async function getCategories(){
  const res = await fetch(`${API_URL}/api/categories`);
  if(!res.ok) throw new Error('Failed to load categories');
  const data = await res.json();
  return Array.isArray(data.categories) ? data.categories : [];
}
export async function addServerCustomCategory(name){
  const res = await fetch(`${API_URL}/api/custom-categories`, { method:'POST', headers:{ ...authHeader(), 'Content-Type':'application/json' }, body: JSON.stringify({ name }) });
  if(!res.ok) throw new Error('Failed to add category');
  return true;
}
export async function removeServerCustomCategory(name){
  const res = await fetch(`${API_URL}/api/custom-categories/${encodeURIComponent(name)}`, { method:'DELETE', headers: authHeader() });
  if(!res.ok) throw new Error('Failed to remove category');
  return true;
}

// Client → Server migration helper
export async function migrateClientData(payload){
  const res = await fetch(`${API_URL}/api/migrate`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload||{}) });
  if(!res.ok) throw new Error('Migration failed');
  return await res.json();
}
