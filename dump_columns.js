const XLSX = require('xlsx');

const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';
const wb = XLSX.readFile(filename);

wb.SheetNames.forEach(name => {
  console.log('\n========================================');
  console.log('SHEET:', name);
  const sheet = wb.Sheets[name];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (json.length > 0) {
    const headers = json[0];
    headers.forEach((h, colIdx) => {
      if (h !== undefined && h !== null && h !== '') {
        console.log(`Col ${colIdx}: "${h}"`);
      }
    });
    console.log(`Total Rows in sheet: ${json.length - 1}`);
  }
});
