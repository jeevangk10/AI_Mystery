const express = require('express');
const Mystery = require('../models/Mystery');
const Investigation = require('../models/Investigation');
const createInvestigationController = require('../controllers/investigationController');

function createInvestigationRouter({ MysteryModel = Mystery, InvestigationModel = Investigation } = {}) {
  const router = express.Router();
  const controller = createInvestigationController({ Mystery: MysteryModel, Investigation: InvestigationModel });

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.patch('/:id/evidence/:evidenceId/examined', controller.setEvidenceExamined);
  router.post('/:id/accuse', controller.accuse);
  router.get('/:id', controller.get);

  return router;
}

module.exports = createInvestigationRouter;
