// src/components/GameUI/GameUI.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GameUI.module.css";
import TopBar from "../TopBar/TopBar";
import PlayerRanking from "../PlayerRanking/PlayerRanking";
import QuestionBox from "../QuestionBox/QuestionBox";
import SideMissions from "../SideMissions/SideMissions";
import BottomBar from "../BottomBar/BottomBar";
import ProgressBar from "../ProgressBar/ProgressBar";
import StudentDashboard from "../StudentDashboard/StudentDashboard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";
// Fallback DB game id if no code has been chosen yet:
const DEFAULT_WW_GAME_ID = Number(process.env.REACT_APP_WW_GAME_ID) || 1;

const GameUI = ({ user, onFinish, onLogout }) => {
  const navigate = useNavigate();

  // ---------- NEW: game join / code state ----------
  const [codeInput, setCodeInput] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [joining, setJoining] = useState(false);

  // Persist the resolved game in localStorage so refresh keeps the session
  const [currentGame, setCurrentGame] = useState(() => {
    const savedId = Number(localStorage.getItem("current_game_id"));
    const savedCode = localStorage.getItem("current_game_code");
    const savedName = localStorage.getItem("current_game_name") || "Wisdom Warfare";
    if (Number.isFinite(savedId) && savedId > 0) {
      return { game_id: savedId, game_code: savedCode || null, game_name: savedName };
    }
    return { game_id: DEFAULT_WW_GAME_ID, game_code: null, game_name: "Wisdom Warfare" };
  });

  // ---------- existing quiz UI state ----------
  const [timerKey, setTimerKey] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [questionsData, setQuestionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  // Player list for this game session (participants only)
  const [players, setPlayers] = useState([]);

  const [isFinished, setIsFinished] = useState(false);
  const [finishCountdown, setFinishCountdown] = useState(null);

  const questionTimerRef = useRef(null);
  const finishIntervalRef = useRef(null);
  const leaderboardIntervalRef = useRef(null);

  const missions = useMemo(
    () => [
      { text: "Answer 5 questions about space travel", current: 3, total: 5 },
      { text: "Achieve 90% accuracy in a Wave", current: 0, total: 1 },
    ],
    []
  );

  // ---------- Fetch questions (unchanged, student-safe) ----------
  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      if (!mounted) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/questions-for-students`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data.map((r) => ({
              id: r.id,
              question: r.text || r.question || "",
              answers: [r.option_a, r.option_b, r.option_c, r.option_d].filter(
                (a) => typeof a !== "undefined" && a !== null
              ),
              difficulty: r.difficulty || "Medium",
            }))
          : [];
        if (mounted) {
          setQuestionsData(normalized);
          setCurrentQuestionIndex((prevIdx) =>
            normalized.length === 0
              ? 0
              : Math.min(prevIdx, Math.max(0, normalized.length - 1))
          );
        }
      } catch (err) {
        console.error("Fetch questions failed:", err);
        if (mounted) setQuestionsData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchQuestions();
    const qInterval = setInterval(fetchQuestions, 15000); // refresh every 15s
    return () => {
      mounted = false;
      clearInterval(qInterval);
    };
  }, []);

  // ---------- NEW: resolve code -> game_id ----------
  const resolveGameByCode = async (rawCode) => {
    const code = String(rawCode || "").trim();
    if (!code) throw new Error("Enter a code");
    // try query param first
    let res = await fetch(
      `${API_BASE}/game/by-code?code=${encodeURIComponent(code)}`
    );
    if (res.ok) return res.json();
    // fallback to /:code
    res = await fetch(`${API_BASE}/game/by-code/${encodeURIComponent(code)}`);
    if (res.ok) return res.json();
    // try upper-case (server already uppercases, but just in case)
    const up = code.toUpperCase();
    res = await fetch(`${API_BASE}/game/by-code?code=${encodeURIComponent(up)}`);
    if (res.ok) return res.json();

    // surface best error
    let msg = "Invalid game code";
    try {
      const t = await res.text();
      const maybe = JSON.parse(t);
      msg = maybe?.error || maybe?.message || msg;
    } catch { /* ignore */ }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  };

  // ---------- NEW: join flow (save + call /join-game) ----------
  const performJoin = async (game) => {
    // Save locally
    localStorage.setItem("current_game_id", String(game.game_id));
    if (game.game_code) localStorage.setItem("current_game_code", game.game_code);
    if (game.game_name) localStorage.setItem("current_game_name", game.game_name);
    setCurrentGame({
      game_id: game.game_id,
      game_code: game.game_code || null,
      game_name: game.game_name || "Wisdom Warfare",
    });

    // If logged in, announce participant
    try {
      const uid = user?.user_id || Number(localStorage.getItem("user_id"));
      if (uid && Number.isFinite(Number(uid))) {
        const j = await fetch(`${API_BASE}/join-game`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: Number(uid), game_id: Number(game.game_id) }),
        });
        if (!j.ok) {
          console.warn("join-game returned non-OK", j.status);
        }
      }
    } catch (e) {
      console.warn("join-game failed:", e);
    }
  };

  const handleJoinByCode = async (e) => {
    e?.preventDefault?.();
    if (joining) return;
    setJoinErr("");
    setJoining(true);
    try {
      const data = await resolveGameByCode(codeInput);
      if (!data?.ok || !data?.game_id) {
        throw new Error(data?.error || "Invalid game code");
      }
      await performJoin(data);
      setCodeInput("");
    } catch (err) {
      console.error("Join by code error:", err);
      setJoinErr(err.message || "Invalid game code");
    } finally {
      setJoining(false);
    }
  };

  const handleClearCode = () => {
    // Revert to default session
    localStorage.removeItem("current_game_id");
    localStorage.removeItem("current_game_code");
    localStorage.removeItem("current_game_name");
    setCurrentGame({
      game_id: DEFAULT_WW_GAME_ID,
      game_code: null,
      game_name: "Wisdom Warfare",
    });
  };

  // ---------- Join-game (mark participant) when user or game changes ----------
  useEffect(() => {
    let cancelled = false;
    const announceJoin = async () => {
      try {
        if (cancelled) return;
        const uid = user?.user_id || Number(localStorage.getItem("user_id"));
        const gid = currentGame?.game_id;
        if (!uid || !gid) return;
        const res = await fetch(`${API_BASE}/join-game`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: Number(uid), game_id: Number(gid) }),
        });
        if (!res.ok) {
          console.warn("join-game non-OK", res.status);
        }
      } catch (err) {
        console.error("join-game failed:", err);
      }
    };
    announceJoin();
    return () => {
      cancelled = true;
    };
  }, [user, currentGame?.game_id]);

  // ---------- Fetch per-game participant leaderboard ----------
  const fetchLeaderboard = async (gameId) => {
    const gid = Number(gameId || currentGame?.game_id || DEFAULT_WW_GAME_ID);
    if (!gid || !Number.isFinite(gid)) return;
    try {
      const res = await fetch(`${API_BASE}/leaderboard/${gid}?limit=20`);
      if (!res.ok) {
        console.warn("Failed to fetch per-game leaderboard:", res.status);
        return;
      }
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map((u, idx) => ({
            rank: idx + 1,
            name:
              u.display_name ||
              u.displayName ||
              u.username ||
              u.email ||
              "Unknown",
            score: Number(u.score || 0),
            user_id: u.user_id || u.userId || null,
          }))
        : [];
      setPlayers(normalized);
    } catch (err) {
      console.error("fetchLeaderboard error:", err);
    }
  };

  // poll leaderboard for the selected game
  useEffect(() => {
    // clear any prior poller
    if (leaderboardIntervalRef.current) {
      clearInterval(leaderboardIntervalRef.current);
      leaderboardIntervalRef.current = null;
    }
    // initial fetch
    fetchLeaderboard(currentGame?.game_id);
    // poll every 5s
    leaderboardIntervalRef.current = setInterval(
      () => fetchLeaderboard(currentGame?.game_id),
      5000
    );
    return () => {
      if (leaderboardIntervalRef.current) {
        clearInterval(leaderboardIntervalRef.current);
        leaderboardIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.game_id]);

  // ---------- Stats update from QuestionBox ----------
  const handleStatsUpdated = ({ total_score, accuracy: acc }) => {
    if (typeof total_score === "number") setScore(total_score);
    if (typeof acc === "number") setAccuracy(Math.round(acc));
  };

  // ---------- Next question (or finish) ----------
  const handleNextQuestion = () => {
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }

    if (!questionsData || questionsData.length === 0) {
      setIsFinished(true);
      return;
    }
    setCurrentQuestionIndex((prev) => {
      if (prev + 1 < questionsData.length) return prev + 1;
      setIsFinished(true);
      return prev;
    });
    setTimerKey((k) => k + 1);
  };

  // ---------- Auto-skip unanswered after 30s ----------
  useEffect(() => {
    if (isFinished) return;

    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }

    questionTimerRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 30000);

    return () => {
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, isFinished, questionsData.length]);

  // ---------- Auto-redirect after finishing (10s) ----------
  useEffect(() => {
    if (!isFinished) {
      setFinishCountdown(null);
      if (finishIntervalRef.current) {
        clearInterval(finishIntervalRef.current);
        finishIntervalRef.current = null;
      }
      return;
    }

    setFinishCountdown(10);
    finishIntervalRef.current = setInterval(() => {
      setFinishCountdown((s) => {
        if (s === null) return null;
        if (s <= 1) {
          if (finishIntervalRef.current) {
            clearInterval(finishIntervalRef.current);
            finishIntervalRef.current = null;
          }
          try {
            if (typeof onFinish === "function") onFinish();
          } catch (err) {
            console.error("onFinish error:", err);
          }
          navigate("/gamepage", { replace: true });
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (finishIntervalRef.current) {
        clearInterval(finishIntervalRef.current);
        finishIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  const toggleDashboard = () => setIsDashboardOpen((s) => !s);

  const qSource =
    questionsData.length > 0
      ? questionsData
      : [
          {
            id: "fallback-1",
            question: "Who is credited with creating the first compiler?",
            answers: ["John Backus", "Alan Turing", "Grace Hopper", "Dennis Ritchie"],
            difficulty: "Easy",
          },
        ];

  const safeIndex = Math.min(
    currentQuestionIndex,
    Math.max(0, qSource.length - 1)
  );
  const current = qSource[safeIndex];

  const handleSubmit = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (typeof onFinish === "function") {
      try {
        onFinish();
      } catch (err) {
        console.error(err);
      }
    }
    navigate("/gamepage", { replace: true });
  };

  const showJoinBanner = !currentGame?.game_code; // if no code chosen, nudge to join

  return (
    <>
      {/* ---------- NEW: Join by code banner ---------- */}
      <div className="w-full bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="text-white text-sm flex-1">
            {currentGame?.game_code ? (
              <>
                <span className="opacity-80 mr-2">Joined game:</span>
                <span className="font-bold">{currentGame.game_name}</span>
                <span className="mx-2 opacity-60">|</span>
                <span className="text-cyan-300">Code: {currentGame.game_code}</span>
                <button
                  onClick={handleClearCode}
                  className="ml-4 text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600"
                >
                  Change code
                </button>
              </>
            ) : (
              <>
                <span className="opacity-80 mr-2">Have a code from your teacher?</span>
                <form
                  onSubmit={handleJoinByCode}
                  className="inline-flex items-center gap-2"
                >
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Enter code (e.g., WW3K9A2)"
                    className="px-3 py-2 rounded bg-gray-900 text-white border border-gray-600 focus:outline-none focus:border-cyan-500 text-sm"
                    style={{ width: 200 }}
                  />
                  <button
                    type="submit"
                    disabled={joining}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-3 py-2 rounded"
                  >
                    {joining ? "Joining..." : "Join"}
                  </button>
                </form>
                {joinErr && (
                  <span className="ml-3 text-rose-400 text-xs">{joinErr}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.gameContainer}>
        <div className={styles.topBar}>
          <TopBar
            wave={1}
            totalWaves={3}
            timer="WISDOM WARFARE"
            score={score.toLocaleString()}
            accuracy={accuracy}
          />
        </div>

        <div className={styles.progressBarArea}>
          <ProgressBar key={timerKey} duration={30} />
        </div>

        {/* Left column: session participants ranking */}
        <div className={styles.playerRanking}>
          {players && players.length > 0 ? (
            <PlayerRanking players={players} />
          ) : (
            <div style={{ color: "#cbd5e1", textAlign: "center" }}>
              {showJoinBanner
                ? "Enter a game code to see this session’s players"
                : "No players yet"}
            </div>
          )}
        </div>

        {/* Center: question area */}
        <div className={styles.questionBox}>
          {loading ? (
            <div style={{ color: "#e0e0e0", textAlign: "center" }}>
              Loading questions...
            </div>
          ) : isFinished ? (
            <div className="text-center text-white">
              <h2 className="text-3xl mb-4">🎉 Quiz Complete!</h2>
              <p className="mb-3">
                {finishCountdown !== null && finishCountdown > 0
                  ? `Redirecting in ${finishCountdown}s...`
                  : "Redirecting..."}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg font-bold"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            <QuestionBox
              question={current.question}
              answers={current.answers}
              questionId={current.id}
              difficulty={current.difficulty}
              onNextQuestion={handleNextQuestion}
              onStatsUpdated={handleStatsUpdated}
              user={user}
              gameName="Wisdom Warfare"
            />
          )}
        </div>

        {/* Right column: side missions */}
        <div className={styles.sideMissions}>
          <SideMissions missions={missions} />
        </div>

        <div className={styles.bottomBar}>
          <BottomBar
            onDashboardClick={toggleDashboard}
            onLogout={() => {
              if (typeof onLogout === "function") onLogout();
              navigate("/", { replace: true });
            }}
          />
        </div>
      </div>

      {isDashboardOpen && <StudentDashboard onClose={toggleDashboard} />}
    </>
  );
};

export default GameUI;
