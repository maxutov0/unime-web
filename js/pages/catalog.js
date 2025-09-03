import { el, debounce } from '../utils.js';
import { getProducts } from '../api.js';
import { getCategories } from '../api.js';
import { ProductCard } from '../components/productCard.js';
import { Pagination } from '../components/pagination.js';

export async function CatalogPage(){
  const wrap = el('div', { class:'section' });
  const toolbar = el('div', { class:'toolbar filters' });

  const categories = ['all', ...(await getCategories())];

  let state = { search:'', category:'all', rating:'', sort:'relevance', page:1, pageSize:12 };

  const search = el('input', { class:'input', placeholder:'Search…', 'aria-label':'Search products', style:'width:220px' });
  search.addEventListener('input', debounce(async ()=>{ state.search = search.value; state.page=1; await renderList(); }, 300));

  const category = el('select', { class:'select' }, ...categories.map(c=> el('option', { value:c, text:c })));
  category.addEventListener('change', async ()=>{ state.category = category.value; state.page=1; await renderList(); });

  const rating = el('select', { class:'select' },
    el('option', { value:'', text:'Any rating' }),
    el('option', { value:'4', text:'4★+' }),
    el('option', { value:'3', text:'3★+' })
  );
  rating.addEventListener('change', async ()=>{ state.rating = rating.value; state.page=1; await renderList(); });

  const sort = el('select', { class:'select' },
    el('option', { value:'relevance', text:'Relevance' }),
    el('option', { value:'price-asc', text:'Price: Low-High' }),
    el('option', { value:'price-desc', text:'Price: High-Low' }),
    el('option', { value:'rating-desc', text:'Top rated' }),
    el('option', { value:'newest', text:'Newest' }),
  );
  sort.addEventListener('change', async ()=>{ state.sort = sort.value; state.page=1; await renderList(); });

  const countEl = el('span', { class:'muted' });
  toolbar.append(
    el('strong', { text:'Catalog' }),
    search,
    category,
    rating,
    sort,
    countEl,
  );

  const list = el('div', { class:'grid section products-grid' });
  const pagerWrap = el('div');

  wrap.append(toolbar, list, pagerWrap);

  async function renderList(){
    list.innerHTML = '';
    const filters = {};
    if(state.category && state.category !== 'all') filters.category = state.category;
    if(state.rating) filters.rating = state.rating;
    const { items, total } = await getProducts({ search:state.search, filters, sort:state.sort, page:state.page, pageSize:state.pageSize });
    countEl.textContent = `Results: ${total}`;
    if(items.length === 0){
      list.appendChild(el('div', { class:'empty col-12', text:'No products found.' }));
      pagerWrap.innerHTML = '';
      return;
    }
    items.map(ProductCard).forEach(c => { c.classList.add('col-3'); list.appendChild(c); });
    pagerWrap.innerHTML='';
    pagerWrap.appendChild(Pagination({ page:state.page, pageSize:state.pageSize, total, onPage: (p)=>{ state.page=p; renderList(); } }));
  }

  await renderList();

  // Listen to header search broadcast
  const onHdrSearch = async (e)=>{ const q = e.detail || ''; search.value = q; state.search = q; state.page = 1; await renderList(); };
  document.addEventListener('catalog:search', onHdrSearch);
  wrap.cleanup = () => document.removeEventListener('catalog:search', onHdrSearch);
  return wrap;
}
