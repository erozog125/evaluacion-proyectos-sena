// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcJetAkdddNAXj5pZ1KqkIyEoalflLb_8",
  authDomain: "evaluacion-proyectos.firebaseapp.com",
  projectId: "evaluacion-proyectos",
  storageBucket: "evaluacion-proyectos.firebasestorage.app",
  messagingSenderId: "305225646709",
  appId: "1:305225646709:web:53d2a5e154dd283d6d2e3c",
  measurementId: "G-03YQN500E6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
