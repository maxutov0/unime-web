import { el, uid } from '../utils.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { getState } from '../store.js';
import { getProducts, createProduct, updateProduct, deleteProduct, exportProducts, importProducts, getAllOrders, getServerCustomCategories, addServerCustomCategory, removeServerCustomCategory } from '../api.js';

export async function AdminPage(){
  const wrap = el('div', { class:'section' });
  wrap.appendChild(el('h2', { text:'Admin' }));

  const st = getState();
  const isAdmin = !!st.session?.user?.isAdmin;
  if(!isAdmin){
    try{ toast('Admin access required'); }catch{}
    wrap.append(
      el('div', { class:'card' },
        el('div', { class:'card__body' },
          el('p', { class:'muted', text:'Access restricted: staff only.' }),
          el('div', { class:'toolbar' },
            el('a', { href:'#/profile', class:'btn btn--primary', text:'Sign in as admin' })
          )
        )
      )
    );
    return wrap;
  }

  // Tabs
  const tabs = el('div', { class:'toolbar' });
  const btnProducts = el('button', { class:'btn btn--primary', text:'Products' });
  const btnOrders = el('button', { class:'btn', text:'Orders' });
  const btnCategories = el('button', { class:'btn', text:'Categories' });
  tabs.append(btnProducts, btnOrders, btnCategories);
  const content = el('div', { class:'section' });
  wrap.append(el('div', { class:'notice', text:'Admin area — protected' }), tabs, content);

  btnProducts.addEventListener('click', renderProducts);
  btnOrders.addEventListener('click', renderOrders);
  btnCategories.addEventListener('click', renderCategories);

  await renderProducts();
  return wrap;

  async function renderProducts(){
    btnProducts.classList.add('btn--primary'); btnOrders.classList.remove('btn--primary'); btnCategories.classList.remove('btn--primary');
    content.innerHTML='';
    const table = el('table', { style:'width:100%; border-collapse:collapse' });
    table.appendChild(el('thead', {}, el('tr', {}, ...['ID','Title','Price','Category','Actions'].map(h => el('th', { style:'text-align:left; padding:8px; border-bottom:1px solid var(--color-border)', text:h })) )));
    const tbody = el('tbody');
    table.appendChild(tbody);

    let page = 1; const pageSize = 10;
    const pager = el('div', { class:'toolbar' });
    async function load(){
      tbody.innerHTML=''; pager.innerHTML='';
      const { items, total } = await getProducts({ page, pageSize, sort:'newest' });
      items.forEach(p => tbody.appendChild(row(p)));
      const pages = Math.max(1, Math.ceil(total / pageSize));
      const info = el('span', { class:'muted', text:`Page ${page} of ${pages} — Total: ${total}` });
      const prev = el('button', { class:'btn', text:'Prev', disabled: page<=1 });
      const next = el('button', { class:'btn', text:'Next', disabled: page>=pages });
      prev.addEventListener('click', ()=>{ if(page>1){ page--; load(); } });
      next.addEventListener('click', ()=>{ if(page<pages){ page++; load(); } });
      pager.append(prev, next, info);
    }

    const addBtn = el('button', { class:'btn btn--primary', text:'Add product' });
    addBtn.addEventListener('click', ()=> openProductEditor());

    const exp = el('button', { class:'btn', text:'Export JSON' });
    exp.addEventListener('click', async ()=>{
      const data = await exportProducts();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = el('a', { href:url, download:'products-export.json' });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    const imp = el('input', { type:'file', accept:'application/json', style:'display:none' });
    const impBtn = el('button', { class:'btn', text:'Import JSON' });
    impBtn.addEventListener('click', ()=> imp.click());
    imp.addEventListener('change', async ()=>{
      const file = imp.files?.[0]; if(!file) return;
      const text = await file.text();
      try{ const data = JSON.parse(text); await importProducts(data); location.hash = '#/admin'; }
      catch(e){ alert('Invalid JSON'); }
    });

    content.append(el('div', { class:'toolbar' }, addBtn, exp, impBtn), imp, table, pager);
    await load();
  }

  function row(p){
    const tr = el('tr');
    const id = el('td', { style:'padding:8px; border-bottom:1px solid var(--color-border)', text:p.id });
    const title = el('input', { class:'input', value:p.title });
    const price = el('input', { class:'input', type:'number', step:'0.01', value:String(p.price) });
    const category = el('input', { class:'input', value:p.category||'' });
    const tdTitle = el('td', { style:'padding:8px; border-bottom:1px solid var(--color-border)' }, title);
    const tdPrice = el('td', { style:'padding:8px; border-bottom:1px solid var(--color-border)' }, price);
    const tdCat = el('td', { style:'padding:8px; border-bottom:1px solid var(--color-border)' }, category);
    const actions = el('td', { style:'padding:8px; border-bottom:1px solid var(--color-border)' });
    const edit = el('button', { class:'btn', text:'Edit' });
    edit.addEventListener('click', ()=> openProductEditor(p));
    const save = el('button', { class:'btn', text:'Save' });
    save.addEventListener('click', async ()=>{ await updateProduct(p.id, { title:title.value, price:Number(price.value)||p.price, category: category.value.trim() }); save.textContent='Saved'; setTimeout(()=> save.textContent='Save', 800); });
    const del = el('button', { class:'btn btn--danger', text:'Delete' });
    del.addEventListener('click', async ()=>{ if(confirm('Delete product?')){ await deleteProduct(p.id); location.hash='#/admin'; } });
    actions.append(edit, ' ', save, ' ', del);
    tr.append(id, tdTitle, tdPrice, tdCat, actions);
    return tr;
  }

  function openProductEditor(p){
    const isNew = !p;
    const data = p || { id: uid('p'), title:'', description:'', price: 0, currency:'EUR', images:[], thumbnail:'', category:'', tags:[], rating:{avg:0,count:0}, stock:0, createdAt: new Date().toISOString() };
    const form = el('form', { class:'form', style:'min-width:520px' });
    const title = el('input', { class:'input', required:true, value:data.title, placeholder:'Product title' });
    const desc = el('textarea', { class:'textarea', rows:'4', placeholder:'Description' }); desc.value = data.description || '';
    const price = el('input', { class:'input', type:'number', step:'0.01', min:'0', required:true, value:String(data.price||0) });
    const currency = el('input', { class:'input', value:data.currency||'EUR', placeholder:'Currency (e.g., EUR)' });
    const category = el('input', { class:'input', required:true, value:data.category||'', placeholder:'Category' });
    const stock = el('input', { class:'input', type:'number', step:'1', min:'0', value:String(data.stock||0) });
    const tags = el('input', { class:'input', placeholder:'Tags (comma separated)', value:(data.tags||[]).join(', ') });
    const thumb = el('input', { class:'input', placeholder:'Thumbnail URL', value:data.thumbnail||'' });
    const images = el('textarea', { class:'textarea', rows:'3', placeholder:'Image URLs (one per line)' }); images.value = (data.images||[]).join('\n');

    form.append(
      el('div', { class:'field' }, el('label', { text:'Title' }), title),
      el('div', { class:'field' }, el('label', { text:'Description' }), desc),
      el('div', { class:'grid' },
        el('div', { class:'col-4 field' }, el('label', { text:'Price' }), price),
        el('div', { class:'col-4 field' }, el('label', { text:'Currency' }), currency),
        el('div', { class:'col-4 field' }, el('label', { text:'Stock' }), stock),
      ),
      el('div', { class:'grid' },
        el('div', { class:'col-6 field' }, el('label', { text:'Category' }), category),
        el('div', { class:'col-6 field' }, el('label', { text:'Tags' }), tags),
      ),
      el('div', { class:'field' }, el('label', { text:'Thumbnail' }), thumb),
      el('div', { class:'field' }, el('label', { text:'Images' }), images),
    );

    openModal({
      title: isNew ? 'Add Product' : `Edit ${data.id}`,
      content: form,
      actions: [
        { label:'Cancel' },
        { label: isNew ? 'Create' : 'Save', primary:true, onClick: async (close)=>{
          if(!form.checkValidity()){ form.reportValidity(); return; }
          const payload = {
            id: data.id,
            title: title.value.trim(),
            description: desc.value.trim(),
            price: Math.max(0, Number(price.value)||0),
            currency: (currency.value||'EUR').trim().toUpperCase(),
            category: category.value.trim()||'misc',
            stock: Math.max(0, Number(stock.value)||0),
            tags: tags.value.split(',').map(s=>s.trim()).filter(Boolean),
            thumbnail: thumb.value.trim() || data.thumbnail || '/assets/images/placeholder-400x300.svg',
            images: images.value.split(/\n+/).map(s=>s.trim()).filter(Boolean),
          };
          try{
            if(isNew){ await createProduct({ ...payload, rating:{avg:0,count:0}, createdAt: new Date().toISOString() }); }
            else { await updateProduct(data.id, payload); }
            if(typeof close === 'function') close();
            location.hash = '#/admin';
          }catch(e){ alert('Failed to save product'); }
        }},
      ]
    });
  }

  async function renderOrders(){
    btnProducts.classList.remove('btn--primary'); btnOrders.classList.add('btn--primary'); btnCategories.classList.remove('btn--primary');
    content.innerHTML='';
    let page = 1;
    const pageSize = 10;
    const listWrap = el('div');
    const pager = el('div', { class:'toolbar' });
    async function load(){
      listWrap.innerHTML=''; pager.innerHTML='';
      const { items, total } = await getAllOrders({ page, pageSize });
      if(!items.length){ content.appendChild(el('div', { class:'empty', text:'No orders yet.' })); return; }
      items.forEach(o => listWrap.appendChild(el('div', { class:'card' }, el('div', { class:'card__body' }, el('div', { text:`${o.id} — ${new Date(o.createdAt).toLocaleString()}` }), el('div', { class:'muted', text:`Items: ${o.items.reduce((s,i)=>s+i.qty,0)}` }) ))));
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if(pages > 1){
        const info = el('span', { class:'muted', text:`Page ${page} of ${pages}` });
        const prev = el('button', { class:'btn', text:'Prev', disabled: page<=1 });
        const next = el('button', { class:'btn', text:'Next', disabled: page>=pages });
        prev.addEventListener('click', ()=>{ if(page>1){ page--; load(); } });
        next.addEventListener('click', ()=>{ if(page<pages){ page++; load(); } });
        pager.append(prev, next, info);
      }
    }
    content.append(listWrap, pager);
    await load();
  }

  async function renderCategories(){
    btnProducts.classList.remove('btn--primary'); btnOrders.classList.remove('btn--primary'); btnCategories.classList.add('btn--primary');
    content.innerHTML='';
    const list = await getServerCustomCategories();
    const ul = el('ul');
    const input = el('input', { class:'input', placeholder:'Add category' });
    const add = el('button', { class:'btn', text:'Add' });
    add.addEventListener('click', async ()=>{ const v = input.value.trim(); if(v){ await addServerCustomCategory(v); input.value=''; renderCategories(); } });
    list.forEach((c, idx)=>{
      const li = el('li', {}, c, ' ', el('button', { class:'btn', text:'✖', onclick: async ()=>{ await removeServerCustomCategory(c); renderCategories(); } }));
      ul.appendChild(li);
    });
    content.append(el('div', { class:'toolbar' }, input, add), ul);
  }
}
