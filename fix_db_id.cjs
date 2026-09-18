const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

// If the database is in Datastore mode on default, we must use the specific databaseId we created.
// In the setup output, it mentioned: The user's firestore db is ai-studio-exceldataexplore-e80f65f7-6207-4199-ad9d-479a0224b28c
// But in the original creation, we passed it in the config but getFirestore needs it if it's not default.

code = code.replace(/export const db = getFirestore\(app\);/, "export const db = getFirestore(app, 'ai-studio-exceldataexplore-e80f65f7-6207-4199-ad9d-479a0224b28c');");

fs.writeFileSync('src/lib/firebase.ts', code);
