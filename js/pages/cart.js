import { el, loadLS, saveLS, keys } from '../utils.js';
import { getProductById } from '../api.js';
import { getState, updateCartQty, removeFromCart, clearCart } from '../store.js';
import { toast } from '../components/toast.js';

function calcTotals(items, promo){
  const subtotal = items.reduce((s, it)=> s + (it.price * it.qty), 0);
  const tax = subtotal * 0.2;
  let shipping = items.length ? 7.5 : 0;
  let discount = 0;
  if(promo === 'SAVE10') discount = subtotal * 0.10;
  if(promo === 'WELCOME5' && subtotal >= 30) discount = Math.max(discount, 5);
  if(promo === 'FREESHIP') shipping = 0;
  const total = Math.max(0, subtotal - discount) + tax + shipping;
  return { subtotal, tax, shipping, discount, total };
}

export async function CartPage(){
  const state = getState();
  const wrap = el('div', { class:'section' });
  const grid = el('div', { class:'grid cart-grid' });
  const list = el('div', { class:'cart-items' });
  let promo = loadLS(keys.promo, null);

  const refresh = () => { window.dispatchEvent(new Event('hashchange')); };

  if(state.cart.length === 0){
    return el('div', { class:'empty', html:'Your cart is empty. <a href="#/catalog">Go shopping →</a>' });
  }

  const detailed = await Promise.all(state.cart.map(async (ci)=>{
    const p = await getProductById(ci.id);
    return { ...ci, title: p?.title || 'Unknown', price: p?.price || ci.priceSnapshot || 0, thumb:p?.thumbnail };
  }));

  for(const it of detailed){
    const qty = el('input', { class:'input', type:'number', min:'1', value:String(it.qty), style:'width:80px' });
    qty.addEventListener('change', ()=> { updateCartQty(it.id, Number(qty.value)||1); refresh(); });
    const remove = el('button', { class:'btn', text:'Remove' });
    remove.addEventListener('click', ()=>{ removeFromCart(it.id); refresh(); });
    list.appendChild(el('div', { class:'card' },
      el('div', { class:'card__body', style:'display:flex; gap:12px; align-items:center' },
        el('img', { class:'cart-item__img', src:it.thumb || '/assets/images/placeholder-400x300.svg', alt:it.title, onerror: (e)=>{ const t=e.currentTarget; const ph='/assets/images/placeholder-400x300.svg'; if(t && !t.src.includes(ph)){ t.onerror=null; t.src=ph; } } }),
        el('div', { class:'grow' }, el('div', { class:'card__title', text:it.title }), el('div', { class:'muted', text:`${it.price.toFixed(2)} EUR` })),
        qty,
        remove,
      )
    ));
  }

  const totals = calcTotals(detailed, promo);
  const summary = el('div', { class:'card checkout-card' },
    el('div', { class:'card__body' },
      el('div', { class:'totals-list' },
        el('div', { text:`Subtotal: €${totals.subtotal.toFixed(2)}` }),
        el('div', { text:`Tax (20%): €${totals.tax.toFixed(2)}` }),
        el('div', { text:`Shipping: €${totals.shipping.toFixed(2)}` }),
        el('div', { text:`Discount: -€${(totals.discount||0).toFixed(2)}` }),
        el('div', { class:'price', text:`Total: €${totals.total.toFixed(2)}` }),
      ),
      el('div', { class:'toolbar' },
        promoControls(),
        el('a', { href:'#/checkout', class:'btn btn--primary', text:'Checkout' }),
        el('button', { class:'btn btn--ghost', text:'Clear cart', onclick: ()=>{ clearCart(); refresh(); } })
      )
    )
  );
  // On desktop, summary sits in right column via .cart-grid;
  // On mobile, single column and summary is appended after items.
  grid.append(list, summary);
  wrap.append(grid);
  return wrap;

  function promoControls(){
    const code = el('input', { class:'input', placeholder:'Promo code (SAVE10, FREESHIP, WELCOME5)', style:'min-width:280px' });
    const apply = el('button', { class:'btn', text:'Apply' });
    const clear = el('button', { class:'btn', text:'Remove' });
    apply.addEventListener('click', ()=>{
      const v = code.value.trim().toUpperCase();
      if(!['SAVE10','FREESHIP','WELCOME5'].includes(v)) { toast('Invalid code'); return; }
      promo = v; saveLS(keys.promo, promo); toast('Promo applied'); refresh();
    });
    clear.addEventListener('click', ()=>{ promo = null; saveLS(keys.promo, null); toast('Promo removed'); refresh(); });
    const bar = el('div', { class:'toolbar' }, code, apply, clear);
    if(promo){ code.value = promo; }
    return bar;
  }
}
