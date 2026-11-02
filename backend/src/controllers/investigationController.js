const AppError = require('../utils/appError');
const {
  createInvestigationSchema,
  examineEvidenceSchema,
  listInvestigationsSchema,
  submitAccusationSchema,
} = require('../validators/mysteryValidators');
const {
  findOwnedMystery,
  findOwnedInvestigation,
  parseId,
  requireReady,
  publicMystery,
  publicInvestigation,
} = require('../services/mysteryAccess');
const { evaluateAccusation, buildInvestigationResult } = require('../services/accusationResult');

function createInvestigationController({ Mystery, Investigation }) {
  async function create(req, res) {
    const parsed = createInvestigationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Please provide a valid mystery identifier.');
    }

    const mystery = await findOwnedMystery(Mystery, parsed.data.mysteryId, req.sessionId);
    requireReady(mystery);

    let investigation = await Investigation.findOne({
      mysteryId: mystery._id,
      ownerSessionId: req.sessionId,
      status: 'active',
    });
    let created = false;

    if (!investigation) {
      try {
        investigation = await Investigation.create({
          mysteryId: mystery._id,
          ownerSessionId: req.sessionId,
          status: 'active',
        });
        created = true;
      } catch (error) {
        if (error.code !== 11000) throw error;
        investigation = await Investigation.findOne({
          mysteryId: mystery._id,
          ownerSessionId: req.sessionId,
          status: 'active',
        });
        if (!investigation) throw error;
      }
    }

    return res.status(created ? 201 : 200).json({
      success: true,
      data: { investigation: publicInvestigation(investigation) },
    });
  }

  async function get(req, res) {
    const investigation = await findOwnedInvestigation(Investigation, req.params.id, req.sessionId);
    const mystery = await findOwnedMystery(Mystery, investigation.mysteryId.toString(), req.sessionId);
    let result;
    if (investigation.status === 'completed' && investigation.accusation) {
      const query = Mystery.findOne({ _id: mystery._id, ownerSessionId: req.sessionId });
      const revealedMystery = query.select ? await query.select('+solution') : await query;
      result = buildInvestigationResult(revealedMystery, investigation.accusation);
    }
    return res.json({
      success: true,
      data: {
        investigation: publicInvestigation(investigation),
        mystery: publicMystery(mystery),
        ...(result ? { result } : {}),
      },
    });
  }

  async function accuse(req, res) {
    const parsed = submitAccusationSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Please select a valid suspect.');

    const investigation = await findOwnedInvestigation(Investigation, req.params.id, req.sessionId);
    if (investigation.status !== 'active') {
      throw new AppError(409, 'INVESTIGATION_COMPLETED', 'This investigation already has a final result.');
    }
    const mystery = await findOwnedMystery(Mystery, investigation.mysteryId.toString(), req.sessionId);
    const suspectId = parseId(parsed.data.suspectId, 'suspect identifier');
    if (!mystery.suspects.some((suspect) => suspect._id.toString() === suspectId)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Choose a suspect from this case.');
    }

    const query = Mystery.findOne({ _id: mystery._id, ownerSessionId: req.sessionId });
    const revealedMystery = query.select ? await query.select('+solution') : await query;
    if (!revealedMystery?.solution) {
      throw new AppError(500, 'SOLUTION_UNAVAILABLE', 'This case result could not be evaluated.');
    }

    const serverEvaluation = evaluateAccusation(revealedMystery, suspectId);
    investigation.accusation = {
      suspectId,
      isCorrect: serverEvaluation.isCorrect,
      submittedAt: new Date(),
    };
    investigation.score = serverEvaluation.score;
    investigation.status = 'completed';
    investigation.completedAt = investigation.accusation.submittedAt;
    try {
      await investigation.save();
    } catch (error) {
      if (error.name === 'VersionError') {
        throw new AppError(409, 'INVESTIGATION_COMPLETED', 'This investigation already has a final result.');
      }
      throw error;
    }

    return res.json({
      success: true,
      data: {
        investigation: publicInvestigation(investigation),
        result: buildInvestigationResult(revealedMystery, investigation.accusation),
      },
    });
  }

  async function setEvidenceExamined(req, res) {
    const parsed = examineEvidenceSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Please provide a valid evidence state.');

    const investigation = await findOwnedInvestigation(Investigation, req.params.id, req.sessionId);
    if (investigation.status !== 'active') {
      throw new AppError(409, 'INVESTIGATION_COMPLETED', 'Completed investigations cannot be changed.');
    }
    const mystery = await findOwnedMystery(Mystery, investigation.mysteryId.toString(), req.sessionId);
    const evidenceId = parseId(req.params.evidenceId, 'evidence identifier');
    if (!mystery.evidence.some((item) => item._id.toString() === evidenceId)) {
      throw new AppError(404, 'NOT_FOUND', 'The requested evidence was not found.');
    }

    const examined = new Set((investigation.examinedEvidenceIds || []).map((id) => id.toString()));
    if (parsed.data.examined) examined.add(evidenceId);
    else examined.delete(evidenceId);
    investigation.examinedEvidenceIds = [...examined];
    await investigation.save();

    return res.json({
      success: true,
      data: { investigation: publicInvestigation(investigation) },
    });
  }

  async function list(req, res) {
    const parsed = listInvestigationsSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Please provide valid history filters.');
    }

    const { status, page, limit } = parsed.data;
    const filter = { ownerSessionId: req.sessionId, ...(status ? { status } : {}) };
    const [items, total] = await Promise.all([
      Investigation.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Investigation.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items: items.map(publicInvestigation),
        pagination: { page, limit, total },
      },
    });
  }

  return { create, get, list, setEvidenceExamined, accuse };
}

module.exports = createInvestigationController;
