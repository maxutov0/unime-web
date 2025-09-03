import { el } from '../utils.js';
import { getProductById, getReviews, addReview } from '../api.js';
import { addToCart, toggleWishlist, inWishlist } from '../store.js';
import { RatingStars } from '../components/ratingStars.js';
import { toast } from '../components/toast.js';

export async function ProductPage({ params }){
  const p = await getProductById(params.id);
  if(!p){
    return el('div', { class:'empty', text:'Product not found.' });
  }
  const wish = el('button', { class:'btn', text: inWishlist(p.id)?'❤️':'🤍' });
  wish.addEventListener('click', ()=>{ toggleWishlist(p.id); wish.textContent = inWishlist(p.id)?'❤️':'🤍'; });

  const qty = el('input', { class:'input', type:'number', value:'1', min:'1', style:'width:80px' });
  const add = el('button', { class:'btn btn--primary', text:'Add to cart' });
  add.addEventListener('click', ()=> { addToCart({ id:p.id, qty: Number(qty.value)||1, priceSnapshot:p.price }); toast('Added to cart'); });

  const gallery = el('div');
  const placeholder = '/assets/images/placeholder-400x300.svg';
  function imgFallback(e){ const t = e.currentTarget; if(t && t.src && !t.src.includes(placeholder)){ t.onerror = null; t.src = placeholder; } }
  const mainWrap = el('div', { class:'gallery__main' });
  const mainImg = el('img', { src: p.images?.[0] || p.thumbnail || placeholder, alt: p.title, onerror: imgFallback });
  mainWrap.appendChild(mainImg);
  const thumbs = el('div', { class:'toolbar' });
  (p.images || [p.thumbnail]).forEach(src => {
    const tWrap = el('div', { class:'gallery__thumb', style:'cursor:pointer' });
    const t = el('img', { src: src || placeholder, alt:p.title, loading:'lazy', onerror: imgFallback });
    tWrap.addEventListener('click', ()=>{ mainImg.src = src; });
    tWrap.appendChild(t);
    thumbs.appendChild(tWrap);
  });
  gallery.append(mainWrap, thumbs);

  const reviewsWrap = el('div');
  await renderReviews();

  async function renderReviews(){
    reviewsWrap.innerHTML='';
    const list = await getReviews(p.id);
    reviewsWrap.append(
      el('h3', { text:'Reviews' }),
      ...(list.length ? list.map(r => el('div', { class:'card' }, el('div', { class:'card__body' }, el('div', { class:'toolbar' }, el('strong', { text:r.author || r.name }), el('span', { class:'muted', text:new Date(r.createdAt).toLocaleString() })), RatingStars(r.rating), el('p', { text:r.comment }) ) )) : [el('div', { class:'empty', text:'No reviews yet.' })])
    );
    const form = el('form', { class:'form', style:'margin-top:12px' });
    const name = el('input', { class:'input', placeholder:'Your name', required:true });
    const rating = el('select', { class:'select', required:true }, el('option', { value:'', text:'Rating…' }), ...[5,4,3,2,1].map(n => el('option', { value:String(n), text:`${n}★` })));
    const comment = el('textarea', { class:'textarea', placeholder:'Share your thoughts', required:true, rows:'3' });
    form.append(el('div', { class:'field' }, el('label', { text:'Name' }), name));
    form.append(el('div', { class:'field' }, el('label', { text:'Rating' }), rating));
    form.append(el('div', { class:'field' }, el('label', { text:'Comment' }), comment));
    form.append(el('button', { class:'btn btn--primary', type:'submit', text:'Submit review' }));
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      await addReview(p.id, { author: name.value.trim().slice(0,60), rating: Number(rating.value), comment: comment.value.trim().slice(0, 500) });
      toast('Review submitted');
      await renderReviews();
    });
    reviewsWrap.append(form);
  }

  return el('div', { class:'grid section' },
    el('div', { class:'col-6' }, gallery),
    el('div', { class:'col-6' },
      el('h1', { text:p.title }),
      el('div', {}, RatingStars(p.rating?.avg||0), el('span', { class:'muted', text:` ${p.rating?.avg||0} • ${p.rating?.count||0} reviews` })),
      el('p', { class:'price', text:`${p.price.toFixed(2)} ${p.currency||'EUR'}` }),
      el('p', { text:p.description }),
      el('div', { class:'toolbar' }, wish, qty, add),
      reviewsWrap
    )
  );
}
