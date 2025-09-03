import { keys, loadLS, saveLS } from './utils.js';

const state = {
  cart: loadLS(keys.cart, []), // [{id, qty, priceSnapshot}]
  wishlist: loadLS(keys.wishlist, []), // [id]
  session: loadLS(keys.session, { loggedIn: false, user: null, token: null }),
  theme: loadLS(keys.theme, null),
};

const listeners = new Set();
function emit(){ listeners.forEach(fn => fn(getState())); }

export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
export function getState(){ return JSON.parse(JSON.stringify(state)); }

export function setThemePreference(theme){ state.theme = theme; saveLS(keys.theme, theme); emit(); }

export function toggleWishlist(id){
  const i = state.wishlist.indexOf(id);
  if(i>=0) state.wishlist.splice(i,1); else state.wishlist.push(id);
  saveLS(keys.wishlist, state.wishlist); emit();
}

export function inWishlist(id){ return state.wishlist.includes(id); }

export function addToCart(item){
  const found = state.cart.find(i => i.id === item.id);
  if(found) found.qty += item.qty || 1; else state.cart.push({ id:item.id, qty:item.qty||1, priceSnapshot:item.priceSnapshot });
  saveLS(keys.cart, state.cart); emit();
}
export function updateCartQty(id, qty){
  const it = state.cart.find(i => i.id === id);
  if(!it) return; it.qty = Math.max(1, qty); saveLS(keys.cart, state.cart); emit();
}
export function removeFromCart(id){
  const i = state.cart.findIndex(i => i.id === id);
  if(i>=0){ state.cart.splice(i,1); saveLS(keys.cart, state.cart); emit(); }
}
export function clearCart(){ state.cart = []; saveLS(keys.cart, state.cart); emit(); }

export function login(payload){
  if(payload && payload.user && payload.token){
    state.session = { loggedIn:true, user: payload.user, token: payload.token };
  } else {
    // Back-compat for older callers
    state.session = { loggedIn:true, user: payload, token: null };
  }
  saveLS(keys.session, state.session); emit();
}
export function logout(){ state.session = { loggedIn:false, user:null, token:null }; saveLS(keys.session, state.session); emit(); }
