/**
 * Aracının Node girişi. Geliştirme sırasında yerelde, yayında sabit IP'li
 * sunucuda aynı dosya çalışır.
 *
 *   FATSECRET_CLIENT_ID=... FATSECRET_CLIENT_SECRET=... node server/server.ts
 *
 * Telefon aynı Wi-Fi'daysa bilgisayarın LAN IP'sinden erişir; 0.0.0.0'a
 * bağlandığı için ayrıca ayar gerekmez.
 */

import { createServer } from 'node:http';

import { createApi } from './api.ts';

const clientId = process.env.FATSECRET_CLIENT_ID ?? '';
const clientSecret = process.env.FATSECRET_CLIENT_SECRET ?? '';
const port = Number(process.env.PORT) || 8787;

if (!clientId || !clientSecret) {
  console.error('FATSECRET_CLIENT_ID ve FATSECRET_CLIENT_SECRET tanımlı olmalı.');
  process.exit(1);
}

const api = createApi({ clientId, clientSecret });

const server = createServer((req, res) => {
  void (async () => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    // Ters vekil arkasında gerçek istemci IP'si bu başlıkta gelir.
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'bilinmiyor';

    const { status, body } = await api({
      path: url.pathname,
      query: url.searchParams,
      clientIp,
    });

    const payload = JSON.stringify(body);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
    });
    res.end(payload);

    console.log(`${req.method} ${url.pathname}${url.search} -> ${status}`);
  })();
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Aracı hazır: http://localhost:${port}`);
  console.log(`  GET /health`);
  console.log(`  GET /api/foods/search?q=egg`);
  console.log(`  GET /api/foods/3092`);
});
