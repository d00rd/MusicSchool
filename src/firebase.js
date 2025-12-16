// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCCJsU_sxmMwIKy0MEb-WOgFPgp2JT425Q",
  authDomain: "musicschool-ca81f.firebaseapp.com",
  projectId: "musicschool-ca81f",
  storageBucket: "musicschool-ca81f.firebasestorage.app",
  messagingSenderId: "517348260980",
  appId: "1:517348260980:web:6825a0498a4b60d9b6a521",
  measurementId: "G-TM7Q1P0KZ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);