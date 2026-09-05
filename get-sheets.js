const XLSX = require('xlsx');
const workbook = XLSX.readFile('public/دار القلم ١٤٤٧.xlsx');
console.log(workbook.SheetNames);
