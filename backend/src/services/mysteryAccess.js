const AppError = require('../utils/appError');
const { objectId } = require('../validators/mysteryValidators');

function parseId(value, label = 'identifier') {
  const parsed = objectId.safeParse(value);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', `Please provide a valid ${label}.`);
  }
  return parsed.data;
}

async function findOwnedMystery(Mystery, id, sessionId) {
  const mysteryId = parseId(id, 'mystery identifier');
  const mystery = await Mystery.findOne({ _id: mysteryId, ownerSessionId: sessionId });
  if (!mystery) throw new AppError(404, 'NOT_FOUND', 'The requested mystery was not found.');
  return mystery;
}

async function findOwnedInvestigation(Investigation, id, sessionId) {
  const investigationId = parseId(id, 'investigation identifier');
  const investigation = await Investigation.findOne({ _id: investigationId, ownerSessionId: sessionId });
  if (!investigation) throw new AppError(404, 'NOT_FOUND', 'The requested investigation was not found.');
  return investigation;
}

function requireReady(mystery) {
  if (mystery.status !== 'ready') {
    throw new AppError(409, 'MYSTERY_NOT_READY', 'This mystery is not ready to investigate.');
  }
}

function publicMystery(mystery) {
  const value = typeof mystery.toObject === 'function'
    ? mystery.toObject({ versionKey: false, minimize: false })
    : JSON.parse(JSON.stringify(mystery));
  delete value.solution;
  delete value.ownerSessionId;
  delete value.__v;
  return value;
}

function publicInvestigation(investigation) {
  const value = typeof investigation.toObject === 'function'
    ? investigation.toObject({ versionKey: false })
    : JSON.parse(JSON.stringify(investigation));
  delete value.ownerSessionId;
  delete value.__v;
  return value;
}

module.exports = {
  parseId,
  findOwnedMystery,
  findOwnedInvestigation,
  requireReady,
  publicMystery,
  publicInvestigation,
};
