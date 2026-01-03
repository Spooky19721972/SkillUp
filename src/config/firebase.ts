import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAFHTmbJNaRWIlx2gIvEixWtmFSKCxSByM",
  authDomain: "skillup-cc757.firebaseapp.com",
  projectId: "skillup-cc757",
  storageBucket: "skillup-cc757.appspot.com",
  messagingSenderId: "740566688124",
  appId: "1:740566688124:web:6d22fdf87dda657c1504f9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (persistence automatique avec AsyncStorage dans React Native)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
