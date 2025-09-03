import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';
import puppeteer from 'puppeteer';

const BASE = process.env.BASE_URL || `http://localhost:4000`;
const START_MOCK = String(process.env.START_MOCK ?? '1') !== '0';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function waitForServer(url, { timeoutMs = 30000 } = {}){
  const started = Date.now();
  return new Promise(async (resolve, reject) => {
    while (Date.now() - started < timeoutMs){
      try {
        await new Promise((res, rej) => {
          const req = http.get(url, (r) => { r.resume(); res(); });
          req.on('error', rej);
        });
        return resolve(true);
      } catch {}
      await sleep(500);
    }
    reject(new Error('Server did not start in time'));
  });
}

async function getFirstProductId(){
  const res = await fetch(`${BASE}/api/products?page=1&pageSize=1`);
  const data = await res.json();
  const first = (data.items || [])[0];
  return first?.id || 'hub-100';
}

async function main(){
  // Ensure output folder
  if(!existsSync('screenshots')) mkdirSync('screenshots');

  // Optionally start mock server
  const srv = START_MOCK ? spawn(process.execPath, ['scripts/mockServer.mjs'], { stdio: 'inherit', env: { ...process.env, PORT: String(new URL(BASE).port || 4000) } }) : null;
  try {
    await waitForServer(`${BASE}/`);

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    // Home
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.hero__title', { timeout: 15000 }).catch(()=>{});
    await page.screenshot({ path: 'screenshots/home.png', fullPage: true });

    // Catalog
    await page.goto(`${BASE}/#/catalog`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.products-grid', { timeout: 15000 }).catch(()=>{});
    await page.screenshot({ path: 'screenshots/catalog.png', fullPage: true });

    // Product
    const pid = await getFirstProductId();
    await page.goto(`${BASE}/#/product/${encodeURIComponent(pid)}`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1', { timeout: 15000 }).catch(()=>{});
    await page.screenshot({ path: `screenshots/product-${String(pid)}.png`, fullPage: true });

    // Add to cart for next pages
    const addBtn = await page.$('text/Add to cart');
    if(addBtn){ await addBtn.click(); }

    // Cart
    await page.goto(`${BASE}/#/cart`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.cart-grid,.empty', { timeout: 15000 }).catch(()=>{});
    await page.screenshot({ path: 'screenshots/cart.png', fullPage: true });

    // Checkout (with cart populated)
    await page.goto(`${BASE}/#/checkout`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h2, .empty', { timeout: 15000 }).catch(()=>{});
    await page.screenshot({ path: 'screenshots/checkout.png', fullPage: true });

    // Fill checkout flow (COD to avoid card fields)
    const name = await page.$('#name');
    const email = await page.$('#email');
    const phone = await page.$('#phone');
    const addr = await page.$('#addr');
    const pay = await page.$('#pay');
    if(name && email && phone && addr && pay){
      await name.type('Admin Test');
      await email.type('admin@example.com');
      await phone.type('+39 333 123 4567');
      await addr.type('Via Roma 1, Milano');
      await pay.select('cod');
      const agree = await page.$('input[type="checkbox"]');
      if(agree) await agree.click();
      await page.click('text/Place order');
      await page.waitForSelector('text/Thank you!', { timeout: 15000 }).catch(()=>{});
      await page.screenshot({ path: 'screenshots/checkout-success.png', fullPage: true });
    }

    // About
    await page.goto(`${BASE}/#/about`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h2', { timeout: 15000 }).catch(()=>{});
    await page.screenshot({ path: 'screenshots/about.png', fullPage: true });

    // Admin: if credentials provided, sign in via UI; else skip login
    await page.goto(`${BASE}/#/profile`, { waitUntil: 'networkidle2' });
    if(ADMIN_EMAIL && ADMIN_PASSWORD){
      // Ensure Login tab is active and form visible
      const loginTab = await page.$('text/Login');
      if(loginTab) await loginTab.click();
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', ADMIN_EMAIL);
      await page.type('input[type="password"]', ADMIN_PASSWORD);
      await page.click('text/Sign in');
      // Wait briefly for redirect/render
      await sleep(800);
    }
    await page.goto(`${BASE}/#/admin`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('text/Admin area — protected', { timeout: 15000 }).catch(()=>{});
    await page.screenshot({ path: 'screenshots/admin.png', fullPage: true });

    // Admin → Orders tab
    const ordersTab = await page.$('text/Orders');
    if(ordersTab){
      await ordersTab.click();
      await page.waitForSelector('.card, .empty', { timeout: 15000 }).catch(()=>{});
      await page.screenshot({ path: 'screenshots/admin-orders.png', fullPage: true });
    }

    // Admin → Categories tab
    const categoriesTab = await page.$('text/Categories');
    if(categoriesTab){
      await categoriesTab.click();
      await page.waitForSelector('input[placeholder="Add category"], .empty', { timeout: 15000 }).catch(()=>{});
      await page.screenshot({ path: 'screenshots/admin-categories.png', fullPage: true });
    }

    await browser.close();
  } finally {
    // Cleanup server
    try { if(srv) srv.kill('SIGTERM'); } catch {}
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
