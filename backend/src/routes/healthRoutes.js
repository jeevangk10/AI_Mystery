const express = require('express');
const AppError = require('../utils/appError');

function createHealthRouter(getDatabaseState) {
  const router = express.Router();

  router.get('/', (req, res, next) => {
    if (getDatabaseState() !== 1) {
      return next(new AppError(503, 'DATABASE_UNAVAILABLE', 'MongoDB is not connected.'));
    }

    return res.json({
      success: true,
      data: { status: 'ok', database: 'connected' },
    });
  });

  return router;
}

module.exports = createHealthRouter;
