const mongoose = require('../database/mongodb');

const QueueSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true
  },
  name: {
      type: String,
      required: true,
      unique: true
  },
  main: {
    type: String
  },
  time: {
      type: Date,
      default: Date.now,
      required: true,
  },
  expire_at: {
      type: Date, 
      default: Date.now, 
      expires: 3600
  }
});


const Queue = mongoose.model("Queue", QueueSchema);
module.exports = Queue;