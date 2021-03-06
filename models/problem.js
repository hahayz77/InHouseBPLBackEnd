const mongoose = require('../database/mongodb');

const ProblemSchema = new mongoose.Schema({
  player: {
      type: String
  },
  second_player:{
    type: String
  },
  match_id: {
    type: String
  },
  problem_type: {
      type: String
  },
  problem_result:{
        type: Boolean
  },
  teams:{
    type: Array
  },
  time: {
      type: Date,
      default: Date.now,
      required: true,
  },
  expire_at: {
      type: Date, 
      default: Date.now, 
      expires: 604800
  }
});


const Problem = mongoose.model("Problem", ProblemSchema);
module.exports = Problem;