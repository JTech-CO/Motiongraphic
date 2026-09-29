#!/usr/bin/env node
/**
 * Frame-accurate MP4 render with no npm dependencies.
 * Drives a local Chrome/Edge over the Chrome DevTools Protocol (what Puppeteer uses internally):
 *   seek(i / fps) → captureScreenshot → pipe into ffmpeg, then mux the WAV rendered
 *   in-page by OfflineAudioContext.
 * FPS, duration and stage size are read from the page (SX.T), so this file can be copied
 * into another motion-graphic project unchanged — only NAME below differs per project.
 *
 * Requirements: Node 22+ (global WebSocket), Chrome or Edge, ffmpeg on PATH.
 *
 *   node tools/render.mjs                         # → out/<NAME>.mp4 (+ .wav)
 *   node tools/render.mjs --from 8 --to 12        # partial range
 *   node tools/render.mjs --stills 1.2,5.9,23.5   # PNG stills → out/stills/
 *   node tools/render.mjs --wav                   # WAV only → out/<NAME>.wav
 *
 * Env: CHROME_PATH, FFMPEG_PATH
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'genesis-2015-2026'; // output basename for this project

// Replaced by the page's SX.T once it has loaded
let FPS = 30;
let DURATION = 25;
let W = 1920;
let H = 1080;

// ---------- args ----------
const argv = process.argv.slice(2);
const arg = (name, def = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};
const outDir = path.resolve(ROOT, arg('outdir', 'out'));
const outFile = path.resolve(outDir, arg('out', `${NAME}.mp4`));
const from = Math.max(0, Number(arg('from', 0)));
const toArg = arg('to');
const quality = Math.min(100, Math.max(50, Number(arg('quality', 92))));
const stills = arg('stills');
const wavOnly = arg('wav') === true;

// ---------- static server (loopback only, no path traversal) ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function serve() {
  const server = http.createServer((req, res) => {
    let p;
    try {
      p = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (p.endsWith('/')) p += 'index.html';
    const file = path.resolve(ROOT, `.${p}`);
    if (!file.startsWith(ROOT + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// ---------- browser ----------
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const c = {
    win32: [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'],
  }[process.platform] || [];
  const hit = c.find((p) => fs.existsSync(p));
  if (!hit) throw new Error('Chrome/Edge not found. Set CHROME_PATH.');
  return hit;
}

async function launchChrome() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sx-render-'));
  const proc = spawn(findChrome(), [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--mute-audio',
    '--force-device-scale-factor=1',
    `--window-size=${W},${H}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not expose DevTools in time')), 30000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    proc.on('exit', (code) => reject(new Error(`Chrome exited (${code})`)));
  });
  return { proc, wsUrl, userDir };
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.seq = 0;
    this.pending = new Map();
    this.waiters = [];
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else resolve(msg.result);
      } else if (msg.method) {
        this.waiters = this.waiters.filter((w) => !(w.method === msg.method && (w.resolve(msg.params), true)));
      }
    };
  }
  open() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    this.ws.send(JSON.stringify(msg));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  once(method) {
    return new Promise((resolve) => this.waiters.push({ method, resolve }));
  }
  close() {
    this.ws.close();
  }
}

// ---------- main ----------
async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await serve();
  const port = server.address().port;
  const chrome = await launchChrome();
  const cdp = new CDP(chrome.wsUrl);
  await cdp.open();

  const cleanup = () => {
    try {
      cdp.close();
    } catch {}
    chrome.proc.kill();
    server.close();
    setTimeout(() => fs.rmSync(chrome.userDir, { recursive: true, force: true }), 500);
  };

  try {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (m, p) => cdp.send(m, p, sessionId);
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    const loaded = cdp.once('Page.loadEventFired');
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?capture` });
    await loaded;
    for (let i = 0; i < 200 && !(await evaluate('window.SX_READY === true')); i++) await new Promise((r) => setTimeout(r, 50));
    ({ FPS, DURATION, W, H } = await evaluate('({ FPS: SX.T.FPS, DURATION: SX.T.DURATION, W: SX.T.W, H: SX.T.H })'));
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    const to = Math.min(DURATION, toArg == null ? DURATION : Number(toArg));
    console.log(`${W}×${H} · ${FPS}fps · ${DURATION}s`);

    const frameAt = async (t, format = 'jpeg') => {
      await evaluate(`window.seek(${t}); new Promise((r) => { requestAnimationFrame(() => r(1)); setTimeout(() => r(0), 100); })`);
      const shot = await send('Page.captureScreenshot', {
        format,
        ...(format === 'jpeg' ? { quality } : {}),
        clip: { x: 0, y: 0, width: W, height: H, scale: 1 },
        optimizeForSpeed: format === 'jpeg',
      });
      return Buffer.from(shot.data, 'base64');
    };

    if (stills) {
      const dir = path.join(outDir, 'stills');
      fs.mkdirSync(dir, { recursive: true });
      for (const s of String(stills).split(',').map(Number).filter(Number.isFinite)) {
        const file = path.join(dir, `t_${s.toFixed(3)}.png`);
        fs.writeFileSync(file, await frameAt(s, 'png'));
        console.log(file);
      }
      return;
    }

    const wavPath = outFile.replace(/\.mp4$/i, '') + '.wav';
    fs.writeFileSync(wavPath, Buffer.from(await evaluate('SX.audio.renderWavBase64()'), 'base64'));
    console.log(`audio → ${wavPath}`);
    if (wavOnly) return;

    const f0 = Math.round(from * FPS);
    const f1 = Math.round(to * FPS);
    const ff = spawn(process.env.FFMPEG_PATH || 'ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-ss', String(f0 / FPS), '-t', String((f1 - f0) / FPS), '-i', wavPath,
      '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
      outFile,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const ffDone = once(ff, 'close');

    const t0 = Date.now();
    for (let i = f0; i < f1; i++) {
      const buf = await frameAt(i / FPS);
      if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
      if ((i - f0) % FPS === 0 || i === f1 - 1) {
        process.stdout.write(`\rframe ${String(i).padStart(3, '0')} / ${f1 - 1}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      }
    }
    ff.stdin.end();
    const [code] = await ffDone;
    process.stdout.write('\n');
    if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
    console.log(`video → ${outFile}`);
  } finally {
    cleanup();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
