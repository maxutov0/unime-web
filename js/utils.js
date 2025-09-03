export const ns = 'app:ecom';
export const keys = {
  cart: `${ns}:cart`,
  wishlist: `${ns}:wishlist`,
  session: `${ns}:session`,
  theme: `${ns}:theme`,
  contacts: `${ns}:contacts`,
  promo: `${ns}:promo`,
};

export function formatPrice(value, currency = 'EUR', locale = navigator.language || 'en-US'){
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value); }
  catch { return `${value.toFixed(2)} ${currency}`; }
}

export function sanitize(text = ''){
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

export function el(tag, attrs = {}, ...children){
  const node = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs || {})){
    if(v == null) continue;
    if(k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if(k === 'html') node.innerHTML = v;
    else if(k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for(const c of children.flat()){
    if(c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function debounce(fn, delay = 300){
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

export function uid(prefix='id'){
  return `${prefix}-${Math.random().toString(36).slice(2,8)}-${Date.now().toString(36).slice(-4)}`;
}

export function loadLS(key, fallback){
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
export function saveLS(key, value){
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function setTheme(theme){
  if(theme === 'light' || theme === 'dark'){
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function phoneMask(value){
  const digits = String(value || '').replace(/\D/g,'').slice(0, 12);
  let out = '';
  for(let i=0;i<digits.length;i++){
    out += digits[i];
    if(i===2||i===5||i===8) out += ' ';
  }
  return out.trim();
}

export function qs(sel, root=document){ return root.querySelector(sel); }
export function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

export function fragment(items){
  const frag = document.createDocumentFragment();
  items.forEach(i => frag.appendChild(i));
  return frag;
}

export function parseHash(){
  const hash = location.hash || '#/';
  const [path, queryStr] = hash.slice(1).split('?');
  const segments = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryStr || ''));
  return { path:`#/${segments.join('/')}`, segments, query };
}
