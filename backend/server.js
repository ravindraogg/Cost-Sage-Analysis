require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { Groq } = require("groq-sdk");
const path = require("path");
const fs = require("fs").promises;

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS and JSON middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
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

const messageSchema = new mongoose.Schema({
  text: String,
  isUser: Boolean,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  model: String,
  attachments: [
    {
      name: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true },
      url: { type: String, required: true },
    },
  ],
});

const chatSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  messages: [messageSchema],
});

// Models
const User = mongoose.model("User", UserSchema);
const Expense = mongoose.model("Expense", ExpenseSchema);
const Chat = mongoose.model("Chat", chatSchema);

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

// JWT functions
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

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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

// Authentication routes
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

// Expense routes
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

// Chat routes
app.get("/api/chats/:userEmail", verifyToken, async (req, res) => {
  try {
    const { userEmail } = req.params;
    if (userEmail !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const chats = await Chat.find({ userEmail })
      .sort({ updatedAt: -1 })
      .exec();
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

app.post("/api/chats/new", verifyToken, async (req, res) => {
  try {
    const { userEmail, initialMessage, model, attachments } = req.body;

    if (!userEmail || !initialMessage) {
      return res.status(400).json({ error: "userEmail and initialMessage are required" });
    }
    if (userEmail !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const newChat = new Chat({
      userEmail,
      updatedAt: new Date(),
      messages: [
        {
          text: initialMessage,
          isUser: true,
          timestamp: new Date(),
          model: model || "default",
          attachments: attachments || [],
        },
      ],
    });

    await newChat.save();

    res.status(201).json({
      message: "New chat created successfully",
      chatId: newChat._id,
    });
  } catch (error) {
    console.error("Error creating new chat:", error);
    res.status(500).json({ error: "Failed to create new chat" });
  }
});

app.post("/api/chats/:chatId/messages", verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, isUser, model, attachments } = req.body;

    console.log("Received message data:", { message, isUser, model, attachments }); // Debug log

    if (!message) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    if (chat.userEmail !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Sanitize attachments
    const sanitizedAttachments = Array.isArray(attachments)
      ? attachments
          .filter((att) => att && typeof att === 'object') // Ensure it's an object
          .map((att) => ({
            name: String(att.name || ""),
            type: String(att.type || ""),
            size: Number(att.size) || 0,
            url: String(att.url || ""),
          }))
          .filter((att) => att.name && att.type && att.url) // Require non-empty fields
      : [];

    chat.messages.push({
      text: message,
      isUser,
      timestamp: new Date(),
      model: model || "default",
      attachments: sanitizedAttachments,
    });

    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      message: "Message added successfully",
      chatId: chat._id,
    });
  } catch (error) {
    console.error("Error adding message to chat:", error);
    res.status(500).json({ error: "Failed to add message to chat" });
  }
});

app.post("/api/insights", verifyToken, async (req, res) => {
  try {
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

app.post("/api/chat", verifyToken, async (req, res) => {
  try {
    const { messages, model } = req.body;

    // Clean messages to include only role and content for Groq
    const cleanedMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      messages: cleanedMessages,
      model: model || "llama-3.1-8b-instant",
    });
    res.json(response.choices[0].message);
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({ success: false, message: "Failed to get response from Groq" });
  }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Create uploads directory
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Serve static files
app.use("/uploads", express.static(uploadsDir));

app.post("/api/upload", verifyToken, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({
      message: "File uploaded successfully",
      fileUrl,
      filename: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ success: false, message: "Failed to upload file" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));