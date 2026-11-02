function idOf(value) {
  return value?.toString?.() || String(value || '');
}

function evaluateAccusation(mystery, suspectId) {
  const selected = mystery.suspects.find((suspect) => idOf(suspect._id) === suspectId);
  if (!selected) return null;
  const isCorrect = idOf(mystery.solution.culpritId) === suspectId;
  return { selected, isCorrect, score: isCorrect ? 100 : 0 };
}

function buildInvestigationResult(mystery, accusation) {
  if (!mystery?.solution || !accusation) return undefined;
  const suspects = new Map(mystery.suspects.map((suspect) => [idOf(suspect._id), suspect]));
  const evidence = new Map(mystery.evidence.map((item) => [idOf(item._id), item]));
  const culprit = suspects.get(idOf(mystery.solution.culpritId));
  const accused = suspects.get(idOf(accusation.suspectId));

  return {
    isCorrect: accusation.isCorrect,
    score: accusation.isCorrect ? 100 : 0,
    accused: accused ? { id: idOf(accused._id), name: accused.name } : undefined,
    culprit: culprit ? { id: idOf(culprit._id), name: culprit.name } : undefined,
    motive: mystery.solution.motive,
    method: mystery.solution.method,
    summary: mystery.solution.solutionSummary,
    steps: mystery.solution.solutionSteps,
    keyEvidence: mystery.solution.keyEvidenceIds.map((id) => evidence.get(idOf(id))).filter(Boolean).map((item) => ({
      id: idOf(item._id), title: item.title, type: item.type, explanation: item.description,
    })),
    reasoning: mystery.solution.evidenceReasoning.map((item) => ({
      evidenceTitle: evidence.get(idOf(item.evidenceId))?.title || 'Case evidence',
      suspectName: suspects.get(idOf(item.suspectId))?.name || '',
      relationship: item.relationship,
      claim: item.claim,
      explanation: item.explanation,
    })),
  };
}

module.exports = { evaluateAccusation, buildInvestigationResult };
