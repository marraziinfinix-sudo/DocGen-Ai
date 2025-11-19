// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDwRksb5NkOQrHTFHWwqBanghNVzd45-dY",
  authDomain: "invquo-478614.firebaseapp.com",
  projectId: "invquo-478614",
  storageBucket: "invquo-478614.firebasestorage.app",
  messagingSenderId: "321084245266",
  appId: "1:321084245266:web:b76085f90a2b9fd6b2dfcb",
  measurementId: "G-C69QZVP2SZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
