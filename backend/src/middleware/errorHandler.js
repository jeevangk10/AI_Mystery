function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected server error occurred.'
    : error.message || 'An unexpected server error occurred.';

  if (statusCode >= 500 && code !== 'DATABASE_UNAVAILABLE' && process.env.NODE_ENV !== 'test') {
    console.error(`[${code}] ${error.message || 'Unexpected server error'}`);
  }

  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

module.exports = errorHandler;
