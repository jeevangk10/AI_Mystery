const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');

describe('GET /api/v1/health', () => {
  it('returns the standard success response when MongoDB is connected', async () => {
    const app = createApp({ databaseState: () => 1 });
    const response = await request(app).get('/api/v1/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success: true,
      data: { status: 'ok', database: 'connected' },
    });
  });

  it('returns a standard unavailable response when MongoDB is disconnected', async () => {
    const app = createApp({ databaseState: () => 0 });
    const response = await request(app).get('/api/v1/health');

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, {
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'MongoDB is not connected.' },
    });
  });

  it('returns a standard not-found response for unknown API routes', async () => {
    const app = createApp({ databaseState: () => 1 });
    const response = await request(app).get('/api/v1/missing');

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, 'NOT_FOUND');
  });
});
