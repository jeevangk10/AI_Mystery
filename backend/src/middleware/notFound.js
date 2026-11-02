const AppError = require('../utils/appError');

function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found.'));
}

module.exports = notFound;
