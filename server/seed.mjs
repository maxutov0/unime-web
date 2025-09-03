import bcrypt from 'bcryptjs';
import { getDb, queryOne, run, closeDb } from './db.mjs';
import { IMAGE_MAP } from './imageMap.mjs';
import { runMigrations } from './migrate.mjs';

async function seedProducts(){
  await getDb();
  const c = Number((await queryOne('SELECT COUNT(1) as c FROM products'))?.c || 0);
  if(c > 0){ console.log('Products already present, skipping seed'); return; }
  const now = new Date().toISOString();
  // Use external images from picsum.photos for demo reliability
  const img = (seed, w=800, h=600) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
  const thumb = (seed) => img(seed, 400, 300);
  let products = [
    { id:'iot-1001', title:'Smart LED Bulb (E27)', description:'Wi‑Fi + Matter, tunable white 2700–6500K, 9W.', price:14.99, currency:'EUR', images:[img('iot-1001-a'), img('iot-1001-b')], thumbnail:thumb('iot-1001'), category:'lighting', tags:['bulb','matter','wifi'], rating:{avg:4.5,count:210}, stock:200, createdAt:now },
    { id:'iot-1002', title:'Smart Plug Mini', description:'Wi‑Fi + Energy monitoring, schedules & scenes.', price:19.90, currency:'EUR', images:[img('iot-1002-a')], thumbnail:thumb('iot-1002'), category:'power', tags:['plug','energy'], rating:{avg:4.6,count:340}, stock:320, createdAt:now },
    { id:'iot-1003', title:'Smart Thermostat', description:'Programmable, geofencing, OpenTherm, app control.', price:159.00, currency:'EUR', images:[img('iot-1003-a'), img('iot-1003-b')], thumbnail:thumb('iot-1003'), category:'climate', tags:['thermostat'], rating:{avg:4.3,count:95}, stock:50, createdAt:now },
    { id:'iot-1004', title:'Smart Lock Pro', description:'Keyless entry, auto‑lock, HomeKit, Zigbee.', price:229.00, currency:'EUR', images:[img('iot-1004-a')], thumbnail:thumb('iot-1004'), category:'security', tags:['lock','zigbee'], rating:{avg:4.2,count:60}, stock:35, createdAt:now },
    { id:'iot-1005', title:'Smart Camera 2K', description:'Indoor cam, motion detection, local storage.', price:49.90, currency:'EUR', images:[img('iot-1005-a'), img('iot-1005-b')], thumbnail:thumb('iot-1005'), category:'security', tags:['camera','2k'], rating:{avg:4.4,count:180}, stock:120, createdAt:now },
    { id:'iot-1007', title:'Smart Hub (Matter)', description:'Bridges Zigbee/Z‑Wave to Matter over Thread.', price:119.00, currency:'EUR', images:[img('iot-1007-a')], thumbnail:thumb('iot-1007'), category:'hubs', tags:['hub','matter','thread'], rating:{avg:4.3,count:105}, stock:80, createdAt:now },
    { id:'iot-1008', title:'Motion Sensor PIR', description:'Battery powered, Zigbee, 2‑year life.', price:17.90, currency:'EUR', images:[img('iot-1008-a')], thumbnail:thumb('iot-1008'), category:'sensors', tags:['motion','pir'], rating:{avg:4.5,count:260}, stock:240, createdAt:now },
    { id:'iot-1009', title:'Door/Window Sensor', description:'Magnetic contact, Zigbee, automations.', price:12.90, currency:'EUR', images:[img('iot-1009-a')], thumbnail:thumb('iot-1009'), category:'sensors', tags:['contact'], rating:{avg:4.6,count:310}, stock:300, createdAt:now },
    { id:'iot-1014', title:'LED Light Strip (2m)', description:'RGBIC, music sync, Wi‑Fi + Matter.', price:24.90, currency:'EUR', images:[img('iot-1014-a')], thumbnail:thumb('iot-1014'), category:'lighting', tags:['strip','rgb'], rating:{avg:4.3,count:180}, stock:160, createdAt:now },
    { id:'iot-1016', title:'Energy Monitor Clamp', description:'Whole‑home power monitoring, Wi‑Fi.', price:69.00, currency:'EUR', images:[img('iot-1016-a')], thumbnail:thumb('iot-1016'), category:'power', tags:['energy'], rating:{avg:4.2,count:115}, stock:65, createdAt:now }
  ];
  // Apply external image map overrides if provided
  products = products.map(p => {
    const m = IMAGE_MAP[p.id];
    if(m){
      return {
        ...p,
        thumbnail: m.thumbnail || p.thumbnail,
        images: Array.isArray(m.images) && m.images.length ? m.images : p.images,
      };
    }
    return p;
  });

  for(const p of products){
    await run(`INSERT INTO products(id,title,description,price,currency,category,stock,thumbnail,images_json,tags_json,rating_avg,rating_count,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [ p.id, p.title||'', p.description||'', Number(p.price)||0, p.currency||'EUR', p.category||null, Number(p.stock||0), p.thumbnail||'', JSON.stringify(p.images||[]), JSON.stringify(p.tags||[]), Number(p.rating?.avg||0), Number(p.rating?.count||0), p.createdAt || now ]);
  }
  console.log(`Seeded ${products.length} products`);
}

async function seedAdmin(){
  await getDb();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Admin';
  const exists = await queryOne('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail]);
  if(exists){ console.log('Admin user exists, skipping'); return; }
  const hash = await bcrypt.hash(String(adminPass), 10);
  await run('INSERT INTO users(name, email, password_hash, is_admin, created_at) VALUES(?,?,?,?,?)', [adminName, adminEmail, hash, 1, new Date().toISOString()]);
  console.log(`Seeded admin user: ${adminEmail} / ${adminPass}`);
}

async function main(){
  await runMigrations();
  await seedProducts();
  await seedAdmin();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(async () => {
      console.log('Seeding complete');
      await closeDb().catch(()=>{});
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await closeDb().catch(()=>{});
      process.exit(1);
    });
}
