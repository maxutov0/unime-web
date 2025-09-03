import { el } from '../utils.js';
import { addToCart, toggleWishlist, inWishlist } from '../store.js';
import { toast } from './toast.js';
import { RatingStars } from './ratingStars.js';

export function ProductCard(p){
  const wishBtn = el('button', { class:'btn btn--ghost', 'aria-label':'Wishlist' }, inWishlist(p.id)?'❤️':'🤍');
  wishBtn.addEventListener('click', ()=>{
    toggleWishlist(p.id); wishBtn.textContent = inWishlist(p.id)?'❤️':'🤍';
  });

  const addBtn = el('button', { class:'btn btn--primary', 'aria-label':'Add to cart' }, 'Add');
  addBtn.addEventListener('click', ()=> { addToCart({ id:p.id, qty:1, priceSnapshot:p.price }); toast('Added to cart'); });

  const placeholder = '/assets/images/placeholder-400x300.svg';
  function imgFallback(e){ const t = e.currentTarget; if(t && t.src && !t.src.includes(placeholder)){ t.onerror = null; t.src = placeholder; } }

  return el('article', { class:'card' },
    el('a', { href:`#/product/${p.id}` },
      el('div', { class:'card__media' },
        el('img', { src: p.thumbnail || placeholder, alt: p.title, loading:'lazy', onerror: imgFallback })
      )
    ),
    el('div', { class:'card__body' },
      el('div', { class:'toolbar' },
        p.category ? el('span', { class:'badge', text: String(p.category) }) : null,
        ...(Array.isArray(p.tags) ? p.tags.slice(0,2).map(t => el('span', { class:'badge', text: t })) : [])
      ),
      el('div', { class:'card__title' }, p.title),
      el('div', {}, RatingStars(p.rating?.avg || 0), el('span', { class:'muted', text:` (${p.rating?.count||0})` })),
      el('div', { class:'price', text: `${p.price.toFixed(2)} ${p.currency||'EUR'}` }),
      el('div', { class:'toolbar' },
        el('a', { href:`#/product/${p.id}`, class:'btn btn--ghost', text:'Details' }),
        el('div', { class:'spacer' }),
        wishBtn,
        addBtn,
      )
    )
  );
}
