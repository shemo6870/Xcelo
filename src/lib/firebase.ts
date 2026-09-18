import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "masry-2afaf",
  appId: "1:653754423660:web:ab4294679fd2652f63bb49",
  apiKey: "AIzaSyDV3SQNioy-FZScm3GrWOMWf9FX3PeYnw8",
  authDomain: "masry-2afaf.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-exceldataexplore-e80f65f7-6207-4199-ad9d-479a0224b28c",
  storageBucket: "masry-2afaf.appspot.com",
  messagingSenderId: "653754423660",
  measurementId: "",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'ai-studio-exceldataexplore-e80f65f7-6207-4199-ad9d-479a0224b28c');
