import { getDb, queryAll, run, runMany } from '../db.mjs';

function pick(arr, n=1){ const a = arr.slice(); const out=[]; while(n-- && a.length){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return out; }

async function main(){
  await getDb();
  const products = await queryAll('SELECT id, price FROM products LIMIT 50');
  if(products.length === 0){ console.log('No products to create orders'); return; }
  const now = new Date().toISOString();
  for(let k=0;k<5;k++){
    const id = `ord_${Math.random().toString(36).slice(2,8)}`;
    const itemsCount = Math.floor(Math.random()*3)+1;
    const chosen = pick(products, itemsCount);
    const items = chosen.map(p => ({ id: p.id, qty: Math.floor(Math.random()*2)+1, priceSnapshot: Number(p.price)||0 }));
    await run(
      `INSERT INTO orders(id, created_at, user_id, customer_name, customer_email, customer_phone, customer_address, payment_method, payment_last4, status)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [id, now, null, 'Demo User', 'demo@example.com', '+100000000', 'Demo Street 1', 'cod', '', 'placed']
    );
    await runMany('INSERT INTO order_items(order_id, product_id, qty, price_snapshot) VALUES(?,?,?,?)', items.map(i => [id, String(i.id), Number(i.qty), Number(i.priceSnapshot)]));
    console.log('Seeded order', id, 'with', items.length, 'items');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => { console.error(err); process.exit(1); });
}

