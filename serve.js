#!/usr/bin/env node
/* ==========================================================================
   serve.js — zero-dependency static file server for the OllamaChat folder.
   Used by start.bat when Node.js is available.

     node serve.js            -> http://localhost:5173
     PORT=8080 node serve.js  -> http://localhost:8080
   ========================================================================== */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

/** Keeps the resolved path inside ROOT (blocks ../ traversal). */
function isInsideRoot(filePath) {
  return filePath === ROOT || filePath.startsWith(ROOT + path.sep);
}

const server = http.createServer(function (req, res) {
  const requested = decodeURIComponent((req.url || '/').split('?')[0]);
  const target = requested === '/' ? '/index.html' : requested;
  const filePath = path.join(ROOT, path.normalize(target));

  if (!isInsideRoot(filePath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found: ' + target);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
});

server.on('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is already in use. Try: set PORT=8080 && node serve.js');
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, function () {
  console.log('OllamaChat is served at http://localhost:' + PORT + '/');
  console.log('Press Ctrl+C to stop.');
});
