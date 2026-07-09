/**
 * Local proxy server for Silk Chat
 * - Serves index.html at http://localhost:3000
 * - Proxies POST /api/chat → NVIDIA API (handles CORS & streams)
 *
 * Run: node server.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const HTML_FILE = path.join(__dirname, 'index.html');

// ─── Helpers ────────────────────────────────────────────────────────────────

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ─── Request handler ────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Serve index.html ──────────────────────────────────────────────────────
  if (req.method === 'GET' && (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html')) {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf8');
      setCORSHeaders(res);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(404);
      res.end('index.html not found');
    }
    return;
  }

  // ── Proxy: POST /api/chat → NVIDIA API ───────────────────────────────────
  if (req.method === 'POST' && parsedUrl.pathname === '/api/chat') {
    let bodyStr;
    try {
      bodyStr = await readBody(req);
    } catch {
      res.writeHead(400);
      res.end('Bad request');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(bodyStr);
    } catch {
      res.writeHead(400);
      res.end('Invalid JSON');
      return;
    }

    // Allow apiUrl and apiKey to come from the client request body
    const targetUrl = payload.apiUrl || 'https://integrate.api.nvidia.com/v1/chat/completions';
    const apiKey = payload.apiKey || '';
    const { apiUrl: _a, apiKey: _b, ...nvidiaPayload } = payload; // strip proxy-only fields

    const parsedTarget = url.parse(targetUrl);
    const postBody = JSON.stringify(nvidiaPayload);

    const options = {
      hostname: parsedTarget.hostname,
      port: parsedTarget.port || 443,
      path: parsedTarget.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody),
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'text/event-stream',
      },
    };

    setCORSHeaders(res);

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': proxyRes.headers['content-type'] || 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
        ...Object.fromEntries(
          Object.entries(proxyRes.headers).filter(([k]) =>
            ['access-control-allow-origin', 'x-request-id'].includes(k)
          )
        ),
      });
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502);
      }
      res.end(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    });

    proxyReq.write(postBody);
    proxyReq.end();
    return;
  }

  // 404 fallback
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n✅ Silk Chat server running at http://localhost:${PORT}\n`);
  console.log('   Open the link above in your browser.');
  console.log('   Press Ctrl+C to stop.\n');
});
