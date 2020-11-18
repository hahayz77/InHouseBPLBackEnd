const mongoose = require('../database/mongodb');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    unique: true,
    lowercase: true
  },
  name: {
      type: String,
      unique: true,
      require: true
  },
  password: {
    type: String,
    required: true
  },
  main: {
    type: String
  },
  report: {
    type: String
  },
  status: {
    type: Object
  },
  points: {
      type: Number,
  },
  time: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;