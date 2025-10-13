// server2.js


require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { Server } = require("socket.io");
const stream = require("stream");
// --- file upload + csv (already in your last version)

const multer = require("multer");
const ExcelJS = require("exceljs");
const path = require("path");

const app = express();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const studentUpload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

app.use(cors());
app.use(express.json());






const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/* =======================
   DB POOL
   ======================= */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "wisdomwarfare",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* =======================
   QUIZ STATE
   ======================= */
let questions = [];
let currentIndex = -1;
let acceptingAnswers = false;
let firstAnswered = false;
let answeredUsers = new Set();

async function loadQuestions() {
  try {
    const [rows] = await pool.query("SELECT * FROM questions ORDER BY id");
    questions = rows || [];
    console.log("Questions loaded:", questions.length);
  } catch (err) {
    console.error("Error loading questions:", err);
    questions = [];
  }
}
/*fetch all questions */
app.get("/questions", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM questions");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
/*Delete question */
// Delete a question by ID
app.delete("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM questions WHERE id = ?", [id]);
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*Update question */
// Update a question
app.put("/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { text, option_a, option_b, option_c, option_d, correct, difficulty } = req.body;

    await pool.execute(
      "UPDATE questions SET text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct=?, difficulty=? WHERE id=?",
      [text, option_a, option_b, option_c, option_d, correct, difficulty, id]
    );

    res.json({ message: "Question updated successfully" });
  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/* =======================
   LEADERBOARD HELPERS
   ======================= */
async function fetchGlobalLeaderboard(limit = 10) {
  const sql = `
    SELECT u.user_id, u.user_id, COALESCE( u.username, u.email) AS display_name,
           COALESCE(p.score, 0) AS score, p.last_update
    FROM users u
    LEFT JOIN performance p ON u.user_id = p.user_id
    ORDER BY score DESC, p.last_update ASC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [parseInt(limit, 10)]);
  return rows;
}

async function fetchGameLeaderboard(gameIdOrName, limit = 10, byId = true) {
  if (byId) {
    const sql = `
      SELECT u.user_id, COALESCE( u.username, u.email) AS display_name,
             COALESCE(p.score,0) AS score
      FROM game_participants gp
      JOIN users u ON gp.user_id = u.user_id
      LEFT JOIN performance p ON u.user_id = p.user_id
      WHERE gp.game_id = ?
      ORDER BY score DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [parseInt(gameIdOrName, 10), parseInt(limit, 10)]);
    return rows;
  } else {
    const sql = `
      SELECT s.user_id, COALESCE( u.username, u.email) AS display_name,
             s.score, s.attempts, s.correct, s.accuracy
      FROM scores s
      LEFT JOIN users u ON s.user_id = u.user_id
      WHERE s.game_name = ?
      ORDER BY s.score DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [gameIdOrName, parseInt(limit, 10)]);
    return rows;
  }
}

async function broadcastGlobalLeaderboard(limit = 10) {
  try {
    const lb = await fetchGlobalLeaderboard(limit);
    io.emit("leaderboard:global", lb);
  } catch (err) {
    console.error("broadcastGlobalLeaderboard error:", err);
  }
}

async function broadcastGameLeaderboard(gameIdOrName, limit = 10, byId = true) {
  try {
    const lb = await fetchGameLeaderboard(gameIdOrName, limit, byId);
    io.emit("leaderboard:game", {
      game_id: byId ? gameIdOrName : null,
      game_name: byId ? null : gameIdOrName,
      players: lb,
    });
  } catch (err) {
    console.error("broadcastGameLeaderboard error:", err);
  }
}

//Upload Student Details
// 📦 Upload Students via CSV or Excel

app.post("/upload-students", studentUpload.single("file"), async (req, res) => {
  try {
    console.log("Upload route hit");
    console.log("req.file:", req.file);

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.worksheets[0];
    const currentDate = new Date().toISOString().slice(0, 10);

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const [studentid, name, email] = row.values.slice(1);
      console.log(`Row ${rowNumber}:`, studentid, name, email);
      if (studentid && name && email) rows.push({ studentid, name, email });
    });

    console.log("Parsed rows:", rows);

    for (const student of rows) {
      try {
        const studentId = student.studentid;
const username = student.name;
// Extract plain email string from the Excel object
const email = typeof student.email === "object" ? student.email.text : student.email;
const createdAt = new Date();
        console.log("Received student:", student);

        await pool.query(
         `INSERT INTO users (user_id, username, email, created_at)
   VALUES (?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE username=?, email=?, created_at=?`,
  [studentId, username, email, createdAt, username, email, createdAt]
        );
      } catch (dbErr) {
        console.error("DB error:", dbErr, "Student:", student);
      }
    }

    res.status(200).json({ message: `Uploaded ${rows.length} students successfully!` });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});



app.listen(5000, () => console.log("Server running on port 4000"));


/* =======================
   QUIZ LOOP
   ======================= */
async function nextQuestion() {
  currentIndex++;
  answeredUsers.clear();
  firstAnswered = false;

  if (currentIndex >= questions.length) {
    io.emit("gameOver", { message: "🎉 Game Over! Thanks for playing." });
    console.log("Game over - no more questions.");
    return;
  }

  const q = questions[currentIndex];
  acceptingAnswers = true;

  io.emit("newQuestion", {
    id: q.id,
    text: q.text,
    options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
    difficulty: q.difficulty || "Medium",
  });

  console.log("Sent question:", q.id, q.text);

  setTimeout(() => {
    acceptingAnswers = false;
    nextQuestion().catch(e => console.error("nextQuestion error:", e));
  }, parseInt(process.env.QUESTION_TIMEOUT_MS || "30000", 10));
}

/* =======================
   USER RESOLUTION
   ======================= */
async function resolveUserId(uidOrId) {
  if (!uidOrId && uidOrId !== 0) return null;
  const asNumber = Number(uidOrId);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    try {
      const [rows] = await pool.query("SELECT user_id FROM users WHERE user_id = ? LIMIT 1", [asNumber]);
      if (rows && rows.length > 0) return asNumber;
    } catch (err) {
      console.error("resolveUserId DB error:", err);
    }
  }
  try {
    const [rows] = await pool.query("SELECT user_id FROM users WHERE uid = ? LIMIT 1", [String(uidOrId)]);
    if (rows && rows.length > 0) {
      return rows[0].user_id;
    }
  } catch (err) {
    console.error("resolveUserId DB error:", err);
  }
  return null;
}

/* =======================
   GAME CODE HELPERS (server-side fallback if DB trigger missing)
   ======================= */
function genCandidateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase(); // 6 chars
}
async function generateUniqueGameCode(conn) {
  let tries = 0;
  while (tries < 20) {
    const code = genCandidateCode();
    const [rows] = await conn.query("SELECT 1 FROM game_sessions WHERE game_code = ? LIMIT 1", [code]);
    if (!rows || rows.length === 0) return code;
    tries++;
  }
  // extremely unlikely
  return "WW" + Date.now().toString().slice(-4);
}

/* =======================
   SOCKET.IO
   ======================= */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("submitAnswer", async ({ user_id, answer }) => {
    try {
      if (!acceptingAnswers || !questions[currentIndex]) {
        socket.emit("answerResult", "No active question.");
        return;
      }
      if (!user_id) {
        socket.emit("answerResult", "Missing user_id.");
        return;
      }
      const resolved = await resolveUserId(user_id);
      if (!resolved) {
        socket.emit("answerResult", "Unknown user.");
        return;
      }
      if (answeredUsers.has(resolved)) {
        socket.emit("answerResult", "⚠ You already answered this question!");
        return;
      }
      answeredUsers.add(resolved);

      const correct = questions[currentIndex].correct;
      let points = 10;

      if (answer === correct) {
        if (!firstAnswered) {
          points += 5;
          firstAnswered = true;
          socket.emit("answerResult", `✅ First Correct! +${points} points`);
        } else {
          socket.emit("answerResult", `✅ Correct! +${points} points`);
        }

        await pool.query(
          `INSERT INTO performance (user_id, score)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE score = score + VALUES(score), last_update = CURRENT_TIMESTAMP`,
          [resolved, points]
        );

        await broadcastGlobalLeaderboard(20);
      } else {
        socket.emit("answerResult", "❌ Wrong!");
      }
    } catch (err) {
      console.error("submitAnswer error:", err);
      socket.emit("answerResult", "Server error processing answer.");
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* =======================
   REST ENDPOINTS (ORIGINAL + NEW)
   ======================= */

/* Health */
app.get("/", (_req, res) => res.send("WisdomWarfare backend running"));

/* OAuth Upsert (preferred) – ORIGINAL */
app.post("/auth/upsert-user", async (req, res) => {
  const { uid, email, display_name } = req.body;
  if (!uid) return res.status(400).json({ error: "uid required" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(z
      `INSERT INTO users (uid, email, display_name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE email = VALUES(email), display_name = VALUES(display_name)`,
      [uid, email || null, display_name || null]
    );

    const [rows] = await conn.query(
      "SELECT user_id, uid, email, display_name FROM users WHERE uid = ? LIMIT 1",
      [uid]
    );
    const user = rows && rows[0] ? rows[0] : null;

    if (user) {
      await conn.query("INSERT IGNORE INTO performance (user_id) VALUES (?)", [user.user_id]);
    }

    await conn.commit();
    res.json({ ok: true, user_id: user ? user.user_id : null, user });
  } catch (err) {
    await conn.rollback();
    console.error("auth.upsert-user error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/* Legacy upsert – ORIGINAL */
app.post("/users/upsert", async (req, res) => {
  const { uid, email, display_name } = req.body;
  if (!uid) return res.status(400).json({ error: "uid required" });

  try {
    await pool.query(
      `INSERT INTO users (uid, email, display_name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         display_name = VALUES(display_name)`,
      [uid, email || null, display_name || null]
    );

    const [rows] = await pool.query(
      "SELECT user_id, uid, email, display_name FROM users WHERE uid = ? LIMIT 1",
      [uid]
    );
    const user = rows && rows[0] ? rows[0] : null;

    if (user) {
      await pool.query("INSERT IGNORE INTO performance (user_id) VALUES (?)", [user.user_id]);
    }

    res.json({ ok: true, user });
  } catch (err) {
    console.error("users.upsert error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* Join a game – ORIGINAL (accepts numeric user_id or uid) */
app.post("/join-game", async (req, res) => {
  const { user_id, game_id } = req.body;
  if (!user_id || !game_id)
    return res.status(400).json({ error: "user_id and game_id required" });

  try {
    const resolved = await resolveUserId(user_id);
    if (!resolved) return res.status(404).json({ error: "user not found" });

    await pool.query(
      `INSERT INTO game_participants (game_id, user_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE joined_at = CURRENT_TIMESTAMP`,
      [parseInt(game_id, 10), parseInt(resolved, 10)]
    );

    broadcastGameLeaderboard(game_id, 20, true).catch((err) =>
      console.error("broadcastGameLeaderboard:", err)
    );
    res.json({ ok: true, message: "Joined game", user_id: resolved });
  } catch (err) {
    console.error("join-game error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* Add a single question – ORIGINAL */
app.post("/questions", async (req, res) => {
  try {
    const { text, option_a, option_b, option_c, option_d, correct, difficulty } =
      req.body;
    if (!text || !option_a || !option_b || !option_c || !option_d || !correct) {
      return res
        .status(400)
        .json({ error: "text and all options and correct required" });
    }
    const opts = [option_a, option_b, option_c, option_d];
    if (!opts.includes(correct)) {
      return res
        .status(400)
        .json({ error: "correct answer must match one of the options" });
    }

    const [result] = await pool.query(
      `INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [text, option_a, option_b, option_c, option_d, correct, difficulty || "Medium"]
    );
    await loadQuestions();
    res.json({ message: "Question added", question_id: result.insertId });
  } catch (err) {
    console.error("POST /questions error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* Questions for students – ORIGINAL */
app.get("/questions-for-students", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, text, option_a, option_b, option_c, option_d, difficulty FROM questions ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /questions-for-students", err);
    res.status(500).json({ error: "Could not fetch questions" });
  }
});

/* Submit answer – ORIGINAL */
app.post("/submit-answer", async (req, res) => {
  const { user_id, question_id, selected, game_name } = req.body;
  if (!user_id || !question_id || typeof selected === "undefined")
    return res
      .status(400)
      .json({ error: "user_id, question_id, selected required" });

  const resolvedUserId = await resolveUserId(user_id);
  if (!resolvedUserId) return res.status(404).json({ error: "user not found" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[q]] = await conn.query("SELECT correct FROM questions WHERE id = ?", [
      question_id,
    ]);
    if (!q) {
      await conn.rollback();
      return res.status(404).json({ error: "Question not found" });
    }

    const isCorrect = q.correct === selected ? 1 : 0;
    const points = isCorrect ? 10 : 0;

    await conn.query(
      `INSERT INTO answers (user_id, game_name, question_id, selected_answer, correct_answer, is_correct)
       VALUES (?, ?, ?, ?, ?, ?)`,

      [resolvedUserId, game_name || null, question_id, selected, q.correct, isCorrect]
    );

    if (game_name) {
      await conn.query(
        `INSERT INTO scores (user_id, game_name, score, attempts, correct)
         VALUES (?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           score = score + VALUES(score),
           attempts = attempts + VALUES(attempts),
           correct = correct + VALUES(correct),
           last_update = CURRENT_TIMESTAMP`,
        [resolvedUserId, game_name, points, isCorrect]
      );

      await conn.query(
        `UPDATE scores
         SET accuracy = CASE WHEN attempts > 0 THEN (correct / attempts) * 100 ELSE 0 END
         WHERE user_id = ? AND game_name = ?`,
        [resolvedUserId, game_name]
      );

      const [[gs]] = await conn.query(
        "SELECT game_id FROM game_sessions WHERE game_name = ? LIMIT 1",
        [game_name]
      );
      if (gs && gs.game_id)
        broadcastGameLeaderboard(gs.game_id).catch((e) => console.error(e));
      else
        broadcastGameLeaderboard(game_name, 20, false).catch((e) =>
          console.error(e)
        );
    }

    await conn.query(
      `INSERT INTO performance (user_id, score, attempts, correct)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         score = score + VALUES(score),
         attempts = attempts + VALUES(attempts),
         correct = correct + VALUES(correct),
         last_update = CURRENT_TIMESTAMP`,
      [resolvedUserId, points, isCorrect]
    );

    const [[perf]] = await conn.query(
      "SELECT score, attempts, correct FROM performance WHERE user_id = ?",
      [resolvedUserId]
    );
    const accuracy = perf.attempts ? (perf.correct / perf.attempts) * 100 : 0;
    await conn.query("UPDATE performance SET accuracy = ? WHERE user_id = ?", [
      accuracy,
      resolvedUserId,
    ]);

    await conn.commit();

    broadcastGlobalLeaderboard().catch((e) => console.error(e));

    res.json({
      ok: true,
      is_correct: !!isCorrect,
      points_awarded: points,
      total_score: perf.score,
      attempts: perf.attempts,
      correct: perf.correct,
      accuracy,
    });
  } catch (err) {
    await conn.rollback();
    console.error("POST /submit-answer error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

/* Record per-game delta – ORIGINAL */
app.post("/scores/record", async (req, res) => {
  const { uid, user_id, game_name, delta = 0, is_correct = false } = req.body;
  if (!game_name) return res.status(400).json({ error: "game_name required" });
  if (!user_id && !uid)
    return res.status(400).json({ error: "user_id or uid required" });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    let uidUserId = user_id;
    if (!uidUserId) {
      const [urows] = await conn.query(
        "SELECT user_id FROM users WHERE uid = ? LIMIT 1",
        [uid]
      );
      if (!urows || urows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "user not found by uid" });
      }
      uidUserId = urows[0].user_id;
    } else {
      const resolved = await resolveUserId(uidUserId);
      if (!resolved) {
        await conn.rollback();
        return res.status(404).json({ error: "user not found" });
      }
      uidUserId = resolved;
    }

    await conn.query(
      `INSERT INTO scores (user_id, game_name, score, attempts, correct)
       VALUES (?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         score = score + VALUES(score),
         attempts = attempts + VALUES(attempts),
         correct = correct + VALUES(correct),
         last_update = CURRENT_TIMESTAMP`,
      [uidUserId, game_name, parseInt(delta, 10), is_correct ? 1 : 0]
    );

    await conn.query(
      `UPDATE scores SET accuracy = CASE WHEN attempts > 0 THEN (correct / attempts) * 100 ELSE 0 END
       WHERE user_id = ? AND game_name = ?`,
      [uidUserId, game_name]
    );

    await conn.query(
      `INSERT INTO performance (user_id, score, attempts, correct)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE
         score = score + VALUES(score),
         attempts = attempts + VALUES(attempts),
         correct = correct + VALUES(correct),
         last_update = CURRENT_TIMESTAMP`,
      [uidUserId, parseInt(delta, 10), is_correct ? 1 : 0]
    );

    await conn.query(
      `UPDATE performance
       SET accuracy = CASE WHEN attempts > 0 THEN (correct / attempts) * 100 ELSE 0 END
       WHERE user_id = ?`,
      [uidUserId]
    );

    await conn.commit();

    const [[scoresRow]] = await pool.query(
      "SELECT * FROM scores WHERE user_id = ? AND game_name = ? LIMIT 1",
      [uidUserId, game_name]
    );
    const [[perfRow]] = await pool.query(
      "SELECT * FROM performance WHERE user_id = ? LIMIT 1",
      [uidUserId]
    );

    broadcastGameLeaderboard(game_name, 20, false).catch(() => {});
    broadcastGlobalLeaderboard(20).catch(() => {});

    res.json({
      ok: true,
      scoresRow: scoresRow || null,
      performanceRow: perfRow || null,
    });
  } catch (err) {
    if (conn) try { await conn.rollback(); } catch (_) {}
    console.error("POST /scores/record error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

/* Leaderboards – ORIGINAL */
app.get("/leaderboard-global", async (req, res) => {
  try {
    const rows = await fetchGlobalLeaderboard(
      parseInt(req.query.limit || "10", 10)
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /leaderboard-global error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/leaderboard/:gameId", async (req, res) => {
  const gameId = req.params.gameId;
  try {
    const rows = await fetchGameLeaderboard(
      gameId,
      parseInt(req.query.limit || "10", 10),
      true
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /leaderboard/:gameId error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
    const rows = await fetchGlobalLeaderboard(
      parseInt(req.query.limit || "10", 10)
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /leaderboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   NEW: TEACHER GAME & CODE
   ======================= */

/**
 * POST /teacher/new-game
 * body: { teacher_id (or uid), game_name }
 * returns: { ok, game_id, game_code, game_name }
 */
app.post("/teacher/new-game", async (req, res) => {
  const { teacher_id, uid, game_name } = req.body || {};
  if (!game_name) return res.status(400).json({ error: "game_name required" });
  if (!teacher_id && !uid) return res.status(400).json({ error: "teacher_id or uid required" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // resolve teacher numeric id
    let teacherId = teacher_id;
    if (!teacherId) {
      const [urows] = await conn.query("SELECT user_id FROM users WHERE uid = ? LIMIT 1", [uid]);
      if (!urows || urows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "teacher not found by uid" });
      }
      teacherId = urows[0].user_id;
    }

    // Insert session; if DB trigger fills game_code we're good. If not, we’ll fill it.
    const [ins] = await conn.query(
      "INSERT INTO game_sessions (game_name, teacher_user_id) VALUES (?, ?)",
      [game_name, teacherId]
    );

    // Fetch row
    const [[row]] = await conn.query(
      "SELECT game_id, game_name, game_code FROM game_sessions WHERE game_id = ? LIMIT 1",
      [ins.insertId]
    );

    let gameCode = row.game_code;
    if (!gameCode) {
      // Fallback: generate unique code here
      gameCode = await generateUniqueGameCode(conn);
      await conn.query("UPDATE game_sessions SET game_code = ? WHERE game_id = ?", [gameCode, row.game_id]);
    }

    await conn.commit();
    res.json({ ok: true, game_id: row.game_id, game_code: gameCode, game_name: row.game_name });
  } catch (err) {
    await conn.rollback();
    console.error("POST /teacher/new-game error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  } finally {
    conn.release();
  }
});

/**
 * GET /game/by-code/:code
 * GET /game/by-code?code=CODE
 * returns: { ok, game_id, game_name, game_code }
 */
async function resolveGameByCode(code) {
  const upper = String(code || "").trim().toUpperCase();
  if (!upper) return null;
  const [rows] = await pool.query(
    "SELECT game_id, game_name, game_code FROM game_sessions WHERE UPPER(game_code) = ? LIMIT 1",
    [upper]
  );
  return rows && rows[0] ? rows[0] : null;
}

app.get("/game/by-code/:code", async (req, res) => {
  try {
    const row = await resolveGameByCode(req.params.code);
    if (!row) return res.status(404).json({ error: "Invalid game code" });
    res.json({ ok: true, game_id: row.game_id, game_name: row.game_name, game_code: row.game_code });
  } catch (err) {
    console.error("GET /game/by-code/:code error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/game/by-code", async (req, res) => {
  try {
    const row = await resolveGameByCode(req.query.code);
    if (!row) return res.status(404).json({ error: "Invalid game code" });
    res.json({ ok: true, game_id: row.game_id, game_name: row.game_name, game_code: row.game_code });
  } catch (err) {
    console.error("GET /game/by-code error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   CSV UPLOAD (BULK) – ORIGINAL (with your hardened impl)
   ======================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[_-]+/g, "");
}
function normalizeRowKeys(row) {
  const out = {};
  Object.keys(row || {}).forEach((k) => {
    out[normalizeHeader(k)] = row[k];
  });
  return out;
}
function mapCorrectValue(normalizedRow) {
  const raw = (normalizedRow.correct || normalizedRow.answer || normalizedRow.key || "").toString().trim();
  if (!raw) return "";
  const letter = raw.toUpperCase(); // still accept uppercase letters from CSV
  if (["A","B","C","D"].includes(letter)) return "option_" + letter.toLowerCase(); // lowercase here
  return ""; // invalid correct value
}


async function handleCsvUploadBuffer(buffer) {
  return new Promise((resolve) => {
    const rows = [];
    const errors = [];
    const readable = new stream.Readable({
      read() { this.push(buffer); this.push(null); },
    });

    readable
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        if (rows.length === 0) return resolve({ ok: false, error: "CSV contains no rows" });

        let inserted = 0, skipped = 0;
        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();

          for (let i = 0; i < rows.length; i++) {
            const raw = rows[i];
            const r = normalizeRowKeys(raw);

            const text = r.question || r.text || r.prompt || r.q || r.ques || "";

            const option_a = r.optiona || r.option_a || r.a || r.answera || r.choicea || r.choicesa || r.opa || "";
            const option_b = r.optionb || r.option_b || r.b || r.answerb || r.choiceb || r.choicesb || r.opb || "";
            const option_c = r.optionc || r.option_c || r.c || r.answerc || r.choicec || r.choicesc || r.opc || "";
            const option_d = r.optiond || r.option_d || r.d || r.answerd || r.choiced || r.choicesd || r.opd || "";

            const optionsObj = { A: option_a, B: option_b, C: option_c, D: option_d };

            let correct = mapCorrectValue(r); // no need for optionsObj anymore

            const difficulty = r.difficulty || r.level || "Medium";

            if (!text || !option_a || !option_b || !option_c || !option_d) {
              skipped++; errors.push({ row: i + 1, error: "Missing question/options", raw }); continue;
            }
            if (!correct) {
              skipped++; errors.push({ row: i + 1, error: "Missing correct answer", raw }); continue;
            }
            if (![option_a, option_b, option_c, option_d].includes(correct)) {
              skipped++; errors.push({ row: i + 1, error: "Correct answer must match one of the options", raw }); continue;
            }

            await conn.query(
              `INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct, difficulty)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [text, option_a, option_b, option_c, option_d, correct, difficulty]
            );
            inserted++;
          }

          await conn.commit();
          await loadQuestions();
          resolve({ ok: true, parsedRows: rows.length, inserted, skipped, errors });
        } catch (err) {
          try { await conn.rollback(); } catch (_) {}
          console.error("CSV insert error:", err);
          resolve({ ok: false, error: err.message || "Insert failed" });
        } finally {
          conn.release();
        }
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err);
        resolve({ ok: false, error: err.message || "CSV parse failed" });
      });
  });
}

async function csvUploadController(req, res) {
  if (!req.file)
    return res.status(400).json({ error: "file required (field name 'file')" });
  try {
    const result = await handleCsvUploadBuffer(req.file.buffer);
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error("Unexpected upload error:", err);
    res.status(500).json({ error: "Unexpected server error", detail: err.message || String(err) });
  }
}

// Multiple aliases so your UI can try several
app.post(
  ["/questions/upload", "/questions/bulk", "/api/questions/upload", "/api/questions/bulk"],
  upload.single("file"),
  csvUploadController
);

/* =======================
   START SERVER
   ======================= */
const PORT = parseInt(process.env.PORT || "4000", 10);
server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await loadQuestions();
  console.log("Game starting in 15 seconds...");
  setTimeout(() => nextQuestion().catch((e) => console.error(e)), 15000);
});
