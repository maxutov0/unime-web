import { el } from '../utils.js';
import { toast } from '../components/toast.js';
import { getOrders, registerUser, loginUser, setAuthToken, updateProfile } from '../api.js';
import { getState, login, logout } from '../store.js';

export async function ProfilePage(){
  const state = getState();
  const wrap = el('div', { class:'section' });
  wrap.appendChild(el('h2', { text:'Profile' }));

  if(!state.session.loggedIn){
    const tabs = el('div', { class:'toolbar' });
    const btnLogin = el('button', { class:'btn btn--primary', text:'Login' });
    const btnRegister = el('button', { class:'btn', text:'Register' });
    tabs.append(btnLogin, btnRegister);

    const form = el('form', { class:'form', novalidate:true, style:'max-width:420px' });
    const name = el('input', { class:'input', placeholder:'Full name', required:true });
    const email = el('input', { class:'input', type:'email', placeholder:'Email', required:true });
    const password = el('input', { class:'input', type:'password', placeholder:'Password', required:true, minlength:'6' });
    let mode = 'login';

    function renderFields(){
      form.innerHTML = '';
      if(mode === 'register'){
        form.append(
          el('div', { class:'field' }, el('label', { text:'Name' }), name),
          el('div', { class:'field' }, el('label', { text:'Email' }), email),
          el('div', { class:'field' }, el('label', { text:'Password' }), password),
          el('button', { class:'btn btn--primary', type:'submit', text:'Create account' })
        );
      } else {
        form.append(
          el('div', { class:'field' }, el('label', { text:'Email' }), email),
          el('div', { class:'field' }, el('label', { text:'Password' }), password),
          el('button', { class:'btn btn--primary', type:'submit', text:'Sign in' })
        );
      }
    }

    btnLogin.addEventListener('click', ()=>{ btnLogin.classList.add('btn--primary'); btnRegister.classList.remove('btn--primary'); mode='login'; renderFields(); });
    btnRegister.addEventListener('click', ()=>{ btnRegister.classList.add('btn--primary'); btnLogin.classList.remove('btn--primary'); mode='register'; renderFields(); });
    renderFields();

    const refresh = () => window.dispatchEvent(new Event('hashchange'));
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      try{
        if(mode === 'register'){
          const resp = await registerUser({ name: name.value.trim(), email: email.value.trim(), password: password.value });
          setAuthToken(resp.token); login({ user: resp.user, token: resp.token });
          toast('Account created');
          location.hash = '#/profile'; refresh();
        } else {
          const resp = await loginUser({ email: email.value.trim(), password: password.value });
          setAuthToken(resp.token); login({ user: resp.user, token: resp.token });
          toast('Signed in');
          location.hash = '#/profile'; refresh();
        }
      } catch(e){ toast('Authentication failed'); }
    });
    wrap.append(tabs, form);
    return wrap;
  }

  const isAdmin = !!state.session.user?.isAdmin;
  wrap.append(
    el('p', { text:`Hello, ${state.session.user?.name || 'user'}${isAdmin?' (admin)':''}!` }),
    el('div', { class:'toolbar' },
      (isAdmin ? el('a', { href:'#/admin', class:'btn btn--primary', text:'Admin' }) : null),
      el('button', { class:'btn', text:'Logout', onclick: ()=>{ setAuthToken(null); logout(); try{ toast('Signed out'); }catch{} location.hash = '#/profile'; window.dispatchEvent(new Event('hashchange')); } })
    )
  );

  // Profile update form
  const pf = el('form', { class:'form', style:'max-width:520px' });
  const name = el('input', { class:'input', value: state.session.user?.name || '', placeholder:'Full name' });
  const email = el('input', { class:'input', type:'email', value: state.session.user?.email || '', placeholder:'Email' });
  const curPass = el('input', { class:'input', type:'password', placeholder:'Current password (only to change password)' });
  const newPass = el('input', { class:'input', type:'password', placeholder:'New password (optional)' });
  pf.append(
    el('h3', { text:'Update profile' }),
    el('div', { class:'field' }, el('label', { text:'Name' }), name),
    el('div', { class:'field' }, el('label', { text:'Email' }), email),
    el('div', { class:'field' }, el('label', { text:'Current password' }), curPass),
    el('div', { class:'field' }, el('label', { text:'New password' }), newPass),
    el('button', { class:'btn btn--primary', type:'submit', text:'Save changes' })
  );
  pf.addEventListener('submit', async (e)=>{
    e.preventDefault();
    try{
      const payload = {};
      if(name.value.trim() && name.value.trim() !== state.session.user?.name) payload.name = name.value.trim();
      if(email.value.trim() && email.value.trim() !== state.session.user?.email) payload.email = email.value.trim();
      if(newPass.value.trim()){
        payload.newPassword = newPass.value;
        payload.password = curPass.value;
      }
      const resp = await updateProfile(payload);
      // Update session
      setAuthToken(resp.token);
      login({ user: resp.user, token: resp.token });
      toast('Profile updated');
    }catch(err){ toast('Update failed'); }
  });
  wrap.append(pf);

  let orders = [];
  wrap.appendChild(el('h3', { text:'My orders' }));
  try{
    const res = await getOrders();
    orders = (res.items || []).slice().reverse();
  }catch(e){
    wrap.appendChild(el('div', { class:'empty', text:'Unable to load orders. Try signing in again.' }));
    return wrap;
  }
  if(orders.length === 0){ wrap.appendChild(el('div', { class:'empty', text:'No orders yet.' })); return wrap; }
  orders.forEach(o => {
    wrap.appendChild(el('div', { class:'card' },
      el('div', { class:'card__body', style:'display:flex; align-items:center; gap:12px' },
        el('div', { class:'grow' },
          el('div', { text:`Order ${o.id} — ${new Date(o.createdAt).toLocaleString()}` }),
          el('div', { class:'muted', text:`Items: ${o.items.reduce((s,i)=>s+i.qty,0)}` })
        ),
        el('a', { href:`#/order/${o.id}`, class:'btn', text:'View details' })
      )
    ));
  });
  return wrap;
}
