const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/alert\(data\.error \|\| 'حدث خطأ أثناء الحذف'\);/g, "alert(res.error || 'حدث خطأ أثناء الحذف');");
fs.writeFileSync('src/App.tsx', code);
