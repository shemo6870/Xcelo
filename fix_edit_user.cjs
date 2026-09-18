const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/const res = await fetch\('\/api\/users', \{[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?oldUsername,[\s\S]*?newUsername: editUserForm\.username,[\s\S]*?newPassword: editUserForm\.password,[\s\S]*?newComplex: editUserForm\.complex[\s\S]*?\}\)[\s\S]*?\}\);/g, `const res = await updateUser(oldUsername, editUserForm.username, editUserForm.password, editUserForm.complex);
      const data = res;
      res.ok = res.success;`);
fs.writeFileSync('src/App.tsx', code);
