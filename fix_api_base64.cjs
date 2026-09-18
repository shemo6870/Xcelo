const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// Replace the buggy btoa / atob implementation with a robust one
const replaceSave = `export const saveExcelToFirestore = async (arrayBuffer: ArrayBuffer): Promise<any> => {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64String = btoa(binary);
  
  await setDoc(doc(db, 'files', 'data_xlsx'), { content: base64String });
  return { success: true };
};`;

code = code.replace(/export const saveExcelToFirestore = async \(arrayBuffer: ArrayBuffer\): Promise<any> => \{[\s\S]*?return \{ success: true \};\s*\};/, replaceSave);

fs.writeFileSync('src/lib/api.ts', code);
