import { el } from '../utils.js';

export function Pagination({ page, pageSize, total, onPage }){
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const wrap = el('div', { class:'pagination' });
  const prev = el('button', { class:'btn', disabled: page<=1, text:'Prev' });
  const next = el('button', { class:'btn', disabled: page>=pages, text:'Next' });
  prev.addEventListener('click', () => onPage(Math.max(1, page-1)));
  next.addEventListener('click', () => onPage(Math.min(pages, page+1)));
  wrap.append(prev, el('span', { text:`Page ${page} / ${pages}` }), next);
  return wrap;
}

