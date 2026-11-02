const mongoose = require('mongoose');

async function connectDatabase(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  return mongoose.connection;
}

function getDatabaseState() {
  return mongoose.connection.readyState;
}

module.exports = { connectDatabase, getDatabaseState };
