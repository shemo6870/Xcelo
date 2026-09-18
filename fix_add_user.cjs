const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/const res = await fetch\('\/api\/users', \{[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?username: addUsername,[\s\S]*?password: addPassword,[\s\S]*?role: 'user',[\s\S]*?complex: addComplex[\s\S]*?\}\)[\s\S]*?\}\);/g, `const res = await addUser(addUsername, addPassword, 'user', addComplex);
      const data = res;
      res.ok = res.success;`);
fs.writeFileSync('src/App.tsx', code);
