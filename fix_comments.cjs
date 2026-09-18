const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The replacement was exact: "setAllUsers(data);" instead of "//"
// But sometimes there is a space after "//" so it became "setAllUsers(data); "
// A comment was typically `// text` -> `setAllUsers(data); text`
// Also `http://` became `http:setAllUsers(data);`
code = code.replace(/setAllUsers\(data\);/g, '//');

// Now we need to manually add back `setAllUsers(data);` in `fetchUsers`
code = code.replace(/const data = await getUsers\(\);\s*\/\/\s*/g, `const data = await getUsers();\n      setAllUsers(data);\n      `);

fs.writeFileSync('src/App.tsx', code);
