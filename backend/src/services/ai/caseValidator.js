const mongoose = require('mongoose');
const { generatedCaseSchema } = require('../../validators/caseSchemas');

const difficultyTargets = Object.freeze({
  easy: { suspects: 3, evidence: 6 },
  medium: { suspects: 4, evidence: 8 },
  hard: { suspects: 5, evidence: 10 },
});
const requiredEvidenceTypes = ['chat', 'photo', 'cctv', 'witness', 'document', 'physical'];

class CaseValidationError extends Error {
  constructor(issues) {
    super('The generated case failed deterministic validation.');
    this.name = 'CaseValidationError';
    this.code = 'CASE_VALIDATION_FAILED';
    this.retryable = true;
    this.issues = issues;
  }
}

function ensure(condition, issue) {
  if (!condition) throw new CaseValidationError([issue]);
}

function parseOutput(value) {
  const parsed = generatedCaseSchema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 12).map((issue) => `${issue.path.join('.') || 'case'}: ${issue.message}`);
    throw new CaseValidationError(issues);
  }
  return parsed.data;
}

function dateValue(value, field) {
  const date = new Date(value);
  ensure(!Number.isNaN(date.getTime()) && value.endsWith('Z'), `${field} must be a valid UTC timestamp ending in Z.`);
  return date;
}

function validateGeneratedCase(value, input) {
  const generated = parseOutput(value);
  const target = difficultyTargets[input.difficulty];

  ensure(generated.suspects.length === target.suspects, `difficulty ${input.difficulty} requires ${target.suspects} suspects`);
  ensure(generated.evidence.length === target.evidence, `difficulty ${input.difficulty} requires ${target.evidence} evidence items`);
  ensure(generated.timeline.length >= 3, 'case timeline must contain at least three events');

  const suspectById = new Map();
  for (const [index, suspect] of generated.suspects.entries()) {
    ensure(suspect.id === `suspect_${index + 1}`, 'suspect IDs must be sequential from suspect_1');
    ensure(!suspectById.has(suspect.id), 'suspect IDs must be unique');
    suspectById.set(suspect.id, suspect);
  }
  const suspectNames = generated.suspects.map((suspect) => suspect.name.toLocaleLowerCase());
  ensure(new Set(suspectNames).size === suspectNames.length, 'suspect names must be unique');

  const evidenceById = new Map();
  const types = new Set();
  for (const [index, item] of generated.evidence.entries()) {
    ensure(item.id === `evidence_${index + 1}`, 'evidence IDs must be sequential from evidence_1');
    ensure(!evidenceById.has(item.id), 'evidence IDs must be unique');
    evidenceById.set(item.id, item);
    types.add(item.type);
    dateValue(item.timestamp, `evidence.${item.id}.timestamp`);
    for (const suspectId of item.suspectIds) {
      ensure(suspectById.has(suspectId), `evidence ${item.id} references an unknown suspect`);
    }
  }
  for (const type of requiredEvidenceTypes) {
    ensure(types.has(type), `case is missing required evidence type ${type}`);
  }

  const culprit = suspectById.get(generated.solution.culpritId);
  ensure(Boolean(culprit), 'solution culpritId must reference an existing suspect');

  const keyEvidenceIds = new Set(generated.solution.keyEvidenceIds);
  ensure(keyEvidenceIds.size >= 2, 'solution must reference at least two different key evidence items');
  for (const evidenceId of keyEvidenceIds) {
    ensure(evidenceById.has(evidenceId), `solution references unknown key evidence ${evidenceId}`);
  }

  const supportingEvidenceIds = new Set();
  let alternativeAlibiContradicted = false;
  for (const reasoning of generated.solution.evidenceReasoning) {
    ensure(evidenceById.has(reasoning.evidenceId), `solution reasoning references unknown evidence ${reasoning.evidenceId}`);
    ensure(suspectById.has(reasoning.suspectId), `solution reasoning references unknown suspect ${reasoning.suspectId}`);
    if (reasoning.relationship === 'supports' && reasoning.suspectId === culprit.id) {
      supportingEvidenceIds.add(reasoning.evidenceId);
    }
    if (reasoning.relationship === 'contradicts' && reasoning.suspectId !== culprit.id) {
      alternativeAlibiContradicted = true;
    }
  }
  ensure(supportingEvidenceIds.size >= 2, 'two different evidence items must support the canonical culprit');
  ensure(alternativeAlibiContradicted, 'at least one clue must contradict an alternative suspect alibi');
  for (const evidenceId of supportingEvidenceIds) {
    ensure(keyEvidenceIds.has(evidenceId), 'all direct culprit-supporting evidence must appear in keyEvidenceIds');
  }

  dateValue(generated.incident.occurredAt, 'incident.occurredAt');
  let priorTime = Number.NEGATIVE_INFINITY;
  for (const event of generated.timeline) {
    const eventTime = dateValue(event.timestamp, `timeline.${event.id}.timestamp`).getTime();
    ensure(eventTime >= priorTime, 'timeline events must be in chronological order');
    priorTime = eventTime;
    for (const evidenceId of event.sourceEvidenceIds) {
      ensure(evidenceById.has(evidenceId), `timeline event ${event.id} references unknown evidence ${evidenceId}`);
    }
  }

  return generated;
}

function mapValidatedCase(generated, input) {
  const suspectIds = new Map(generated.suspects.map((suspect) => [suspect.id, new mongoose.Types.ObjectId()]));
  const evidenceIds = new Map(generated.evidence.map((item) => [item.id, new mongoose.Types.ObjectId()]));

  return {
    title: input.title || generated.title,
    summary: generated.summary,
    incident: {
      ...generated.incident,
      occurredAt: new Date(generated.incident.occurredAt),
    },
    victim: generated.victim,
    suspects: generated.suspects.map((suspect) => ({
      _id: suspectIds.get(suspect.id),
      name: suspect.name,
      age: suspect.age,
      occupation: suspect.occupation,
      biography: suspect.biography,
      motive: suspect.motive,
      alibi: suspect.alibi,
      avatarUrl: '',
    })),
    evidence: generated.evidence.map((item) => ({
      _id: evidenceIds.get(item.id),
      type: item.type,
      title: item.title,
      description: item.description,
      content: item.imagePrompt ? { ...item.content, imagePrompt: item.imagePrompt } : item.content,
      timestamp: new Date(item.timestamp),
      location: item.location,
      suspectIds: item.suspectIds.map((id) => suspectIds.get(id)),
      assetUrl: '',
      assetStatus: ['photo', 'cctv'].includes(item.type) ? 'fallback' : 'not-requested',
      importance: item.importance,
    })),
    timeline: generated.timeline.map((event) => ({
      timestamp: new Date(event.timestamp),
      description: event.description,
      sourceEvidenceIds: event.sourceEvidenceIds.map((id) => evidenceIds.get(id)),
      confidence: event.confidence,
    })),
    solution: {
      culpritId: suspectIds.get(generated.solution.culpritId),
      motive: generated.solution.motive,
      method: generated.solution.method,
      solutionSummary: generated.solution.solutionSummary,
      solutionSteps: generated.solution.solutionSteps,
      keyEvidenceIds: generated.solution.keyEvidenceIds.map((id) => evidenceIds.get(id)),
      evidenceReasoning: generated.solution.evidenceReasoning.map((reasoning) => ({
        evidenceId: evidenceIds.get(reasoning.evidenceId),
        suspectId: suspectIds.get(reasoning.suspectId),
        claim: reasoning.claim,
        explanation: reasoning.explanation,
        relationship: reasoning.relationship,
      })),
    },
  };
}

module.exports = {
  CaseValidationError,
  difficultyTargets,
  validateGeneratedCase,
  mapValidatedCase,
};
