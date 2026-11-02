const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const createApp = require('../src/app');

describe('API security middleware', () => {
  it('sets secure headers and limits repeated case-generation requests', async () => {
    let generationCalls = 0;
    const app = createApp({
      databaseState: () => 1,
      sessionSecret: 'phase-seven-security-test-secret-long-enough',
      sessionIdFactory: () => 'c'.repeat(43),
      generateMystery: async () => {
        generationCalls += 1;
        return { id: '64b000000000000000000001', status: 'ready' };
      },
    });
    const agent = request.agent(app);
    const health = await agent.get('/api/v1/health');
    assert.equal(health.headers['x-content-type-options'], 'nosniff');
    assert.equal(health.headers['x-powered-by'], undefined);

    const responses = [];
    for (let index = 0; index < 7; index += 1) {
      responses.push(await agent.post('/api/v1/mysteries').send({
        scenario: 'A fictional archive key disappears during a supervised evening catalogue review.',
      }));
    }

    const limited = responses.find((response) => response.status === 429);
    assert.ok(limited, 'generation requests should be rate-limited');
    assert.equal(limited.body.error.code, 'RATE_LIMITED');
    assert.equal(generationCalls, 5, 'limited requests must not invoke Gemini generation');
  });
});
