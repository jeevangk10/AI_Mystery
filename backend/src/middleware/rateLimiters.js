const { rateLimit } = require('express-rate-limit');

function responseHandler(_req, res) {
  return res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Wait a little while and try again.',
    },
  });
}

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: responseHandler,
});

const generationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: responseHandler,
});

module.exports = { apiRateLimit, generationRateLimit };
