/* Uji otomatis di browser sungguhan (Chrome headless).
   Jalankan:
     1) serve folder ini:  python3 -m http.server 8080 --bind 0.0.0.0
     2) npm install puppeteer
     3) node tools/qa-browser-test.js
   Memeriksa: etalase tanpa form, tap→WA, filter, draft tidak bocor,
   CRUD admin, kompresi foto, export buang catatan internal, undo, urutan,
   loop admin→etalase, fallback tanpa jaringan, layout mobile.
*/
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const BASE = 'http://127.0.0.1:8080';
const OUT = __dirname;
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/properties.json'), 'utf8'));
const waNumber = String(catalog.meta.wa).replace(/[^0-9]/g, '');

const results = [];
function check(name, cond, extra) {
  results.push({ name, ok: !!cond, extra });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : ''));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  // ---------------- STOREFRONT ----------------
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));

  // capture window.open instead of actually navigating to WhatsApp
  await page.evaluateOnNewDocument(() => {
    window.__wa = [];
    window.open = (u) => { window.__wa.push(u); return { closed: false }; };
  });

  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.prop');

  check('storefront: no JS errors', errs.length === 0, errs);
  const metaRendered = await page.evaluate(() => ({
    brand: document.querySelector('[data-brand]').textContent,
    tagline: document.querySelector('[data-tagline]').textContent,
    city: document.querySelector('[data-city]').textContent,
    hours: document.querySelector('[data-hours]').textContent
  }));
  check('storefront: metadata comes from properties.json',
    metaRendered.brand === catalog.meta.brand &&
    metaRendered.tagline === catalog.meta.tagline &&
    metaRendered.city === catalog.meta.city &&
    metaRendered.hours === catalog.meta.hours,
    metaRendered);
  const cards = await page.$$eval('.prop', els => els.length);
  check('storefront: 4 shelf cards (5 published - 1 featured)', cards === 4, cards);
  const feat = await page.$eval('#featured', el => el.textContent.includes('PILIHAN KAMI'));
  check('storefront: featured pick rendered', feat);
  const chips = await page.$$eval('#chips .chip', els => els.map(e => e.textContent.trim()));
  check('storefront: chips built from data', chips.length >= 6, chips);
  const noInputs = await page.$$eval('input, textarea, select', els => els.length);
  check('storefront: ZERO typing fields (no form)', noInputs === 0, noInputs);

  // draft property must not leak
  const bodyText = await page.evaluate(() => document.body.innerText);
  check('storefront: draft KP-06 hidden', !bodyText.includes('KP-06') && !bodyText.includes('Kampus UNY'));
  check('storefront: honest catch shown', bodyText.includes('tanpa jendela'));
  check('storefront: internal notes not leaked', !bodyText.includes('Bu Retno'));

  // 1-tap WA from a card
  await page.click('.prop .btn[data-wa]');
  let wa = await page.evaluate(() => window.__wa);
  check('storefront: card tap opens wa.me', wa.length === 1 && wa[0].startsWith('https://wa.me/' + waNumber + '?text='), wa[0] && wa[0].slice(0, 60));
  const decoded = decodeURIComponent(wa[0].split('text=')[1]);
  check('storefront: message carries property code + SRC', /KP-0\d/.test(decoded) && decoded.includes('SRC:WEB-'), decoded);
  check('storefront: message asks no dates upfront', !/check-in:/i.test(decoded));

  // landmark chip filter
  await page.evaluate(() => [...document.querySelectorAll('#chips .chip')].find(c => c.textContent.includes('RS Bethesda')).click());
  await new Promise(r => setTimeout(r, 120));
  const afterFilter = await page.$$eval('.prop', els => els.length);
  check('storefront: landmark chip filters to 1', afterFilter === 1, afterFilter);
  const featGone = await page.$eval('#featured', el => el.innerHTML.trim() === '');
  check('storefront: featured hidden while filtering', featGone);

  // long-stay chip
  await page.evaluate(() => [...document.querySelectorAll('#chips .chip')].find(c => c.textContent.includes('Semua')).click());
  await page.evaluate(() => document.querySelector('#chips .chip.ls').click());
  await new Promise(r => setTimeout(r, 120));
  const lsCount = await page.$$eval('.prop', els => els.length);
  const allLS = await page.$$eval('.prop', els => els.every(e => e.textContent.includes('Bisa menginap lama')));
  check('storefront: long-stay chip filters to 4 long-stay rooms', lsCount === 4 && allLS, { lsCount, allLS });
  await page.evaluate(() => window.__wa = []);
  await page.click('#helpBtn');
  const helpMsg = decodeURIComponent((await page.evaluate(() => window.__wa))[0].split('text=')[1]);
  check('storefront: help message mentions long stay context', helpMsg.includes('menginap lama'), helpMsg);

  await page.evaluate(() => document.querySelector('#chips .chip.ls').click());
  await new Promise(r => setTimeout(r, 150));
  await page.screenshot({ path: path.join(OUT, 'shot-store.png'), fullPage: true });

  // ---------------- ADMIN ----------------
  const adm = await browser.newPage();
  await adm.setViewport({ width: 1280, height: 950, deviceScaleFactor: 1 });
  const aerrs = [];
  adm.on('console', m => { if (m.type() === 'error') aerrs.push(m.text()); });
  adm.on('pageerror', e => aerrs.push('PAGEERROR: ' + e.message));
  adm.on('dialog', async d => { await d.accept(); });
  await adm.goto(BASE + '/admin.html', { waitUntil: 'networkidle0' });
  await adm.waitForSelector('.row');
  check('admin: no JS errors', aerrs.length === 0, aerrs);

  const stats = await adm.evaluate(() => ({
    total: document.querySelector('#statTotal').textContent,
    pub: document.querySelector('#statPub').textContent,
    stale: document.querySelector('#statStale').textContent
  }));
  check('admin: stats correct', stats.total === '6 kamar' && stats.pub === '5 tayang' && stats.stale === '1 perlu cek', stats);

  // select + score
  await adm.click('.row');
  await adm.waitForSelector('#editor:not(.hide)');
  const sc = await adm.$eval('#scoreNum', e => Number(e.textContent));
  check('admin: score computed for KP-01 (no photo → ≤85)', sc === 85, sc);
  const gate = await adm.$eval('#gateBanner', e => e.textContent);
  check('admin: quality gate flags missing photo', gate.includes('foto'), gate.slice(0, 90));

  // edit name + save
  await adm.$eval('#f_name', el => { el.value = 'RedDoorz Sardjito EDITED'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await adm.click('#saveBtn');
  await new Promise(r => setTimeout(r, 150));
  const renamed = await adm.evaluate(() => document.body.innerText.includes('RedDoorz Sardjito EDITED'));
  check('admin: edit + save reflected in list', renamed);

  // photo upload → compression
  const png = path.join(OUT, 'test-photo.png');
  fs.writeFileSync(png, Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64'));
  const fileInput = await adm.$('#f_photoFile');
  await fileInput.uploadFile(path.join(OUT, 'test-photo-big.png'));
  await new Promise(r => setTimeout(r, 600));
  const photoInfo = await adm.$eval('#photoInfo', e => e.textContent);
  check('admin: photo compressed to data URL', photoInfo.includes('KB'), photoInfo);
  const photoVal = await adm.$eval('#f_photo', e => e.value.slice(0, 22));
  check('admin: photo stored as data:image', photoVal.startsWith('data:image/'), photoVal);
  const bigIn = fs.statSync(path.join(OUT,'test-photo-big.png')).size;
  const bigOut = await adm.$eval('#f_photo', e => Math.round(e.value.length * 0.75));
  check('admin: 1400px photo compressed smaller than source', bigOut < bigIn * 0.5, { inKB: Math.round(bigIn/1024), outKB: Math.round(bigOut/1024) });
  await adm.click('#saveBtn');
  await new Promise(r => setTimeout(r, 150));
  const sc2 = await adm.$eval('#scoreNum', e => Number(e.textContent));
  check('admin: score rises to 100 with photo', sc2 === 100, sc2);

  // add new
  await adm.click('#addBtn');
  await new Promise(r => setTimeout(r, 200));
  const newCode = await adm.$eval('#f_code', e => e.value);
  check('admin: new property gets next code', newCode === 'KP-07', newCode);
  await adm.evaluate(() => {
    const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#f_name', 'Kamar QA Uji Coba'); set('#f_landmark', 'RS Sardjito'); set('#f_area', 'Jl. QA');
    set('#f_price', '132000'); set('#f_walkMin', '5');
    set('#f_catch', 'Kamar mandi di luar, air dingin pagi hari.');
    set('#f_verdict', 'Untuk uji coba otomatis.');
    set('#f_notes', 'RAHASIA INTERNAL — tidak boleh publik');
    document.querySelector('#f_published').checked = true;
    document.querySelector('#f_longStay').checked = true;
    document.querySelector('#f_verifiedAt').value = new Date().toISOString().slice(0, 10);
  });
  await adm.click('#saveBtn');
  await new Promise(r => setTimeout(r, 200));
  const total2 = await adm.$eval('#statTotal', e => e.textContent);
  check('admin: add increases total to 7', total2 === '7 kamar', total2);

  // featured exclusivity
  await adm.evaluate(() => { document.querySelector('#f_featured').checked = true; });
  await adm.click('#saveBtn');
  await new Promise(r => setTimeout(r, 150));
  const featCount = await adm.evaluate(() => JSON.parse(localStorage.getItem('kp.catalog.v1')).properties.filter(p => p.featured).length);
  check('admin: only one featured allowed', featCount === 1, featCount);

  // export strips internal notes
  const exported = await adm.$eval('#jsonOut', e => JSON.parse(e.textContent));
  const hasNotes = JSON.stringify(exported).includes('RAHASIA INTERNAL');
  check('admin: public export strips internal notes', !hasNotes);
  check('admin: export keeps new property', exported.properties.some(p => p.name === 'Kamar QA Uji Coba'));
  const backup = await adm.evaluate(() => JSON.parse(localStorage.getItem('kp.catalog.v1')));
  check('admin: local draft KEEPS internal notes', JSON.stringify(backup).includes('RAHASIA INTERNAL'));

  // delete + undo
  await adm.click('#delBtn');
  await new Promise(r => setTimeout(r, 250));
  const total3 = await adm.$eval('#statTotal', e => e.textContent);
  check('admin: delete removes row', total3 === '6 kamar', total3);
  await adm.click('#undoBtn');
  await new Promise(r => setTimeout(r, 250));
  const total4 = await adm.$eval('#statTotal', e => e.textContent);
  check('admin: undo restores row', total4 === '7 kamar', total4);

  // reorder
  const beforeOrder = await adm.evaluate(() => JSON.parse(localStorage.getItem('kp.catalog.v1')).properties.map(p => p.code + ':' + p.order).join(','));
  await adm.evaluate(() => document.querySelectorAll('[data-mv="up"]')[2].click());
  await new Promise(r => setTimeout(r, 200));
  const afterOrder = await adm.evaluate(() => JSON.parse(localStorage.getItem('kp.catalog.v1')).properties.map(p => p.code + ':' + p.order).join(','));
  check('admin: reorder changes order values', beforeOrder !== afterOrder, { beforeOrder, afterOrder });

  // search + filter
  await adm.type('#q', 'Bethesda');
  await new Promise(r => setTimeout(r, 200));
  const searched = await adm.$$eval('.row', els => els.length);
  check('admin: search narrows list', searched === 1, searched);
  await adm.$eval('#q', el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await adm.evaluate(() => [...document.querySelectorAll('.fchip')].find(c => c.dataset.f === 'stale').click());
  await new Promise(r => setTimeout(r, 200));
  const staleRows = await adm.$$eval('.row', els => els.length);
  check('admin: stale filter finds 1', staleRows === 1, staleRows);
  await adm.evaluate(() => [...document.querySelectorAll('.fchip')].find(c => c.dataset.f === 'all').click());

  // meta save
  await adm.evaluate(() => [...document.querySelectorAll('.tab')].find(t => t.dataset.tab === 'setting').click());
  await adm.$eval('#m_wa', el => { el.value = '628999888777'; });
  await adm.click('#saveMetaBtn');
  await new Promise(r => setTimeout(r, 150));
  const savedWa = await adm.evaluate(() => JSON.parse(localStorage.getItem('kp.catalog.v1')).meta.wa);
  check('admin: meta WA saved', savedWa === '628999888777', savedWa);
  const dirtyBanner = await adm.$eval('#srcBanner', e => e.textContent);
  check('admin: banner warns about uncommitted changes', dirtyBanner.includes('belum di-commit'), dirtyBanner.slice(0,90));
  await adm.evaluate(() => [...document.querySelectorAll('.tab')].find(t => t.dataset.tab === 'kamar').click());
  await new Promise(r => setTimeout(r, 200));
  await adm.screenshot({ path: path.join(OUT, 'shot-admin.png'), fullPage: false });

  // ---------------- FULL LOOP: admin draft → storefront ----------------
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const errs2 = [];
  page2.on('pageerror', e => errs2.push(e.message));
  await page2.evaluateOnNewDocument(() => { window.__wa = []; window.open = u => { window.__wa.push(u); return {}; }; });
  await page2.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  await page2.waitForSelector('.prop');
  const loopText = await page2.evaluate(() => document.body.innerText);
  check('LOOP: admin edit appears on storefront', loopText.includes('Kamar QA Uji Coba') && loopText.includes('EDITED'));
  check('LOOP: new featured is the QA property', (await page2.$eval('#featured', e => e.textContent)).includes('Kamar QA'));
  await page2.evaluate(() => window.__wa = []);
  await page2.click('#chatBtn');
  const waNew = (await page2.evaluate(() => window.__wa))[0];
  check('LOOP: storefront uses new WA number', waNew.includes('wa.me/628999888777'), waNew.slice(0, 45));
  check('LOOP: no JS errors on storefront', errs2.length === 0, errs2);
  const leak = await page2.evaluate(() => document.body.innerText.includes('RAHASIA'));
  check('LOOP: internal note never rendered', !leak);
  const draftBanner = await page2.evaluate(() => document.body.innerText.includes('Mode pratinjau'));
  check('LOOP: storefront shows draft-preview banner for owner', draftBanner);
  const noDraftBanner = await page.evaluate(() => document.body.innerText.includes('Mode pratinjau'));
  check('storefront: no draft banner for clean visitor', !noDraftBanner);
  await page2.screenshot({ path: path.join(OUT, 'shot-store-after.png'), fullPage: true });

  // ---------------- OFFLINE FALLBACK (no network) ----------------
  const off = await browser.newPage();
  await off.setRequestInterception(true);
  off.on('request', r => { if (r.url().includes('properties.json')) r.abort(); else r.continue(); });
  const offErrs = [];
  off.on('pageerror', e => offErrs.push(e.message));
  await off.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));
  const offCards = await off.$$eval('.prop', els => els.length);
  check('offline: embedded seed fallback renders', offCards >= 4, offCards);
  const offBrand = await off.$eval('[data-brand]', e => e.textContent);
  check('offline: fallback uses current brand metadata', offBrand === catalog.meta.brand, offBrand);
  check('offline: no JS errors', offErrs.length === 0, offErrs);

  // ---------------- FRESH CONTEXT: reads real JSON file, mobile admin layout ----------------
  const ctx = await browser.createBrowserContext();
  const fresh = await ctx.newPage();
  const fErrs = [];
  fresh.on('pageerror', e => fErrs.push(e.message));
  fresh.on('console', m => { if (m.type()==='error') fErrs.push(m.text()); });
  await fresh.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await fresh.goto(BASE + '/admin.html', { waitUntil: 'networkidle0' });
  await fresh.waitForSelector('.row');
  const srcTxt = await fresh.$eval('#srcBanner', e => e.textContent);
  check('fresh: admin loads data/properties.json (no local draft)', srcTxt.includes('data/properties.json'), srcTxt.slice(0,80));
  check('fresh: no console/JS errors incl. favicon', fErrs.length === 0, fErrs);
  const overflow = await fresh.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('mobile admin: no horizontal overflow', overflow <= 1, overflow);
  await fresh.click('.row');
  await new Promise(r => setTimeout(r, 400));
  const editorVisible = await fresh.$eval('#editor', e => !e.classList.contains('hide'));
  check('mobile admin: editor reachable', editorVisible);
  const overflow2 = await fresh.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('mobile admin: no overflow with editor open', overflow2 <= 1, overflow2);
  await fresh.screenshot({ path: path.join(OUT, 'shot-admin-mobile.png'), fullPage: false });
  // offline admin (bare-file behaviour): must still be populated from embedded seed
  const oaCtx = await browser.createBrowserContext();
  const offAdm = await oaCtx.newPage();
  await offAdm.setRequestInterception(true);
  offAdm.on('request', r => { if (r.url().includes('properties.json')) r.abort(); else r.continue(); });
  const oaErrs = [];
  offAdm.on('pageerror', e => oaErrs.push(e.message));
  await offAdm.goto(BASE + '/admin.html', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 700));
  const oaRows = await offAdm.$$eval('.row', els => els.length);
  check('offline admin: embedded seed populates list', oaRows === 5, oaRows);
  const oaBrand = await offAdm.$eval('#m_brand', e => e.value);
  check('offline admin: fallback uses current brand metadata', oaBrand === catalog.meta.brand, oaBrand);
  check('offline admin: no JS errors', oaErrs.length === 0, oaErrs);
  await offAdm.close();
  await oaCtx.close();

  await ctx.close();

  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log('\n==== ' + (results.length - failed.length) + '/' + results.length + ' passed ====');
  if (failed.length) { console.log('FAILURES:', failed.map(f => f.name)); process.exit(1); }
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
