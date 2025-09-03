import { el } from '../utils.js';

export function NotFoundPage(){
  return el('div', { class:'section' },
    el('h2', { text:'404 — Not found' }),
    el('p', { text:'The page you requested does not exist.' }),
    el('a', { href:'#/', class:'btn', text:'Go home' })
  );
}

