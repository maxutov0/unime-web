import { IMAGE_MAP } from '../imageMap.mjs';

export async function up({ run }){
  const id = 'iot-1014';
  const cfg = IMAGE_MAP[id] || {};
  const thumb = cfg.thumbnail || null;
  const images = Array.isArray(cfg.images) && cfg.images.length ? cfg.images : null;
  const sets = [];
  const args = [];
  if(thumb){ sets.push('thumbnail=?'); args.push(String(thumb)); }
  if(images){ sets.push('images_json=?'); args.push(JSON.stringify(images)); }
  if(sets.length){
    args.push(id);
    await run(`UPDATE products SET ${sets.join(', ')} WHERE id=?`, args);
  }
}

