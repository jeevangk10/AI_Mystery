const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const dns = require('node:dns');
const mongoose = require('mongoose');
const env = require('../src/config/env');

if (env.MONGODB_DNS_SERVERS.length) dns.setServers(env.MONGODB_DNS_SERVERS);

const { connectDatabase } = require('../src/config/database');
const Mystery = require('../src/models/Mystery');
const { createGeminiCaseProvider } = require('../src/services/ai/geminiClient');
const { createMysteryGenerationService } = require('../src/services/ai/mysteryGenerator');
const { publicMystery } = require('../src/services/mysteryAccess');

async function verifyLiveGeneration() {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured.');

  const ownerSessionId = crypto.randomBytes(32).toString('base64url');
  const marker = crypto.randomBytes(8).toString('hex');
  const scenario = `Temporary Phase 3 verification ${marker}: a rare brass lens disappears from a fictional observatory during a public demonstration. Build a fair, evidence-supported mystery around the event.`;
  const input = {
    scenario,
    title: `Verification case ${marker}`,
    difficulty: 'easy',
    caseType: 'theft',
    tone: 'classic-detective',
  };
  let mysteryId;

  try {
    console.info('Connecting to MongoDB for temporary generation verification.');
    await connectDatabase(env.MONGODB_URI);
    console.info('MongoDB connected; requesting one temporary Gemini case.');
    const provider = createGeminiCaseProvider({
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_TEXT_MODEL,
      timeoutMs: env.GENERATION_TIMEOUT_MS,
    });
    const generateMystery = createMysteryGenerationService({
      MysteryModel: Mystery,
      provider,
      maxAttempts: env.GEMINI_MAX_ATTEMPTS,
    });

    const mystery = await generateMystery({ input, ownerSessionId });
    console.info('Gemini returned a case; validating private persistence and public serialization.');
    mysteryId = mystery._id;

    assert.equal(mystery.status, 'ready');
    assert.equal(mystery.suspects.length, 3);
    assert.equal(mystery.evidence.length, 6);
    assert.equal(mystery.solution.culpritId.toString().length, 24);

    const stored = await Mystery.findOne({ _id: mysteryId, ownerSessionId }).select('+solution');
    const publicRead = await Mystery.findOne({ _id: mysteryId, ownerSessionId });
    assert.ok(stored?.solution, 'canonical solution should be persisted server-side');
    assert.equal(publicRead.solution, undefined, 'solution should remain excluded from default reads');

    const serialized = publicMystery(publicRead);
    assert.equal('solution' in serialized, false);
    assert.equal('ownerSessionId' in serialized, false);
    console.info('Gemini generation integration passed: validated case stored, one private culprit persisted, and public serialization excludes the solution.');
  } finally {
    if (mysteryId) await Mystery.deleteOne({ _id: mysteryId }).catch(() => {});
    else await Mystery.deleteMany({ ownerSessionId, scenario }).catch(() => {});
    await mongoose.disconnect();
  }
}

verifyLiveGeneration().catch((error) => {
  console.error(`Gemini generation integration failed: ${error.name || 'Error'} (${error.code || 'NO_CODE'}:${error.diagnosticCode || 'NO_DIAGNOSTIC'})`);
  process.exitCode = 1;
});
