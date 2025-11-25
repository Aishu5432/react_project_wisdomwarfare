// require("dotenv").config();
// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const mysql = require("mysql2/promise");
// const { Server } = require("socket.io");
// const multer = require("multer");
// const csv = require("csv-parser");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// app.use(cors());
// app.use(express.json());

// const server = http.createServer(app);
// const io = new Server(server, { 
//   cors: { 
//     origin: "*",
//     methods: ["GET", "POST"]
//   } 
// });

// // Database connection
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "root",
//   database: process.env.DB_NAME || "wisdomwarfare",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// // Game state
// let questions = [];
// let currentIndex = -1;
// let acceptingAnswers = false;
// let firstAnswered = false;
// let answeredUsers = new Map();
// let gameTimer = null;
// let currentQuestionStartTime = null;
// let gameSessionId = null;
// let isGameActive = false;

// // Load questions from database
// async function loadQuestions() {
//   try {
//     console.log("🔄 Loading questions from database...");
    
//     const [rows] = await pool.query(`
//       SELECT * FROM questions 
//       WHERE text IS NOT NULL 
//       AND option_a IS NOT NULL 
//       AND option_b IS NOT NULL 
//       AND option_c IS NOT NULL 
//       AND option_d IS NOT NULL 
//       AND correct IS NOT NULL
//       ORDER BY 
//         CASE difficulty 
//           WHEN 'Easy' THEN 1 
//           WHEN 'Medium' THEN 2 
//           WHEN 'Hard' THEN 3 
//           ELSE 4 
//         END, id
//       LIMIT 30
//     `);
    
//     questions = rows || [];
//     console.log(`✅ ${questions.length} questions loaded successfully`);
    
//     return questions.length;
//   } catch (err) {
//     console.error("❌ Error loading questions:", err.message);
//     questions = [];
//     return 0;
//   }
// }

// // Generate unique game session ID
// function generateGameSessionId() {
//   return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// }

// // **COMPLETELY FIXED CORRECT ANSWER FUNCTION**
// function getCorrectAnswerText(question) {
//   if (!question) {
//     console.log("❌ No question provided");
//     return "Unknown";
//   }

//   console.log("🔍 DEBUG - getCorrectAnswerText called:", {
//     questionId: question.id,
//     correct: question.correct,
//     option_a: question.option_a,
//     option_b: question.option_b,
//     option_c: question.option_c,
//     option_d: question.option_d
//   });

//   // DIRECT SIMPLE MAPPING - NO COMPLEX LOGIC
//   const correct = String(question.correct).toLowerCase().trim();
  
//   if (correct === 'option_a' || correct === 'a') {
//     console.log("✅ Mapped to option_a:", question.option_a);
//     return question.option_a;
//   }
//   if (correct === 'option_b' || correct === 'b') {
//     console.log("✅ Mapped to option_b:", question.option_b);
//     return question.option_b;
//   }
//   if (correct === 'option_c' || correct === 'c') {
//     console.log("✅ Mapped to option_c:", question.option_c);
//     return question.option_c;
//   }
//   if (correct === 'option_d' || correct === 'd') {
//     console.log("✅ Mapped to option_d:", question.option_d);
//     return question.option_d;
//   }

//   console.log("❌ Could not map correct answer:", correct);
//   return "Unknown";
// }

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadsDir = path.join(__dirname, 'uploads');
//     if (!fs.existsSync(uploadsDir)) {
//       fs.mkdirSync(uploadsDir, { recursive: true });
//     }
//     cb(null, uploadsDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only CSV files are allowed'));
//     }
//   },
//   limits: { fileSize: 10 * 1024 * 1024 }
// });

// // API Routes
// app.get("/", (req, res) => {
//   res.json({ 
//     message: "Wisdom Warfare Backend Running! 🚀",
//     status: "healthy",
//     questionsLoaded: questions.length,
//     gameActive: isGameActive
//   });
// });

// // Get all questions
// app.get("/questions", async (req, res) => {
//   try {
//     const [rows] = await pool.execute(`
//       SELECT * FROM questions 
//       ORDER BY 
//         CASE difficulty 
//           WHEN 'Easy' THEN 1 
//           WHEN 'Medium' THEN 2 
//           WHEN 'Hard' THEN 3 
//           ELSE 4 
//         END, id
//       LIMIT 30
//     `);
//     res.json({
//       count: rows.length,
//       questions: rows
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Database error" });
//   }
// });

// // Get game status
// app.get("/game/status", (req, res) => {
//   res.json({
//     questionsLoaded: questions.length,
//     currentIndex: currentIndex,
//     acceptingAnswers: acceptingAnswers,
//     gameSessionId: gameSessionId,
//     isGameActive: isGameActive,
//     currentQuestion: currentIndex >= 0 && currentIndex < questions.length ? questions[currentIndex] : null
//   });
// });

// // Start game manually
// app.post("/admin/start-game", async (req, res) => {
//   try {
//     console.log("🎮 Admin starting game...");
    
//     if (questions.length === 0) {
//       console.log("🔄 No questions in memory, reloading...");
//       await loadQuestions();
//     }
    
//     if (questions.length > 0) {
//       startNewGameSession();
//       res.json({ 
//         success: true,
//         message: "Game started successfully", 
//         questions: questions.length,
//         sessionId: gameSessionId 
//       });
//     } else {
//       res.status(400).json({ 
//         success: false,
//         error: "No questions available. Please upload questions first." 
//       });
//     }
//   } catch (err) {
//     console.error("Start game error:", err);
//     res.status(500).json({ 
//       success: false,
//       error: err.message 
//     });
//   }
// });

// // Reset game
// app.post("/admin/reset-game", (req, res) => {
//   currentIndex = -1;
//   acceptingAnswers = false;
//   firstAnswered = false;
//   answeredUsers.clear();
//   isGameActive = false;
  
//   if (gameTimer) {
//     clearTimeout(gameTimer);
//     gameTimer = null;
//   }
  
//   res.json({ 
//     success: true,
//     message: "Game reset successfully" 
//   });
// });

// // Reload questions endpoint
// app.post("/admin/reload-questions", async (req, res) => {
//   try {
//     const count = await loadQuestions();
//     res.json({
//       success: true,
//       message: "Questions reloaded successfully",
//       questionsLoaded: count
//     });
//   } catch (err) {
//     res.status(500).json({ 
//       success: false,
//       error: err.message 
//     });
//   }
// });

// // Database test endpoint
// app.get("/test-db", async (req, res) => {
//   try {
//     const [dbTest] = await pool.query("SELECT 1 as db_status");
//     const [questionCount] = await pool.query("SELECT COUNT(*) as count FROM questions");
//     const [sampleQuestions] = await pool.query("SELECT id, text, correct, difficulty FROM questions LIMIT 3");
    
//     res.json({
//       database: "Connected ✅",
//       totalQuestions: questionCount[0].count,
//       sampleQuestions: sampleQuestions,
//       gameState: {
//         questionsInMemory: questions.length,
//         currentIndex: currentIndex,
//         gameSessionId: gameSessionId,
//         isGameActive: isGameActive
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ 
//       database: "Error ❌", 
//       error: err.message
//     });
//   }
// });

// // Delete ALL questions and reset auto-increment
// app.delete("/questions/reset-all", async (req, res) => {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
    
//     console.log("Starting question reset...");
    
//     await connection.execute("DELETE FROM answers");
//     await connection.execute("DELETE FROM scores");
//     await connection.execute("DELETE FROM performance");
//     await connection.execute("DELETE FROM questions");
//     await connection.execute("ALTER TABLE questions AUTO_INCREMENT = 1");
    
//     await connection.commit();
    
//     await loadQuestions();
    
//     console.log("Question reset completed successfully");
//     res.json({ 
//       message: "All questions and game data reset successfully"
//     });
    
//   } catch (err) {
//     await connection.rollback();
//     console.error("Error resetting questions:", err);
//     res.status(500).json({ error: "Database error: " + err.message });
//   } finally {
//     connection.release();
//   }
// });

// // Add single question
// app.post("/questions", async (req, res) => {
//   try {
//     const { text, option_a, option_b, option_c, option_d, correct, difficulty } = req.body;
    
//     if (!text || !option_a || !option_b || !option_c || !option_d || !correct) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     // Normalize correct answer to ensure consistent format
//     let normalizedCorrect = correct.toUpperCase().trim();
//     if (normalizedCorrect === 'A') normalizedCorrect = 'option_a';
//     if (normalizedCorrect === 'B') normalizedCorrect = 'option_b';
//     if (normalizedCorrect === 'C') normalizedCorrect = 'option_c';
//     if (normalizedCorrect === 'D') normalizedCorrect = 'option_d';
    
//     if (!['OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D'].includes(normalizedCorrect)) {
//       return res.status(400).json({ error: "Correct answer must be A, B, C, or D" });
//     }

//     const [result] = await pool.query(
//       `INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct, difficulty)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [text, option_a, option_b, option_c, option_d, normalizedCorrect, difficulty || "Medium"]
//     );
    
//     await loadQuestions();
//     res.json({ 
//       success: true,
//       message: "Question added successfully", 
//       question_id: result.insertId 
//     });
//   } catch (err) {
//     console.error("POST /questions error:", err);
//     res.status(500).json({ 
//       success: false,
//       error: err.message 
//     });
//   }
// });

// // CSV Upload endpoint
// app.post("/questions/upload", upload.single("file"), async (req, res) => {
//   const connection = await pool.getConnection();
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     console.log("Processing file:", req.file.path);
//     const results = [];
//     let inserted = 0;
//     let errors = [];

//     await connection.beginTransaction();

//     const processCSV = () => {
//       return new Promise((resolve, reject) => {
//         fs.createReadStream(req.file.path)
//           .pipe(csv())
//           .on('data', (data) => results.push(data))
//           .on('end', async () => {
//             try {
//               for (let i = 0; i < results.length; i++) {
//                 const row = results[i];
//                 try {
//                   const question = {
//                     text: row.question || row.text || row.Question || row.Q,
//                     option_a: row.option_a || row.a || row.optionA || row.A || row['option A'],
//                     option_b: row.option_b || row.b || row.optionB || row.B || row['option B'],
//                     option_c: row.option_c || row.c || row.optionC || row.C || row['option C'],
//                     option_d: row.option_d || row.d || row.optionD || row.D || row['option D'],
//                     correct: row.correct || row.answer || row.correct_answer || row.key,
//                     difficulty: row.difficulty || row.level || 'Medium'
//                   };

//                   if (!question.text || !question.option_a || !question.option_b || 
//                       !question.option_c || !question.option_d || !question.correct) {
//                     errors.push(`Row ${i+1}: Missing required fields`);
//                     continue;
//                   }

//                   let normalizedCorrect = question.correct.toString().toUpperCase().trim();
                  
//                   if (['A', 'OPTION_A', 'OPTION A', '1'].includes(normalizedCorrect)) normalizedCorrect = 'option_a';
//                   else if (['B', 'OPTION_B', 'OPTION B', '2'].includes(normalizedCorrect)) normalizedCorrect = 'option_b';
//                   else if (['C', 'OPTION_C', 'OPTION C', '3'].includes(normalizedCorrect)) normalizedCorrect = 'option_c';
//                   else if (['D', 'OPTION_D', 'OPTION D', '4'].includes(normalizedCorrect)) normalizedCorrect = 'option_d';
//                   else {
//                     errors.push(`Row ${i+1}: Invalid correct answer format: ${question.correct}`);
//                     continue;
//                   }

//                   await connection.query(
//                     `INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct, difficulty)
//                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                     [
//                       question.text.trim(),
//                       question.option_a.trim(),
//                       question.option_b.trim(),
//                       question.option_c.trim(),
//                       question.option_d.trim(),
//                       normalizedCorrect,
//                       question.difficulty.trim()
//                     ]
//                   );
//                   inserted++;
                  
//                 } catch (rowError) {
//                   errors.push(`Row ${i+1}: ${rowError.message}`);
//                 }
//               }
//               resolve();
//             } catch (processError) {
//               reject(processError);
//             }
//           })
//           .on('error', (error) => {
//             reject(error);
//           });
//       });
//     };

//     await processCSV();
//     await connection.commit();

//     try {
//       fs.unlinkSync(req.file.path);
//     } catch (unlinkError) {
//       console.error("Error deleting file:", unlinkError);
//     }

//     await loadQuestions();
//     res.json({
//       success: true,
//       message: `CSV processing completed`,
//       inserted: inserted,
//       total: results.length,
//       errors: errors
//     });

//   } catch (error) {
//     await connection.rollback();
//     console.error("Upload error:", error);
//     res.status(500).json({ 
//       success: false,
//       error: "Upload failed: " + error.message 
//     });
//   } finally {
//     connection.release();
//   }
// });

// // Leaderboard endpoint
// app.get("/leaderboard", async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit || "20", 10);
    
//     const sql = `
//       SELECT 
//         u.user_id, 
//         u.email, 
//         u.display_name, 
//         u.role,
//         COALESCE(p.score, 0) as score,
//         COALESCE(p.attempts, 0) as attempts,
//         COALESCE(p.correct_answers, 0) as correct_answers,
//         CASE 
//           WHEN p.attempts > 0 THEN ROUND((p.correct_answers * 100.0 / p.attempts), 2)
//           ELSE 0 
//         END as accuracy
//       FROM users u
//       LEFT JOIN performance p ON u.user_id = p.user_id
//       WHERE u.email IS NOT NULL 
//         AND u.role = 'student'
//         AND u.email != ''
//       ORDER BY p.score DESC, accuracy DESC, p.correct_answers DESC
//       LIMIT ?
//     `;
    
//     const [rows] = await pool.query(sql, [limit]);
//     res.json(rows);
//   } catch (err) {
//     console.error("GET /leaderboard error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });
// // Game results for Wisdom Warfare
// app.get("/game-results/wisdom-warfare", async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit || "50", 10);
    
//     const [results] = await pool.query(`
//       SELECT 
//         u.user_id,
//         u.email,
//         u.display_name,
//         COALESCE(SUM(a.points_earned), 0) as total_score,
//         COUNT(a.answer_id) as questions_answered,
//         COALESCE(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END), 0) as correct_answers,
//         CASE 
//           WHEN COUNT(a.answer_id) > 0 THEN 
//             ROUND((SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(a.answer_id)), 2)
//           ELSE 0 
//         END as accuracy,
//         MAX(a.answered_at) as last_played
//       FROM users u
//       LEFT JOIN answers a ON u.user_id = a.user_id
//       WHERE u.role = 'student'
//       GROUP BY u.user_id, u.email, u.display_name
//       HAVING questions_answered > 0
//       ORDER BY total_score DESC, accuracy DESC, last_played DESC
//       LIMIT ?
//     `, [limit]);
    
//     res.json({
//       game_name: "Wisdom Warfare",
//       results: results,
//       total_players: results.length
//     });
//   } catch (err) {
//     console.error("Get game results error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Download results as CSV
// app.get("/download-results/wisdom-warfare", async (req, res) => {
//   try {
//     const [results] = await pool.query(`
//       SELECT 
//         u.user_id,
//         u.email,
//         u.display_name,
//         COALESCE(SUM(a.points_earned), 0) as total_score,
//         COUNT(a.answer_id) as questions_answered,
//         COALESCE(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END), 0) as correct_answers,
//         CASE 
//           WHEN COUNT(a.answer_id) > 0 THEN 
//             ROUND((SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(a.answer_id)), 2)
//           ELSE 0 
//         END as accuracy,
//         MAX(a.answered_at) as last_played
//       FROM users u
//       LEFT JOIN answers a ON u.user_id = a.user_id
//       WHERE u.role = 'student'
//       GROUP BY u.user_id, u.email, u.display_name
//       HAVING questions_answered > 0
//       ORDER BY total_score DESC, accuracy DESC, last_played DESC
//     `);
    
//     const csvHeader = "Rank,Student Name,Email,Total Score,Questions Answered,Correct Answers,Accuracy%,Last Played\n";
//     const csvRows = results.map((player, index) => 
//       `${index + 1},"${player.display_name || 'Anonymous'}","${player.email}",${player.total_score || 0},${player.questions_answered || 0},${player.correct_answers || 0},${player.accuracy || 0},"${player.last_played || 'Never'}"`
//     ).join('\n');
    
//     const csvContent = csvHeader + csvRows;
    
//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', 'attachment; filename=wisdom-warfare-results.csv');
//     res.send(csvContent);
    
//   } catch (err) {
//     console.error("Download results error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // User authentication
// app.post("/auth/upsert-user", async (req, res) => {
//   const { uid, email, display_name, role = 'student' } = req.body;
  
//   if (!email) {
//     return res.status(400).json({ error: "Email is required" });
//   }

//   const normalizedEmail = email.toLowerCase().trim();
  
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();

//     const [existingUsers] = await connection.query(
//       "SELECT user_id, uid, email, display_name, role FROM users WHERE LOWER(email) = LOWER(?)",
//       [normalizedEmail]
//     );

//     let user;
    
//     if (existingUsers.length > 0) {
//       user = existingUsers[0];
//       await connection.query(
//         "UPDATE users SET uid = ?, display_name = ?, role = ? WHERE user_id = ?",
//         [uid, display_name || user.display_name, role, user.user_id]
//       );
//     } else {
//       const [result] = await connection.query(
//         `INSERT INTO users (uid, email, display_name, role) VALUES (?, ?, ?, ?)`,
//         [uid, normalizedEmail, display_name || normalizedEmail, role]
//       );
      
//       const [newUsers] = await connection.query(
//         "SELECT user_id, uid, email, display_name, role FROM users WHERE user_id = ?",
//         [result.insertId]
//       );
//       user = newUsers[0];
//     }
    
//     if (role === 'student') {
//       await connection.query(
//         `INSERT IGNORE INTO performance (user_id, score, attempts, correct_answers, accuracy)
//          VALUES (?, 0, 0, 0, 0)`,
//         [user.user_id]
//       );
//     }

//     await connection.commit();
    
//     res.json({ 
//       ok: true, 
//       user_id: user.user_id, 
//       user: user 
//     });
    
//   } catch (err) {
//     await connection.rollback();
//     console.error("auth/upsert-user error:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     connection.release();
//   }
// });

// // Record answer
// app.post("/record-answer", async (req, res) => {
//   const { user_id, question_id, selected_answer, is_correct, points, game_name = 'Wisdom Warfare', game_session_id } = req.body;
  
//   if (!user_id || !question_id || !selected_answer || !game_session_id) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();

//     const [existingAnswers] = await connection.query(
//       "SELECT * FROM answers WHERE user_id = ? AND question_id = ? AND game_session_id = ?",
//       [user_id, question_id, game_session_id]
//     );

//     if (existingAnswers.length > 0) {
//       await connection.rollback();
//       return res.json({
//         ok: false,
//         error: "You have already answered this question in this game session",
//         points_earned: 0
//       });
//     }

//     const pointsEarned = is_correct ? (points || 10) : 0;

//     await connection.query(
//       `INSERT INTO answers (user_id, question_id, selected_answer, is_correct, points_earned, game_session_id)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [user_id, question_id, selected_answer, is_correct, pointsEarned, game_session_id]
//     );

//     await connection.query(
//       `INSERT INTO scores (user_id, game_name, score, attempts, correct_answers, accuracy, game_session_id)
//        VALUES (?, ?, ?, 1, ?, ?, ?)
//        ON DUPLICATE KEY UPDATE
//        score = score + VALUES(score),
//        attempts = attempts + 1,
//        correct_answers = correct_answers + VALUES(correct_answers),
//        accuracy = CASE 
//          WHEN (attempts + 1) > 0 THEN ((correct_answers + VALUES(correct_answers)) * 100.0 / (attempts + 1))
//          ELSE 0 
//        END`,
//       [
//         user_id, 
//         game_name, 
//         pointsEarned, 
//         is_correct ? 1 : 0, 
//         is_correct ? 100 : 0, 
//         game_session_id
//       ]
//     );

//     if (is_correct) {
//       await connection.query(
//         `INSERT INTO performance (user_id, score, attempts, correct_answers, accuracy)
//          VALUES (?, ?, 1, 1, 100)
//          ON DUPLICATE KEY UPDATE
//          score = score + VALUES(score),
//          attempts = attempts + 1,
//          correct_answers = correct_answers + 1,
//          accuracy = CASE 
//            WHEN (attempts + 1) > 0 THEN ((correct_answers + 1) * 100.0 / (attempts + 1))
//            ELSE 0 
//          END`,
//         [user_id, pointsEarned]
//       );
//     } else {
//       await connection.query(
//         `INSERT INTO performance (user_id, score, attempts, correct_answers, accuracy)
//          VALUES (?, 0, 1, 0, 0)
//          ON DUPLICATE KEY UPDATE
//          attempts = attempts + 1,
//          accuracy = CASE 
//            WHEN (attempts + 1) > 0 THEN (correct_answers * 100.0 / (attempts + 1))
//            ELSE 0 
//          END`,
//         [user_id]
//       );
//     }

//     await connection.commit();

//     const [leaderboard] = await connection.query(
//       `SELECT 
//         u.user_id, u.email, u.display_name, 
//         COALESCE(p.score, 0) as score, 
//         CASE 
//           WHEN p.attempts > 0 THEN ROUND((p.correct_answers * 100.0 / p.attempts), 2)
//           ELSE 0 
//         END as accuracy,
//         p.correct_answers, p.attempts
//        FROM users u
//        JOIN performance p ON u.user_id = p.user_id
//        WHERE u.role = 'student'
//        ORDER BY p.score DESC, accuracy DESC
//        LIMIT 10`
//     );

//     res.json({
//       ok: true,
//       points_earned: pointsEarned,
//       leaderboard: leaderboard
//     });

//   } catch (err) {
//     await connection.rollback();
//     console.error("record-answer error:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     connection.release();
//   }
// });

// // Get user stats
// app.get("/user/:user_id/stats", async (req, res) => {
//   try {
//     const userId = req.params.user_id;
    
//     const [performanceRows] = await pool.query(
//       "SELECT * FROM performance WHERE user_id = ?",
//       [userId]
//     );
    
//     const [userRows] = await pool.query(
//       "SELECT user_id, email, display_name, role, created_at FROM users WHERE user_id = ?",
//       [userId]
//     );

//     const [difficultyStats] = await pool.query(`
//       SELECT 
//         q.difficulty,
//         COUNT(a.answer_id) as total_answered,
//         SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as correct,
//         SUM(a.points_earned) as score
//       FROM answers a
//       JOIN questions q ON a.question_id = q.id
//       WHERE a.user_id = ?
//       GROUP BY q.difficulty
//     `, [userId]);

//     const totalPossibleScore = 450;
//     const currentScore = performanceRows[0]?.score || 0;
//     const percentage = totalPossibleScore > 0 ? (currentScore / totalPossibleScore) * 100 : 0;

//     const byDifficulty = {};
//     difficultyStats.forEach(stat => {
//       byDifficulty[stat.difficulty.toLowerCase()] = {
//         total: stat.total_answered,
//         correct: stat.correct,
//         score: stat.score
//       };
//     });

//     const [gameSessions] = await pool.query(`
//       SELECT 
//         game_session_id,
//         COUNT(*) as questions_answered,
//         SUM(points_earned) as session_score,
//         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
//         MAX(answered_at) as last_answered
//       FROM answers 
//       WHERE user_id = ?
//       GROUP BY game_session_id
//       ORDER BY last_answered DESC
//       LIMIT 10
//     `, [userId]);

//     res.json({
//       user: userRows[0] || null,
//       performance: performanceRows[0] || { score: 0, attempts: 0, correct_answers: 0, accuracy: 0 },
//       game_stats: {
//         total_possible_score: totalPossibleScore,
//         current_percentage: percentage.toFixed(1),
//         questions_answered: performanceRows[0]?.attempts || 0,
//         total_questions: 30,
//         by_difficulty: byDifficulty
//       },
//       game_sessions: gameSessions
//     });

//   } catch (err) {
//     console.error("Get user stats error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // **FIXED SOCKET.IO HANDLERS**
// io.on("connection", (socket) => {
//   console.log("✅ Socket connected:", socket.id);

//   socket.emit("gameStatus", {
//     questionsLoaded: questions.length,
//     currentIndex: currentIndex,
//     acceptingAnswers: acceptingAnswers,
//     gameSessionId: gameSessionId,
//     isGameActive: isGameActive,
//     currentQuestion: currentIndex >= 0 && currentIndex < questions.length ? questions[currentIndex] : null
//   });

//   if (isGameActive && currentIndex >= 0 && currentIndex < questions.length && questions[currentIndex] && acceptingAnswers) {
//     const q = questions[currentIndex];
//     const correctAnswerText = getCorrectAnswerText(q);
    
//     console.log("📤 Sending current question to new connection - CORRECT ANSWER:", correctAnswerText);
    
//     socket.emit("newQuestion", {
//       id: q.id,
//       text: q.text,
//       options: { 
//         A: q.option_a, 
//         B: q.option_b, 
//         C: q.option_c, 
//         D: q.option_d 
//       },
//       correct: q.correct,
//       correctAnswer: correctAnswerText,
//       difficulty: q.difficulty || "Medium",
//       time: 30,
//       questionNumber: currentIndex + 1,
//       totalQuestions: questions.length,
//       gameSessionId: gameSessionId
//     });
//   }

//   socket.on("getGameStatus", () => {
//     socket.emit("gameStatus", {
//       questionsLoaded: questions.length,
//       currentIndex: currentIndex,
//       acceptingAnswers: acceptingAnswers,
//       gameSessionId: gameSessionId,
//       isGameActive: isGameActive,
//       currentQuestion: currentIndex >= 0 && currentIndex < questions.length ? questions[currentIndex] : null
//     });
//   });

//   socket.on("submitAnswer", async ({ user_id, answer, email, display_name }) => {
//     try {
//       if (!acceptingAnswers || currentIndex >= questions.length || !questions[currentIndex]) {
//         socket.emit("answerResult", { 
//           error: "No active question",
//           showNextButton: true
//         });
//         return;
//       }
      
//       const questionKey = `${user_id}-${questions[currentIndex].id}-${gameSessionId}`;
//       if (answeredUsers.has(questionKey)) {
//         socket.emit("answerResult", { 
//           error: "You have already answered this question!",
//           showNextButton: true
//         });
//         return;
//       }
      
//       answeredUsers.set(questionKey, true);

//       const currentQuestion = questions[currentIndex];
//       const userAnswer = answer.toUpperCase().trim();
//       const correctAnswerKey = currentQuestion.correct.toString().toUpperCase().trim();
      
//       let isCorrect = false;
      
//       // SIMPLE DIRECT COMPARISON
//       if ((correctAnswerKey === 'OPTION_A' || correctAnswerKey === 'A') && userAnswer === 'A') isCorrect = true;
//       else if ((correctAnswerKey === 'OPTION_B' || correctAnswerKey === 'B') && userAnswer === 'B') isCorrect = true;
//       else if ((correctAnswerKey === 'OPTION_C' || correctAnswerKey === 'C') && userAnswer === 'C') isCorrect = true;
//       else if ((correctAnswerKey === 'OPTION_D' || correctAnswerKey === 'D') && userAnswer === 'D') isCorrect = true;

//       console.log("🎯 Answer submitted:", {
//         user_id,
//         userAnswer,
//         correctAnswer: correctAnswerKey,
//         isCorrect,
//         questionId: currentQuestion.id,
//         gameSessionId: gameSessionId
//       });

//       let points = 10;
//       const answerTime = Date.now() - currentQuestionStartTime;
//       if (isCorrect && answerTime < 5000 && !firstAnswered) {
//         points += 5;
//         firstAnswered = true;
//       }

//       try {
//         const response = await fetch(`http://localhost:${process.env.PORT || 4001}/record-answer`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             user_id: parseInt(user_id),
//             question_id: currentQuestion.id,
//             selected_answer: answer,
//             is_correct: isCorrect,
//             points: points,
//             game_name: "Wisdom Warfare",
//             game_session_id: gameSessionId
//           })
//         });

//         const result = await response.json();

//         if (result.ok) {
//           const correctAnswerText = getCorrectAnswerText(currentQuestion);
          
//           console.log("✅ Sending answer result - CORRECT ANSWER TEXT:", correctAnswerText);
          
//           if (isCorrect) {
//             socket.emit("answerResult", { 
//               message: `✅ Correct! +${points} points`,
//               correct: true,
//               points: points,
//               correctAnswer: correctAnswerText,
//               showNextButton: true
//             });
//           } else {
//             socket.emit("answerResult", { 
//               message: `❌ Wrong answer! Correct was: ${correctAnswerText}`,
//               correct: false,
//               points: 0,
//               correctAnswer: correctAnswerText,
//               showNextButton: true
//             });
//           }

//           if (result.leaderboard) {
//             io.emit("leaderboardUpdate", result.leaderboard);
//           }
//         } else {
//           socket.emit("answerResult", { 
//             error: result.error,
//             showNextButton: true
//           });
//         }

//       } catch (dbError) {
//         console.error("Database record error:", dbError);
//         socket.emit("answerResult", { 
//           error: "Error recording answer",
//           showNextButton: true
//         });
//       }

//     } catch (err) {
//       console.error("submitAnswer error:", err);
//       socket.emit("answerResult", { 
//         error: "Server error processing answer",
//         showNextButton: true
//       });
//     }
//   });

//   socket.on("nextQuestion", () => {
//     console.log("Next question requested by:", socket.id);
//     if (acceptingAnswers || (currentIndex >= 0 && currentIndex < questions.length)) {
//       if (gameTimer) {
//         clearTimeout(gameTimer);
//         gameTimer = null;
//       }
//       endCurrentQuestion();
//     }
//   });

//   socket.on("adminStartGame", () => {
//     console.log("Admin starting game via socket");
//     if (questions.length > 0) {
//       startNewGameSession();
//     } else {
//       socket.emit("gameError", { error: "No questions available" });
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("❌ Socket disconnected:", socket.id);
//   });
// });

// // End current question and move to next
// function endCurrentQuestion() {
//   acceptingAnswers = false;
  
//   if (currentIndex >= 0 && currentIndex < questions.length) {
//     const q = questions[currentIndex];
//     const correctAnswerText = getCorrectAnswerText(q);
    
//     console.log(`📢 Ending question ${currentIndex + 1} - CORRECT ANSWER: ${correctAnswerText}`);
    
//     io.emit("questionClosed", { 
//       correct: q.correct,
//       correctAnswer: correctAnswerText,
//       explanation: `Question completed! Correct answer was: ${correctAnswerText}`,
//       questionNumber: currentIndex + 1,
//       totalQuestions: questions.length,
//       showNextButton: false
//     });
//   }
  
//   setTimeout(() => {
//     console.log(`Moving to next question...`);
//     nextQuestion().catch(e => console.error("Next question error:", e));
//   }, 1000);
// }

// // Game loop functions
// async function nextQuestion() {
//   currentIndex++;
  
//   answeredUsers.clear();
//   firstAnswered = false;
//   currentQuestionStartTime = Date.now();

//   if (currentIndex >= questions.length) {
//     console.log("🎉 Game completed - all questions answered");
//     isGameActive = false;
    
//     try {
//       const [finalResults] = await pool.query(`
//         SELECT 
//           u.user_id, u.email, u.display_name,
//           COALESCE(SUM(a.points_earned), 0) as session_score,
//           COUNT(a.answer_id) as questions_answered,
//           COALESCE(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END), 0) as correct_answers,
//           CASE 
//             WHEN COUNT(a.answer_id) > 0 THEN 
//               ROUND((SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(a.answer_id)), 2)
//             ELSE 0 
//           END as accuracy
//         FROM users u
//         LEFT JOIN answers a ON u.user_id = a.user_id AND a.game_session_id = ?
//         WHERE u.role = 'student'
//         GROUP BY u.user_id, u.email, u.display_name
//         HAVING questions_answered > 0
//         ORDER BY session_score DESC, accuracy DESC
//         LIMIT 20
//       `, [gameSessionId]);
      
//       io.emit("gameCompleted", {
//         message: "🎉 Game Completed! All questions answered.",
//         totalQuestions: questions.length,
//         gameSessionId: gameSessionId,
//         finalResults: { results: finalResults }
//       });
//     } catch (error) {
//       console.error("Error getting final results:", error);
//       io.emit("gameCompleted", {
//         message: "🎉 Game Completed! All questions answered.",
//         totalQuestions: questions.length,
//         gameSessionId: gameSessionId,
//         finalResults: { results: [] }
//       });
//     }
    
//     return;
//   }

//   const q = questions[currentIndex];
//   acceptingAnswers = true;
//   isGameActive = true;

//   const correctAnswerText = getCorrectAnswerText(q);

//   console.log(`📝 Question ${currentIndex + 1}/${questions.length} [${q.difficulty}]: ${q.text.substring(0, 50)}...`);
//   console.log(`✅ Correct answer: ${q.correct} -> ${correctAnswerText}`);

//   io.emit("newQuestion", {
//     id: q.id,
//     text: q.text,
//     options: { 
//       A: q.option_a, 
//       B: q.option_b, 
//       C: q.option_c, 
//       D: q.option_d 
//     },
//     correct: q.correct,
//     correctAnswer: correctAnswerText,
//     difficulty: q.difficulty || "Medium",
//     time: 30,
//     questionNumber: currentIndex + 1,
//     totalQuestions: questions.length,
//     gameSessionId: gameSessionId,
//     showNextButton: false
//   });

//   if (gameTimer) clearTimeout(gameTimer);
//   gameTimer = setTimeout(() => {
//     if (acceptingAnswers) {
//       console.log(`⏰ Time's up for question ${currentIndex + 1}`);
//       endCurrentQuestion();
//     }
//   }, 30000);
// }

// // Start new game session
// function startNewGameSession() {
//   gameSessionId = generateGameSessionId();
//   currentIndex = -1;
//   answeredUsers.clear();
//   isGameActive = true;
  
//   console.log(`🎮 Starting new game session: ${gameSessionId}`);
//   io.emit("gameStarted", { 
//     sessionId: gameSessionId, 
//     totalQuestions: questions.length 
//   });
  
//   setTimeout(() => {
//     nextQuestion().catch(e => console.error("Game start error:", e));
//   }, 3000);
// }

// // Start server
// const PORT = process.env.PORT || 4001;

// function startServer(port) {
//   server.listen(port, async () => {
//     console.log(`🚀 Server running on port ${port}`);
//     console.log(`📊 Admin panel: http://localhost:${port}/admin`);
//     console.log(`🔍 Health check: http://localhost:${port}/`);
    
//     setTimeout(async () => {
//       const count = await loadQuestions();
      
//       if (count === 0) {
//         console.log("❌ No questions found. Please use the admin panel to upload questions.");
//       } else {
//         console.log(`✅ ${count} questions loaded successfully`);
//         console.log("⏳ Game is ready! Use the admin panel to start the game.");
//       }
//     }, 2000);
    
//   }).on('error', (err) => {
//     if (err.code === 'EADDRINUSE') {
//       console.log(`❌ Port ${port} is busy, trying port ${port + 1}...`);
//       startServer(port + 1);
//     } else {
//       console.error('Server error:', err);
//     }
//   });
// }

// // Start the server
// startServer(PORT);


require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { Server } = require("socket.io");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "wisdomwarfare",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Game state
let questions = [];
let currentIndex = -1;
let acceptingAnswers = false;
let firstAnswered = false;
let answeredUsers = new Map();
let gameTimer = null;
let currentQuestionStartTime = null;
let gameSessionId = null;
let isGameActive = false;

// Load questions from database
async function loadQuestions() {
  try {
    console.log("🔄 Loading questions from database...");
    
    const [rows] = await pool.query(`
      SELECT * FROM questions 
      WHERE text IS NOT NULL 
      AND option_a IS NOT NULL 
      AND option_b IS NOT NULL 
      AND option_c IS NOT NULL 
      AND option_d IS NOT NULL 
      AND correct IS NOT NULL
      ORDER BY 
        CASE difficulty 
          WHEN 'Easy' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Hard' THEN 3 
          ELSE 4 
        END, id
      LIMIT 30
    `);
    
    questions = rows || [];
    console.log(`✅ ${questions.length} questions loaded successfully`);
    
    return questions.length;
  } catch (err) {
    console.error("❌ Error loading questions:", err.message);
    questions = [];
    return 0;
  }
}

// Generate unique game session ID
function generateGameSessionId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// **COMPLETELY FIXED CORRECT ANSWER FUNCTION**
function getCorrectAnswerText(question) {
  if (!question) {
    console.log("❌ No question provided");
    return "Unknown";
  }

  console.log("🔍 DEBUG - getCorrectAnswerText called:", {
    questionId: question.id,
    correct: question.correct,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c,
    option_d: question.option_d
  });

  // DIRECT SIMPLE MAPPING - NO COMPLEX LOGIC
  const correct = String(question.correct).toLowerCase().trim();
  
  if (correct === 'option_a' || correct === 'a') {
    console.log("✅ Mapped to option_a:", question.option_a);
    return question.option_a;
  }
  if (correct === 'option_b' || correct === 'b') {
    console.log("✅ Mapped to option_b:", question.option_b);
    return question.option_b;
  }
  if (correct === 'option_c' || correct === 'c') {
    console.log("✅ Mapped to option_c:", question.option_c);
    return question.option_c;
  }
  if (correct === 'option_d' || correct === 'd') {
    console.log("✅ Mapped to option_d:", question.option_d);
    return question.option_d;
  }

  console.log("❌ Could not map correct answer:", correct);
  return "Unknown";
}

// NEW: Check if user has already played
async function hasUserPlayedGame(userId) {
  try {
    const [existingAnswers] = await pool.query(
      "SELECT COUNT(*) as count FROM answers WHERE user_id = ?",
      [userId]
    );
    return existingAnswers[0].count > 0;
  } catch (error) {
    console.error("Error checking user play history:", error);
    return false;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// API Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Wisdom Warfare Backend Running! 🚀",
    status: "healthy",
    questionsLoaded: questions.length,
    gameActive: isGameActive
  });
});

// NEW: Check if user can play
app.get("/user/:user_id/can-play", async (req, res) => {
  try {
    const userId = req.params.user_id;
    
    const [existingAnswers] = await pool.query(
      "SELECT COUNT(*) as count FROM answers WHERE user_id = ?",
      [userId]
    );
    
    const canPlay = existingAnswers[0].count === 0;
    
    res.json({
      can_play: canPlay,
      message: canPlay ? "User can play the game" : "User has already played the game"
    });
  } catch (err) {
    console.error("Error checking play status:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all questions
app.get("/questions", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM questions 
      ORDER BY 
        CASE difficulty 
          WHEN 'Easy' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Hard' THEN 3 
          ELSE 4 
        END, id
      LIMIT 30
    `);
    res.json({
      count: rows.length,
      questions: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get game status
app.get("/game/status", (req, res) => {
  res.json({
    questionsLoaded: questions.length,
    currentIndex: currentIndex,
    acceptingAnswers: acceptingAnswers,
    gameSessionId: gameSessionId,
    isGameActive: isGameActive,
    currentQuestion: currentIndex >= 0 && currentIndex < questions.length ? questions[currentIndex] : null
  });
});

// Start game manually
app.post("/admin/start-game", async (req, res) => {
  try {
    console.log("🎮 Admin starting game...");
    
    if (questions.length === 0) {
      console.log("🔄 No questions in memory, reloading...");
      await loadQuestions();
    }
    
    if (questions.length > 0) {
      startNewGameSession();
      res.json({ 
        success: true,
        message: "Game started successfully", 
        questions: questions.length,
        sessionId: gameSessionId 
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: "No questions available. Please upload questions first." 
      });
    }
  } catch (err) {
    console.error("Start game error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Reset game
app.post("/admin/reset-game", (req, res) => {
  currentIndex = -1;
  acceptingAnswers = false;
  firstAnswered = false;
  answeredUsers.clear();
  isGameActive = false;
  
  if (gameTimer) {
    clearTimeout(gameTimer);
    gameTimer = null;
  }
  
  res.json({ 
    success: true,
    message: "Game reset successfully" 
  });
});

// Reload questions endpoint
app.post("/admin/reload-questions", async (req, res) => {
  try {
    const count = await loadQuestions();
    res.json({
      success: true,
      message: "Questions reloaded successfully",
      questionsLoaded: count
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Database test endpoint
app.get("/test-db", async (req, res) => {
  try {
    const [dbTest] = await pool.query("SELECT 1 as db_status");
    const [questionCount] = await pool.query("SELECT COUNT(*) as count FROM questions");
    const [sampleQuestions] = await pool.query("SELECT id, text, correct, difficulty FROM questions LIMIT 3");
    
    res.json({
      database: "Connected ✅",
      totalQuestions: questionCount[0].count,
      sampleQuestions: sampleQuestions,
      gameState: {
        questionsInMemory: questions.length,
        currentIndex: currentIndex,
        gameSessionId: gameSessionId,
        isGameActive: isGameActive
      }
    });
  } catch (err) {
    res.status(500).json({ 
      database: "Error ❌", 
      error: err.message
    });
  }
});

// Delete ALL questions and reset auto-increment
app.delete("/questions/reset-all", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    console.log("Starting question reset...");
    
    await connection.execute("DELETE FROM answers");
    await connection.execute("DELETE FROM scores");
    await connection.execute("DELETE FROM performance");
    await connection.execute("DELETE FROM questions");
    await connection.execute("ALTER TABLE questions AUTO_INCREMENT = 1");
    
    await connection.commit();
    
    await loadQuestions();
    
    console.log("Question reset completed successfully");
    res.json({ 
      message: "All questions and game data reset successfully"
    });
    
  } catch (err) {
    await connection.rollback();
    console.error("Error resetting questions:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  } finally {
    connection.release();
  }
});

// NEW: Reset duplicate plays endpoint
app.post("/admin/reset-duplicate-plays", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get all users with multiple game sessions
    const [duplicateUsers] = await connection.query(`
      SELECT user_id, COUNT(DISTINCT game_session_id) as session_count 
      FROM answers 
      GROUP BY user_id 
      HAVING session_count > 1
    `);

    // Keep only the first game session for each user
    for (const user of duplicateUsers) {
      const [firstSession] = await connection.query(`
        SELECT game_session_id 
        FROM answers 
        WHERE user_id = ? 
        ORDER BY answered_at ASC 
        LIMIT 1
      `, [user.user_id]);

      if (firstSession.length > 0) {
        const firstSessionId = firstSession[0].game_session_id;
        
        // Delete answers from other sessions
        await connection.query(
          "DELETE FROM answers WHERE user_id = ? AND game_session_id != ?",
          [user.user_id, firstSessionId]
        );
      }
    }

    // Recalculate performance
    await connection.query(`
      UPDATE performance p
      JOIN (
        SELECT 
          user_id,
          SUM(points_earned) as total_score,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as total_correct
        FROM answers 
        GROUP BY user_id
      ) a ON p.user_id = a.user_id
      SET 
        p.score = a.total_score,
        p.attempts = a.total_attempts,
        p.correct_answers = a.total_correct,
        p.accuracy = CASE 
          WHEN a.total_attempts > 0 THEN (a.total_correct * 100.0 / a.total_attempts)
          ELSE 0 
        END
    `);

    await connection.commit();
    
    res.json({ 
      success: true,
      message: `Reset duplicate plays for ${duplicateUsers.length} users`,
      affected_users: duplicateUsers.length
    });
    
  } catch (err) {
    await connection.rollback();
    console.error("Reset duplicate plays error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Add single question
app.post("/questions", async (req, res) => {
  try {
    const { text, option_a, option_b, option_c, option_d, correct, difficulty } = req.body;
    
    if (!text || !option_a || !option_b || !option_c || !option_d || !correct) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Normalize correct answer to ensure consistent format
    let normalizedCorrect = correct.toUpperCase().trim();
    if (normalizedCorrect === 'A') normalizedCorrect = 'option_a';
    if (normalizedCorrect === 'B') normalizedCorrect = 'option_b';
    if (normalizedCorrect === 'C') normalizedCorrect = 'option_c';
    if (normalizedCorrect === 'D') normalizedCorrect = 'option_d';
    
    if (!['OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D'].includes(normalizedCorrect)) {
      return res.status(400).json({ error: "Correct answer must be A, B, C, or D" });
    }

    const [result] = await pool.query(
      `INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [text, option_a, option_b, option_c, option_d, normalizedCorrect, difficulty || "Medium"]
    );
    
    await loadQuestions();
    res.json({ 
      success: true,
      message: "Question added successfully", 
      question_id: result.insertId 
    });
  } catch (err) {
    console.error("POST /questions error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// CSV Upload endpoint
app.post("/questions/upload", upload.single("file"), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Processing file:", req.file.path);
    const results = [];
    let inserted = 0;
    let errors = [];

    await connection.beginTransaction();

    const processCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            try {
              for (let i = 0; i < results.length; i++) {
                const row = results[i];
                try {
                  const question = {
                    text: row.question || row.text || row.Question || row.Q,
                    option_a: row.option_a || row.a || row.optionA || row.A || row['option A'],
                    option_b: row.option_b || row.b || row.optionB || row.B || row['option B'],
                    option_c: row.option_c || row.c || row.optionC || row.C || row['option C'],
                    option_d: row.option_d || row.d || row.optionD || row.D || row['option D'],
                    correct: row.correct || row.answer || row.correct_answer || row.key,
                    difficulty: row.difficulty || row.level || 'Medium'
                  };

                  if (!question.text || !question.option_a || !question.option_b || 
                      !question.option_c || !question.option_d || !question.correct) {
                    errors.push(`Row ${i+1}: Missing required fields`);
                    continue;
                  }

                  let normalizedCorrect = question.correct.toString().toUpperCase().trim();
                  
                  if (['A', 'OPTION_A', 'OPTION A', '1'].includes(normalizedCorrect)) normalizedCorrect = 'option_a';
                  else if (['B', 'OPTION_B', 'OPTION B', '2'].includes(normalizedCorrect)) normalizedCorrect = 'option_b';
                  else if (['C', 'OPTION_C', 'OPTION C', '3'].includes(normalizedCorrect)) normalizedCorrect = 'option_c';
                  else if (['D', 'OPTION_D', 'OPTION D', '4'].includes(normalizedCorrect)) normalizedCorrect = 'option_d';
                  else {
                    errors.push(`Row ${i+1}: Invalid correct answer format: ${question.correct}`);
                    continue;
                  }

                  await connection.query(
                    `INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct, difficulty)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                      question.text.trim(),
                      question.option_a.trim(),
                      question.option_b.trim(),
                      question.option_c.trim(),
                      question.option_d.trim(),
                      normalizedCorrect,
                      question.difficulty.trim()
                    ]
                  );
                  inserted++;
                  
                } catch (rowError) {
                  errors.push(`Row ${i+1}: ${rowError.message}`);
                }
              }
              resolve();
            } catch (processError) {
              reject(processError);
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });
    };

    await processCSV();
    await connection.commit();

    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkError) {
      console.error("Error deleting file:", unlinkError);
    }

    await loadQuestions();
    res.json({
      success: true,
      message: `CSV processing completed`,
      inserted: inserted,
      total: results.length,
      errors: errors
    });

  } catch (error) {
    await connection.rollback();
    console.error("Upload error:", error);
    res.status(500).json({ 
      success: false,
      error: "Upload failed: " + error.message 
    });
  } finally {
    connection.release();
  }
});

// Leaderboard endpoint
app.get("/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "20", 10);
    
    const sql = `
      SELECT 
        u.user_id, 
        u.email, 
        u.display_name, 
        u.role,
        COALESCE(p.score, 0) as score,
        COALESCE(p.attempts, 0) as attempts,
        COALESCE(p.correct_answers, 0) as correct_answers,
        CASE 
          WHEN p.attempts > 0 THEN ROUND((p.correct_answers * 100.0 / p.attempts), 2)
          ELSE 0 
        END as accuracy
      FROM users u
      LEFT JOIN performance p ON u.user_id = p.user_id
      WHERE u.email IS NOT NULL 
        AND u.role = 'student'
        AND u.email != ''
      ORDER BY p.score DESC, accuracy DESC, p.correct_answers DESC
      LIMIT ?
    `;
    
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows);
  } catch (err) {
    console.error("GET /leaderboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Game results for Wisdom Warfare
app.get("/game-results/wisdom-warfare", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    
    const [results] = await pool.query(`
      SELECT 
        u.user_id,
        u.email,
        u.display_name,
        COALESCE(SUM(a.points_earned), 0) as total_score,
        COUNT(a.answer_id) as questions_answered,
        COALESCE(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END), 0) as correct_answers,
        CASE 
          WHEN COUNT(a.answer_id) > 0 THEN 
            ROUND((SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(a.answer_id)), 2)
          ELSE 0 
        END as accuracy,
        MAX(a.answered_at) as last_played
      FROM users u
      LEFT JOIN answers a ON u.user_id = a.user_id
      WHERE u.role = 'student'
      GROUP BY u.user_id, u.email, u.display_name
      HAVING questions_answered > 0
      ORDER BY total_score DESC, accuracy DESC, last_played DESC
      LIMIT ?
    `, [limit]);
    
    res.json({
      game_name: "Wisdom Warfare",
      results: results,
      total_players: results.length
    });
  } catch (err) {
    console.error("Get game results error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Download results as CSV
app.get("/download-results/wisdom-warfare", async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        u.user_id,
        u.email,
        u.display_name,
        COALESCE(SUM(a.points_earned), 0) as total_score,
        COUNT(a.answer_id) as questions_answered,
        COALESCE(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END), 0) as correct_answers,
        CASE 
          WHEN COUNT(a.answer_id) > 0 THEN 
            ROUND((SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(a.answer_id)), 2)
          ELSE 0 
        END as accuracy,
        MAX(a.answered_at) as last_played
      FROM users u
      LEFT JOIN answers a ON u.user_id = a.user_id
      WHERE u.role = 'student'
      GROUP BY u.user_id, u.email, u.display_name
      HAVING questions_answered > 0
      ORDER BY total_score DESC, accuracy DESC, last_played DESC
    `);
    
    const csvHeader = "Rank,Student Name,Email,Total Score,Questions Answered,Correct Answers,Accuracy%,Last Played\n";
    const csvRows = results.map((player, index) => 
      `${index + 1},"${player.display_name || 'Anonymous'}","${player.email}",${player.total_score || 0},${player.questions_answered || 0},${player.correct_answers || 0},${player.accuracy || 0},"${player.last_played || 'Never'}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=wisdom-warfare-results.csv');
    res.send(csvContent);
    
  } catch (err) {
    console.error("Download results error:", err);
    res.status(500).json({ error: err.message });
  }
});

// User authentication
app.post("/auth/upsert-user", async (req, res) => {
  const { uid, email, display_name, role = 'student' } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      "SELECT user_id, uid, email, display_name, role FROM users WHERE LOWER(email) = LOWER(?)",
      [normalizedEmail]
    );

    let user;
    
    if (existingUsers.length > 0) {
      user = existingUsers[0];
      await connection.query(
        "UPDATE users SET uid = ?, display_name = ?, role = ? WHERE user_id = ?",
        [uid, display_name || user.display_name, role, user.user_id]
      );
    } else {
      const [result] = await connection.query(
        `INSERT INTO users (uid, email, display_name, role) VALUES (?, ?, ?, ?)`,
        [uid, normalizedEmail, display_name || normalizedEmail, role]
      );
      
      const [newUsers] = await connection.query(
        "SELECT user_id, uid, email, display_name, role FROM users WHERE user_id = ?",
        [result.insertId]
      );
      user = newUsers[0];
    }
    
    if (role === 'student') {
      await connection.query(
        `INSERT IGNORE INTO performance (user_id, score, attempts, correct_answers, accuracy)
         VALUES (?, 0, 0, 0, 0)`,
        [user.user_id]
      );
    }

    await connection.commit();
    
    res.json({ 
      ok: true, 
      user_id: user.user_id, 
      user: user 
    });
    
  } catch (err) {
    await connection.rollback();
    console.error("auth/upsert-user error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Record answer
app.post("/record-answer", async (req, res) => {
  const { user_id, question_id, selected_answer, is_correct, points, game_name = 'Wisdom Warfare', game_session_id } = req.body;
  
  if (!user_id || !question_id || !selected_answer || !game_session_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // NEW: Check if user has already played in any session
    const [existingPlays] = await connection.query(
      "SELECT COUNT(*) as count FROM answers WHERE user_id = ?",
      [user_id]
    );

    if (existingPlays[0].count > 0) {
      await connection.rollback();
      return res.json({
        ok: false,
        error: "You have already played the game! Each student can only play once.",
        points_earned: 0
      });
    }

    const [existingAnswers] = await connection.query(
      "SELECT * FROM answers WHERE user_id = ? AND question_id = ? AND game_session_id = ?",
      [user_id, question_id, game_session_id]
    );

    if (existingAnswers.length > 0) {
      await connection.rollback();
      return res.json({
        ok: false,
        error: "You have already answered this question in this game session",
        points_earned: 0
      });
    }

    const pointsEarned = is_correct ? (points || 10) : 0;

    await connection.query(
      `INSERT INTO answers (user_id, question_id, selected_answer, is_correct, points_earned, game_session_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, question_id, selected_answer, is_correct, pointsEarned, game_session_id]
    );

    await connection.query(
      `INSERT INTO scores (user_id, game_name, score, attempts, correct_answers, accuracy, game_session_id)
       VALUES (?, ?, ?, 1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       score = score + VALUES(score),
       attempts = attempts + 1,
       correct_answers = correct_answers + VALUES(correct_answers),
       accuracy = CASE 
         WHEN (attempts + 1) > 0 THEN ((correct_answers + VALUES(correct_answers)) * 100.0 / (attempts + 1))
         ELSE 0 
       END`,
      [
        user_id, 
        game_name, 
        pointsEarned, 
        is_correct ? 1 : 0, 
        is_correct ? 100 : 0, 
        game_session_id
      ]
    );

    if (is_correct) {
      await connection.query(
        `INSERT INTO performance (user_id, score, attempts, correct_answers, accuracy)
         VALUES (?, ?, 1, 1, 100)
         ON DUPLICATE KEY UPDATE
         score = score + VALUES(score),
         attempts = attempts + 1,
         correct_answers = correct_answers + 1,
         accuracy = CASE 
           WHEN (attempts + 1) > 0 THEN ((correct_answers + 1) * 100.0 / (attempts + 1))
           ELSE 0 
         END`,
        [user_id, pointsEarned]
      );
    } else {
      await connection.query(
        `INSERT INTO performance (user_id, score, attempts, correct_answers, accuracy)
         VALUES (?, 0, 1, 0, 0)
         ON DUPLICATE KEY UPDATE
         attempts = attempts + 1,
         accuracy = CASE 
           WHEN (attempts + 1) > 0 THEN (correct_answers * 100.0 / (attempts + 1))
           ELSE 0 
         END`,
        [user_id]
      );
    }

    await connection.commit();

    const [leaderboard] = await connection.query(
      `SELECT 
        u.user_id, u.email, u.display_name, 
        COALESCE(p.score, 0) as score, 
        CASE 
          WHEN p.attempts > 0 THEN ROUND((p.correct_answers * 100.0 / p.attempts), 2)
          ELSE 0 
        END as accuracy,
        p.correct_answers, p.attempts
       FROM users u
       JOIN performance p ON u.user_id = p.user_id
       WHERE u.role = 'student'
       ORDER BY p.score DESC, accuracy DESC
       LIMIT 10`
    );

    res.json({
      ok: true,
      points_earned: pointsEarned,
      leaderboard: leaderboard
    });

  } catch (err) {
    await connection.rollback();
    console.error("record-answer error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Get user stats
app.get("/user/:user_id/stats", async (req, res) => {
  try {
    const userId = req.params.user_id;
    
    const [performanceRows] = await pool.query(
      "SELECT * FROM performance WHERE user_id = ?",
      [userId]
    );
    
    const [userRows] = await pool.query(
      "SELECT user_id, email, display_name, role, created_at FROM users WHERE user_id = ?",
      [userId]
    );

    const [difficultyStats] = await pool.query(`
      SELECT 
        q.difficulty,
        COUNT(a.answer_id) as total_answered,
        SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as correct,
        SUM(a.points_earned) as score
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ?
      GROUP BY q.difficulty
    `, [userId]);

    const totalPossibleScore = 450;
    const currentScore = performanceRows[0]?.score || 0;
    const percentage = totalPossibleScore > 0 ? (currentScore / totalPossibleScore) * 100 : 0;

    const byDifficulty = {};
    difficultyStats.forEach(stat => {
      byDifficulty[stat.difficulty.toLowerCase()] = {
        total: stat.total_answered,
        correct: stat.correct,
        score: stat.score
      };
    });

    const [gameSessions] = await pool.query(`
      SELECT 
        game_session_id,
        COUNT(*) as questions_answered,
        SUM(points_earned) as session_score,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
        MAX(answered_at) as last_answered
      FROM answers 
      WHERE user_id = ?
      GROUP BY game_session_id
      ORDER BY last_answered DESC
      LIMIT 10
    `, [userId]);

    res.json({
      user: userRows[0] || null,
      performance: performanceRows[0] || { score: 0, attempts: 0, correct_answers: 0, accuracy: 0 },
      game_stats: {
        total_possible_score: totalPossibleScore,
        current_percentage: percentage.toFixed(1),
        questions_answered: performanceRows[0]?.attempts || 0,
        total_questions: 30,
        by_difficulty: byDifficulty
      },
      game_sessions: gameSessions
    });

  } catch (err) {
    console.error("Get user stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// **FIXED SOCKET.IO HANDLERS**
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.emit("gameStatus", {
    questionsLoaded: questions.length,
    currentIndex: currentIndex,
    acceptingAnswers: acceptingAnswers,
    gameSessionId: gameSessionId,
    isGameActive: isGameActive,
    currentQuestion: currentIndex >= 0 && currentIndex < questions.length ? questions[currentIndex] : null
  });

  if (isGameActive && currentIndex >= 0 && currentIndex < questions.length && questions[currentIndex] && acceptingAnswers) {
    const q = questions[currentIndex];
    const correctAnswerText = getCorrectAnswerText(q);
    
    console.log("📤 Sending current question to new connection - CORRECT ANSWER:", correctAnswerText);
    
    socket.emit("newQuestion", {
      id: q.id,
      text: q.text,
      options: { 
        A: q.option_a, 
        B: q.option_b, 
        C: q.option_c, 
        D: q.option_d 
      },
      correct: q.correct,
      correctAnswer: correctAnswerText,
      difficulty: q.difficulty || "Medium",
      time: 30,
      questionNumber: currentIndex + 1,
      totalQuestions: questions.length,
      gameSessionId: gameSessionId
    });
  }

  socket.on("getGameStatus", () => {
    socket.emit("gameStatus", {
      questionsLoaded: questions.length,
      currentIndex: currentIndex,
      acceptingAnswers: acceptingAnswers,
      gameSessionId: gameSessionId,
      isGameActive: isGameActive,
      currentQuestion: currentIndex >= 0 && currentIndex < questions.length ? questions[currentIndex] : null
    });
  });

  socket.on("submitAnswer", async ({ user_id, answer, email, display_name }) => {
    try {
      // NEW: Check if user has already played
      const hasPlayed = await hasUserPlayedGame(user_id);
      if (hasPlayed) {
        socket.emit("answerResult", { 
          error: "You have already played the game! Each student can only play once.",
          showNextButton: false
        });
        return;
      }

      if (!acceptingAnswers || currentIndex >= questions.length || !questions[currentIndex]) {
        socket.emit("answerResult", { 
          error: "No active question",
          showNextButton: true
        });
        return;
      }
      
      const questionKey = `${user_id}-${questions[currentIndex].id}-${gameSessionId}`;
      if (answeredUsers.has(questionKey)) {
        socket.emit("answerResult", { 
          error: "You have already answered this question!",
          showNextButton: true
        });
        return;
      }
      
      answeredUsers.set(questionKey, true);

      const currentQuestion = questions[currentIndex];
      const userAnswer = answer.toUpperCase().trim();
      const correctAnswerKey = currentQuestion.correct.toString().toUpperCase().trim();
      
      let isCorrect = false;
      
      // SIMPLE DIRECT COMPARISON
      if ((correctAnswerKey === 'OPTION_A' || correctAnswerKey === 'A') && userAnswer === 'A') isCorrect = true;
      else if ((correctAnswerKey === 'OPTION_B' || correctAnswerKey === 'B') && userAnswer === 'B') isCorrect = true;
      else if ((correctAnswerKey === 'OPTION_C' || correctAnswerKey === 'C') && userAnswer === 'C') isCorrect = true;
      else if ((correctAnswerKey === 'OPTION_D' || correctAnswerKey === 'D') && userAnswer === 'D') isCorrect = true;

      console.log("🎯 Answer submitted:", {
        user_id,
        userAnswer,
        correctAnswer: correctAnswerKey,
        isCorrect,
        questionId: currentQuestion.id,
        gameSessionId: gameSessionId
      });

      let points = 10;
      const answerTime = Date.now() - currentQuestionStartTime;
      if (isCorrect && answerTime < 5000 && !firstAnswered) {
        points += 5;
        firstAnswered = true;
      }

      try {
        const response = await fetch(`http://localhost:${process.env.PORT || 4001}/record-answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: parseInt(user_id),
            question_id: currentQuestion.id,
            selected_answer: answer,
            is_correct: isCorrect,
            points: points,
            game_name: "Wisdom Warfare",
            game_session_id: gameSessionId
          })
        });

        const result = await response.json();

        if (result.ok) {
          const correctAnswerText = getCorrectAnswerText(currentQuestion);
          
          console.log("✅ Sending answer result - CORRECT ANSWER TEXT:", correctAnswerText);
          
          if (isCorrect) {
            socket.emit("answerResult", { 
              message: `✅ Correct! +${points} points`,
              correct: true,
              points: points,
              correctAnswer: correctAnswerText,
              showNextButton: true
            });
          } else {
            socket.emit("answerResult", { 
              message: `❌ Wrong answer! Correct was: ${correctAnswerText}`,
              correct: false,
              points: 0,
              correctAnswer: correctAnswerText,
              showNextButton: true
            });
          }

          if (result.leaderboard) {
            io.emit("leaderboardUpdate", result.leaderboard);
          }
        } else {
          socket.emit("answerResult", { 
            error: result.error,
            showNextButton: true
          });
        }

      } catch (dbError) {
        console.error("Database record error:", dbError);
        socket.emit("answerResult", { 
          error: "Error recording answer",
          showNextButton: true
        });
      }

    } catch (err) {
      console.error("submitAnswer error:", err);
      socket.emit("answerResult", { 
        error: "Server error processing answer",
        showNextButton: true
      });
    }
  });

  socket.on("nextQuestion", () => {
    console.log("Next question requested by:", socket.id);
    if (acceptingAnswers || (currentIndex >= 0 && currentIndex < questions.length)) {
      if (gameTimer) {
        clearTimeout(gameTimer);
        gameTimer = null;
      }
      endCurrentQuestion();
    }
  });

  socket.on("adminStartGame", () => {
    console.log("Admin starting game via socket");
    if (questions.length > 0) {
      startNewGameSession();
    } else {
      socket.emit("gameError", { error: "No questions available" });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// End current question and move to next
function endCurrentQuestion() {
  acceptingAnswers = false;
  
  if (currentIndex >= 0 && currentIndex < questions.length) {
    const q = questions[currentIndex];
    const correctAnswerText = getCorrectAnswerText(q);
    
    console.log(`📢 Ending question ${currentIndex + 1} - CORRECT ANSWER: ${correctAnswerText}`);
    
    io.emit("questionClosed", { 
      correct: q.correct,
      correctAnswer: correctAnswerText,
      explanation: `Question completed! Correct answer was: ${correctAnswerText}`,
      questionNumber: currentIndex + 1,
      totalQuestions: questions.length,
      showNextButton: false
    });
  }
  
  setTimeout(() => {
    console.log(`Moving to next question...`);
    nextQuestion().catch(e => console.error("Next question error:", e));
  }, 1000);
}

// Game loop functions
async function nextQuestion() {
  currentIndex++;
  
  answeredUsers.clear();
  firstAnswered = false;
  currentQuestionStartTime = Date.now();

  if (currentIndex >= questions.length) {
    console.log("🎉 Game completed - all questions answered");
    isGameActive = false;
    
    try {
      const [finalResults] = await pool.query(`
        SELECT 
          u.user_id, u.email, u.display_name,
          COALESCE(SUM(a.points_earned), 0) as session_score,
          COUNT(a.answer_id) as questions_answered,
          COALESCE(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END), 0) as correct_answers,
          CASE 
            WHEN COUNT(a.answer_id) > 0 THEN 
              ROUND((SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(a.answer_id)), 2)
            ELSE 0 
          END as accuracy
        FROM users u
        LEFT JOIN answers a ON u.user_id = a.user_id AND a.game_session_id = ?
        WHERE u.role = 'student'
        GROUP BY u.user_id, u.email, u.display_name
        HAVING questions_answered > 0
        ORDER BY session_score DESC, accuracy DESC
        LIMIT 20
      `, [gameSessionId]);
      
      io.emit("gameCompleted", {
        message: "🎉 Game Completed! All questions answered.",
        totalQuestions: questions.length,
        gameSessionId: gameSessionId,
        finalResults: { results: finalResults }
      });
    } catch (error) {
      console.error("Error getting final results:", error);
      io.emit("gameCompleted", {
        message: "🎉 Game Completed! All questions answered.",
        totalQuestions: questions.length,
        gameSessionId: gameSessionId,
        finalResults: { results: [] }
      });
    }
    
    return;
  }

  const q = questions[currentIndex];
  acceptingAnswers = true;
  isGameActive = true;

  const correctAnswerText = getCorrectAnswerText(q);

  console.log(`📝 Question ${currentIndex + 1}/${questions.length} [${q.difficulty}]: ${q.text.substring(0, 50)}...`);
  console.log(`✅ Correct answer: ${q.correct} -> ${correctAnswerText}`);

  io.emit("newQuestion", {
    id: q.id,
    text: q.text,
    options: { 
      A: q.option_a, 
      B: q.option_b, 
      C: q.option_c, 
      D: q.option_d 
    },
    correct: q.correct,
    correctAnswer: correctAnswerText,
    difficulty: q.difficulty || "Medium",
    time: 30,
    questionNumber: currentIndex + 1,
    totalQuestions: questions.length,
    gameSessionId: gameSessionId,
    showNextButton: false
  });

  if (gameTimer) clearTimeout(gameTimer);
  gameTimer = setTimeout(() => {
    if (acceptingAnswers) {
      console.log(`⏰ Time's up for question ${currentIndex + 1}`);
      endCurrentQuestion();
    }
  }, 30000);
}

// Start new game session
function startNewGameSession() {
  gameSessionId = generateGameSessionId();
  currentIndex = -1;
  answeredUsers.clear();
  isGameActive = true;
  
  console.log(`🎮 Starting new game session: ${gameSessionId}`);
  io.emit("gameStarted", { 
    sessionId: gameSessionId, 
    totalQuestions: questions.length 
  });
  
  setTimeout(() => {
    nextQuestion().catch(e => console.error("Game start error:", e));
  }, 3000);
}

// Start server
const PORT = process.env.PORT || 4001;

function startServer(port) {
  server.listen(port, async () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Admin panel: http://localhost:${port}/admin`);
    console.log(`🔍 Health check: http://localhost:${port}/`);
    
    setTimeout(async () => {
      const count = await loadQuestions();
      
      if (count === 0) {
        console.log("❌ No questions found. Please use the admin panel to upload questions.");
      } else {
        console.log(`✅ ${count} questions loaded successfully`);
        console.log("⏳ Game is ready! Use the admin panel to start the game.");
      }
    }, 2000);
    
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`❌ Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Start the server
startServer(PORT);