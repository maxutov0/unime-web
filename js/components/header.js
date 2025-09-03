import { getState, subscribe } from '../store.js';
import { el } from '../utils.js';

function cartCount(state){ return state.cart.reduce((s,i)=>s+i.qty,0); }

export function Header({ onSearch, onToggleTheme }){
  const state = getState();

  const brand = el('a', { href:'#/', class:'brand', 'aria-label':'Home' },
    el('img',{src:'/assets/icons/logo.svg', alt:'logo', class:'brand__logo'}),
    el('span', { text:'NovaIoT' })
  );

  const searchInput = el('input', { type:'search', placeholder:'Search products…', 'aria-label':'Search' });
  if(typeof onSearch === 'function') searchInput.addEventListener('input', (e)=> onSearch(e.target.value));

  const themeBtn = el('button', { class:'btn btn--ghost', 'aria-label':'Toggle theme' }, '🌓');
  if(onToggleTheme) themeBtn.addEventListener('click', onToggleTheme);

  const cartLink = el('a', { href:'#/cart', class:'btn btn--ghost', 'aria-label':'Cart' }, '🛒', el('span', { class:'badge', text:String(cartCount(state)) }));
  const badge = el('span', { class:'badge', style:'display:none', text:'ADMIN' });
  const profileLink = el('a', { href:'#/profile', class:'btn btn--ghost', 'aria-label':'Profile' }, '👤', badge);

  const nav = el('nav', { class:'nav', role:'navigation' });
  const linkCatalog = el('a', { href:'#/catalog' , text:'Catalog' });
  const linkAbout = el('a', { href:'#/about', text:'About' });
  const linkAdmin = el('a', { href:'#/admin', text:'Admin', style:'display:none' });
  nav.append(linkCatalog, linkAbout, linkAdmin, cartLink, profileLink, themeBtn);

  const header = el('div', { class:'header container' },
    el('div', { class:'header__inner' },
      brand,
      el('div', { class:'grow' }),
      el('label', { class:'search' }, '🔎', searchInput),
      nav,
    )
  );

  function applyAdminVisibility(st){
    const isAdmin = !!st.session?.user?.isAdmin; linkAdmin.style.display = isAdmin ? '' : 'none'; badge.style.display = isAdmin ? '' : 'none';
  }
  applyAdminVisibility(state);

  const unsub = subscribe((st)=>{
    cartLink.querySelector('.badge').textContent = String(cartCount(st));
    applyAdminVisibility(st);
  });
  header.cleanup = unsub;
  return header;
}
