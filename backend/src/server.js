const env = require('./config/env');
const dns = require('node:dns');
if (env.MONGODB_DNS_SERVERS.length) dns.setServers(env.MONGODB_DNS_SERVERS);
const { connectDatabase } = require('./config/database');
const createApp = require('./app');
const app = createApp({
  clientUrl: env.CLIENT_URL,
  sessionSecret: env.SESSION_SECRET || require('node:crypto').randomBytes(32).toString('hex'),
  production: env.NODE_ENV === 'production',
});
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.info(`API listening on http://localhost:${env.PORT}`);
});

connectDatabase(env.MONGODB_URI)
  .then(() => console.info('MongoDB connection established.'))
  .catch((error) => console.error(`MongoDB connection failed: ${error.message}`));

function shutdown(signal) {
  console.info(`${signal} received. Closing API server.`);
  server.close(() => {
    const mongoose = require('mongoose');
    mongoose.disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
