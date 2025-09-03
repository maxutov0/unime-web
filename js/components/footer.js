import { el } from '../utils.js';

export function Footer(){
  const year = new Date().getFullYear();
  return el('div', { class:'footer' },
    el('div', { class:'container footer__row' },
      el('div', { text:`© ${year} NovaIoT` }),
      el('div', {},
        el('a', { href:'#/about', class:'btn btn--ghost', text:'About' }),
        ' ',
        el('a', { href:'#/catalog', class:'btn btn--ghost', text:'Catalog' })
      )
    )
  );
}
