const AppError = require('../utils/appError');

function createSameOriginGuard(clientUrls) {
  const allowedOrigins = new Set(clientUrls.map((value) => {
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  }).filter(Boolean));

  return function sameOriginGuard(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    const origin = req.get('origin');
    if (origin && !allowedOrigins.has(origin)) {
      return next(new AppError(403, 'FORBIDDEN', 'This request origin is not allowed.'));
    }

    return next();
  };
}

module.exports = createSameOriginGuard;
