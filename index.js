const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 8000;

// CORS Configuration
const corsOptions = {
  origin: "https://taskifyhimanshu.vercel.app",
  // origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));
app.use(express.json());

// File Paths
const usersFile = path.join(__dirname, "data", "users.json"); // Updated path
const tasksFile = path.join(__dirname, "data", "UsersTasks.json"); // Updated path

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Load Users
const loadUsers = () => {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, "utf8").trim();
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error("Error loading users:", error);
  }
  return [];
};

// Load Tasks
const loadTasks = () => {
  try {
    if (fs.existsSync(tasksFile)) {
      const data = fs.readFileSync(tasksFile, "utf8").trim();
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
  return [];
};

// Save Tasks
const saveTasks = (tasks) => {
  try {
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
};

// Login API
app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = loadUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Return user data without password
    const { password: _, ...userData } = user;
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch User Tasks API
app.get("/api/usersTasks/:user_id", (req, res) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const tasks = loadTasks();
    const userTasks = tasks.find((user) => user.user_id === parseInt(userId));

    if (!userTasks) {
      return res.status(404).json({ error: "No tasks found for this user." });
    }

    res.json({ tasks: userTasks.tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add New Task API
app.post("/api/usersTasks/:user_id", (req, res) => {
  try {
    const { user_id } = req.params;
    const { task_name } = req.body;

    if (!user_id || !task_name) {
      return res.status(400).json({ error: "Missing user_id or task_name" });
    }

    const tasks = loadTasks();
    const userTasks = tasks.find((user) => user.user_id === parseInt(user_id));

    if (!userTasks) {
      return res.status(404).json({ error: "User not found." });
    }

    const newTask = {
      task_id: Date.now(),
      task_name,
      status: "Pending",
      task_description: "",
      due_date: "",
      priority: "Low",
      category: "",
      estimated_time: 0,
      actual_time: null,
      notes: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      assigned_to: "Self",
      tags: "",
    };

    userTasks.tasks.push(newTask);
    saveTasks(tasks);

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

// Delete Task API
app.delete("/api/usersTasks/:user_id/:taskId", (req, res) => {
  try {
    const { user_id, taskId } = req.params;
    const tasks = loadTasks();

    const userTasks = tasks.find((user) => user.user_id === parseInt(user_id));

    if (!userTasks) {
      return res.status(404).json({ error: "User not found." });
    }

    const taskIndex = userTasks.tasks.findIndex(
      (task) => task.task_id === parseInt(taskId)
    );

    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found." });
    }

    userTasks.tasks.splice(taskIndex, 1);
    saveTasks(tasks);

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Task API (Mark as Completed or Edit Task)
app.patch("/api/usersTasks/:user_id/:taskId", (req, res) => {
  try {
    const { user_id, taskId } = req.params;
    const { task_name, status } = req.body;
    const tasks = loadTasks();

    const userTasks = tasks.find((user) => user.user_id === parseInt(user_id));

    if (!userTasks) {
      return res.status(404).json({ error: "User not found." });
    }

    const task = userTasks.tasks.find(
      (task) => task.task_id === parseInt(taskId)
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (task_name) task.task_name = task_name;
    if (status) task.status = status;

    saveTasks(tasks);
    res.json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Signup API
app.post("/api/signup", (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Load existing users
    const users = loadUsers();

    // Check if email already exists
    if (users.some((user) => user.email === email)) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Create new user
    const newUser = {
      user_id: users.length ? users[users.length - 1].user_id + 1 : 1,
      name,
      email,
      password,
    };

    // Update users.json
    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    // Update UsersTasks.json
    const usersTasks = loadTasks();
    usersTasks.push({
      user_id: newUser.user_id,
      tasks: [],
    });
    fs.writeFileSync(tasksFile, JSON.stringify(usersTasks, null, 2));

    res.json({
      success: true,
      message: "User created successfully",
      user_id: newUser.user_id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
