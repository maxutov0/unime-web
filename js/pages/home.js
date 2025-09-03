import { el, fragment } from '../utils.js';
import { getProducts } from '../api.js';
import { ProductCard } from '../components/productCard.js';

export async function HomePage(){
  const wrap = el('div', { class:'section' });
  wrap.append(
    el('section', { class:'hero section' },
      el('div', { class:'hero__panel' },
        el('h1', { class:'hero__title', text:'NovaIoT — Smart Home & Devices' }),
        el('p', { text:'Discover NovaIoT — curated smart home devices, sensors, and hubs to automate and secure your space.' }),
        el('div', { class:'hero__cta' }, el('a', { href:'#/catalog', class:'btn btn--primary', text:'Shop now →' }))
      ),
      el('div', {},
        el('div', { class:'hero__media' },
          el('img', { src:'https://plus.unsplash.com/premium_photo-1688686804638-fadb460edc4a?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt:'Smart home devices', loading:'lazy', referrerpolicy:'no-referrer', onerror: (e)=>{ const t=e.currentTarget; const ph='/assets/images/placeholder-400x300.svg'; if(t && !t.src.includes(ph)){ t.onerror=null; t.src=ph; } } })
        )
      )
    ),
    el('h2', { class:'section__title', text:'Popular now' }),
  );

  const { items } = await getProducts({ sort:'rating-desc', page:1, pageSize:8 });
  const cards = items.map(ProductCard);
  const grid = el('div', { class:'grid products-grid' });
  cards.forEach(c => { c.classList.add('col-3'); grid.appendChild(c); });
  wrap.appendChild(grid);
  return wrap;
}
