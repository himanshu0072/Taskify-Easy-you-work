const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  task_name: { type: String, required: true },
  task_description: { type: String, default: "" },
  due_date: { type: Date, default: null },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  category: { type: String, default: "" },
  estimated_time: { type: Number, default: 0 },
  actual_time: { type: Number, default: null },
  notes: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  completed_at: { type: Date, default: null },
  assigned_to: { type: String, default: "Self" },
  tags: { type: String, default: "" },
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
