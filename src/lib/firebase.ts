
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Add if you need Firestore later
// import { getStorage } from "firebase/storage"; // Add if you need Storage later
// import { getAnalytics } from "firebase/analytics"; // Add if you need Analytics later

// Check if essential Firebase config values are present
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error(
    "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing. " +
    "Please check your .env.local file in the project root, " +
    "ensure the variable is set correctly with the NEXT_PUBLIC_ prefix, " +
    "and that you have RESTARTED your development server after making changes to .env.local."
  );
}
if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  console.warn(
    "Firebase Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) is missing. " +
    "Please check your .env.local file."
  );
}
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.warn(
    "Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is missing. " +
    "Please check your .env.local file."
  );
}


const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app); // Uncomment if you use Firestore
// const storage = getStorage(app); // Uncomment if you use Storage

// Initialize Analytics only if measurementId is available and in a browser environment
// const analytics = typeof window !== 'undefined' && firebaseConfig.measurementId ? getAnalytics(app) : undefined;

export { app, auth, db /*, storage, analytics */ };

