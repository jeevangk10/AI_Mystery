const assert = require('node:assert/strict');
const dns = require('node:dns');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const env = require('../src/config/env');

if (env.MONGODB_DNS_SERVERS.length) dns.setServers(env.MONGODB_DNS_SERVERS);

const { connectDatabase } = require('../src/config/database');
const Mystery = require('../src/models/Mystery');
const Investigation = require('../src/models/Investigation');

async function verifyMongoPersistenceAndOwnership() {
  const ownerSessionId = crypto.randomBytes(32).toString('base64url');
  const runId = crypto.randomBytes(8).toString('hex');
  let mysteryId;
  let investigationId;

  try {
    await connectDatabase(env.MONGODB_URI);

    const mystery = new Mystery({
      title: 'Phase 2 persistence check',
      scenario: `Temporary fictional case for persistence verification ${runId}. A workshop item disappears during a demonstration.`,
      difficulty: 'easy',
      status: 'ready',
      ownerSessionId,
      summary: 'Temporary case created only to verify database persistence and ownership.',
      incident: {
        description: 'A fictional mechanism was reported missing.',
        location: 'Verification Workshop',
        occurredAt: new Date('2026-03-08T20:00:00Z'),
        timezone: 'UTC',
      },
      suspects: Array.from({ length: 3 }, (_, index) => ({
        name: `Verification Suspect ${index + 1}`,
        biography: 'A temporary fictional profile.',
        motive: 'A temporary fictional motive.',
        alibi: 'A temporary fictional alibi.',
      })),
      evidence: Array.from({ length: 6 }, (_, index) => ({
        type: index === 0 ? 'chat' : 'document',
        title: `Verification clue ${index + 1}`,
        description: 'Temporary fictional evidence used for a database integration check.',
        timestamp: new Date(Date.UTC(2026, 2, 8, 12 + index)),
      })),
    });

    mystery.solution = {
      culpritId: mystery.suspects[0]._id,
      motive: 'The fictional culprit wanted the item.',
      method: 'The fictional culprit used a service entrance.',
      solutionSummary: 'A temporary explanation for database verification.',
      solutionSteps: ['The temporary record is internally linked.'],
      keyEvidenceIds: [mystery.evidence[0]._id, mystery.evidence[1]._id],
      evidenceReasoning: [],
    };

    await mystery.save();
    mysteryId = mystery._id;

    const storedMystery = await Mystery.findOne({ _id: mysteryId, ownerSessionId }).select('+solution');
    assert.ok(storedMystery, 'case should be retrievable by its owner');
    assert.equal(storedMystery.solution.culpritId.toString(), mystery.suspects[0]._id.toString());

    const publicMystery = await Mystery.findOne({ _id: mysteryId, ownerSessionId });
    assert.equal(publicMystery.solution, undefined, 'canonical solution must be excluded by default');
    assert.equal(await Mystery.findOne({ _id: mysteryId, ownerSessionId: `other-${ownerSessionId}` }), null);

    const investigation = await Investigation.create({ mysteryId, ownerSessionId });
    investigationId = investigation._id;
    investigation.examinedEvidenceIds.addToSet(mystery.evidence[0]._id);
    await investigation.save();
    const resumedInvestigation = await Investigation.findOne({ _id: investigationId, ownerSessionId });
    assert.equal(resumedInvestigation.examinedEvidenceIds[0].toString(), mystery.evidence[0]._id.toString());
    assert.ok(await Investigation.findOne({ _id: investigationId, ownerSessionId }));
    assert.equal(await Investigation.findOne({ _id: investigationId, ownerSessionId: `other-${ownerSessionId}` }), null);

    console.info('MongoDB integration passed: case persistence, private solution selection, owner-scoped reads, and examined-evidence persistence.');
  } finally {
    if (investigationId) await Investigation.deleteOne({ _id: investigationId }).catch(() => {});
    if (mysteryId) await Mystery.deleteOne({ _id: mysteryId }).catch(() => {});
    await mongoose.disconnect();
  }
}

verifyMongoPersistenceAndOwnership().catch((error) => {
  console.error(`MongoDB integration failed: ${error.message}`);
  process.exitCode = 1;
});
