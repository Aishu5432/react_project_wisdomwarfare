// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Optional: analytics (safe to skip in dev)
import { getAnalytics } from "firebase/analytics";

// 🔑 Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5olknMuO1mdZJ_25S96UXLEjtGuhj-WU",
  authDomain: "gamified-learning-89fa5.firebaseapp.com",
  projectId: "gamified-learning-89fa5",
  storageBucket: "gamified-learning-89fa5.appspot.com",
  messagingSenderId: "372047414058",
  appId: "1:372047414058:web:f9195649866927daa71453",
  measurementId: "G-Z233GF05ZC",
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Optional: analytics (only works in browsers w/ analytics enabled)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (err) {
  console.warn("Analytics not available in this environment:", err.message);
}

// ✅ Export so other files can import
export { app, auth, db, googleProvider, analytics };