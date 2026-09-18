import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "masry-2afaf",
  appId: "1:653754423660:web:ab4294679fd2652f63bb49",
  apiKey: "AIzaSyDV3SQNioy-FZScm3GrWOMWf9FX3PeYnw8",
  authDomain: "masry-2afaf.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ai-studio-exceldataexplore-e80f65f7-6207-4199-ad9d-479a0224b28c');

async function seed() {
  const usersStr = fs.readFileSync('users.json', 'utf8');
  const users = JSON.parse(usersStr);
  const usersCol = collection(db, 'users');
  
  const existingDocs = await getDocs(usersCol);
  if (existingDocs.empty) {
    for (const u of users) {
      await addDoc(usersCol, u);
      console.log('Added user', u.username);
    }
  } else {
    console.log('Users already seeded');
  }
}
seed().catch(console.error).then(() => process.exit(0));
