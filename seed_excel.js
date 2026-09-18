import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "masry-2afaf",
  appId: "1:653754423660:web:ab4294679fd2652f63bb49",
  apiKey: "AIzaSyDV3SQNioy-FZScm3GrWOMWf9FX3PeYnw8",
  authDomain: "masry-2afaf.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ai-studio-exceldataexplore-e80f65f7-6207-4199-ad9d-479a0224b28c');

async function seed() {
  const fileBuffer = fs.readFileSync('public/data.xlsx');
  
  // Convert to base64
  const base64String = fileBuffer.toString('base64');
  
  await setDoc(doc(db, 'files', 'data_xlsx'), { content: base64String });
  console.log('Saved initial excel file to Firestore successfully');
}
seed().catch(console.error).then(() => process.exit(0));
