const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8000;

// ✅ CORS Configuration
const corsOptions = {
  origin: "https://taskifyhimanshu.vercel.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));
app.options("*", cors()); // Allow preflight for all routes

// ✅ Middleware
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://himanshu0072:hima@cluster0.9ariqnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Define User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // Stored as a **hashed** password
});
const User = mongoose.model("User", UserSchema);

// ✅ Define Task Schema
const TaskSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  task_name: String,
  status: { type: String, default: "Pending" },
  task_description: String,
  due_date: String,
  priority: { type: String, default: "Low" },
  category: String,
  estimated_time: Number,
  actual_time: Number,
  notes: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  completed_at: Date,
  assigned_to: { type: String, default: "Self" },
  tags: String,
});
const Task = mongoose.model("Task", TaskSchema);

// api for status
fetch(`https://taskify-1wt1.onrender.com/api/usersTasks/${userId}/${taskId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: newStatus }),
});

// ✅ Signup API (Now with Hashed Password)
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.json({
      success: true,
      message: "User created successfully",
      user_id: newUser._id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Login API (Now with Hashed Password Verification)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      success: true,
      user: { user_id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Fetch User Tasks API
app.get("/api/usersTasks/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const tasks = await Task.find({ user_id });

    res.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Add New Task API
app.post("/api/usersTasks/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { task_name } = req.body;

    if (!task_name) {
      return res.status(400).json({ error: "Task name is required" });
    }

    const newTask = new Task({ user_id, task_name });
    await newTask.save();

    res.json({
      success: true,
      message: "Task added successfully",
      task: newTask,
    });
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Delete Task API (Now Ensuring Correct `user_id`)
app.delete("/api/usersTasks/:user_id/:taskId", async (req, res) => {
  try {
    const { user_id, taskId } = req.params;

    const deletedTask = await Task.findOneAndDelete({ _id: taskId, user_id });

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Update Task API (More Secure and Flexible)
app.patch("/api/usersTasks/:user_id/:taskId", async (req, res) => {
  try {
    const { user_id, taskId } = req.params;
    const updateData = { ...req.body, updated_at: new Date() };

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, user_id },
      updateData,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
