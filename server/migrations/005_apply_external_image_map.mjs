import { IMAGE_MAP } from '../imageMap.mjs';

export async function up({ run, queryAll }){
  const rows = await queryAll('SELECT id FROM products');
  const ids = new Set(rows.map(r => String(r.id)));
  for(const [id, cfg] of Object.entries(IMAGE_MAP)){
    if(!ids.has(id)) continue;
    const thumb = cfg.thumbnail || null;
    const images = Array.isArray(cfg.images) && cfg.images.length ? cfg.images : null;
    if(!thumb && !images) continue;
    const sets = [];
    const args = [];
    if(thumb){ sets.push('thumbnail=?'); args.push(String(thumb)); }
    if(images){ sets.push('images_json=?'); args.push(JSON.stringify(images)); }
    args.push(id);
    await run(`UPDATE products SET ${sets.join(', ')} WHERE id=?`, args);
  }
}

