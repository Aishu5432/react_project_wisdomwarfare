// src/WelcomePage.js
import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebaseConfig"; // 👈 corrected import (case-sensitive)

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

export default function WelcomePage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleGoogleSignIn = async (role = "student") => {
    setErr("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");

      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      if (!fbUser) throw new Error("Firebase did not return a user");

      const idToken = await fbUser.getIdToken();

      const payload = {
        uid: fbUser.uid,
        email: fbUser.email || "",
        display_name: fbUser.displayName || null,
        id_token: idToken,
        provider: "google",
        role,
      };

      // Default user object based on Firebase (will be used if backend fails)
      const userObj = {
        user_id: null,
        uid: fbUser.uid,
        email: fbUser.email || "",
        display_name:
          fbUser.displayName || fbUser.email || "Anonymous",
      };

      // Attempt to upsert on backend, but don't fail sign-in if backend is down
      try {
        const res = await fetch(`${API_BASE}/auth/upsert-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Try to parse JSON safely
        let data = null;
        try {
          data = await res.json();
        } catch (jsonErr) {
          // server returned no/invalid JSON
          console.warn("Upsert: server didn't return JSON", jsonErr);
        }

        if (res.ok) {
          // Merge backend returned values (if present)
          userObj.user_id = data?.user_id || data?.user?.user_id || userObj.user_id;
          userObj.display_name =
            userObj.display_name ||
            data?.display_name ||
            data?.user?.display_name ||
            userObj.email ||
            "Anonymous";
        } else {
          // Server responded with an error status; log and continue with local userObj
          console.warn("Upsert failed:", data || `HTTP ${res.status}`);
        }
      } catch (networkErr) {
        // Network error / backend unreachable — continue with local userObj
        console.warn("Upsert request failed (network/backend):", networkErr);
      }

      // Persist minimal data locally and call parent
      localStorage.setItem("user_id", userObj.user_id);
      localStorage.setItem("display_name", userObj.display_name);

      if (typeof onLogin === "function") onLogin(userObj, role);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErr(error.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Welcome — Sign in</h2>

        {err && <div className="mb-4 text-red-400">❌ {err}</div>}

        <button
          onClick={() => handleGoogleSignIn("student")}
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded mb-3"
        >
          {loading ? "Signing in..." : "Sign in with Google (Student)"}
        </button>

        <button
          onClick={() => handleGoogleSignIn("teacher")}
          disabled={loading}
          className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3 rounded"
        >
          {loading ? "Signing in..." : "Sign in with Google (Teacher)"}
        </button>

        <p className="text-sm text-gray-400 mt-4">
          Make sure Firebase Google sign-in is enabled and your web origin (
          <code>http://localhost:3000</code>) is allowed in Google Cloud OAuth
          client.
        </p>
      </div>
    </div>
  );
}
