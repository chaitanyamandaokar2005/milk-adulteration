const mongoose = require('mongoose');
const { isMongo, localDB } = require('../config/db');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model('User', userSchema);

class UserModel {
  static async create(data) {
    if (isMongo()) {
      return await MongoUser.create(data);
    } else {
      const record = { ...data, createdAt: new Date() };
      const saved = await localDB.users.insert(record);
      return saved;
    }
  }

  static async findOne(query) {
    if (isMongo()) {
      return await MongoUser.findOne(query);
    } else {
      return await localDB.users.findOne(query);
    }
  }

  static async findById(id) {
    if (isMongo()) {
      return await MongoUser.findById(id);
    } else {
      return await localDB.users.findOne({ _id: id });
    }
  }
}

module.exports = UserModel;
