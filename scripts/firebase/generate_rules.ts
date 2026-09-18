import fs from 'fs';
const blueprint = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
`;

fs.writeFileSync('firestore.rules', rules);
console.log("Rules generated.");
