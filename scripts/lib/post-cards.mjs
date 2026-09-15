/**
 * Post images, rendered from HTML.
 *
 * Facebook will not take an SVG, so these end up as PNG. They are written as
 * HTML and rasterised by the headless Chrome already on the machine, rather
 * than drawn with an image library, for one reason: the cards then use the
 * SAME self-hosted Outfit file and the SAME colour tokens as the app. A card
 * drawn with a different renderer drifts from the product within a month, and
 * a page whose images do not match its app looks like a reseller.
 *
 * No new dependency. If no rasteriser is present the HTML is still written and
 * the caller is told, so the run never silently produces nothing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

/** Facebook's landscape size. */
const W = 1200, H = 630;

/**
 * Escape anything interpolated into a card.
 *
 * Card text can come from the database (see the data-backed posts in
 * post-library.mjs), and `testers.wants_help_with` is a free-text column that
 * anyone can write to with the public anon key. Unescaped, a submitted value
 * of `<script src=//evil/a.js></script>` becomes a script tag in a page this
 * file then hands to a browser. Everything that is not a hardcoded colour goes
 * through here.
 */
export const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** The app's real palette. Keep in step with :root in src/index.css. */
export const C = {
  green50: '#ecfdf5', green100: '#d1fae5', green200: '#a7f3d0',
  green500: '#10b981', green600: '#059669', green700: '#047857', green800: '#065f46',
  amber50: '#fffbeb', amber100: '#fef3c7', amber200: '#fde68a', amber600: '#d97706',
  indigo50: '#eef2ff', indigo100: '#e0e7ff', indigo600: '#4f46e5',
  body: '#f0f5eb', card: '#ffffff',
  text: '#1a2e05', text2: '#4a6741', muted: '#7c9a6e', inverse: '#ffffff',
};

/**
 * The font is inlined as a data URI. Chrome renders these from a temp file, so
 * a relative font path would resolve against the wrong directory and silently
 * fall back to a system face — which is exactly the kind of failure you only
 * notice after the post is public.
 */
function fontFace() {
  const p = resolve(ROOT, 'public/fonts/outfit-latin.woff2');
  if (!existsSync(p)) return '';
  const b64 = readFileSync(p).toString('base64');
  return `@font-face{font-family:'Outfit';font-style:normal;font-weight:400 900;
    src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}

function logoDataUri() {
  const p = resolve(ROOT, 'public/pwa-192x192.png');
  if (!existsSync(p)) return '';
  return `data:image/png;base64,${readFileSync(p).toString('base64')}`;
}

const SHELL = (inner, opts = {}) => `<!doctype html><html><head><meta charset="utf-8"><style>
  ${fontFace()}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;font-family:'Outfit',system-ui,sans-serif;
       background:${opts.bg || C.body};color:${opts.fg || C.text};
       display:flex;flex-direction:column;justify-content:center;
       padding:76px 84px;position:relative;overflow:hidden}
  .glow{position:absolute;right:-200px;top:-200px;width:660px;height:660px;
        background:radial-gradient(circle,${opts.glow || C.green100} 0%,rgba(255,255,255,0) 70%)}
  .brand{position:absolute;left:84px;top:56px;display:flex;align-items:center;gap:5px}
  .brand img{width:44px;height:44px;border-radius:12px}
  .brand span{font-size:32px;font-weight:800;letter-spacing:-.02em;color:${opts.fg || C.text}}
  .flag{position:absolute;right:84px;bottom:56px;display:flex;gap:8px;align-items:flex-start}
  .flag i{display:block;flex:none;width:22px;height:44px;border-radius:5px}
  h1{font-size:${opts.size || 70}px;font-weight:900;line-height:1.06;letter-spacing:-.03em;
     max-width:${opts.width || '17ch'};position:relative;margin-top:14px}
  .sub{margin-top:26px;font-size:29px;line-height:1.4;color:${opts.sub || C.text2};
       max-width:28ch;position:relative}
  /* align-self, because body is a flex column: without it the pill stretches
     the full 1200px instead of hugging its text. */
  .kicker{display:inline-flex;align-self:flex-start;padding:11px 24px;font-size:21px;
          font-weight:800;letter-spacing:.07em;text-transform:uppercase;
          border-radius:999px;position:relative}
  ${inner.css || ''}
</style></head><body>
  <div class="glow"></div>
  <div class="brand"><img src="${logoDataUri()}" alt=""><span>exiaCamer</span></div>
  ${inner.html}
  <div class="flag"><i style="background:${opts.flagGreen || C.green600}"></i><i style="background:#f43f5e"></i><i style="background:#f59e0b"></i></div>
</body></html>`;

/* ——— Card templates ——— */

export const CARDS = {
  /** A plain claim, in the product's voice. The workhorse. */
  statement: ({ kicker, title, sub }) => SHELL({
    html: `${kicker ? `<span class="kicker" style="color:${C.green700};background:${C.card};border:2px solid ${C.green200}">${esc(kicker)}</span>` : ''}
           <h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}`,
  }),

  /** One number, large. Only ever rendered from a real figure. */
  stat: ({ value, label, sub }) => SHELL({
    css: `.v{font-size:210px;font-weight:900;line-height:.9;letter-spacing:-.05em;
             color:${C.green600};position:relative;align-self:flex-start}
          .l{margin-top:18px;font-size:40px;font-weight:800;position:relative}`,
    html: `<div class="v">${esc(value)}</div><div class="l">${esc(label)}</div>
           ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}`,
  }),

  /** A phonics tip. Useful whether or not anyone installs anything. */
  tip: ({ title, sub }) => SHELL({
    css: `.k{color:${C.amber600};background:${C.amber50};border:2px solid ${C.amber200}}`,
    html: `<span class="kicker k">Reading tip</span><h1>${esc(title)}</h1>
           ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}`,
  }, { glow: C.amber100 }),

  /** Naming what is unfinished. The page's signature move. */
  honest: ({ title, sub }) => SHELL({
    css: `.k{color:${C.amber600};background:${C.card};border:2px solid ${C.amber200}}`,
    html: `<span class="kicker k">What is not finished</span><h1>${esc(title)}</h1>
           ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}`,
  }, { bg: C.amber50, glow: C.amber200 }),

  /** The ask. Inverted, so it is visibly different from the rest. */
  cta: ({ title, sub }) => SHELL({
    css: `.k{color:${C.green700};background:${C.card};border:0}`,
    html: `<span class="kicker k">Free · no account</span><h1>${esc(title)}</h1>
           ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}`,
    // flagGreen: the brand green vanishes against a green card, leaving what
    // looks like a two-colour flag.
  }, { bg: C.green600, fg: C.inverse, sub: 'rgba(255,255,255,.88)',
       glow: 'rgba(255,255,255,.14)', flagGreen: C.green200 }),
};

/* ——— Rasterising ——— */

let RASTERISER;

/**
 * Finds a rasteriser once, and measures it.
 *
 * `--window-size` is the WINDOW, not the viewport: Chrome keeps some of it for
 * itself, so asking for 1200x630 renders the page into about 1200x543 and pads
 * the rest. Anything positioned near the bottom of the card -- which is most of
 * the interesting furniture -- gets quietly cut in half. It cost an afternoon
 * to notice, because the PNG is still exactly 1200x630 and only the content is
 * missing.
 *
 * The gap is ~87px on this build, but it is a browser detail and not a
 * constant, so it is measured rather than hardcoded: a page that reports its
 * own innerHeight, read back through --dump-dom.
 */
function rasteriser() {
  if (RASTERISER !== undefined) return RASTERISER;
  // Probed with `which` rather than a shell, so no binary name is ever
  // concatenated into a command line.
  const bin = ['google-chrome', 'chromium', 'chromium-browser', 'google-chrome-stable']
    .find((b) => {
      try { execFileSync('which', [b], { stdio: 'pipe' }); return true; } catch { return false; }
    });
  if (!bin) { RASTERISER = null; return RASTERISER; }

  let chromeHeight = 0;
  let probeDir = null;
  try {
    // mkdtemp, not a fixed name in /tmp: a predictable path in a world-
    // writable directory can be pre-created as a symlink by another user on a
    // shared machine, and writeFileSync would follow it.
    probeDir = mkdtempSync(join(tmpdir(), 'lexia-probe-'));
    const probe = join(probeDir, 'viewport.html');
    writeFileSync(probe, '<!doctype html><body><script>'
      + 'document.body.textContent="VP:"+window.innerHeight;</script>');
    const dom = execFileSync(bin, [
      '--headless=new', '--disable-gpu', '--host-resolver-rules=MAP * ~NOTFOUND',
      '--window-size=1200,800', '--dump-dom', `file://${probe}`,
    ], { stdio: 'pipe', timeout: 60000 }).toString();
    const m = dom.match(/VP:(\d+)/);
    if (m) chromeHeight = Math.max(0, 800 - Number(m[1]));
  } catch { /* fall back to no compensation; cropping still fixes it */ }
  finally {
    if (probeDir) { try { rmSync(probeDir, { recursive: true, force: true }); } catch { /* ignore */ } }
  }

  RASTERISER = { bin, chromeHeight, crop: cropper() };
  return RASTERISER;
}

/** ImageMagick, if it is here. Optional: it only trims the padding. */
function cropper() {
  for (const bin of ['magick', 'convert']) {
    try { execFileSync('which', [bin], { stdio: 'pipe' }); return bin; } catch { /* next */ }
  }
  return null;
}

export function canRasterise() { return rasteriser() !== null; }

/**
 * Writes `html` to `htmlPath` and, when possible, a PNG beside it.
 * Returns true when the PNG was produced.
 */
export function render(html, htmlPath, pngPath) {
  writeFileSync(htmlPath, html);
  const r = rasteriser();
  if (!r) return false;
  const winH = H + r.chromeHeight;
  try {
    execFileSync(r.bin, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars',
      // Belt and braces around escaping. Everything a card needs is already
      // inlined, so the renderer never has a legitimate reason to touch the
      // network; blocking name resolution outright means a script tag that
      // somehow survives escaping still cannot fetch anything or phone home.
      // The sandbox stays ON for the same reason: this page is rendered on a
      // developer's own laptop.
      '--host-resolver-rules=MAP * ~NOTFOUND', '--disable-extensions',
      '--virtual-time-budget=3000',
      `--window-size=${W},${winH}`, `--screenshot=${pngPath}`, `file://${htmlPath}`,
    ], { stdio: 'pipe', timeout: 60000 });
    if (!existsSync(pngPath)) return false;

    // Trim the padding Chrome added below the card. Without ImageMagick the
    // image is simply taller; the extra strip is the card's own background, so
    // it still looks right, just not exactly 1.91:1.
    if (r.crop && r.chromeHeight > 0) {
      try {
        execFileSync(r.crop, [pngPath, '-crop', `${W}x${H}+0+0`, '+repage', pngPath],
          { stdio: 'pipe', timeout: 60000 });
      } catch { /* keep the untrimmed image */ }
    }
    unlinkSync(htmlPath);
    return true;
  } catch { /* fall through; the HTML is still on disk */ }
  return false;
}
