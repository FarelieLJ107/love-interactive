import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID
};

let db: Firestore | null = null;
let isFirebaseEnabled = false;

if (firebaseConfig.projectId && firebaseConfig.apiKey) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    isFirebaseEnabled = true;
    console.log("Firebase & Firestore initialized successfully! 🎉");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.warn(
    "Firebase environment variables are missing. App will fallback to localStorage for persistence. Configure VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY in your settings to sync Jurnal Cinta to the Cloud! ☁️"
  );
}

export { db, isFirebaseEnabled };
