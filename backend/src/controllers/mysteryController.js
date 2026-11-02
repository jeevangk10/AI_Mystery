const AppError = require('../utils/appError');
const { createMysterySchema } = require('../validators/caseSchemas');
const { listEvidenceSchema } = require('../validators/mysteryValidators');
const {
  parseId,
  findOwnedMystery,
  requireReady,
  publicMystery,
} = require('../services/mysteryAccess');

function createMysteryController({ Mystery, generateMystery }) {
  async function create(req, res) {
    const parsed = createMysterySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Please provide a scenario between 50 and 3,000 characters and valid case preferences.');
    }

    try {
      const mystery = await generateMystery({ input: parsed.data, ownerSessionId: req.sessionId });
      return res.status(201).json({
        success: true,
        data: { mysteryId: mystery.id || mystery._id.toString(), status: mystery.status },
      });
    } catch (error) {
      if (error.name === 'MysteryGenerationError') {
        throw new AppError(502, 'GENERATION_FAILED', 'We could not create a consistent mystery. Please try again.');
      }
      throw error;
    }
  }

  async function getStatus(req, res) {
    const mystery = await findOwnedMystery(Mystery, req.params.id, req.sessionId);
    const progressMessage = {
      generating: 'Creating your fictional case.',
      validating: 'Checking the case evidence and timeline.',
      ready: 'Your case is ready to investigate.',
      failed: 'We could not complete this case. Please try again.',
      archived: 'This case is no longer available for a new investigation.',
    }[mystery.status];
    return res.json({
      success: true,
      data: { mysteryId: mystery.id || mystery._id.toString(), status: mystery.status, progressMessage },
    });
  }

  async function getMystery(req, res) {
    const mystery = await findOwnedMystery(Mystery, req.params.id, req.sessionId);
    requireReady(mystery);
    return res.json({ success: true, data: { mystery: publicMystery(mystery) } });
  }

  async function listEvidence(req, res) {
    const query = listEvidenceSchema.safeParse(req.query);
    if (!query.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Please provide valid evidence filters.');
    }

    const mystery = await findOwnedMystery(Mystery, req.params.id, req.sessionId);
    requireReady(mystery);

    const filter = query.data;
    const evidence = filter.type ? mystery.evidence.filter((item) => item.type === filter.type) : [...mystery.evidence];
    const offset = (filter.page - 1) * filter.limit;
    return res.json({
      success: true,
      data: {
        items: evidence.slice(offset, offset + filter.limit).map((item) => (
          typeof item.toObject === 'function' ? item.toObject() : item
        )),
        pagination: { page: filter.page, limit: filter.limit, total: evidence.length },
      },
    });
  }

  async function getEvidence(req, res) {
    const mystery = await findOwnedMystery(Mystery, req.params.id, req.sessionId);
    requireReady(mystery);
    const evidenceId = parseId(req.params.evidenceId, 'evidence identifier');
    const evidence = mystery.evidence.find((item) => item._id.toString() === evidenceId);
    if (!evidence) throw new AppError(404, 'NOT_FOUND', 'The requested evidence was not found.');
    return res.json({
      success: true,
      data: { evidence: typeof evidence.toObject === 'function' ? evidence.toObject() : evidence },
    });
  }

  return { create, getStatus, getMystery, listEvidence, getEvidence };
}

module.exports = createMysteryController;
