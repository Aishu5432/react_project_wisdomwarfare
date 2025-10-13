// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import WelcomePage from "./WelcomePage";
import GamePage from "./GamePage";
import TeacherGameManagementPage from "./TeacherGameManagementPage";
import GameUI from "./components/GameUI/GameUI";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import "./App.css";

/**
 * Small helper component shown after login that displays the "Continue" / "Logout"
 * UI and sends students to /gamepage and teachers to teacher management.
 */
function HomeLanding({ user, role, onLogout }) {
  const navigate = useNavigate();

  const getDisplayName = (u) => {
    if (!u) return "User";
    return u.display_name || u.displayName || u.username || u.email || "User";
  };

  if (!user || !role) {
    // If someone hits /home without being logged in, redirect them back.
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl mb-2">Welcome, {getDisplayName(user)}!</h1>
      <p className="mb-6">{user?.email || ""}</p>
      <div className="flex gap-4">
        <button
          onClick={() => {
            // Teacher -> teacher page, Student -> GamePage
            if (role === "teacher") navigate("/teacher-game-management");
            else navigate("/gamepage");
          }}
          className={`px-6 py-3 rounded-lg ${
            role === "teacher"
              ? "bg-rose-600 hover:bg-rose-500"
              : "bg-cyan-600 hover:bg-cyan-500"
          }`}
        >
          Continue
        </button>
        <button
          onClick={() => {
            onLogout();
            navigate("/", { replace: true });
          }}
          className="px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function AppRouterContainer() {
  // keep user state in the top-level container so routes can share it
  const [user, setUser] = useState(null); // { user_id, uid, email, display_name, displayName }
  const [role, setRole] = useState(null); // "teacher" | "student"
  const [gameStarted, setGameStarted] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setGameStarted(false);
    // send user to welcome page
    navigate("/", { replace: true });
  };

  return (
    <Routes>
      {/* Welcome: login component */}
      <Route
        path="/"
        element={
          !user || !role ? (
            <WelcomePage
              onLogin={(userObj, roleStr) => {
                setUser(userObj);
                setRole(roleStr);
                // after successful login navigate to landing page
                navigate("/home", { replace: true });
              }}
            />
          ) : (
            // if already logged in, go to post-login landing
            <Navigate to="/home" replace />
          )
        }
      />

      {/* Post-login landing (Continue / Logout) */}
      <Route
        path="/home"
        element={<HomeLanding user={user} role={role} onLogout={handleLogout} />}
      />

      {/* Game page: shows join/start UI for students */}
      <Route
        path="/gamepage"
        element={
          <GamePage
            user={user}
            onStartGame={() => {
              setGameStarted(true);
              // navigate to the play route where GameUI lives
              navigate("/play");
            }}
            onLogout={handleLogout}
          />
        }
      />

      {/* Play route where the live GameUI mounts */}
      <Route
        path="/play"
        element={
          // protect this route lightly: redirect to /gamepage if not started
          gameStarted ? (
            <GameUI
              user={user}
              onLogout={handleLogout}
              onFinish={() => {
                // when GameUI finishes, go back to GamePage and reset state
                setGameStarted(false);
                navigate("/gamepage", { replace: true });
              }}
            />
          ) : (
            <Navigate to="/gamepage" replace />
          )
        }
      />

      {/* Dashboard & Teacher routes */}
      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/teacher-game-management" element={<TeacherGameManagementPage />} />

      {/* Fallback 404 */}
      <Route
        path="*"
        element={
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <a href="/" className="text-cyan-400 underline">
              Go back to Welcome
            </a>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRouterContainer />
    </Router>
  );
}

export default App;
