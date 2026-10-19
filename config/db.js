const mongoose = require('mongoose');
const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let isMongoConnected = false;

// Fallback NeDB datastores
const localDB = {
  users: Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true }),
  adulterants: Datastore.create({ filename: path.join(dataDir, 'adulterants.db'), autoload: true }),
  tests: Datastore.create({ filename: path.join(dataDir, 'tests.db'), autoload: true })
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/milkadulteration';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    isMongoConnected = true;
    console.log(`[Database] MongoDB connected successfully to: ${uri}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[Database] Could not connect to MongoDB at ${uri}. Running with local persistent data store (NeDB).`);
    console.warn(`[Database] Tip: To connect to MongoDB, start your local mongod service or specify MONGODB_URI in .env`);
  }
};

const getStatus = () => {
  return {
    isMongoConnected,
    mode: isMongoConnected ? 'MongoDB' : 'Local Persistent Datastore (Fallback)'
  };
};

module.exports = {
  connectDB,
  getStatus,
  localDB,
  isMongo: () => isMongoConnected
};
