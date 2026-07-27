const XLSX = require('xlsx');

const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';
const wb = XLSX.readFile(filename, { cellDates: true });

wb.SheetNames.forEach(name => {
  console.log('========================================');
  console.log('SHEET:', name);
  const sheet = wb.Sheets[name];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (json.length > 0) {
    // Find header row (usually row 0 or row 1)
    json.slice(0, 5).forEach((row, rIdx) => {
      console.log(`Header Row candidate ${rIdx}:`, row.slice(0, 30));
    });
  }
});
