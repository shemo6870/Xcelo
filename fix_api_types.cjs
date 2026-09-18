const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

code = code.replace(/const updateData = \{\};/g, 'const updateData: any = {};');
code = code.replace(/export const loginUser = async \(username, password\) => \{/g, 'export const loginUser = async (username: string, password: string): Promise<any> => {');
code = code.replace(/export const addUser = async \(username, password, role, complex\) => \{/g, 'export const addUser = async (username: string, password: string, role: string, complex: string): Promise<any> => {');
code = code.replace(/export const updateUser = async \(oldUsername, newUsername, newPassword, newComplex\) => \{/g, 'export const updateUser = async (oldUsername: string, newUsername?: string, newPassword?: string, newComplex?: string): Promise<any> => {');
code = code.replace(/export const deleteUser = async \(username\) => \{/g, 'export const deleteUser = async (username: string): Promise<any> => {');
code = code.replace(/export const saveExcelToFirestore = async \(arrayBuffer\) => \{/g, 'export const saveExcelToFirestore = async (arrayBuffer: ArrayBuffer): Promise<any> => {');

fs.writeFileSync('src/lib/api.ts', code);
