// src/GamePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameUI from "./components/GameUI/GameUI";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

// ---------------- Rules Modal ----------------
function RulesModal({ title, rules, onClose }) {
  if (!rules) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-cyan-600 rounded-xl p-8 max-w-lg w-full relative shadow-3xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-300 hover:text-cyan-100 text-3xl font-bold transition-colors duration-200"
        >
          &times;
        </button>
        <h2 className="text-4xl font-extrabold text-cyan-300 mb-6 text-center">
          {title} Rules
        </h2>
        <div className="text-gray-200 text-lg leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">
          <p>{rules}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------- Top Players Modal ----------------
function TopPlayersModal({ players, loading, error, onClose, onRetry }) {
  // players: array | null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-cyan-600 rounded-xl p-6 max-w-lg w-full relative shadow-3xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-300 hover:text-cyan-100 text-3xl font-bold transition-colors duration-200"
        >
          &times;
        </button>
        <h2 className="text-4xl font-extrabold text-cyan-300 mb-4 text-center">
          🏆 Top Players (Global)
        </h2>

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-300">
            {loading && "Loading leaderboard..."}
            {!loading && error && <span className="text-red-400">Failed to load leaderboard</span>}
            {!loading && !error && (!players || players.length === 0) && (
              <span className="text-gray-400">No leaderboard data yet.</span>
            )}
          </div>
          <div>
            <button
              onClick={onRetry}
              className="mr-2 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm"
              disabled={loading}
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="text-gray-200 text-lg leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-center text-gray-400 py-6">Fetching leaderboard…</div>
          ) : error ? (
            <div className="text-center text-red-400">
              <p>Unable to fetch leaderboard from the server.</p>
              <p className="text-sm text-gray-300 mt-2">Check console/network or retry.</p>
            </div>
          ) : (
            <ol className="list-decimal list-inside space-y-3">
              {(players || []).map((player, index) => (
                <li
                  key={player.user_id ?? index}
                  className="flex justify-between items-center bg-gray-700 p-3 rounded-lg"
                >
                  <span className="font-semibold text-cyan-200">
                    {player.display_name || player.displayName || player.name || "Unknown"}
                  </span>
                  <span className="text-gray-300 text-sm">
                    {typeof player.total_score !== "undefined"
                      ? player.total_score
                      : player.score ?? 0}{" "}
                    points
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Game Card ----------------
function GameCard({ title, icon, onViewRules, onEnterGame }) {
  const [code, setCode] = useState("");

  return (
    <div className="bg-gray-900 rounded-3xl p-6 shadow-3xl border-2 border-cyan-600 relative transition-all duration-300 hover:scale-105">
      <h3 className="text-3xl font-extrabold text-cyan-300 mb-4 text-center">
        <span role="img" aria-label="game-icon" className="mr-2 text-3xl">
          {icon}
        </span>
        {title}
      </h3>

      <input
        type="text"
        placeholder="Enter game code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-800 border-2 border-cyan-700 rounded-lg text-white text-center"
      />

      <button
        onClick={() => onViewRules(title)}
        className="w-full py-2 mb-3 rounded-xl border-2 border-cyan-500 text-cyan-300 hover:bg-cyan-900"
      >
        📖 View Rules
      </button>

      <button
        onClick={() => onEnterGame(title, code)}
        className="w-full py-3 rounded-xl font-extrabold text-lg bg-cyan-600 text-white hover:bg-cyan-500"
      >
        🚀 Enter Game
      </button>
    </div>
  );
}

// ---------------- Main Game Page ----------------
function GamePage({ onStartGame, onLogout }) {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [currentGameRules, setCurrentGameRules] = useState({ title: "", rules: "" });
  const [showTopPlayersModal, setShowTopPlayersModal] = useState(false);
  const [enteredGame, setEnteredGame] = useState(null);

  // leaderboard state
  const [topPlayers, setTopPlayers] = useState([]);
  const [topPlayersLoading, setTopPlayersLoading] = useState(false);
  const [topPlayersError, setTopPlayersError] = useState(null);

  const navigate = useNavigate();

  // Rules data
  const gameRulesContent = {
    "Wisdom Warfare": {
      title: "Wisdom Warfare",
      rules:
        "Wisdom Warfare is a fast-paced trivia game. Answer questions quickly to gain points. Incorrect answers cost you points. The player with the most points at the end of three rounds wins!",
    },
    "Mystery Spinner": { title: "Mystery Spinner", rules: "Spin the wheel, answer questions, and collect points. First to 5000 wins!" },
    "Escape Room": { title: "Escape Room", rules: "Solve puzzles to escape before time runs out. Work as a team!" },
    "A. Crossword": { title: "A. Crossword", rules: "Classic crossword with a twist. Solve all clues to reveal a hidden phrase." },
  };

  const handleViewRules = (gameTitle) => {
    setCurrentGameRules(gameRulesContent[gameTitle] || { title: gameTitle, rules: "No rules found." });
    setShowRulesModal(true);
  };

  const handleEnterGame = (gameTitle, code) => {
    if (gameTitle === "Wisdom Warfare" && code === "WW123") {
      setEnteredGame("Wisdom Warfare");
      if (typeof onStartGame === "function") onStartGame();
    } else {
      alert("Invalid game code!");
    }
  };

  // ---------------- Fetch leaderboard (teacher page logic) ---------------
  const fetchLeaderboard = useCallback(async () => {
    setTopPlayersLoading(true);
    setTopPlayersError(null);
    try {
      // using same endpoint & limit parameter as TeacherGameManagementPage
      const res = await fetch(`${API_BASE}/leaderboard?limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn("Unexpected leaderboard format, expected array:", data);
        setTopPlayers([]);
      } else {
        setTopPlayers(data);
      }
    } catch (err) {
      console.error("Failed to fetch global leaderboard:", err);
      setTopPlayers([]);
      setTopPlayersError(err.message || String(err));
    } finally {
      setTopPlayersLoading(false);
    }
  }, []);

  // Fetch global leaderboard when the modal opens (same behavior as teacher page)
  useEffect(() => {
    if (!showTopPlayersModal) return;
    fetchLeaderboard();
  }, [showTopPlayersModal, fetchLeaderboard]);

  if (enteredGame === "Wisdom Warfare") {
    // If you prefer to navigate to /play and render GameUI inside App router,
    // change this to navigate("/play") instead. For now we render GameUI inline for simplicity.
    return <GameUI onLogout={onLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6">
      <h1 className="text-5xl font-black text-cyan-400 mb-6">
        ⚔ INTERACTIVE GAMIFIED LEARNING
      </h1>

      <div
        onClick={() => setShowTopPlayersModal(true)}
        className="cursor-pointer bg-gray-800 rounded-full px-8 py-3 mb-10 border-2 border-cyan-600 hover:scale-105 flex items-center justify-center"
      >
        🏆
        <span className="ml-2 font-bold text-cyan-400 glow-text">
          View Top Players
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
        {Object.keys(gameRulesContent).map((game) => (
          <GameCard
            key={game}
            title={game}
            icon={
              game === "Wisdom Warfare"
                ? "🧠"
                : game === "Mystery Spinner"
                ? "🎡"
                : game === "Escape Room"
                ? "🗝"
                : "📝"
            }
            onViewRules={handleViewRules}
            onEnterGame={handleEnterGame}
          />
        ))}
      </div>

      {showRulesModal && (
        <RulesModal
          title={currentGameRules.title}
          rules={currentGameRules.rules}
          onClose={() => setShowRulesModal(false)}
        />
      )}

      {showTopPlayersModal && (
        <TopPlayersModal
          players={topPlayers}
          loading={topPlayersLoading}
          error={topPlayersError}
          onClose={() => setShowTopPlayersModal(false)}
          onRetry={() => fetchLeaderboard()}
        />
      )}

      {/* Logout button */}
      <button
        onClick={() => {
          if (onLogout) onLogout();
          navigate("/");
        }}
        className="mt-12 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg text-white font-bold"
      >
        🚪 Logout
      </button>
    </div>
  );
}

export default GamePage;
