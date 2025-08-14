Library proxy

This small Express proxy forwards requests to the Library of Congress API and keeps your API key on the server.

Setup

1. cd library-proxy
2. cp .env.example .env and set LIB_API_KEY
3. npm install
4. npm start

Endpoints

- GET /v1/events -> proxies to LIB_API_BASE/v1/events (forwards query params)

Client usage example

Fetch from the client via:

fetch('http://localhost:3001/v1/events')
  .then(r=>r.json())
  .then(data=>console.log(data));
