const mongoose = require('mongoose');
const { isMongo, localDB } = require('../config/db');

const testResultSchema = new mongoose.Schema({
  userId: { type: String, default: 'guest' },
  userEmail: { type: String, default: 'guest@example.com' },
  adulterantSlug: { type: String, required: true },
  adulterantName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  sampledColorHex: { type: String, required: true },
  sampledColorRgb: [Number],
  detectedStatus: { type: String, enum: ['PURE', 'ADULTERATED'], required: true },
  confidenceScore: { type: Number, required: true },
  distanceToPure: { type: Number },
  distanceToAdulterated: { type: Number },
  milkSource: { type: String, default: '' },
  labTerminology: { type: String, enum: ['NEGATIVE', 'POSITIVE'], default: 'NEGATIVE' },
  chemicalReport: {
    purpose: String,
    snfImpact: String,
    densityImpact: String,
    chemicalMechanism: String,
    healthHazards: [String],
    fssaiLimit: String
  },
  notes: { type: String, default: '' },
  sampleName: { type: String, default: 'Milk Sample #1' },
  createdAt: { type: Date, default: Date.now }
});

const MongoTestResult = mongoose.model('TestResult', testResultSchema);

class TestResultModel {
  static async create(data) {
    if (isMongo()) {
      return await MongoTestResult.create(data);
    } else {
      const record = { ...data, createdAt: new Date() };
      const saved = await localDB.tests.insert(record);
      return saved;
    }
  }

  static async find(query = {}) {
    if (isMongo()) {
      return await MongoTestResult.find(query).sort({ createdAt: -1 });
    } else {
      const results = await localDB.tests.find(query);
      return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  static async findById(id) {
    if (isMongo()) {
      return await MongoTestResult.findById(id);
    } else {
      return await localDB.tests.findOne({ _id: id });
    }
  }

  static async deleteById(id, userId) {
    if (isMongo()) {
      return await MongoTestResult.findOneAndDelete({ _id: id, userId });
    } else {
      return await localDB.tests.remove({ _id: id, userId });
    }
  }
}

module.exports = TestResultModel;
