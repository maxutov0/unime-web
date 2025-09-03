// Simple screenshot capturer using Puppeteer.
// Usage:
// 1) npm i -D puppeteer
// 2) node scripts/captureScreens.mjs
// Screenshots will be saved under docs/screenshots/

import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('docs/screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function withBrowser(run){
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 } });
  try { return await run(browser); } finally { await browser.close(); }
}

async function capture(page, name){
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('Saved', file);
}

async function clickByText(page, selector, text){
  const handle = await page.$x(`//${selector}[contains(normalize-space(.), ${JSON.stringify(text)})]`);
  if(handle[0]) await handle[0].click();
}

async function typeAndEnter(page, selector, value){
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, value);
}

async function main(){
  const base = process.env.BASE_URL || 'http://localhost';
  await withBrowser(async (browser) => {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);

    // Home
    await page.goto(`${base}/#/`);
    await page.waitForSelector('#main');
    await capture(page, 'home');

    // Catalog
    await page.goto(`${base}/#/catalog`);
    await page.waitForSelector('#main .grid');
    await capture(page, 'catalog');

    // Product detail (first card)
    const firstCardLink = await page.$("a[href^='#/product/']");
    if(firstCardLink){ await firstCardLink.click(); await page.waitForSelector("img[alt][src]"); await capture(page, 'product'); }

    // Add to cart from product page (if available)
    await clickByText(page, 'button', 'Add to cart');
    // Cart
    await page.goto(`${base}/#/cart`);
    await page.waitForSelector('#main');
    await capture(page, 'cart');

    // Checkout
    await page.goto(`${base}/#/checkout`);
    await page.waitForSelector('#main');
    await capture(page, 'checkout');

    // About
    await page.goto(`${base}/#/about`);
    await page.waitForSelector('#main');
    await capture(page, 'about');

    // Profile (login)
    await page.goto(`${base}/#/profile`);
    await page.waitForSelector('form');
    // Try default admin credentials if present (update if different)
    try {
      await typeAndEnter(page, "input[placeholder='Email']", process.env.SCREEN_EMAIL || 'admin@example.com');
      await typeAndEnter(page, "input[placeholder='Password']", process.env.SCREEN_PASSWORD || 'admin123');
      await clickByText(page, 'button', 'Sign in');
      await page.waitForSelector("text=Hello");
    } catch {}
    await capture(page, 'profile');

    // Admin (if accessible)
    await page.goto(`${base}/#/admin`);
    await page.waitForSelector('#main');
    await capture(page, 'admin');

    // Orders page (profile orders list)
    await page.goto(`${base}/#/profile`);
    await page.waitForSelector('#main');
    await capture(page, 'profile-orders');
  });
}

main().catch(err => { console.error(err); process.exit(1); });

