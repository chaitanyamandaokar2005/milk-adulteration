const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  userId: { type: String, default: 'guest', index: true },
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

testResultSchema.index({ userId: 1, createdAt: -1 });

testResultSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    return ret;
  }
});

const MongoTestResult = mongoose.model('TestResult', testResultSchema);

class TestResultModel {
  static async create(data) {
    return MongoTestResult.create(data);
  }

  static async find(query = {}) {
    return MongoTestResult.find(query).sort({ createdAt: -1 });
  }

  static async findById(id) {
    return MongoTestResult.findById(id);
  }

  static async deleteById(id, userId) {
    return MongoTestResult.findOneAndDelete({ _id: id, userId });
  }
}

module.exports = TestResultModel;
