How to use the Library proxy

1. cd library-proxy
2. cp .env.example .env and set LIB_API_KEY to your key (the key you provided). Do not commit the real .env.
3. npm install
4. npm start

The proxy will run on http://localhost:3001 by default. The `renderLibrary.js` will try `fetch('/v1/events')` (relative path) — if you serve the frontend and proxy from same origin, configure `window.LIB_PROXY_BASE` to point to the proxy base (e.g., `http://localhost:3001`) before calling the library renderer.

Client example:

window.LIB_PROXY_BASE = 'http://localhost:3001';
fetch(window.LIB_PROXY_BASE + '/v1/events').then(r=>r.json()).then(console.log);
