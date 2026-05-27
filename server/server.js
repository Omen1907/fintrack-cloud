const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
dotenv.config();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const PORT = process.env.PORT || 3000;
const pool = require("./db");
const bcrypt = require("bcrypt");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "https://finance-tracker-mvp.vercel.app"],

    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "finance-tracker-backend",
    environment: process.env.NODE_ENV
  });
});

const authenticateToken = (req, res, next) => {
  console.log("Headers received:", req.headers);
  console.log("Authenticating request...");
  console.log("authenticateToken middleware started");
  const authHeader = req.header("Authorization");
  console.log("Authorization header:", authHeader);

  const token = authHeader?.split(" ")[1];
  console.log("Extracted token:", token);

  if (!token) {
    console.log("No token found, sending 401");
    return res
      .status(401)
      .json({ message: "Access Denied: No token provided" });
  }

  try {
    console.log("JWT Secret:", JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token decoded:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

pool
  .query("SELECT NOW()")
  .then((res) => console.log("DB connected:", res.rows[0]))
  .catch((err) => console.error("DB connection error:", err));

app.get("/debug-db", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Incoming registration:", req.body);

    if (!email || email.trim() === "" || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUserQuery = "SELECT * FROM users WHERE email = $1";
    const existingUser = await pool.query(existingUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertQuery =
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email";
    const result = await pool.query(insertQuery, [
      email.trim(),
      hashedPassword,
    ]);

    res.status(201).json({
      id: result.rows[0].id,
      message: "User registered successfully",
      user: { email: result.rows[0].email },
    });
  } catch (err) {
    console.error("Register error:", {
      message: err.message,
      stack: err.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const userQuery = "SELECT id, email, password FROM users WHERE email = $1";
    const result = await pool.query(userQuery, [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("Signin error:", {
      message: err.message,
      stack: err.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

app.get("/dashboard/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const incomeQuery =
      "SELECT COALESCE(SUM(amount), 0) AS total_income FROM transactions WHERE user_id = $1 AND type = 'income'";
    const expenseQuery =
      "SELECT COALESCE(SUM(amount), 0) AS total_expense FROM transactions WHERE user_id = $1 AND type = 'expense'";
    const savingsQuery =
      "SELECT COALESCE(SUM(saved_amount), 0) AS total_savings FROM savings WHERE user_id = $1";

    const [incomeResult, expenseResult, savingsResult] = await Promise.all([
      pool.query(incomeQuery, [userId]),
      pool.query(expenseQuery, [userId]),
      pool.query(savingsQuery, [userId]),
    ]);

    res.status(200).json({
      totalIncome: incomeResult.rows[0].total_income,
      totalExpense: expenseResult.rows[0].total_expense,
      totalSavings: savingsResult.rows[0].total_savings,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/transactions", authenticateToken, async (req, res) => {
  console.log("Route hit");
  console.log("Authorization Header:", req.headers.authorization);
  console.log("Request Body:", req.body);
  console.log("Decoded user:", req.user);

  try {
    const { amount, type, date, category, description } = req.body;

    console.log("amount:", amount);
    console.log("type:", type);
    console.log("date:", date);
    console.log("category:", category);
    console.log("description:", description);

    if (!amount || typeof amount !== "number" || amount <= 0) {
      console.log("Validation failed: amount");
      return res
        .status(400)
        .json({ error: "Amount must be a positive number" });
    }

    if (!["income", "expense"].includes(type)) {
      console.log("Validation failed: type");
      return res
        .status(400)
        .json({ error: "Type must be 'income' or 'expense'" });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
      console.log("Validation failed: date");
      return res
        .status(400)
        .json({ error: "Date must be in YYYY-MM-DD format" });
    }

    if (!category || category.trim() === "") {
      console.log("Validation failed: category");
      return res.status(400).json({ error: "Category is required" });
    }

    const finalDescription = description ? description.trim() : null;

    const insertQuery = `
      INSERT INTO transactions (user_id, amount, type, date, category, description)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

    const result = await pool.query(insertQuery, [
      req.user.id,
      amount,
      type,
      date,
      category,
      finalDescription,
    ]);

    console.log("Insert success:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", {
      message: err.message,
      stack: err.stack,
      requestBody: req.body,
      user: req.user,
    });

    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

app.put("/transactions/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const transactionId = parseInt(req.params.id, 10);
    const { amount, category, type, date, description } = req.body;

    const updateQuery = `
      UPDATE transactions
      SET amount = $1, category = $2, type = $3, date = $4, description = $5
      WHERE id = $6 AND user_id = $7
      RETURNING *`;

    const result = await pool.query(updateQuery, [
      amount,
      category,
      type,
      date,
      description,
      transactionId,
      userId,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Transaction not found or not owned by user" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userQuery = "SELECT * FROM transactions WHERE user_id = $1";
    const result = await pool.query(userQuery, [userId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/transactions/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const transactionId = parseInt(req.params.id, 10);
    if (isNaN(transactionId) || transactionId <= 0) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const deleteQuery =
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await pool.query(deleteQuery, [transactionId, userId]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Transaction not found or not owned by user" });
    }

    res.status(200).json({
      message: "Transaction deleted",
      deletedTransaction: result.rows[0],
    });
  } catch (err) {
    // 6. Error handling
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// app.get("/categories", authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     console.log("Fetching categories for userId:", userId);

//     const query = "SELECT * FROM categories WHERE user_id = $1";
//     const result = await pool.query(query, [userId]);

//     console.log("Categories fetched:", result.rows);
//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error("Database error:", err.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

app.post("/savings", authenticateToken, async (req, res) => {
  try {
    const { title, target_amount } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    if (
      !target_amount ||
      typeof target_amount !== "number" ||
      target_amount <= 0
    ) {
      return res
        .status(400)
        .json({ error: "Target amount must be a positive number" });
    }

    const insertQuery = `
      INSERT INTO savings (user_id, title, target_amount, saved_amount, created_at)
      VALUES ($1, $2, $3, 0, NOW())
      RETURNING *`;

    const result = await pool.query(insertQuery, [
      req.user.id,
      title.trim(),
      target_amount,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/savings", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM savings WHERE user_id = $1",
      [req.user.id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/savings/:id", authenticateToken, async (req, res) => {
  try {
    const savingsId = parseInt(req.params.id, 10);
    const { amount } = req.body;

    if (isNaN(savingsId) || savingsId <= 0) {
      return res.status(400).json({ error: "Invalid savings ID" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a positive number" });
    }

    const updateQuery = `UPDATE savings SET saved_amount = saved_amount + $1 WHERE id = $2 and user_id = $3 RETURNING *`;

    const result = await pool.query(updateQuery, [
      amount,
      savingsId,
      req.user.id,
    ]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Savings goal not found or not owned by user" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/savings/:id", authenticateToken, async (req, res) => {
  try {
    const savingsId = parseInt(req.params.id, 10);

    if (isNaN(savingsId) || savingsId <= 0) {
      return res.status(400).json({ error: "Invalid savings ID" });
    }

    const deleteQuery =
      "DELETE FROM savings WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await pool.query(deleteQuery, [savingsId, req.user.id]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Savings goal not found or not owned by user" });
    }

    res
      .status(200)
      .json({ message: "Savings goal deleted", deletedGoal: result.rows[0] });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
