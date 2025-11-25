// import React, { useEffect, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { formatAccuracy } from '../src/utils/helpers';
// const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4001";

// function RulesModal({ title, rules, onClose }) {
//   if (!rules) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
//       <div className="bg-gray-800 border-2 border-cyan-600 rounded-xl p-8 max-w-lg w-full relative shadow-3xl">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-cyan-300 hover:text-cyan-100 text-3xl font-bold transition-colors duration-200"
//         >
//           &times;
//         </button>
//         <h2 className="text-4xl font-extrabold text-cyan-300 mb-6 text-center">
//           {title} Rules
//         </h2>
//         <div className="text-gray-200 text-lg leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">
//           <p>{rules}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// function TopPlayersModal({ players, loading, error, onClose, onRetry }) {
//   const formatAccuracy = (accuracy) => {
//     if (accuracy === null || accuracy === undefined) return '0.0';
//     return typeof accuracy === 'number' ? accuracy.toFixed(1) : parseFloat(accuracy || 0).toFixed(1);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
//       <div className="bg-gray-800 border-2 border-cyan-600 rounded-xl p-6 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-cyan-300 hover:text-cyan-100 text-3xl font-bold transition-colors duration-200"
//         >
//           &times;
//         </button>
//         <h2 className="text-3xl font-extrabold text-cyan-300 mb-4 text-center">
//           🏆 Global Leaderboard
//         </h2>
        
//         {loading ? (
//           <div className="text-center text-gray-400 py-8">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
//             <p>Loading leaderboard...</p>
//           </div>
//         ) : error ? (
//           <div className="text-center text-red-400 py-8">
//             <p>Failed to load leaderboard: {error}</p>
//             <button
//               onClick={onRetry}
//               className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white"
//             >
//               Retry
//             </button>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-white min-w-full">
//               <thead>
//                 <tr className="bg-cyan-700">
//                   <th className="p-3 text-left">Rank</th>
//                   <th className="p-3 text-left">Student</th>
//                   <th className="p-3 text-left">Email</th>
//                   <th className="p-3 text-right">Score</th>
//                   <th className="p-3 text-right">Accuracy</th>
//                   <th className="p-3 text-right">Attempted Questions(out of 30)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {players.map((player, index) => (
//                   <tr key={player.user_id} className="border-b border-gray-700 hover:bg-gray-700">
//                     <td className="p-3 font-bold text-cyan-300">
//                       {index + 1}
//                       {index === 0 && " 🥇"}
//                       {index === 1 && " 🥈"} 
//                       {index === 2 && " 🥉"}
//                     </td>
//                     <td className="p-3 font-medium">
//                       {player.display_name || "Anonymous"}
//                     </td>
//                     <td className="p-3 text-gray-300">
//                       {player.email}
//                     </td>
//                     <td className="p-3 text-right font-bold text-cyan-300">
//                       {player.score || 0}
//                     </td>
//                     <td className="p-3 text-right text-green-400 font-bold">
//                       {formatAccuracy(player.accuracy)}%
//                     </td>
//                     <td className="p-3 text-right text-gray-300">
//                       {player.attempts || 0}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             {players.length === 0 && (
//               <div className="text-center text-gray-400 py-8">
//                 <div className="text-6xl mb-4">📊</div>
//                 <p className="text-xl">No players yet</p>
//                 <p className="text-sm mt-2">Students need to play games to appear on leaderboard</p>
//               </div>
//             )}
//           </div>
//         )}
        
//         <div className="mt-6 text-center">
//           <button
//             onClick={onClose}
//             className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold transition-colors"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function GameCard({ title, icon, onViewRules, onEnterGame }) {
//   const [code, setCode] = useState("");
  
//   const handleEnter = () => {
//     if (title === "Wisdom Warfare") {
//       if (code === "WW123" || code === "TEST123") {
//         onEnterGame(title, code);
//       } else {
//         alert("Please enter valid game code: WW123 or TEST123");
//       }
//     } else {
//       onEnterGame(title, code);
//     }
//   };

//   return (
//     <div className="bg-gray-900 rounded-3xl p-6 shadow-3xl border-2 border-cyan-600 relative transition-all duration-300 hover:scale-105 hover-lift">
//       <h3 className="text-3xl font-extrabold text-cyan-300 mb-4 text-center">
//         <span role="img" aria-label="game-icon" className="mr-2 text-3xl">
//           {icon}
//         </span>
//         {title}
//       </h3>
      
//       {title === "Wisdom Warfare" && (
//         <input
//           type="text"
//           placeholder="Enter game code: WW123"
//           value={code}
//           onChange={(e) => setCode(e.target.value)}
//           className="w-full p-3 mb-4 bg-gray-800 border-2 border-cyan-700 rounded-lg text-white text-center placeholder-gray-400"
//         />
//       )}
      
//       <div className="space-y-3">
//         <button
//           onClick={() => onViewRules(title)}
//           className="w-full py-2 rounded-xl border-2 border-cyan-500 text-cyan-300 hover:bg-cyan-900 transition-colors"
//         >
//           📖 View Rules
//         </button>
//         <button
//           onClick={handleEnter}
//           className="w-full py-3 rounded-xl font-extrabold text-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
//         >
//           🚀 Enter Game
//         </button>
//       </div>
//     </div>
//   );
// }

// function GamePage({ user, onStartGame, onLogout }) {
//   const [showRulesModal, setShowRulesModal] = useState(false);
//   const [currentGameRules, setCurrentGameRules] = useState({ title: "", rules: "" });
//   const [showTopPlayersModal, setShowTopPlayersModal] = useState(false);
//   const [topPlayers, setTopPlayers] = useState([]);
//   const [topPlayersLoading, setTopPlayersLoading] = useState(false);
//   const [topPlayersError, setTopPlayersError] = useState(null);
//   const navigate = useNavigate();

//   const gameRulesContent = {
//     "Wisdom Warfare": {
//       title: "Wisdom Warfare",
//       rules: "Answer multiple-choice questions quickly to earn points. Correct answers earn 10 points, with a 5-point bonus for being the first to answer correctly. The faster you answer, the more points you get! Game code required: WW123",
//     },
//     "Mystery Spinner": { 
//       title: "Mystery Spinner", 
//       rules: "Spin the wheel to get random questions from different categories. Each spin reveals a new challenge. Collect points and compete with others!" 
//     },
//     "Escape Room": { 
//       title: "Escape Room", 
//       rules: "Solve compiler design puzzles and challenges to escape the virtual room. Work through increasingly difficult problems to earn your freedom and top scores!" 
//     },
//     "A. Crossword": { 
//       title: "A. Crossword", 
//       rules: "Complete the compiler design crossword puzzle. Fill in the blanks based on your knowledge of compiler phases, data structures, and algorithms." 
//     },
//   };

//   const handleViewRules = (gameTitle) => {
//     setCurrentGameRules(gameRulesContent[gameTitle] || { title: gameTitle, rules: "No rules found." });
//     setShowRulesModal(true);
//   };

//   const handleEnterGame = (gameTitle, code) => {
//     if (gameTitle === "Wisdom Warfare") {
//       onStartGame();
//     } else {
//       alert(`${gameTitle} is coming soon! Currently only Wisdom Warfare is available.`);
//     }
//   };

//   const fetchLeaderboard = useCallback(async () => {
//     setTopPlayersLoading(true);
//     setTopPlayersError(null);
//     try {
//       const res = await fetch(`${API_BASE}/leaderboard?limit=20`);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       const data = await res.json();
//       setTopPlayers(data);
//     } catch (err) {
//       console.error("Failed to fetch leaderboard:", err);
//       setTopPlayersError(err.message || String(err));
//     } finally {
//       setTopPlayersLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (showTopPlayersModal) {
//       fetchLeaderboard();
//     }
//   }, [showTopPlayersModal, fetchLeaderboard]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 flex flex-col items-center p-6">
//       {/* Header */}
//       <div className="text-center mb-8">
//         <h1 className="text-5xl font-black text-cyan-400 mb-4 glow-text">
//           ⚔ WISDOM WARFARE
//         </h1>
//         <p className="text-xl text-cyan-200">Interactive Compiler Design Learning</p>
//         {user && (
//           <div className="mt-4 p-3 bg-cyan-900 rounded-lg inline-block">
//             <p className="text-cyan-100">Welcome, <span className="font-bold">{user.display_name}</span></p>
//             <p className="text-cyan-200 text-sm">{user.email}</p>
//           </div>
//         )}
//       </div>

//       {/* Top Players Button */}
//       <div className="mb-8">
//         <button
//           onClick={() => setShowTopPlayersModal(true)}
//           className="px-8 py-4 rounded-full bg-cyan-700 hover:bg-cyan-600 border-2 border-cyan-500 text-cyan-100 font-bold text-lg transition-all hover-lift"
//         >
//           🏆 View Global Leaderboard
//         </button>
//       </div>

//       {/* Game Cards Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
//         {Object.keys(gameRulesContent).map((game) => (
//           <GameCard
//             key={game}
//             title={game}
//             icon={
//               game === "Wisdom Warfare"
//                 ? "🧠"
//                 : game === "Mystery Spinner"
//                 ? "🎡"
//                 : game === "Escape Room"
//                 ? "🗝"
//                 : "📝"
//             }
//             onViewRules={handleViewRules}
//             onEnterGame={handleEnterGame}
//           />
//         ))}
//       </div>

//       {/* Student Dashboard Button */}
//       <button
//         onClick={() => navigate("/dashboard")}
//         className="mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold"
//       >
//         📊 View My Dashboard
//       </button>

//       {/* Logout Button */}
//       <button
//         onClick={onLogout}
//         className="mt-12 bg-red-600 hover:bg-red-500 px-8 py-4 rounded-lg text-white font-bold text-lg transition-colors"
//       >
//         🚪 Logout
//       </button>

//       {/* Modals */}
//       {showRulesModal && (
//         <RulesModal
//           title={currentGameRules.title}
//           rules={currentGameRules.rules}
//           onClose={() => setShowRulesModal(false)}
//         />
//       )}

//       {showTopPlayersModal && (
//         <TopPlayersModal
//           players={topPlayers}
//           loading={topPlayersLoading}
//           error={topPlayersError}
//           onClose={() => setShowTopPlayersModal(false)}
//           onRetry={fetchLeaderboard}
//         />
//       )}
//     </div>
//   );
// }

// export default GamePage;


import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatAccuracy } from './utils/helpers';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4001";

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

function TopPlayersModal({ players, loading, error, onClose, onRetry }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border-2 border-cyan-600 rounded-xl p-6 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-300 hover:text-cyan-100 text-3xl font-bold transition-colors duration-200"
        >
          &times;
        </button>
        <h2 className="text-3xl font-extrabold text-cyan-300 mb-4 text-center">
          🏆 Global Leaderboard
        </h2>
        
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">
            <p>Failed to load leaderboard: {error}</p>
            <button
              onClick={onRetry}
              className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-white min-w-full">
              <thead>
                <tr className="bg-cyan-700">
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-right">Score</th>
                  <th className="p-3 text-right">Accuracy</th>
                  <th className="p-3 text-right">Attempted Questions(out of 30)</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={player.user_id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="p-3 font-bold text-cyan-300">
                      {index + 1}
                      {index === 0 && " 🥇"}
                      {index === 1 && " 🥈"} 
                      {index === 2 && " 🥉"}
                    </td>
                    <td className="p-3 font-medium">
                      {player.display_name || "Anonymous"}
                    </td>
                    <td className="p-3 text-gray-300">
                      {player.email}
                    </td>
                    <td className="p-3 text-right font-bold text-cyan-300">
                      {player.score || 0}
                    </td>
                    <td className="p-3 text-right text-green-400 font-bold">
                      {formatAccuracy(player.accuracy)}%
                    </td>
                    <td className="p-3 text-right text-gray-300">
                      {player.attempts || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {players.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-xl">No players yet</p>
                <p className="text-sm mt-2">Students need to play games to appear on leaderboard</p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function GameCard({ title, icon, onViewRules, onEnterGame, canPlay }) {
  const [code, setCode] = useState("");
  
  const handleEnter = () => {
    if (title === "Wisdom Warfare") {
      if (!canPlay) {
        alert("You have already played the game! Each student can only play once.");
        return;
      }
      
      if (code === "WW123" || code === "TEST123") {
        onEnterGame(title, code);
      } else {
        alert("Please enter valid game code: WW123 or TEST123");
      }
    } else {
      onEnterGame(title, code);
    }
  };

  return (
    <div className="bg-gray-900 rounded-3xl p-6 shadow-3xl border-2 border-cyan-600 relative transition-all duration-300 hover:scale-105 hover-lift">
      <h3 className="text-3xl font-extrabold text-cyan-300 mb-4 text-center">
        <span role="img" aria-label="game-icon" className="mr-2 text-3xl">
          {icon}
        </span>
        {title}
      </h3>
      
      {title === "Wisdom Warfare" && (
        <>
          <input
            type="text"
            placeholder="Enter game code: WW123"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-800 border-2 border-cyan-700 rounded-lg text-white text-center placeholder-gray-400"
          />
          {!canPlay && (
            <div className="text-red-400 text-sm text-center mb-2 font-bold">
              🚫 You have already played this game
            </div>
          )}
        </>
      )}
      
      <div className="space-y-3">
        <button
          onClick={() => onViewRules(title)}
          className="w-full py-2 rounded-xl border-2 border-cyan-500 text-cyan-300 hover:bg-cyan-900 transition-colors"
        >
          📖 View Rules
        </button>
        <button
          onClick={handleEnter}
          className="w-full py-3 rounded-xl font-extrabold text-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
        >
          🚀 Enter Game
        </button>
      </div>
    </div>
  );
}

function GamePage({ user, onStartGame, onLogout }) {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [currentGameRules, setCurrentGameRules] = useState({ title: "", rules: "" });
  const [showTopPlayersModal, setShowTopPlayersModal] = useState(false);
  const [topPlayers, setTopPlayers] = useState([]);
  const [topPlayersLoading, setTopPlayersLoading] = useState(false);
  const [topPlayersError, setTopPlayersError] = useState(null);
  const [canPlay, setCanPlay] = useState(true);
  const [playCheckLoading, setPlayCheckLoading] = useState(true);
  const navigate = useNavigate();

  const gameRulesContent = {
    "Wisdom Warfare": {
      title: "Wisdom Warfare",
      rules: "Answer multiple-choice questions quickly to earn points. Correct answers earn 10 points, with a 5-point bonus for being the first to answer correctly. The faster you answer, the more points you get! Game code required: WW123. Each student can only play once.",
    },
    "Mystery Spinner": { 
      title: "Mystery Spinner", 
      rules: "Spin the wheel to get random questions from different categories. Each spin reveals a new challenge. Collect points and compete with others!" 
    },
    "Escape Room": { 
      title: "Escape Room", 
      rules: "Solve compiler design puzzles and challenges to escape the virtual room. Work through increasingly difficult problems to earn your freedom and top scores!" 
    },
    "A. Crossword": { 
      title: "A. Crossword", 
      rules: "Complete the compiler design crossword puzzle. Fill in the blanks based on your knowledge of compiler phases, data structures, and algorithms." 
    },
  };

  useEffect(() => {
    if (user && user.user_id) {
      checkIfUserCanPlay();
    } else {
      setPlayCheckLoading(false);
    }
  }, [user]);

  const checkIfUserCanPlay = async () => {
    try {
      const response = await fetch(`${API_BASE}/user/${user.user_id}/can-play`);
      const data = await response.json();
      setCanPlay(data.can_play);
    } catch (error) {
      console.error('Error checking play status:', error);
      setCanPlay(true);
    } finally {
      setPlayCheckLoading(false);
    }
  };

  const handleViewRules = (gameTitle) => {
    setCurrentGameRules(gameRulesContent[gameTitle] || { title: gameTitle, rules: "No rules found." });
    setShowRulesModal(true);
  };

  const handleEnterGame = (gameTitle, code) => {
    if (gameTitle === "Wisdom Warfare") {
      onStartGame();
    } else {
      alert(`${gameTitle} is coming soon! Currently only Wisdom Warfare is available.`);
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    setTopPlayersLoading(true);
    setTopPlayersError(null);
    try {
      const res = await fetch(`${API_BASE}/leaderboard?limit=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTopPlayers(data);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setTopPlayersError(err.message || String(err));
    } finally {
      setTopPlayersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showTopPlayersModal) {
      fetchLeaderboard();
    }
  }, [showTopPlayersModal, fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 flex flex-col items-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-cyan-400 mb-4 glow-text">
          ⚔ WISDOM WARFARE
        </h1>
        <p className="text-xl text-cyan-200">Interactive Compiler Design Learning</p>
        {user && (
          <div className="mt-4 p-3 bg-cyan-900 rounded-lg inline-block">
            <p className="text-cyan-100">Welcome, <span className="font-bold">{user.display_name}</span></p>
            <p className="text-cyan-200 text-sm">{user.email}</p>
            {!playCheckLoading && !canPlay && (
              <p className="text-red-300 text-sm mt-2 font-bold">
                🚫 You have already played the game
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mb-8">
        <button
          onClick={() => setShowTopPlayersModal(true)}
          className="px-8 py-4 rounded-full bg-cyan-700 hover:bg-cyan-600 border-2 border-cyan-500 text-cyan-100 font-bold text-lg transition-all hover-lift"
        >
          🏆 View Global Leaderboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
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
            canPlay={canPlay}
          />
        ))}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-8 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold"
      >
        📊 View My Dashboard
      </button>

      <button
        onClick={onLogout}
        className="mt-12 bg-red-600 hover:bg-red-500 px-8 py-4 rounded-lg text-white font-bold text-lg transition-colors"
      >
        🚪 Logout
      </button>

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
          onRetry={fetchLeaderboard}
        />
      )}
    </div>
  );
}

export default GamePage;