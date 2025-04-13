require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { Groq } = require("groq-sdk");
const app = express();
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, 
  companyName: String,
  industry: String,
  activeToken: {
    token: String,
    createdAt: Date,
  },
});

const ExpenseSchema = new mongoose.Schema({
  username: String,
  userEmail: String,
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  expenseType: {
    type: String,
    required: true,
    enum: [
      "full expense tracker",
      "business expense tracker",
      "personal expense tracker",
      "daily expense tracker",
      "other expenses",
    ],
  },
  createdAt: { type: Date, default: Date.now },
});

const ChatSchema = new mongoose.Schema({
  userEmail: String,
  messages: [
    {
      text: String,
      isUser: Boolean,
      timestamp: { type: Date, default: Date.now },
      model: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
const Expense = mongoose.model("Expense", ExpenseSchema);
const Chat = mongoose.model("Chat", ChatSchema);

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Authorization Header:", authHeader); 
  console.log("Token:", token); 

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded token:", decoded); 
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("User not found for ID:", decoded.id);
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (user.activeToken.token !== token) {
      console.log("Token mismatch for user:", user.email);
      return res.status(401).json({
        success: false,
        message: "Token has been invalidated. Please login again.",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message); 
    return res.status(403).json({ success: false, message: "Invalid token", error: err.message });
  }
};

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, companyName, industry } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`Registration failed: User already exists (Email: ${email})`);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const newUser = new User({
      name,
      email,
      password,
      companyName,
      industry,
      activeToken: { token: null, createdAt: null },
    });
    await newUser.save();

    const token = generateToken(newUser);
    newUser.activeToken = { token, createdAt: new Date() };
    await newUser.save();

    console.log(`New user registered: ${email}`);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: { name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`Login failed: User not found (Email: ${email})`);
      return res.status(400).json({ success: false, message: "User not found" });
    }

    if (user.password !== password) {
      console.log(`Login failed: Invalid credentials (Email: ${email})`);
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);
    user.activeToken = { token, createdAt: new Date() };
    await user.save();

    console.log(`User logged in: ${email}`);
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/logout", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.activeToken = { token: null, createdAt: null };
    await user.save();

    console.log(`User logged out: ${req.user.email}`);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/auth-status", verifyToken, (req, res) => {
  res.json({
    success: true,
    user: { name: req.user.name, email: req.user.email },
  });
});

app.post("/api/expenses", verifyToken, async (req, res) => {
  try {
    const { expenses, expenseType } = req.body;
    if (!Array.isArray(expenses) || expenses.length === 0 || !expenseType) {
      console.log("Expense addition failed: Invalid expenses data or missing expense type");
      return res.status(400).json({
        success: false,
        message: "Invalid expenses data or missing expense type",
      });
    }

    const userExpenses = expenses.map((expense) => ({
      ...expense,
      username: req.user.name,
      userEmail: req.user.email,
      expenseType,
      createdAt: new Date(),
    }));

    await Expense.insertMany(userExpenses);
    console.log(`${expenseType} expenses added for user: ${req.user.name}`);
    res.status(201).json({ success: true, message: "Expenses added successfully" });
  } catch (err) {
    console.error("Error adding expenses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/expenses/recent", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`Recent expenses fetched for user: ${req.user.name}, Count: ${expenses.length}`);
    res.json({ success: true, expenses });
  } catch (err) {
    console.error("Error fetching recent expenses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/expenses/:expenseType", verifyToken, async (req, res) => {
  try {
    const expenseType = decodeURIComponent(req.params.expenseType);
    const expenses = await Expense.find({
      userEmail: req.user.email,
      expenseType: expenseType,
    }).sort({ date: -1 });

    console.log(`${expenseType} expenses fetched for user: ${req.user.name}`);
    res.json({ success: true, expenses });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/expenses/analysis/:expenseType", verifyToken, async (req, res) => {
  try {
    const expenseType = decodeURIComponent(req.params.expenseType);

    const analysis = await Expense.aggregate([
      {
        $match: {
          userEmail: req.user.email,
          expenseType: expenseType,
        },
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    console.log(`Analysis fetched for ${expenseType} for user: ${req.user.name}`);
    res.json({
      success: true,
      analysis,
      message: "Analysis fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching analysis:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/insights", verifyToken, async (req, res) => {
  try {
    console.log("Received /api/insights request:", req.body);
    const { expenseType, categories, amounts } = req.body;

    if (!expenseType || !categories || !amounts || !Array.isArray(categories) || !Array.isArray(amounts)) {
      console.error("Validation failed: Invalid request data");
      return res.status(400).json({ success: false, message: "Invalid request data" });
    }

    if (categories.length === 0 || amounts.length === 0 || categories.length !== amounts.length) {
      console.error("Validation failed: Arrays empty or mismatched");
      return res.status(400).json({
        success: false,
        message: "Categories and amounts must be non-empty and match in length",
      });
    }

    if (!amounts.every((amt) => typeof amt === "number" && !isNaN(amt))) {
      console.error("Validation failed: Amounts must be valid numbers");
      return res.status(400).json({ success: false, message: "Amounts must be valid numbers" });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `Analyze the following expense data for ${expenseType} and provide 3-5 numbered insights (e.g., "1. Insight text"):
Categories: ${categories.join(", ")}
Amounts: ${amounts.join(", ")}`;
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });

    const insightsText = response.choices[0].message.content;
    const insights = insightsText
      .split("\n")
      .filter((line) => line.trim() && /^\d+\./.test(line))
      .map((line) => line.trim());

    res.json({ success: true, insights });
  } catch (error) {
    console.error("Error in /api/insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate insights",
      error: error.message,
    });
  }
});

app.get("/api/chats/:userEmail", async (req, res) => {
  try {
    const chats = await Chat.find({ userEmail: req.params.userEmail });
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chats" });
  }
});

app.post("/api/chats", async (req, res) => {
  try {
    const { userEmail, message, isUser, model } = req.body;
    let chat = await Chat.findOne({ userEmail });

    if (!chat) {
      chat = new Chat({ userEmail, messages: [] });
    }

    chat.messages.push({ text: message, isUser, model });
    await chat.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ success: false, message: "Failed to save chat" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model } = req.body;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      messages,
      model: model || "llama-3.1-8b-instant",
    });
    res.json(response.choices[0].message);
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({ success: false, message: "Failed to get response from Groq" });
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), (req, res) => {
  res.json({ message: "File uploaded successfully", filename: req.file.originalname });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));