const XLSX = require('xlsx');

const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';
console.log('Reading workbook headers...');
const wb = XLSX.readFile(filename, { sheetRows: 20 });
console.log('Sheet Names:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  console.log('\n--- SHEET:', name, '---');
  const sheet = wb.Sheets[name];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  json.slice(0, 8).forEach((row, i) => {
    console.log(`[Row ${i}]`, row.filter(x => x !== undefined && x !== null && x !== '').slice(0, 10));
  });
});
