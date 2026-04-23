import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyD9r6skNBaogFAnXxNWt87fcT1tj2DX9NU",
  authDomain: "smart-crack-cf53e.firebaseapp.com",
  projectId: "smart-crack-cf53e",
  storageBucket: "smart-crack-cf53e.firebasestorage.app",
  messagingSenderId: "431491859949",
  appId: "1:431491859949:web:3f6ce1715f5d8d83bd53e4",
  measurementId: "G-T0JJ2ML6KH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
