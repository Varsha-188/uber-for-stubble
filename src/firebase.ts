import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDc_kqhuHmp6o_sow6ZPF-b7z-qped-G8A",
  authDomain: "uber-for-stubble.firebaseapp.com",
  databaseURL: "https://uber-for-stubble-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "uber-for-stubble",
  storageBucket: "uber-for-stubble.appspot.com",
  messagingSenderId: "1083807028868",
  appId: "1:1083807028868:web:3521852a5f404beab414d1",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

