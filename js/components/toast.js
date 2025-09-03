import { el } from '../utils.js';

const stackId = 'toast-stack';
function ensureStack(){
  const root = document.getElementById('toast-root');
  let stack = document.getElementById(stackId);
  if(!stack){ stack = el('div', { id:stackId, class:'toast-stack', role:'status' }); root.appendChild(stack); }
  return stack;
}

export function toast(message, { timeout=2500 }={}){
  const stack = ensureStack();
  const node = el('div', { class:'toast', text: message });
  stack.appendChild(node);
  setTimeout(()=> node.remove(), timeout);
}

