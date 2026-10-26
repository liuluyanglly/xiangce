const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('=== Starting Master Verification Engine ===');
  const browser = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    'http://localhost:8080/index.html'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const data = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json', res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(body));
        }).on('error', reject);
      });
      const list = JSON.parse(data);
      const page = list.find(p => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  const ws = new (global.WebSocket)(wsUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));

  let msgId = 1;
  const callbacks = new Map();
  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const { resolve, reject } = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  await new Promise(r => setTimeout(r, 2200));

  async function evalJs(expr) {
    const res = await sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res.result ? res.result.value : null;
  }

  async function takeScreenshot(filename) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
    console.log('Saved screenshot:', filename);
  }

  // Step 1: Initial Heart
  console.log('Step 1: Capturing Initial Heart...');
  await takeScreenshot('verify_1_heart.png');

  // Step 2: Single-Click Carousel
  console.log('Step 2: Switching to Carousel (时光回廊)...');
  await evalJs(`document.querySelector('.nav-tab[data-shape="carousel"]').click()`);
  await new Promise(r => setTimeout(r, 1400));
  await takeScreenshot('verify_2_carousel.png');

  // Step 3: Single-Click Wave
  console.log('Step 3: Switching to Wave (时光波浪 3D 轮播传送带)...');
  await evalJs(`document.querySelector('.nav-tab[data-shape="wave"]').click()`);
  await new Promise(r => setTimeout(r, 1600));
  await takeScreenshot('verify_3_wave.png');

  // Step 4: Centered Local Showcase Dock
  console.log('Step 4: Triggering Centered Showcase Dock on photo...');
  const dockInfo = await evalJs(`
    (() => {
      const app = window.eternalApp || window.app;
      const item = app.state.photos[0];
      app.showLocalShowcase(item);
      const dock = document.getElementById('localShowcaseDock');
      return {
        title: document.getElementById('showcaseTitle')?.innerText,
        date: document.getElementById('showcaseDate')?.innerText,
        display: getComputedStyle(dock).display,
        opacity: getComputedStyle(dock).opacity,
        top: getComputedStyle(dock).top,
        left: getComputedStyle(dock).left,
        transform: getComputedStyle(dock).transform
      };
    })()
  `);
  console.log('Dock Info:', dockInfo);
  await new Promise(r => setTimeout(r, 800));
  await takeScreenshot('verify_4_showcase.png');

  // Step 5: Switch to Sphere (记忆星球)
  console.log('Step 5: Switching to Sphere (记忆星球)...');
  await evalJs(`document.querySelector('.nav-tab[data-shape="sphere"]').click()`);
  await new Promise(r => setTimeout(r, 1400));
  await takeScreenshot('verify_5_sphere.png');

  console.log('=== All 5 Verification Steps Completed Successfully! ===');
  ws.close();
  browser.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
