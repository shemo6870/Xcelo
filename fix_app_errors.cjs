const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/saveRes\.status/g, '400');
code = code.replace(/res\.ok = res\.success;/g, '');
code = code.replace(/if \(res\.ok\)/g, 'if (res.success)');

fs.writeFileSync('src/App.tsx', code);
