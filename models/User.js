const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model('User', userSchema);

class UserModel {
  static async create(data) {
    return MongoUser.create(data);
  }

  static async findOne(query) {
    return MongoUser.findOne(query);
  }

  static async findById(id) {
    return MongoUser.findById(id);
  }
}

module.exports = UserModel;
