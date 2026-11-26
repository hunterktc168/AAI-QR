const fs = require('fs');
const http = require('http');
const cp = require('child_process');

const bin = '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';
const port = 9258;
const proc = cp.spawn(bin, [
  '--headless',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=/tmp/qr-sign-render',
  'about:blank'
], { stdio: 'ignore' });

const cleanup = () => {
  try { proc.kill('SIGKILL'); } catch {}
};
process.on('exit', cleanup);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('Connecting to headless Chromium on port', port);
  let wsUrl;
  for (let i = 0; i < 40; i++) {
    try {
      const json = await new Promise((res, rej) =>
        http.get(`http://127.0.0.1:${port}/json/list`, (r) => {
          let d = '';
          r.on('data', (c) => d += c);
          r.on('end', () => res(JSON.parse(d)));
        }).on('error', rej)
      );
      if (json[0]?.webSocketDebuggerUrl) {
        wsUrl = json[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await sleep(150);
  }

  if (!wsUrl) {
    throw new Error('Could not get WebSocket debugger URL from headless Chromium.');
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((res) => ws.addEventListener('open', res));

  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    }
  });

  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const cur = ++id;
      pending.set(cur, { res, rej });
      ws.send(JSON.stringify({ id: cur, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://127.0.0.1:3000/sign-test ...');
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/sign-test' });

  // Wait until the page and helper are loaded
  for (let i = 0; i < 40; i++) {
    const check = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: 'typeof window !== "undefined" && typeof window.__renderSignToPngBase64 === "function"'
    });
    if (check.result?.value) {
      break;
    }
    await sleep(200);
  }

  // Ensure output directory exists
  if (!fs.existsSync('/sign-tests')) {
    fs.mkdirSync('/sign-tests', { recursive: true });
  }

  const targets = [
    { key: 'a', filename: '/sign-tests/sign-a-narrow-paragraph.png' },
    { key: 'b', filename: '/sign-tests/sign-b-damage-price-list.png' },
    { key: 'c', filename: '/sign-tests/sign-c-wifi-headline.png' }
  ];

  for (const t of targets) {
    console.log(`Rendering sign ${t.key} in browser at 300 DPI (2480x3508 px)...`);
    const evalRes = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `window.__renderSignToPngBase64('${t.key}')`
    });

    const b64 = evalRes.result?.value;
    if (!b64) {
      throw new Error(`Failed to render sign ${t.key}: ${JSON.stringify(evalRes)}`);
    }

    const buf = Buffer.from(b64, 'base64');
    fs.writeFileSync(t.filename, buf);
    console.log(`Saved ${t.filename} (${buf.length} bytes)`);
  }

  console.log('All 3 signs rendered and saved successfully in /sign-tests/');
  ws.close();
  cleanup();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  cleanup();
  process.exit(1);
});
