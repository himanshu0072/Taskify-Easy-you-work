const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user_id: String,
  task: String,
  status: { type: Boolean, default: false },
});

module.exports = mongoose.model("Task", TaskSchema);
