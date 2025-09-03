import { el } from '../utils.js';
import { getOrders, getProductById } from '../api.js';

export async function OrderPage({ params }){
  const id = String(params.id || '').trim();
  const wrap = el('div', { class:'section' });
  wrap.append(
    el('h2', { text: `Order ${id}` }),
  );

  let orders;
  try{
    const res = await getOrders({ page: 1, pageSize: 1000 });
    orders = Array.isArray(res.items) ? res.items : [];
  }catch(e){
    wrap.append(el('div', { class:'empty', text:'Unable to load your orders. Please sign in and try again.' }));
    return wrap;
  }

  const order = orders.find(o => String(o.id) === id);
  if(!order){
    wrap.append(el('div', { class:'empty', text:'Order not found.' }));
    return wrap;
  }

  // Header info
  wrap.append(
    el('div', { class:'muted', text: new Date(order.createdAt).toLocaleString() })
  );

  // Items list
  const list = el('div', { class:'grid', style:'margin-top:12px' });
  let subtotal = 0;
  for(const it of order.items || []){
    subtotal += Number(it.qty||0) * Number(it.priceSnapshot||0);
    const p = await getProductById(it.id).catch(()=>null);
    const title = p?.title || `Product ${it.id}`;
    const thumb = p?.thumbnail || '/assets/images/placeholder-400x300.svg';
    list.appendChild(
      el('div', { class:'card col-12' },
        el('div', { class:'card__body', style:'display:flex; gap:12px; align-items:center' },
          el('img', { class:'cart-item__img', src: thumb, alt: title, onerror:(e)=>{ const t=e.currentTarget; const ph='/assets/images/placeholder-400x300.svg'; if(t && !t.src.includes(ph)){ t.onerror=null; t.src=ph; } } }),
          el('div', { class:'grow' },
            el('div', { class:'card__title', text: title }),
            el('div', { class:'muted', text:`ID: ${it.id}` }),
          ),
          el('div', { text: `Qty: ${Number(it.qty||0)}` }),
          el('div', { class:'price', text: `${Number(it.priceSnapshot||0).toFixed(2)} EUR` })
        )
      )
    );
  }

  // Totals
  const payStr = order.payment?.method === 'card'
    ? `Card •••• ${order.payment?.last4 || ''}`
    : (order.payment?.method || '—');
  const statusRaw = String(order.status || 'placed');
  const statusLabel = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
  const totals = el('div', { class:'card col-12', style:'margin-top:12px' },
    el('div', { class:'card__body' },
      el('div', { class:'totals-list' },
        el('div', { text: `Shipping to: ${order.customer?.address || '—'}` }),
        el('div', { }, 'Status: ', el('span', { class:'badge', text: statusLabel })),
        el('div', { text: `Payment: ${payStr}` }),
        el('div', { text: `Subtotal: €${subtotal.toFixed(2)}` }),
        el('div', { class:'price', text: `Total: €${subtotal.toFixed(2)}` }),
      )
    )
  );

  wrap.append(list, totals);
  return wrap;
}
