// tests/app.test.js
const { describe, it, beforeEach, after, before } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../app');
const db = require('../database/db');
const { clearCache, setTimeProvider } = require('../middleware/cacheMiddleware');

let server;
let baseUrl;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

describe('Express Caching & Layered Architecture Tests', () => {
  let virtualTime = 1000000;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  beforeEach(async () => {
    await db.reset();
    clearCache();
    virtualTime = 1000000;
    setTimeProvider(() => virtualTime);
  });

  it('GET /products on first request should return X-Cache: MISS', async () => {
    const res = await makeRequest('GET', '/products');
    assert.equal(res.status, 200);
    assert.equal(res.headers['x-cache'], 'MISS');
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 3);
  });

  it('GET /products on second request within 1 minute should return X-Cache: HIT', async () => {
    const res1 = await makeRequest('GET', '/products');
    assert.equal(res1.headers['x-cache'], 'MISS');

    // Advance time by 30 seconds (30,000 ms)
    virtualTime += 30000;

    const res2 = await makeRequest('GET', '/products');
    assert.equal(res2.status, 200);
    assert.equal(res2.headers['x-cache'], 'HIT');
    assert.deepEqual(res2.body, res1.body);
  });

  it('GET /products/:id caching behavior', async () => {
    const res1 = await makeRequest('GET', '/products/1');
    assert.equal(res1.status, 200);
    assert.equal(res1.headers['x-cache'], 'MISS');
    assert.equal(res1.body.name, 'Laptop');

    const res2 = await makeRequest('GET', '/products/1');
    assert.equal(res2.status, 200);
    assert.equal(res2.headers['x-cache'], 'HIT');
    assert.deepEqual(res2.body, res1.body);
  });

  it('GET /products after 1 minute TTL should expire cache and return X-Cache: MISS', async () => {
    const res1 = await makeRequest('GET', '/products');
    assert.equal(res1.headers['x-cache'], 'MISS');

    // Advance time by 61 seconds (61,000 ms), exceeding 1 min TTL
    virtualTime += 61000;

    const res2 = await makeRequest('GET', '/products');
    assert.equal(res2.status, 200);
    assert.equal(res2.headers['x-cache'], 'MISS');
  });

  it('POST /products should invalidate cache', async () => {
    // Populate cache
    const getRes1 = await makeRequest('GET', '/products');
    assert.equal(getRes1.headers['x-cache'], 'MISS');

    const cachedRes = await makeRequest('GET', '/products');
    assert.equal(cachedRes.headers['x-cache'], 'HIT');

    // POST request to create a new product
    const postRes = await makeRequest('POST', '/products', {
      name: 'Tablet',
      price: 499.99,
      category: 'Electronics'
    });
    assert.equal(postRes.status, 201);
    assert.equal(postRes.body.name, 'Tablet');

    // GET /products should now be a MISS and contain the new item
    const getRes2 = await makeRequest('GET', '/products');
    assert.equal(getRes2.status, 200);
    assert.equal(getRes2.headers['x-cache'], 'MISS');
    assert.equal(getRes2.body.length, 4);
  });

  it('PUT /products/:id should invalidate cache', async () => {
    // Populate cache for GET /products/1
    await makeRequest('GET', '/products/1');
    const cached = await makeRequest('GET', '/products/1');
    assert.equal(cached.headers['x-cache'], 'HIT');

    // Update product 1
    const putRes = await makeRequest('PUT', '/products/1', {
      name: 'Gaming Laptop',
      price: 1299.99
    });
    assert.equal(putRes.status, 200);

    // GET /products/1 after update should be MISS and reflect updated values
    const freshRes = await makeRequest('GET', '/products/1');
    assert.equal(freshRes.status, 200);
    assert.equal(freshRes.headers['x-cache'], 'MISS');
    assert.equal(freshRes.body.name, 'Gaming Laptop');
  });

  it('DELETE /products/:id should invalidate cache', async () => {
    // Populate cache
    await makeRequest('GET', '/products');
    const cached = await makeRequest('GET', '/products');
    assert.equal(cached.headers['x-cache'], 'HIT');

    // Delete product 2
    const delRes = await makeRequest('DELETE', '/products/2');
    assert.equal(delRes.status, 200);

    // GET /products should be MISS and have 2 products left
    const freshRes = await makeRequest('GET', '/products');
    assert.equal(freshRes.headers['x-cache'], 'MISS');
    assert.equal(freshRes.body.length, 2);
  });
});
