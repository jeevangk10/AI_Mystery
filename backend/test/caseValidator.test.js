const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateGeneratedCase, mapValidatedCase, CaseValidationError, difficultyTargets } = require('../src/services/ai/caseValidator');
const { generatedCase } = require('./fixtures/generatedCase');

const input = { difficulty: 'easy', scenario: 'A rare astronomical lens disappears from a private observatory during a public night-sky demonstration.' };

describe('deterministic generated-case validation', () => {
  it('accepts a case with correct references, evidence support, and UTC timeline', () => {
    const result = validateGeneratedCase(generatedCase(), input);
    assert.equal(result.solution.culpritId, 'suspect_1');
  });

  it('enforces difficulty counts and all required evidence types', () => {
    assert.deepEqual(difficultyTargets, {
      easy: { suspects: 3, evidence: 6 },
      medium: { suspects: 4, evidence: 8 },
      hard: { suspects: 5, evidence: 10 },
    });
    const badCount = generatedCase({ suspects: generatedCase().suspects.slice(0, 2) });
    assert.throws(() => validateGeneratedCase(badCount, input), CaseValidationError);

    const missingType = generatedCase();
    missingType.evidence[5].type = 'document';
    assert.throws(() => validateGeneratedCase(missingType, input), (error) => (
      error instanceof CaseValidationError && error.issues.join(' ').includes('required evidence type physical')
    ));
  });

  it('rejects unknown suspect/evidence references and incomplete support reasoning', () => {
    const badSuspectReference = generatedCase();
    badSuspectReference.evidence[0].suspectIds = ['suspect_99'];
    assert.throws(() => validateGeneratedCase(badSuspectReference, input), (error) => (
      error instanceof CaseValidationError && error.issues.join(' ').includes('unknown suspect')
    ));

    const unsupported = generatedCase();
    unsupported.solution.evidenceReasoning[2].relationship = 'contextualizes';
    assert.throws(() => validateGeneratedCase(unsupported, input), (error) => (
      error instanceof CaseValidationError && error.issues.join(' ').includes('alternative suspect alibi')
    ));

    const oneClue = generatedCase();
    oneClue.solution.evidenceReasoning[1].relationship = 'contextualizes';
    assert.throws(() => validateGeneratedCase(oneClue, input), (error) => (
      error instanceof CaseValidationError && error.issues.join(' ').includes('two different evidence items')
    ));
  });

  it('rejects non-UTC timestamps and out-of-order timeline events', () => {
    const localTime = generatedCase();
    localTime.evidence[0].timestamp = '2026-05-12T12:00:00-05:00';
    assert.throws(() => validateGeneratedCase(localTime, input), (error) => (
      error instanceof CaseValidationError && error.issues.join(' ').includes('ending in Z')
    ));

    const unordered = generatedCase();
    unordered.timeline.reverse();
    assert.throws(() => validateGeneratedCase(unordered, input), (error) => (
      error instanceof CaseValidationError && error.issues.join(' ').includes('chronological order')
    ));
  });

  it('maps model references once and keeps image assets as labeled fallbacks', () => {
    const mapped = mapValidatedCase(generatedCase(), input);
    assert.equal(mapped.suspects.length, 3);
    assert.equal(mapped.evidence.length, 6);
    assert.equal(mapped.solution.culpritId.toString(), mapped.suspects[0]._id.toString());
    assert.equal(mapped.solution.keyEvidenceIds[0].toString(), mapped.evidence[0]._id.toString());
    assert.equal(mapped.evidence[1].assetStatus, 'fallback');
    assert.equal(mapped.evidence[1].assetUrl, '');
    assert.match(mapped.evidence[1].content.imagePrompt, /Illustrative fictional/);
  });
});
