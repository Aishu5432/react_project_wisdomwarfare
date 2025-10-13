// src/TeacherGameManagementPage.js
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";
console.log("API_BASE =", API_BASE);

/* ================= TopPlayers (global) ================= */
function TopPlayersModal({ players, onClose }) {
  if (!players) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-red-600 rounded-xl p-6 max-w-lg w-full relative shadow-3xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-300 hover:text-rose-100 text-3xl font-bold transition-colors duration-200"
        >
          &times;
        </button>
        <h2 className="text-3xl font-extrabold text-rose-300 mb-4 text-center">🏆 Global Top Players</h2>
        <div className="text-gray-200 text-sm leading-relaxed max-h-80 overflow-y-auto">
          <ol className="list-decimal list-inside space-y-2">
            {players.map((p, i) => (
              <li key={i} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                <span className="font-semibold text-rose-200"> {i + 1}. {p.display_name || p.username || "Unknown"} (ID-{p.id || p.user_id || "—"})</span>
                <span className="text-gray-300 text-sm">{p.score ?? 0} points</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
//Upload Student Details
function UploadStudentsSection() {
  const [studentFile, setStudentFile] = useState(null);

  const handleUploadStudents = async () => {
    if (!studentFile) return alert("Please choose a file first!");
    const formData = new FormData();
    formData.append("file", studentFile);

    try {
      const res = await axios.post("http://localhost:5000/upload-students", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.message);
      setStudentFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to upload student details");
    }
  };

  return (
    <div className="flex justify-center w-full">
    <div className="bg-gray-800 p-6 mt-6 rounded-lg shadow-lg text-white w-full max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-center">
        👩‍🎓 Upload Students Details
      </h3>

      <div className="flex flex-col items-center space-y-4  w-full">
        <input
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={(e) => setStudentFile(e.target.files[0])}
          className="text-gray-300 bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full max-w-lg"
        />

        <button
          onClick={handleUploadStudents}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow-md transition-all duration-200"
        >
          📂 Upload Students
        </button>
      </div>
    </div>
    </div>
  );
}

//editquestion
function EditQuestionModal({ question, onSave, onCancel }) {
  const [form, setForm] = useState({
    text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct: "",
    difficulty: "Medium",
  });

  const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

  // Populate form whenever question changes
  useEffect(() => {
    if (question) setForm({ ...question });
  }, [question]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-2xl w-[90%] md:w-[50%]">
        <h2 className="text-xl font-bold mb-4 text-rose-300">✏️ Edit Question</h2>

        {/* Question text */}
        <textarea
          name="text"
          value={form.text}
          onChange={handleChange}
          rows={3}
          placeholder="Enter question"
          className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-600"
        />

        {/* Options A-D */}
        {["option_a", "option_b", "option_c", "option_d"].map((opt) => (
          <input
            key={opt}
            name={opt}
            value={form[opt]}
            onChange={handleChange}
            placeholder={opt.replace("_", " ").toUpperCase()}
            className={`w-full mb-3 p-2 rounded bg-gray-800 border border-gray-600 ${
              form.correct === opt ? "border-green-500 text-green-300 font-semibold" : ""
            }`}
          />
        ))}

        {/* Correct answer */}
        <div className="mb-3">
          <label className="block text-gray-300 mb-1">Correct Answer</label>
          <select
            name="correct"
            value={form.correct}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
          >
            {["option_a", "option_b", "option_c", "option_d"].map((opt) => (
              <option key={opt} value={opt}>
                {opt.toUpperCase()}: {form[opt]}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="mb-3">
          <label className="block text-gray-300 mb-1">Difficulty</label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}



/** ======View Questions=======  */
function ViewQuestionsModal({ questions, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-2xl max-h-[85vh] overflow-y-auto w-[90%] md:w-[70%] border-2 border-red-600 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-rose-300">
          📋 All Questions
        </h2>

        {questions.length === 0 ? (
          <p className="text-center text-gray-400">No questions found.</p>
        ) : (
          <ul className="space-y-4">
            {questions.map((q) => (
              <li
                key={q.id}
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-rose-500 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-lg">{q.text}</p>
                    <p className="text-sm text-gray-400">
                      Difficulty: {q.difficulty || "General"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(q)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onDelete(q.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-medium"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

               <ul className="space-y-2 ml-2">
  {["option_a", "option_b", "option_c", "option_d"].map((opt) => {
    const isCorrect = q.correct_text?.trim() === q[opt]?.trim(); // compare actual text
    return (
      <li
        key={opt}
        className={`px-4 py-2 rounded-lg border ${
          isCorrect
            ? "bg-green-600 border-green-400 text-white font-bold"
            : "bg-gray-700 border-gray-600 text-gray-200"
        }`}
      >
        {q[opt]}
      </li>
    );
  })}
</ul>





              </li>
            ))}
          </ul>
        )}

        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


/* ================= Manual Add Question (one by one) ================= */
function ManualQuestionModal({ gameTitle, onClose, onAdded }) {
  const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"]; // <-- dropdown options

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [questions, setQuestions] = useState([]);
const [showQuestionsModal, setShowQuestionsModal] = useState(false);


  const handleOptionChange = (i, v) => {
    const temp = [...options];
    temp[i] = v;
    setOptions(temp);
  };

  const clearForm = () => {
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrect("");
    setDifficulty("Medium");
    setErr("");
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErr("");

    if (!question || options.some((o) => !o) || !correct) {
      setErr("Please fill all fields and select the correct answer.");
      return;
    }
    if (!options.includes(correct)) {
      setErr("Correct answer must exactly match one of the options.");
      return;
    }
    if (!DIFFICULTY_OPTIONS.includes(difficulty)) {
      setErr("Please pick a valid difficulty.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: question,
          option_a: options[0],
          option_b: options[1],
          option_c: options[2],
          option_d: options[3],
          correct,
          difficulty, // now guaranteed from dropdown
          // add game_id/game_code if your backend supports it
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);

      if (typeof onAdded === "function") onAdded(data);
      alert("✅ Question added");
      clearForm();
    } catch (e2) {
      setErr(e2.message || "Server error while adding question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-red-600 rounded-xl p-6 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-300 hover:text-rose-100 text-3xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-2xl font-extrabold text-rose-300 mb-4 text-center">
          ➕ Add Question — {gameTitle}
        </h2>

        {err && <div className="text-red-400 mb-3">{err}</div>}

        <form onSubmit={handleSave} className="space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter question"
            className="w-full p-3 bg-gray-700 border-2 border-red-600 rounded-lg text-white"
            rows={3}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)} (A/B/C/D)`}
                className="w-full p-2 bg-gray-700 border-2 border-red-600 rounded-lg text-white"
                required
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <input
              value={correct}
              onChange={(e) => setCorrect(e.target.value)}
              placeholder="Correct option(Eg:option_a)"
              className="w-full p-2 bg-gray-700 border-2 border-red-600 rounded-lg text-white md:col-span-2"
              required
            />

            {/* ---- DROPDOWN instead of typing ---- */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-2 bg-gray-700 border-2 border-red-600 rounded-lg text-white"
              aria-label="Select difficulty"
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between mt-2">
            <button
              type="button"
              onClick={clearForm}
              className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              disabled={saving}
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= CSV Upload ================= */
function UploadQsModal({ gameTitle, onClose, onInserted }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef();

  const reset = () => {
    setFile(null);
    setLoading(false);
    setErrorMsg("");
  };
  
  useEffect(() => () => reset(), []);

  const handleFile = (f) => {
    setErrorMsg("");
    if (!f) return setFile(null);
    if (!f.name.toLowerCase().endsWith(".csv") && f.type !== "text/csv") {
      setErrorMsg("Please upload a CSV file.");
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onSelectClicked = () => inputRef.current?.click();

  const handleUpload = async (e) => {
    e?.preventDefault?.();
    setErrorMsg("");
    if (!file) return setErrorMsg("No file selected.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("game_name", gameTitle || "Wisdom Warfare");

      const endpoints = [
        `${API_BASE}/questions/bulk`,
        `${API_BASE}/api/questions/bulk`,
        `${API_BASE}/questions/upload`,
        `${API_BASE}/api/questions/upload`,
      ];

      let data = null;
      let lastErr = null;

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { method: "POST", body: formData });
          const text = await res.text();
          let parsed = {};
          try {
            parsed = text ? JSON.parse(text) : {};
          } catch {
            parsed = { raw: text };
          }
          if (res.ok) {
            data = parsed;
            break;
          } else {
            lastErr = parsed?.error || parsed?.message || parsed?.raw || `HTTP ${res.status}`;
          }
        } catch (err) {
          lastErr = err.message || String(err);
        }
      }

      if (!data) {
        setErrorMsg(`Upload failed: ${lastErr || "No working endpoint found"}`);
        setLoading(false);
        return;
      }

      const inserted = data.inserted ?? data.insertedCount ?? 0;
      const skipped = data.skippedCount ?? data.skipped ?? 0;

      if (typeof onInserted === "function") onInserted({ inserted, skipped, raw: data });

      alert(`✅ Upload succeeded. Inserted: ${inserted}. Skipped: ${skipped}.`);
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("CSV upload error:", err);
      setErrorMsg("Network or server error while uploading. See console for details.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-red-600 rounded-xl p-6 max-w-2xl w-full relative shadow-3xl">
        <button
          onClick={() => {
            reset();
            onClose();
          }}
          className="absolute top-4 right-4 text-rose-300 hover:text-rose-100 text-3xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-extrabold text-rose-300 mb-4 text-center">
          Upload Questions — {gameTitle}
        </h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`w-full p-6 mb-4 rounded-lg border-2 border-dashed ${
            dragOver ? "border-rose-400 bg-gray-700" : "border-gray-600 bg-gray-800"
          } text-center`}
          style={{ cursor: "pointer" }}
          onClick={onSelectClicked}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files && e.target.files[0])}
          />
          {file ? (
            <div>
              <div className="text-white font-semibold">{file.name}</div>
              <div className="text-sm text-gray-300 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
              <div className="text-xs text-gray-400 mt-2">Click or drag another file to replace</div>
            </div>
          ) : (
            <div>
              <div className="text-rose-200 font-medium">Click or drag a CSV file here</div>
              <div className="text-sm text-gray-400 mt-2">
                CSV must include columns like: <code>question,a,b,c,d,correct</code> (header names are flexible).
              </div>
            </div>
          )}
        </div>

        {errorMsg && <div className="text-red-400 mb-3">{errorMsg}</div>}

        <div className="flex justify-between gap-4">
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            {loading ? "Uploading..." : "Upload & Insert"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Per-game leaderboard ================= */
function ViewRankModal({ gameTitle, ranks, onClose }) {
  if (!ranks) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-red-600 rounded-xl p-6 max-w-lg w-full relative shadow-3xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-rose-300 hover:text-rose-100 text-3xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-3xl font-extrabold text-rose-300 mb-4 text-center">Ranks for {gameTitle}</h2>
        <ol className="text-gray-200 text-sm leading-relaxed max-h-80 overflow-y-auto">
          {ranks.length > 0 ? (
            ranks.map((p, i) => (
              <li key={i} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg mb-1">
                <span className="font-semibold text-rose-200"> {i + 1}. {p.display_name || p.username || "Unknown"} (ID-{p.id || p.user_id || "—"})</span>
                <span className="font-semibold text-rose-200">{p.score ?? 0} pts</span>
              </li>
            ))
          ) : (
            <p>No ranks yet.</p>
          )}
        </ol>
      </div>
    </div>
  );
}

/* ================= Card ================= */
function TeacherGameCard({
  title,
  icon,
  gameCode,
  onGenerateCode,
  onUploadQs,
  onManualAdd,
  onEmptyQuestions,
  onViewRank,
  onDownloadResult,
  onViewQuestions, // already in props
}) {
  const [showUploadStudents, setShowUploadStudents] = useState(false);
  return (
    <div className="bg-gray-900 rounded-3xl p-6 border-2 border-red-600">
      <h3 className="text-3xl font-extrabold text-rose-300 mb-4 text-center">
        {icon} {title}
      </h3>

      {/* game code block (only shows for Wisdom Warfare) */}
      {title === "Wisdom Warfare" && (
        <div className="bg-gray-800 rounded-xl p-3 border border-red-500/40 mb-4">
          <div className="text-sm text-rose-200 mb-1">Your Game Code</div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-black tracking-widest text-white">
              {gameCode || "— — — — — —"}
            </div>
            <button
              onClick={onGenerateCode}
              className="ml-3 px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm"
            >
              {gameCode ? "Refresh Code" : "Generate Code"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        {title === "Wisdom Warfare" && (
          <>
          
               <button
        onClick={() => setShowUploadStudents(true)}
        className="col-span-2 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500"
      >
        ⬆ Upload Student details
      </button>

      {showUploadStudents && <UploadStudentsSection />}
            <button
              onClick={onManualAdd}
              className="col-span-2 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400"
            >
              ✍️ Add Question (Manual)
            </button>
            
            
            <button
              onClick={onUploadQs}
              className="col-span-2 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500"
            >
              ⬆ Upload Questions
            </button>
            <button
              onClick={onEmptyQuestions}
              className="col-span-2 py-2 rounded-xl bg-gray-700 text-rose-300 hover:bg-gray-600"
              title="Remove all questions linked to this code"
            >
              🧹 Empty Questions (this code)
            </button>
          </>
        )}

        {/* Add View Questions button */}
        {onViewQuestions && (
          <button
            onClick={onViewQuestions}
            className="col-span-2 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500"
          >
             View Questions
          </button>
        )}

        <button
          onClick={onViewRank}
          className="py-2 rounded-xl bg-gray-700 text-rose-300 hover:bg-gray-600"
        >
          📊 View Rank
        </button>
        <button
          onClick={onDownloadResult}
          className="py-2 rounded-xl bg-gray-700 text-rose-300 hover:bg-gray-600"
        >
          ⬇ Download Result
        </button>
      </div>
    </div>
  );
}

/* ================= Main Page ================= */
export default function TeacherGameManagementPage() {
  const [showTopPlayersModal, setShowTopPlayersModal] = useState(false);
  const [showUploadQsModal, setShowUploadQsModal] = useState(false);
  const [showManualQsModal, setShowManualQsModal] = useState(false);
  const [showViewRankModal, setShowViewRankModal] = useState(false);

  const [currentTeacherGameTitle, setCurrentTeacherGameTitle] = useState("");
  const [topPlayers, setTopPlayers] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [questions, setQuestions] = useState([]);
const [showQuestionsModal, setShowQuestionsModal] = useState(false);

  // Unique code for this teacher's Wisdom Warfare session
  const [wwGameCode, setWwGameCode] = useState("");
  const [editQuestion, setEditQuestion] = useState(null);


  const games = [
    { name: "Wisdom Warfare", icon: "🧠" },
    { name: "Mystery Spinner", icon: "🎡" },
    { name: "Escape Room", icon: "🗝" },
    { name: "A. Crossword", icon: "📝" },
  ];
  /*fetch questions after edit */
  

const fetchQuestions = async () => {
  try {
    const res = await axios.get(`${API_BASE}/questions`);
    let data = res.data;

    // Convert correct key (like "option_a") to actual option text
    data = data.map(q => ({
      ...q,
      correct_text: q[q.correct] || "", // get the actual text of the correct answer
    }));

    setQuestions(data);
  } catch (error) {
    console.error("Error fetching questions:", error);
  }
};


// Run it once when the page loads
useEffect(() => {
  fetchQuestions();
}, []);

/* Edit Question */
 
const [editingQuestion, setEditingQuestion] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);

// ✅ Edit handler
const handleEditQuestion = (question) => {
  console.log("Editing:", question);
  setEditingQuestion(question);
  setShowEditModal(true);
};

// ✅ Save edited question
const handleSaveEdit = async (updatedQuestion) => {
  try {
    await axios.put(`http://localhost:4000/questions/${updatedQuestion.id}`, updatedQuestion);
    alert("✅ Question updated successfully!");
    fetchQuestions(); // refresh the list
    setShowEditModal(false);
  } catch (error) {
    console.error("Error updating question:", error);
    alert("❌ Failed to update question");
  }
};


const handleDeleteQuestion = async (id) => {
  if (!window.confirm("Are you sure you want to delete this question?")) return;

  try {
    const res = await fetch(`http://localhost:4000/questions/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete");

    setQuestions((prev) => prev.filter((q) => q.id !== id));
    alert("Question deleted successfully!");
  } catch (err) {
    console.error(err);
    alert("Error deleting question");
  }
};

/* handle viewquestion */
const handleViewQuestions = async () => {
  try {
    const res = await fetch(`${API_BASE}/questions`);
    if (!res.ok) throw new Error("Failed to fetch questions");
    let data = await res.json();

    // Normalize correct answer to actual text
    data = data.map(q => ({
      ...q,
      correct_text: q[q.correct] || "", // q.correct might be "option_a"
    }));

    setQuestions(data);
    setShowQuestionsModal(true);
  } catch (err) {
    console.error(err);
    alert("Could not load questions");
  }
};


/*   */
  /* --------------- helpers to identify teacher --------------- */
  const getTeacherIdOrUid = () => {
    // we try multiple keys to be resilient
    return (
      localStorage.getItem("user_id") ||
      localStorage.getItem("uid") ||
      sessionStorage.getItem("user_id") ||
      sessionStorage.getItem("uid") ||
      null
    );
  };

  /* --------------- load global top players --------------- */
  useEffect(() => {
    if (!showTopPlayersModal) return;
    fetch(`${API_BASE}/leaderboard?limit=10`)
      .then((r) => r.json())
      .then(setTopPlayers)
      .catch((err) => {
        console.error("Error loading global leaderboard:", err);
        setTopPlayers([]);
      });
  }, [showTopPlayersModal]);

  /* --------------- fetch existing or create new WW code --------------- */
  const fetchOrCreateWwCode = async () => {
    const teacher = getTeacherIdOrUid();
    if (!teacher) {
      console.warn("No teacher id/uid in storage.");
      return;
    }

    try {
      // 1) try to find latest session
      const q = new URLSearchParams({ game_name: "Wisdom Warfare" }).toString();
      const res = await fetch(`${API_BASE}/teacher/my-games?${q}`);
      if (res.ok) {
        const arr = await res.json().catch(() => []);
        if (Array.isArray(arr) && arr.length > 0) {
          // pick most recent
          const latest = arr[0];
          if (latest?.game_code) {
            setWwGameCode(latest.game_code);
            return;
          }
        }
      }

      // 2) otherwise, create a new one
      const createRes = await fetch(`${API_BASE}/teacher/new-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher: teacher, game_name: "Wisdom Warfare" }),
      });
      const data = await createRes.json().catch(() => ({}));
      if (!createRes.ok) throw new Error(data?.error || data?.message || "Failed to create game code");
      if (data?.game_code) setWwGameCode(data.game_code);
    } catch (err) {
      console.error("fetchOrCreateWwCode error:", err);
    }
  };

  useEffect(() => {
    fetchOrCreateWwCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------- actions --------------- */
  const handleGenerateCode = async () => {
    const teacher = getTeacherIdOrUid();
    if (!teacher) return alert("No teacher identity found. Please sign in as a teacher.");
    try {
      const res = await fetch(`${API_BASE}/teacher/new-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher, game_name: "Wisdom Warfare" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to create/refresh game code");
      setWwGameCode(data?.game_code || "");
      alert(`🎟️ Game code: ${data?.game_code || "(none)"}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not generate code.");
    }
  };

  const handleUploadQsClick = (gameTitle) => {
    setCurrentTeacherGameTitle(gameTitle);
    setShowUploadQsModal(true);
  };

  const handleManualAddClick = (gameTitle) => {
    setCurrentTeacherGameTitle(gameTitle);
    setShowManualQsModal(true);
  };

  const handleEmptyQuestions = async () => {
    if (!wwGameCode) return alert("No game code yet.");
    const teacher = getTeacherIdOrUid();
    if (!teacher) return alert("No teacher identity found.");

    if (!window.confirm(`This will delete ALL questions linked to code ${wwGameCode}. Continue?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/teacher/wipe-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher, game_code: wwGameCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to wipe questions");
      alert("🧹 Questions cleared for this code.");
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not wipe questions.");
    }
  };

  const handleViewRankClick = async (gameTitle) => {
    setCurrentTeacherGameTitle(gameTitle);
    try {
      // per your earlier server, this returns per-game (by name) leaderboard
      const res = await fetch(`${API_BASE}/leaderboard?game_name=${encodeURIComponent(gameTitle)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRanks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching ranks:", err);
      setRanks([]);
    }
    setShowViewRankModal(true);
  };

  const handleUploadInserted = ({ inserted, skipped }) => {
    console.log(`Inserted ${inserted} questions, skipped ${skipped}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-rose-950 flex flex-col items-center p-4">
      <h1 className="text-5xl font-black text-rose-400 mb-10 text-center">
        ⚔ INTERACTIVE GAMIFIED LEARNING SYSTEM
      </h1>

      {/* Top players button */}
      <div className="mb-8">
        <button
          onClick={() => setShowTopPlayersModal(true)}
          className="px-8 py-3 rounded-lg bg-gray-700 text-rose-300 hover:bg-gray-600 font-bold text-lg"
        >
          🏆 View Global Top Players
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
        {[
          { name: "Wisdom Warfare", icon: "⚔" },
          { name: "Mystery Spinner", icon: "🎡" },
          { name: "Escape Room", icon: "🗝" },
          { name: "A. Crossword", icon: "📝" },
        ].map((g) => (
          <TeacherGameCard
            key={g.name}
            title={g.name}
            icon={g.icon}
            gameCode={g.name === "Wisdom Warfare" ? wwGameCode : undefined}
            onGenerateCode={g.name === "Wisdom Warfare" ? handleGenerateCode : undefined}
            onManualAdd={() => handleManualAddClick(g.name)}
            onUploadQs={() => handleUploadQsClick(g.name)}
            onEmptyQuestions={g.name === "Wisdom Warfare" ? handleEmptyQuestions : undefined}
            onViewRank={() => handleViewRankClick(g.name)}
           onViewQuestions={handleViewQuestions} 
            onDownloadResult={() => alert("Downloading result...")}
          />
        ))}
      </div>
          

      {/* Logout button */}
      <div className="w-full flex justify-center mt-12 mb-6">
        <button
          onClick={() => (window.location.href = "/")}
          className="px-10 py-4 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold text-xl"
        >
          🚪 Logout
        </button>
      </div>
    
      {showTopPlayersModal && (
        <TopPlayersModal
          players={topPlayers}
          onClose={() => setShowTopPlayersModal(false)}
        />
      )}

      {showUploadQsModal && (
        <UploadQsModal
          gameTitle={currentTeacherGameTitle}
          onClose={() => setShowUploadQsModal(false)}
          onInserted={handleUploadInserted}
        />
      )}

      {showManualQsModal && (
        <ManualQuestionModal
          gameTitle={currentTeacherGameTitle}
          onClose={() => setShowManualQsModal(false)}
          onAdded={() => {}}
        />
      )}
    
      


      {showViewRankModal && (
        <ViewRankModal
          gameTitle={currentTeacherGameTitle}
          ranks={ranks}
          onClose={() => setShowViewRankModal(false)}
        />
      )}

      {showQuestionsModal && (
  <ViewQuestionsModal
    questions={questions}
    onClose={() => setShowQuestionsModal(false)}
    onEdit={handleEditQuestion}
    onDelete={handleDeleteQuestion}
  />
)}

{showEditModal && editingQuestion && (
  <EditQuestionModal
    question={editingQuestion}
    onSave={handleSaveEdit}
    onCancel={() => setShowEditModal(false)}
  />
)}




    </div>
  );
}
