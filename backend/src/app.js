const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { getDatabaseState } = require('./config/database');
const createHealthRouter = require('./routes/healthRoutes');
const createMysteryRouter = require('./routes/mysteryRoutes');
const createInvestigationRouter = require('./routes/investigationRoutes');
const { createGuestSession } = require('./middleware/guestSession');
const createSameOriginGuard = require('./middleware/sameOrigin');
const { apiRateLimit } = require('./middleware/rateLimiters');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

function createApp({
  databaseState = getDatabaseState,
  clientUrl = process.env.CLIENT_URL || 'http://localhost:5173',
  sessionSecret = process.env.SESSION_SECRET || 'development-only-session-secret-change-before-production',
  production = process.env.NODE_ENV === 'production',
  sessionIdFactory,
  MysteryModel,
  InvestigationModel,
  generateMystery,
} = {}) {
  const app = express();
  const clientUrls = clientUrl.split(',').map((url) => url.trim()).filter(Boolean);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: clientUrls, credentials: true }));
  app.use(express.json({ limit: '64kb' }));
  app.use('/api/v1', apiRateLimit);
  app.use('/api/v1', createGuestSession({ secret: sessionSecret, production, sessionIdFactory }));
  app.use('/api/v1', createSameOriginGuard(clientUrls));

  app.use('/api/v1/health', createHealthRouter(databaseState));
  app.use('/api/v1/mysteries', createMysteryRouter({ MysteryModel, generateMystery }));
  app.use('/api/v1/investigations', createInvestigationRouter({ MysteryModel, InvestigationModel }));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
