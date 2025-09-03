import { el } from '../utils.js';

export function openModal({ title='Dialog', content, actions=[] }){
  const root = document.getElementById('modal-root');
  const close = () => { root.innerHTML=''; };
  const backdrop = el('div', { class:'modal-backdrop', role:'dialog', 'aria-modal':'true' });
  const modal = el('div', { class:'modal' });
  const header = el('div', { class:'modal__header' }, el('strong', { text:title }), el('button', { class:'btn', text:'✖', onclick: close }));
  const body = el('div', { class:'modal__body' });
  if(typeof content === 'string') body.innerHTML = content; else if(content) body.appendChild(content);
  const footer = el('div', { class:'modal__footer' });
  actions.forEach(a => footer.appendChild(el('button', { class: `btn ${a.primary?'btn--primary':''}`, text:a.label, onclick: () => { if(a.onClick) a.onClick(close); } })));
  modal.append(header, body, footer);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) close(); });
  root.innerHTML=''; root.appendChild(backdrop);
  return close;
}

