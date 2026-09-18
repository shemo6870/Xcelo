const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix handleAddUser
code = code.replace(/const res = await fetch\('\/api\/users', \{\s*method: 'POST',[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?username: addUsername,[\s\S]*?password: addPassword,[\s\S]*?role: 'user',[\s\S]*?complex: addComplex[\s\S]*?\}\)\s*\}\);\s*const data = await res\.json\(\);/g, `const data = await addUser(addUsername, addPassword, 'user', addComplex);
      const res = { ok: data.success };`);

// Fix handleEditUser
code = code.replace(/const res = await fetch\('\/api\/users', \{\s*method: 'PUT',[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?oldUsername: editingUser\.username,[\s\S]*?newUsername: editUsername,[\s\S]*?newPassword: editPassword,[\s\S]*?newComplex: editComplex[\s\S]*?\}\)\s*\}\);\s*const data = await res\.json\(\);/g, `const data = await updateUser(editingUser.username, editUsername, editPassword, editComplex);
      const res = { ok: data.success };`);

fs.writeFileSync('src/App.tsx', code);
