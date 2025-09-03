import { Router, path } from './router.js';
import { Header } from './components/header.js';
import { Footer } from './components/footer.js';
import { setTheme } from './utils.js';
import { getState, setThemePreference } from './store.js';
import {  } from './api.js';
import { setAuthToken } from './api.js';

import { HomePage } from './pages/home.js';
import { CatalogPage } from './pages/catalog.js';
import { ProductPage } from './pages/product.js';
import { OrderPage } from './pages/order.js';
import { CartPage } from './pages/cart.js';
import { CheckoutPage } from './pages/checkout.js';
import { ProfilePage } from './pages/profile.js';
import { AdminPage } from './pages/admin.js';
import { AboutPage } from './pages/about.js';
import { NotFoundPage } from './pages/notFound.js';

const main = document.getElementById('main');
const head = document.getElementById('site-header');
const foot = document.getElementById('site-footer');

function mountHeader(){
  head.innerHTML = '';
  const hdr = Header({
    onSearch: (q)=>{ if(location.hash.startsWith('#/catalog')){ const url = new URL(location.href); url.hash = '#/catalog'; history.replaceState(null, '', url.toString()); document.dispatchEvent(new CustomEvent('catalog:search', { detail:q })); } },
    onToggleTheme: ()=>{
      const st = getState();
      const next = st.theme === 'dark' ? 'light' : st.theme === 'light' ? null : 'dark';
      setThemePreference(next); setTheme(next);
    }
  });
  head.appendChild(hdr);
}

let currentView = null;
async function render(elmPromise){
  if(currentView && typeof currentView.cleanup === 'function'){ try{ currentView.cleanup(); }catch{} }
  main.innerHTML = '<div class="notice">Loading…</div>';
  const node = await (typeof elmPromise === 'function' ? elmPromise() : elmPromise);
  main.innerHTML = '';
  main.appendChild(node);
  currentView = node;
  main.focus();
}

const router = new Router([
  path('#/', () => render(HomePage)),
  path('#/catalog', () => render(CatalogPage)),
  path('#/product/:id', ({ params }) => render(()=> ProductPage({ params }))),
  path('#/order/:id', ({ params }) => render(()=> OrderPage({ params }))),
  path('#/cart', () => render(CartPage)),
  path('#/checkout', () => render(CheckoutPage)),
  path('#/profile', () => render(ProfilePage)),
  path('#/admin', () => render(AdminPage)),
  path('#/about', () => render(AboutPage)),
  path('#/not-found', () => render(NotFoundPage)),
]);

function boot(){
  const st = getState();
  setTheme(st.theme || null);
  if(st.session?.token){ setAuthToken(st.session.token); }
  mountHeader();
  foot.innerHTML = '';
  foot.appendChild(Footer());
  router.resolve();
}

window.addEventListener('load', boot);
