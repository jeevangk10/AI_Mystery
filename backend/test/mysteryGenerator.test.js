const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { createMysteryGenerationService, MysteryGenerationError } = require('../src/services/ai/mysteryGenerator');
const { generatedCase, scenario } = require('./fixtures/generatedCase');

function createMemoryMysteryModel() {
  const records = [];
  const snapshots = [];

  class MemoryMystery {
    constructor(data) {
      Object.assign(this, data);
      this._id = new mongoose.Types.ObjectId();
      this.id = this._id.toString();
    }

    set(data) { Object.assign(this, data); }

    async validate() {
      if (this.status === 'ready' && (!this.solution || this.suspects.length !== 3 || this.evidence.length !== 6)) {
        throw Object.assign(new Error('memory model rejected a ready mystery'), { retryable: true, code: 'CASE_VALIDATION_FAILED' });
      }
    }

    async save() {
      snapshots.push({ status: this.status, hasSolution: Boolean(this.solution), generationErrorCode: this.generationErrorCode });
      if (!records.includes(this)) records.push(this);
      return this;
    }
  }

  return { MemoryMystery, records, snapshots };
}

const input = {
  scenario,
  title: '',
  difficulty: 'easy',
  caseType: 'any',
  tone: 'classic-detective',
};

describe('bounded mystery generation pipeline', () => {
  it('retries an invalid draft, validates it, and publishes one persisted ready case', async () => {
    const { MemoryMystery, records, snapshots } = createMemoryMysteryModel();
    let calls = 0;
    const service = createMysteryGenerationService({
      MysteryModel: MemoryMystery,
      maxAttempts: 2,
      provider: { async generateCase() {
        calls += 1;
        if (calls === 1) return generatedCase({ suspects: generatedCase().suspects.slice(0, 2) });
        return generatedCase();
      } },
    });

    const mystery = await service({ input, ownerSessionId: 'session-owner' });

    assert.equal(calls, 2);
    assert.equal(records.length, 1);
    assert.equal(mystery.status, 'ready');
    assert.ok(mystery.solution);
    assert.equal(mystery.suspects.length, 3);
    assert.equal(mystery.evidence.length, 6);
    assert.ok(snapshots.some((snapshot) => snapshot.status === 'generating'));
    assert.ok(snapshots.some((snapshot) => snapshot.status === 'validating'));
    assert.equal(snapshots.at(-1).status, 'ready');
  });

  it('stops on non-retryable provider errors and records a failed job without partial solution data', async () => {
    const { MemoryMystery, records, snapshots } = createMemoryMysteryModel();
    let calls = 0;
    const service = createMysteryGenerationService({
      MysteryModel: MemoryMystery,
      maxAttempts: 3,
      provider: { async generateCase() {
        calls += 1;
        throw Object.assign(new Error('private provider response must not escape'), { code: 'AI_PROVIDER_ERROR', retryable: false });
      } },
    });

    await assert.rejects(() => service({ input, ownerSessionId: 'session-owner' }), MysteryGenerationError);
    assert.equal(calls, 1);
    assert.equal(records.length, 1);
    assert.equal(records[0].status, 'failed');
    assert.equal(records[0].generationErrorCode, 'AI_PROVIDER_ERROR');
    assert.equal(records[0].solution, undefined);
    assert.equal(snapshots.at(-1).hasSolution, false);
  });

  it('never exceeds the configured retry limit', async () => {
    const { MemoryMystery } = createMemoryMysteryModel();
    let calls = 0;
    const service = createMysteryGenerationService({
      MysteryModel: MemoryMystery,
      maxAttempts: 2,
      provider: { async generateCase() { calls += 1; return {}; } },
    });

    await assert.rejects(() => service({ input, ownerSessionId: 'session-owner' }), MysteryGenerationError);
    assert.equal(calls, 2);
  });
});
