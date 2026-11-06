// 장비 소개서 PDF 만들기: _site/products/sheet-<slug>.html 을 브라우저로 열어 A4 PDF로 저장
// 사용법: npm run build 후  npm run pdf   (결과: site/assets/pdf/<slug>.pdf)
// 필요: Playwright(크로미움). 없으면  npm i -D playwright && npx playwright install chromium
// 선택: 인터넷이 막힌 곳에서는 PRETENDARD_DIR=<pretendard 패키지의 dist 폴더> 로 글꼴을 로컬에서 읽음
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve('_site');
const outDir = path.resolve('site/assets/pdf');
fs.mkdirSync(outDir, { recursive: true });

const sheets = fs.readdirSync(path.join(root, 'products')).filter(f => /^sheet-.+\.html$/.test(f));
if (!sheets.length) { console.error('sheet-*.html 이 없습니다. 먼저 npm run build 를 실행하세요.'); process.exit(1); }

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/products/`;

const browser = await chromium.launch();
const ctx = await browser.newContext();
const fontDir = process.env.PRETENDARD_DIR;
if (fontDir) {
  await ctx.route(/pretendard@[^/]+\/dist\/(.*)$/, (route, req) => {
    const rel = req.url().match(/dist\/(.*)$/)[1].split('?')[0].replace('pretendard.min.css', 'pretendard.css');
    const f = path.join(fontDir, rel);
    fs.existsSync(f) ? route.fulfill({ path: f, contentType: f.endsWith('.css') ? 'text/css' : 'font/woff2' }) : route.abort();
  });
}
for (const f of sheets) {
  const slug = f.replace(/^sheet-/, '').replace(/\.html$/, '');
  const page = await ctx.newPage();
  await page.goto(base + f, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(outDir, slug + '.pdf');
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('PDF', slug, Math.round(fs.statSync(out).size / 1024) + 'KB');
  await page.close();
}
await browser.close();
server.close();
