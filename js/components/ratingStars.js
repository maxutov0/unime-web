import { el } from '../utils.js';

export function RatingStars(value){
  const v = Math.max(0, Math.min(5, Number(value)||0));
  const wrap = el('span', { class:'rating', role:'img', 'aria-label': `${v} out of 5` });
  for(let i=1;i<=5;i++) wrap.appendChild(el('span', { text: i<=v ? '★' : '☆' }));
  return wrap;
}

