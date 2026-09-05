const XLSX = require('xlsx');
const workbook = XLSX.readFile('public/دار القلم ١٤٤٧.xlsx');
console.log("Sheet names:", workbook.SheetNames);
const sheet = workbook.Sheets['دليل الملف'];
if (sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log("دليل الملف length:", data.length);
    if (data.length > 0) {
        console.log(data.slice(0, 5));
    }
}
const sheet2 = workbook.Sheets['الوصف الوظيفي'];
if (sheet2) {
    console.log("Found الوصف الوظيفي!");
} else {
    console.log("No الوصف الوظيفي");
}
