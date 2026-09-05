const XLSX = require('xlsx');
const workbook = XLSX.readFile('public/دار القلم ١٤٤٧.xlsx');
const sheet = workbook.Sheets['دليل الملف'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(data.filter(row => row.length > 0).length, "non-empty rows");
console.log(data.filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== "")));
