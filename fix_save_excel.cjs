const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const saveRes = await fetch\('\/api\/save-excel', \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/octet-stream' \},\s*body: outBuffer\s*\}\);\s*if \(saveRes\.ok\) \{/g;

code = code.replace(regex, `const saveRes = await saveExcelToFirestore(outBuffer);
        if (saveRes.success) {`);

fs.writeFileSync('src/App.tsx', code);
