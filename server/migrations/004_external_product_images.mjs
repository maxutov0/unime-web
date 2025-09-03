export async function up({ run, queryAll }){
  // Switch existing product images to external picsum URLs for demo purposes
  const rows = await queryAll('SELECT id FROM products');
  for(const r of rows){
    const id = String(r.id);
    const thumb = `https://picsum.photos/seed/${encodeURIComponent(id)}/400/300`;
    const images = [
      `https://picsum.photos/seed/${encodeURIComponent(id)}-a/800/600`,
      `https://picsum.photos/seed/${encodeURIComponent(id)}-b/800/600`
    ];
    await run('UPDATE products SET thumbnail=?, images_json=? WHERE id=?', [thumb, JSON.stringify(images), id]);
  }
}

