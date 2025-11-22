
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * TODO: To make the app ONLINE, replace the values below with your actual Firebase Project keys.
 * 1. Go to console.firebase.google.com
 * 2. Create a project -> Add Web App
 * 3. Copy the config object
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Check if the user has actually configured it, or if it's still using placeholders
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

let app;
let auth;
let db;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ Firebase Connected");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.log("⚠️ Firebase not configured. Using Offline Mode (LocalStorage).");
}

export { auth, db };
