const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const Mystery = require('../src/models/Mystery');
const Investigation = require('../src/models/Investigation');
const createApp = require('../src/app');

const OWNER = 'a'.repeat(43);
const OTHER_OWNER = 'b'.repeat(43);
const MYSTERY_ID = '64b000000000000000000001';
const SUSPECT_IDS = [
  '64b000000000000000000011',
  '64b000000000000000000012',
  '64b000000000000000000013',
];
const EVIDENCE_IDS = [
  '64b000000000000000000021',
  '64b000000000000000000022',
  '64b000000000000000000023',
  '64b000000000000000000024',
  '64b000000000000000000025',
  '64b000000000000000000026',
];

function readyMystery(ownerSessionId = OWNER) {
  return {
    _id: MYSTERY_ID,
    id: MYSTERY_ID,
    ownerSessionId,
    status: 'ready',
    title: 'The Clockmaker’s Last Hour',
    scenario: 'A clockmaker finds a rare mechanism missing after the workshop closes for the night.',
    difficulty: 'easy',
    summary: 'A locked workshop, three people with access, and one missing mechanism.',
    incident: { location: 'North Workshop', occurredAt: new Date('2026-03-08T20:00:00Z'), timezone: 'UTC' },
    suspects: SUSPECT_IDS.map((id, index) => ({ _id: id, name: `Suspect ${index + 1}` })),
    evidence: EVIDENCE_IDS.map((id, index) => ({
      _id: id,
      type: index === 0 ? 'chat' : 'document',
      title: `Evidence ${index + 1}`,
      description: 'Fictional case evidence.',
      timestamp: new Date(`2026-03-08T${String(12 + index).padStart(2, '0')}:00:00Z`),
      suspectIds: [],
    })),
    timeline: [],
    solution: {
      culpritId: SUSPECT_IDS[0],
      motive: 'The culprit wanted the mechanism for a private collection.',
      method: 'They used an unlogged service entrance.',
      solutionSummary: 'The access record and message timeline establish the theft.',
      solutionSteps: ['The message time contradicts the claimed alibi.'],
      keyEvidenceIds: EVIDENCE_IDS.slice(0, 2),
      evidenceReasoning: [],
    },
  };
}

function createMockModels(initialMystery = readyMystery()) {
  const mysteries = new Map([[MYSTERY_ID, initialMystery]]);
  const investigations = new Map();
  let nextInvestigationId = 1;

  const MysteryModel = {
    async findOne(filter) {
      const mystery = mysteries.get(String(filter._id));
      return mystery?.ownerSessionId === filter.ownerSessionId ? mystery : null;
    },
  };

  const InvestigationModel = {
    async findOne(filter) {
      return [...investigations.values()].find((item) => (
        item.mysteryId.toString() === filter.mysteryId.toString()
        && item.ownerSessionId === filter.ownerSessionId
        && item.status === filter.status
      )) || null;
    },
    async create(data) {
      const item = {
        ...data,
        _id: new mongoose.Types.ObjectId(`64b0000000000000000000${String(nextInvestigationId++).padStart(2, '0')}`),
        examinedEvidenceIds: [],
        notes: [],
        startedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        async save() { this.updatedAt = new Date(); return this; },
      };
      investigations.set(item._id.toString(), item);
      return item;
    },
    async findOneById(filter) {
      const item = investigations.get(String(filter._id));
      return item?.ownerSessionId === filter.ownerSessionId ? item : null;
    },
    find(filter) {
      const items = [...investigations.values()].filter((item) => (
        item.ownerSessionId === filter.ownerSessionId && (!filter.status || item.status === filter.status)
      ));
      const query = {
        sort() { return this; },
        skip() { return this; },
        limit() { return this; },
        then(resolve, reject) { return Promise.resolve(items).then(resolve, reject); },
      };
      return query;
    },
    async countDocuments(filter) {
      return [...investigations.values()].filter((item) => (
        item.ownerSessionId === filter.ownerSessionId && (!filter.status || item.status === filter.status)
      )).length;
    },
  };

  InvestigationModel.findOne = async (filter) => {
    if (filter._id) return InvestigationModel.findOneById(filter);
    return [...investigations.values()].find((item) => (
      item.mysteryId.toString() === filter.mysteryId.toString()
      && item.ownerSessionId === filter.ownerSessionId
      && item.status === filter.status
    )) || null;
  };

  return { MysteryModel, InvestigationModel, mysteries, investigations };
}

function createTestApp(models = createMockModels(), options = {}) {
  return createApp({
    databaseState: () => 1,
    sessionSecret: 'phase-two-test-session-secret-long-enough',
    clientUrl: 'http://localhost:5173',
    sessionIdFactory: () => OWNER,
    ...options,
    MysteryModel: models.MysteryModel,
    InvestigationModel: models.InvestigationModel,
  });
}

function validReadyMysteryDocument(overrides = {}) {
  const suspectIds = Array.from({ length: 3 }, () => new mongoose.Types.ObjectId());
  const evidence = Array.from({ length: 6 }, (_, index) => ({
    _id: new mongoose.Types.ObjectId(),
    type: index === 0 ? 'chat' : 'document',
    title: `Evidence ${index + 1}`,
    description: 'A fictional clue available to the player.',
    timestamp: new Date(Date.UTC(2026, 2, 8, 12 + index)),
  }));

  const mystery = new Mystery({
    title: 'The Missing Mechanism',
    scenario: 'A rare clock mechanism disappears from a locked workshop during an evening demonstration.',
    difficulty: 'easy',
    status: 'ready',
    ownerSessionId: OWNER,
    summary: 'Three people had access to the workshop and only one timeline fits the evidence.',
    incident: { description: 'The mechanism vanished.', location: 'North Workshop', occurredAt: new Date('2026-03-08T20:00:00Z'), timezone: 'UTC' },
    suspects: suspectIds.map((_id, index) => ({
      _id,
      name: `Suspect ${index + 1}`,
      biography: 'A distinct fictional workshop associate.',
      motive: 'They each had a reason to want the mechanism.',
      alibi: 'They each provided a statement about their whereabouts.',
    })),
    evidence,
    solution: {
      culpritId: suspectIds[0],
      motive: 'The culprit planned to sell the mechanism.',
      method: 'They used the service entrance during the demonstration.',
      solutionSummary: 'The service record and message timestamps support the culprit.',
      solutionSteps: ['The message timestamps contradict the alibi.'],
      keyEvidenceIds: [evidence[0]._id, evidence[1]._id],
      evidenceReasoning: [],
    },
    ...overrides,
  });

  return { mystery, suspectIds, evidence };
}

describe('Phase 2 data models', () => {
  it('accepts a structurally valid ready case', async () => {
    const { mystery } = validReadyMysteryDocument();
    await assert.doesNotReject(() => mystery.validate());
  });

  it('rejects ready cases that do not satisfy their difficulty counts', async () => {
    const { mystery } = validReadyMysteryDocument({ difficulty: 'medium' });
    await assert.rejects(() => mystery.validate(), (error) => Boolean(error.errors.suspects && error.errors.evidence));
  });

  it('rejects a solution that points to a suspect outside the case', async () => {
    const { mystery } = validReadyMysteryDocument({
      solution: {
        culpritId: new mongoose.Types.ObjectId(),
        motive: 'Motive',
        method: 'Method',
        solutionSummary: 'Summary',
        keyEvidenceIds: [],
        evidenceReasoning: [],
      },
    });
    await assert.rejects(() => mystery.validate(), (error) => Boolean(error.errors['solution.culpritId']));
  });

  it('rejects an investigation completed without an accusation', async () => {
    const investigation = new Investigation({
      mysteryId: new mongoose.Types.ObjectId(),
      ownerSessionId: OWNER,
      status: 'completed',
      completedAt: new Date(),
    });
    await assert.rejects(() => investigation.validate(), (error) => Boolean(error.errors.status));
  });
});

describe('Phase 2 guest session and ownership API', () => {
  it('issues a signed HttpOnly SameSite cookie and reuses it', async () => {
    const app = createTestApp();
    const agent = request.agent(app);
    const first = await agent.get('/api/v1/health');
    const cookie = first.headers['set-cookie'][0];

    assert.match(cookie, /^amr_session=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    const second = await agent.get(`/api/v1/mysteries/${MYSTERY_ID}/status`);
    assert.equal(second.status, 200);
    assert.equal(second.headers['set-cookie'], undefined);
  });

  it('returns an owned mystery without the private solution or session owner', async () => {
    const models = createMockModels();
    const owned = readyMystery();
    models.MysteryModel.findOne = async (filter) => filter._id === MYSTERY_ID && filter.ownerSessionId === OWNER ? owned : null;
    const agent = request.agent(createTestApp(models));
    await agent.get('/api/v1/health');
    const response = await agent.get(`/api/v1/mysteries/${MYSTERY_ID}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.mystery.title, owned.title);
    assert.equal('solution' in response.body.data.mystery, false);
    assert.equal('ownerSessionId' in response.body.data.mystery, false);
  });

  it('hides another session’s mystery and investigation behind NOT_FOUND', async () => {
    const models = createMockModels(readyMystery(OWNER));
    const app = createTestApp(models);
    const agentA = request.agent(app);
    const sessionA = await agentA.get('/api/v1/health');
    const sessionCookie = sessionA.headers['set-cookie'][0].split(';')[0];
    const route = `/api/v1/mysteries/${MYSTERY_ID}`;
    const mystery = await request(app).get(route).set('Cookie', sessionCookie);
    const other = await request(createTestApp(models, { sessionIdFactory: () => OTHER_OWNER })).get(route);

    assert.equal(mystery.status, 200);
    assert.equal(other.status, 404);
    assert.equal(other.body.error.code, 'NOT_FOUND');
  });

  it('creates one active investigation for an owned ready case and reuses it', async () => {
    const models = createMockModels();
    const app = createTestApp(models);
    const agent = request.agent(app);
    await agent.get('/api/v1/health');

    const created = await agent.post('/api/v1/investigations').send({ mysteryId: MYSTERY_ID });
    const duplicate = await agent.post('/api/v1/investigations').send({ mysteryId: MYSTERY_ID });

    assert.equal(created.status, 201);
    assert.equal(duplicate.status, 200);
    assert.equal(models.investigations.size, 1);
    assert.equal('ownerSessionId' in created.body.data.investigation, false);
  });

  it('returns an owner-scoped investigation and paginated history', async () => {
    const models = createMockModels();
    const app = createTestApp(models);
    const agent = request.agent(app);
    await agent.get('/api/v1/health');
    const created = await agent.post('/api/v1/investigations').send({ mysteryId: MYSTERY_ID });
    const investigationId = created.body.data.investigation._id;

    const detail = await agent.get(`/api/v1/investigations/${investigationId}`);
    const history = await agent.get('/api/v1/investigations?status=active&page=1&limit=5');
    const otherSession = await request(createTestApp(models, { sessionIdFactory: () => OTHER_OWNER }))
      .get(`/api/v1/investigations/${investigationId}`);

    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.mystery._id, MYSTERY_ID);
    assert.equal('solution' in detail.body.data.mystery, false);
    assert.equal(history.status, 200);
    assert.equal(history.body.data.items.length, 1);
    assert.deepEqual(history.body.data.pagination, { page: 1, limit: 5, total: 1 });
    assert.equal(otherSession.status, 404);
  });

  it('persists examined evidence only for an owned active investigation', async () => {
    const models = createMockModels();
    const app = createTestApp(models);
    const agent = request.agent(app);
    await agent.get('/api/v1/health');
    const created = await agent.post('/api/v1/investigations').send({ mysteryId: MYSTERY_ID });
    const investigationId = created.body.data.investigation._id;

    const marked = await agent.patch(`/api/v1/investigations/${investigationId}/evidence/${EVIDENCE_IDS[0]}/examined`)
      .send({ examined: true });
    const unmarked = await agent.patch(`/api/v1/investigations/${investigationId}/evidence/${EVIDENCE_IDS[0]}/examined`)
      .send({ examined: false });
    const invalid = await agent.patch(`/api/v1/investigations/${investigationId}/evidence/${EVIDENCE_IDS[0]}/examined`)
      .send({ examined: 'yes' });

    assert.equal(marked.status, 200);
    assert.deepEqual(marked.body.data.investigation.examinedEvidenceIds, [EVIDENCE_IDS[0]]);
    assert.deepEqual(unmarked.body.data.investigation.examinedEvidenceIds, []);
    assert.equal(invalid.status, 400);
  });

  it('evaluates an accusation on the server and reveals the solution only after submission', async () => {
    const models = createMockModels();
    const agent = request.agent(createTestApp(models));
    await agent.get('/api/v1/health');
    const created = await agent.post('/api/v1/investigations').send({ mysteryId: MYSTERY_ID });
    const investigationId = created.body.data.investigation._id;
    const before = await agent.get(`/api/v1/investigations/${investigationId}`);
    assert.equal('result' in before.body.data, false);
    assert.equal('solution' in before.body.data.mystery, false);

    const accusation = await agent.post(`/api/v1/investigations/${investigationId}/accuse`)
      .send({ suspectId: SUSPECT_IDS[1] });
    assert.equal(accusation.status, 200);
    assert.equal(accusation.body.data.result.isCorrect, false);
    assert.equal(accusation.body.data.result.accused.name, 'Suspect 2');
    assert.equal(accusation.body.data.result.culprit.name, 'Suspect 1');
    assert.equal(accusation.body.data.result.motive, 'The culprit wanted the mechanism for a private collection.');
    assert.equal(accusation.body.data.investigation.status, 'completed');

    const resumed = await agent.get(`/api/v1/investigations/${investigationId}`);
    const duplicate = await agent.post(`/api/v1/investigations/${investigationId}/accuse`)
      .send({ suspectId: SUSPECT_IDS[0] });
    assert.equal(resumed.body.data.result.isCorrect, false);
    assert.equal(duplicate.status, 409);

    const nextCreated = await agent.post('/api/v1/investigations').send({ mysteryId: MYSTERY_ID });
    const correct = await agent.post(`/api/v1/investigations/${nextCreated.body.data.investigation._id}/accuse`)
      .send({ suspectId: SUSPECT_IDS[0] });
    assert.equal(correct.status, 200);
    assert.equal(correct.body.data.result.isCorrect, true);
    assert.equal(correct.body.data.result.score, 100);
  });

  it('rejects accusations for suspects outside the case', async () => {
    const agent = request.agent(createTestApp());
    await agent.get('/api/v1/health');
    const created = await agent.post('/api/v1/investigations').send({ mysteryId: MYSTERY_ID });
    const response = await agent.post(`/api/v1/investigations/${created.body.data.investigation._id}/accuse`)
      .send({ suspectId: '64b000000000000000000099' });
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects unowned cases, invalid identifiers, and foreign mutation origins', async () => {
    const models = createMockModels();
    models.MysteryModel.findOne = async () => null;
    const app = createTestApp(models);
    const agent = request.agent(app);
    await agent.get('/api/v1/health');

    const unowned = await agent.post('/api/v1/investigations').send({ mysteryId: MYSTERY_ID });
    const invalid = await agent.post('/api/v1/investigations').send({ mysteryId: 'not-an-id' });
    const foreignOrigin = await agent.post('/api/v1/investigations')
      .set('Origin', 'https://attacker.invalid')
      .send({ mysteryId: MYSTERY_ID });

    assert.equal(unowned.status, 404);
    assert.equal(invalid.status, 400);
    assert.equal(foreignOrigin.status, 403);
  });

  it('filters and paginates evidence without returning a solution', async () => {
    const models = createMockModels();
    const app = createTestApp(models);
    const agent = request.agent(app);
    await agent.get('/api/v1/health');
    const response = await agent.get(`/api/v1/mysteries/${MYSTERY_ID}/evidence?type=chat`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.items.length, 1);
    assert.equal(response.body.data.items[0].type, 'chat');
    assert.equal('solution' in response.body.data, false);
  });
});

describe('Mystery creation API contract', () => {
  it('validates scenario and options before requesting generation', async () => {
    let calls = 0;
    const app = createTestApp(createMockModels(), {
      generateMystery: async () => { calls += 1; return { id: MYSTERY_ID, status: 'ready' }; },
    });
    const agent = request.agent(app);
    await agent.get('/api/v1/health');

    const tooShort = await agent.post('/api/v1/mysteries').send({ scenario: 'Too short.' });
    const invalidDifficulty = await agent.post('/api/v1/mysteries').send({ scenario: 'A'.repeat(60), difficulty: 'impossible' });
    const unknownAnswerField = await agent.post('/api/v1/mysteries').send({ scenario: 'A'.repeat(60), culpritId: SUSPECT_IDS[0] });

    assert.equal(tooShort.status, 400);
    assert.equal(invalidDifficulty.status, 400);
    assert.equal(unknownAnswerField.status, 400);
    assert.equal(calls, 0);
  });

  it('returns the case ID and status without returning generated answer fields', async () => {
    let argumentsSeen;
    const app = createTestApp(createMockModels(), {
      generateMystery: async (args) => {
        argumentsSeen = args;
        return { id: MYSTERY_ID, status: 'ready', solution: { culpritId: SUSPECT_IDS[0] } };
      },
    });
    const agent = request.agent(app);
    await agent.get('/api/v1/health');
    const response = await agent.post('/api/v1/mysteries').send({
      scenario: 'A rare astronomical lens disappears from a private observatory during a public night-sky demonstration.',
      difficulty: 'easy',
      caseType: 'theft',
      tone: 'noir',
    });

    assert.equal(response.status, 201);
    assert.deepEqual(response.body.data, { mysteryId: MYSTERY_ID, status: 'ready' });
    assert.equal(argumentsSeen.input.difficulty, 'easy');
    assert.equal(argumentsSeen.input.caseType, 'theft');
    assert.equal(argumentsSeen.ownerSessionId, OWNER);
    assert.equal('solution' in response.body.data, false);
  });

  it('turns generation failures into a controlled user-safe response', async () => {
    const app = createTestApp(createMockModels(), {
      generateMystery: async () => { throw Object.assign(new Error('provider key and raw response'), { name: 'MysteryGenerationError' }); },
    });
    const agent = request.agent(app);
    await agent.get('/api/v1/health');
    const response = await agent.post('/api/v1/mysteries').send({ scenario: 'A rare astronomical lens disappears from a private observatory during a public night-sky demonstration.' });

    assert.equal(response.status, 502);
    assert.deepEqual(response.body.error, {
      code: 'GENERATION_FAILED',
      message: 'We could not create a consistent mystery. Please try again.',
    });
  });
});
