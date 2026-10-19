const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/milkwise';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required in production. Set it to your Atlas or hosted MongoDB connection string.');
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: isProd ? 15000 : 8000,
    maxPoolSize: 10
  });

  console.log(`[Database] MongoDB connected (${mongoose.connection.host}/${mongoose.connection.name})`);
};

const getStatus = () => ({
  isMongoConnected: mongoose.connection.readyState === 1,
  mode: mongoose.connection.readyState === 1 ? 'MongoDB' : 'Disconnected',
  name: mongoose.connection.name || null
});

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getStatus
};
