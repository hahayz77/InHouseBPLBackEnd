const mongoose = require('../database/mongodb');

const rankingSchema = new mongoose.Schema({
  name: {
      type: String,
      unique: true,
      require: true
  },
  ranking: {
    type: Array
  },
  date: {
    type: String
  },
  time: {
    type: Date,
    default: Date.now
  }
});

const Ranking = mongoose.model("Ranking", rankingSchema);
module.exports = Ranking;