import { el, uid } from '../utils.js';
import { getState, clearCart } from '../store.js';
import { saveOrder } from '../api.js';

export async function CheckoutPage(){
  const state = getState();
  if(state.cart.length === 0){
    return el('div', { class:'empty', html:'Your cart is empty. <a href="#/catalog">Go shopping →</a>' });
  }

  const form = el('form', { class:'form', novalidate:true });
  const paySelect = el('select', { id:'pay', class:'select', required:true },
    el('option', { value:'', text:'Select…' }),
    el('option', { value:'card', text:'Credit Card' }),
    el('option', { value:'cod', text:'Cash on Delivery' }),
  );

  // Card fields (hidden until card is selected)
  const cardWrap = el('div', { id:'card-fields', class:'grid', style:'display:none' });
  const nameOnCard = el('input', { id:'cc-name', class:'input', placeholder:'Name on card', autocomplete:'cc-name' });
  const ccNumber = el('input', { id:'cc-number', class:'input', placeholder:'1234 5678 9012 3456', inputmode:'numeric', autocomplete:'cc-number', maxlength:'23' });
  const ccExpiry = el('input', { id:'cc-exp', class:'input', placeholder:'MM/YY', inputmode:'numeric', autocomplete:'cc-exp', maxlength:'5' });
  const ccCvc = el('input', { id:'cc-cvc', class:'input', placeholder:'CVC', inputmode:'numeric', autocomplete:'cc-csc', maxlength:'3', pattern:'^\d{3}$' });

  // Remove native CVC constraints entirely
  try { ccCvc.removeAttribute('pattern'); ccCvc.removeAttribute('maxlength'); ccCvc.setCustomValidity(''); } catch {}

  function detectBrand(d){ return 'generic'; }

  function formatCard(){
    const digits = ccNumber.value.replace(/\D/g, '').slice(0, 16);
    // formatting: groups of 4 only
    ccNumber.value = digits.replace(/(.{4})/g, '$1 ').trim();
    ccNumber.maxLength = 19; // 16 digits + 3 spaces
  }
  ccNumber.addEventListener('input', formatCard);
  ccNumber.addEventListener('blur', formatCard);
  // Expiry MM/YY formatter
  ccExpiry.addEventListener('input', ()=>{
    const d = ccExpiry.value.replace(/\D/g,'').slice(0,4);
    if(d.length >= 3) ccExpiry.value = d.slice(0,2) + '/' + d.slice(2);
    else ccExpiry.value = d;
  });
  // No expiry validation
  // CVC: no validation or filtering

  cardWrap.append(
    el('div', { class:'col-12' }, el('h3', { text:'Payment details' })),
    el('div', { class:'col-6 field' }, el('label', { for:'cc-name', text:'Name on card' }), nameOnCard),
    el('div', { class:'col-6 field' }, el('label', { for:'cc-number', text:'Card number' }), ccNumber),
    el('div', { class:'col-6 field' }, el('label', { for:'cc-exp', text:'Expiry (MM/YY)' }), ccExpiry),
    el('div', { class:'col-6 field' }, el('label', { for:'cc-cvc', text:'CVC' }), ccCvc),
  );

  form.append(
    el('h2', { text:'Checkout' }),
    el('div', { class:'field' }, el('label', { for:'name', text:'Full name' }), el('input', { id:'name', class:'input', required:true, placeholder:'John Doe' })),
    el('div', { class:'field' }, el('label', { for:'email', text:'Email' }), el('input', { id:'email', class:'input', type:'email', required:true, placeholder:'john@example.com' })),
    el('div', { class:'field' }, el('label', { for:'phone', text:'Phone' }), el('input', { id:'phone', class:'input', type:'tel', required:true, placeholder:'+39 333 123 4567', pattern:"^[+0-9 ()-]{10,}$" })),
    el('div', { class:'field' }, el('label', { for:'addr', text:'Address' }), el('input', { id:'addr', class:'input', required:true, placeholder:'Via Roma 1, Milano' })),
    el('div', { class:'field' }, el('label', { for:'pay', text:'Payment method' }), paySelect),
    cardWrap,
    el('label', {}, el('input', { type:'checkbox', class:'checkbox', required:true }), ' I agree to Terms'),
    el('div', { class:'toolbar' }, el('button', { class:'btn btn--primary', type:'submit', text:'Place order' }))
  );

  function setCardRequired(on){
    // Only card number is required
    if(on){
      ccNumber.setAttribute('required','');
      [nameOnCard, ccExpiry, ccCvc].forEach(i => { i.removeAttribute('required'); i.setCustomValidity(''); });
    } else {
      [nameOnCard, ccNumber, ccExpiry, ccCvc].forEach(i => { i.removeAttribute('required'); i.setCustomValidity(''); });
    }
  }
  paySelect.addEventListener('change', ()=>{
    const isCard = paySelect.value === 'card';
    cardWrap.style.display = isCard ? '' : 'none';
    setCardRequired(isCard);
    if(isCard){ // prefill name on card
      const fullName = form.querySelector('#name').value.trim();
      if(fullName && !nameOnCard.value) nameOnCard.value = fullName;
    }
  });

  function luhnValid(num){ return true; }
  function expiryValid(val){
    const m = /^([0-1]\d)\/(\d{2})$/.exec(val || '');
    if(!m) return false;
    const mm = parseInt(m[1],10); if(mm < 1 || mm > 12) return false;
    const yy = parseInt(m[2],10);
    const now = new Date();
    const currentYY = now.getFullYear() % 100;
    const currentMM = now.getMonth() + 1;
    if(yy < currentYY) return false;
    if(yy === currentYY && mm < currentMM) return false;
    return true;
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    // Extra validation for cards
    if(paySelect.value === 'card'){
      const digits = ccNumber.value.replace(/\D/g,'');
      const numberOk = digits.length === 16;
      ccNumber.setCustomValidity(numberOk ? '' : 'Enter 16 digits');
      if(!numberOk){ form.reportValidity(); return; }
    }
    const order = {
      id: uid('ord'),
      createdAt: new Date().toISOString(),
      customer: {
        name: form.querySelector('#name').value.trim(),
        email: form.querySelector('#email').value.trim(),
        phone: form.querySelector('#phone').value.trim(),
        address: form.querySelector('#addr').value.trim(),
      },
      payment: paySelect.value === 'card' ? { method:'card', last4: ccNumber.value.replace(/\D/g,'').slice(-4) } : { method:'cod' },
      items: state.cart.slice(),
      status: 'placed'
    };
    await saveOrder(order);
    clearCart();
    location.hash = `#/checkout?success=${order.id}`;
  });

  const successId = new URLSearchParams(location.hash.split('?')[1] || '').get('success');
  if(successId){
    return el('div', { class:'section' },
      el('h2', { text:'Thank you!' }),
      el('p', { html:`Your order <strong>${successId}</strong> has been placed.` }),
      el('a', { href:'#/', class:'btn', text:'Back to home' })
    );
  }

  return el('div', { class:'section' }, form);
}
