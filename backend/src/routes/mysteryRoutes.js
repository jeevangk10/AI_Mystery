const express = require('express');
const Mystery = require('../models/Mystery');
const { generateMystery } = require('../services/ai/mysteryGenerator');
const createMysteryController = require('../controllers/mysteryController');
const { generationRateLimit } = require('../middleware/rateLimiters');

function createMysteryRouter({ MysteryModel = Mystery, generateMystery: generate = generateMystery } = {}) {
  const router = express.Router();
  const controller = createMysteryController({ Mystery: MysteryModel, generateMystery: generate });

  router.post('/', generationRateLimit, controller.create);
  router.get('/:id/status', controller.getStatus);
  router.get('/:id/evidence/:evidenceId', controller.getEvidence);
  router.get('/:id/evidence', controller.listEvidence);
  router.get('/:id', controller.getMystery);

  return router;
}

module.exports = createMysteryRouter;
