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

function HomeLanding({ user, role, onLogout }) {
  const navigate = useNavigate();

  const getDisplayName = (u) => {
    if (!u) return "User";
    return u.display_name || u.displayName || u.username || u.email || "User";
  };

  if (!user || !role) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl mb-2">Welcome, {getDisplayName(user)}!</h1>
      <p className="mb-6">{user?.email || ""}</p>
      <div className="flex gap-4">
        <button
          onClick={() => {
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
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setGameStarted(false);
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    navigate("/", { replace: true });
  };

  const handleLogin = (userObj, roleStr) => {
    setUser(userObj);
    setRole(roleStr);
    if (userObj.user_id) {
      localStorage.setItem("user_id", userObj.user_id);
      localStorage.setItem("user_email", userObj.email);
      localStorage.setItem("user_role", roleStr);
    }
    navigate("/home", { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user || !role ? (
            <WelcomePage onLogin={handleLogin} />
          ) : (
            <Navigate to="/home" replace />
          )
        }
      />

      <Route
        path="/home"
        element={<HomeLanding user={user} role={role} onLogout={handleLogout} />}
      />

      <Route
        path="/gamepage"
        element={
          <GamePage
            user={user}
            onStartGame={() => {
              setGameStarted(true);
              navigate("/play");
            }}
            onLogout={handleLogout}
          />
        }
      />

      <Route
        path="/play"
        element={
          gameStarted ? (
            <GameUI
              user={user}
              onLogout={handleLogout}
              onFinish={() => {
                setGameStarted(false);
                navigate("/gamepage", { replace: true });
              }}
            />
          ) : (
            <Navigate to="/gamepage" replace />
          )
        }
      />

      <Route path="/dashboard" element={<StudentDashboard />} />
      
      <Route path="/teacher-game-management" element={<TeacherGameManagementPage />} />

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