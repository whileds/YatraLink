// import { initializeApp } from "firebase/app";
// import { getAuth, RecaptchaVerifier } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// // 🔴 Replace these with your Firebase project keys
// const firebaseConfig = {
//   apiKey: "AIzaSyDwPVtjz2x1ALKx1lvE41ml-Y6EZwTxTJg",
//   authDomain: "yatralink-96d2e.firebaseapp.com",
//   projectId: "yatralink-96d2e",
//   storageBucket: "yatralink-96d2e.firebasestorage.app",
//   messagingSenderId: "88614308278",
//   appId: "1:88614308278:web:e8cb95c4c892e494231917"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Firebase services
// export const auth = getAuth(app);
// export const db = getFirestore(app);

// // Recaptcha setup for Phone Auth
// export const setupRecaptcha = (containerId = "recaptcha-container") => {
//   if (!window.recaptchaVerifier) {
//     window.recaptchaVerifier = new RecaptchaVerifier(
//       containerId,
//       { size: "invisible" },
//       auth
//     );
//   }
//   return window.recaptchaVerifier;
// };
// frontend/lib/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwPVtjz2x1ALKx1lvE41ml-Y6EZwTxTJg",
  authDomain: "yatralink-96d2e.firebaseapp.com",
  projectId: "yatralink-96d2e",
  storageBucket: "yatralink-96d2e.firebasestorage.app",
  messagingSenderId: "88614308278",
  appId: "1:88614308278:web:e8cb95c4c892e494231917"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);