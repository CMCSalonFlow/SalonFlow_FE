import { getApp, getApps, initializeApp } from "firebase/app";

export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBInB6Ux1Cxsuavz0mc-gHpc2zKhSQ3zbU",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "salonflow-a669d.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "salonflow-a669d",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "salonflow-a669d.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "674592135028",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:674592135028:web:7b3376a582bfe289637e21",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YYTSP4NZXX"
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
