const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
if (!appContent.includes("import { getUsers, loginUser, addUser, updateUser, deleteUser, saveExcelToFirestore, loadExcelFromFirestore }")) {
  appContent = appContent.replace("import React,", "import { getUsers, loginUser, addUser, updateUser, deleteUser, saveExcelToFirestore, loadExcelFromFirestore } from './lib/api';\nimport React,");
}

// 1. replace load/fetch Excel: 
// The original code has: const response = await fetch('/data.xlsx');
// We need to load from Firestore, and if it fails or is null, fallback to fetch.
// We'll replace `const response = await fetch('/data.xlsx'); const arrayBuffer = await response.arrayBuffer();`
const loadExcelRegex = /const response = await fetch\('\/data\.xlsx'\);\s*const arrayBuffer = await response\.arrayBuffer\(\);/g;
appContent = appContent.replace(loadExcelRegex, `
      let arrayBuffer = await loadExcelFromFirestore();
      if (!arrayBuffer) {
        const response = await fetch('/data.xlsx');
        arrayBuffer = await response.arrayBuffer();
      }
`);

// 2. replace save Excel:
const saveExcelRegex = /const saveRes = await fetch\('\/api\/save-excel', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/octet-stream' \},\s*body: outBuffer\s*\}\);\s*const saveResult = await saveRes\.json\(\);/g;
appContent = appContent.replace(saveExcelRegex, `
        const saveResult = await saveExcelToFirestore(outBuffer);
`);

// 3. replace login
const loginRegex = /const res = await fetch\('\/api\/login', \{[\s\S]*?body: JSON\.stringify\(\{ username: loginUsername, password: loginPassword \}\)\s*\}\);\s*const data = await res\.json\(\);\s*if \(res\.ok\) \{/g;
appContent = appContent.replace(loginRegex, `
      const data = await loginUser(loginUsername, loginPassword);
      if (data.success) {
`);

// 4. replace fetchUsers
const fetchUsersRegex = /const res = await fetch\('\/api\/users'\);\s*const data = await res\.json\(\);\s*setUsers\(data\);/g;
appContent = appContent.replace(fetchUsersRegex, `
      const data = await getUsers();
      setUsers(data);
`);

// 5. replace deleteUser
const deleteUserRegex = /const res = await fetch\(`\/api\/users\/\$\{username\}`,\s*\{\s*method: 'DELETE'\s*\}\);/g;
appContent = appContent.replace(deleteUserRegex, `
      const res = await deleteUser(username);
      if (res.success) { // mock res.ok 
        res.ok = true;
      }
`);

// 6. replace addUser
const addUserRegex = /const res = await fetch\('\/api\/users', \{[\s\S]*?body: JSON\.stringify\(\{ username: newUsername, password: newPassword, role: newRole, complex: newComplex \}\)\s*\}\);\s*const data = await res\.json\(\);/g;
appContent = appContent.replace(addUserRegex, `
      const data = await addUser(newUsername, newPassword, newRole, newComplex);
      const res = { ok: data.success };
`);

// 7. replace updateUser
const updateUserRegex = /const res = await fetch\('\/api\/users', \{[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?oldUsername: editingUser\.username,[\s\S]*?newUsername: editUsername,[\s\S]*?newPassword: editPassword,[\s\S]*?newComplex: editComplex[\s\S]*?\}\)\s*\}\);\s*const data = await res\.json\(\);/g;
appContent = appContent.replace(updateUserRegex, `
      const data = await updateUser(editingUser.username, editUsername, editPassword, editComplex);
      const res = { ok: data.success };
`);


fs.writeFileSync('src/App.tsx', appContent);
console.log('App.tsx patched successfully');
