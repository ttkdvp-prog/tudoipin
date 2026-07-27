const XLSX = require('xlsx');
const fs = require('fs');

console.log('Reading workbook with sheetRows limit...');
const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';

// Read workbook structure fast
const wb = XLSX.readFile(filename, { cellDates: true, dense: true });

console.log('SheetNames:', wb.SheetNames);

const result = {};

wb.SheetNames.forEach(name => {
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Sheet "${name}": ${rows.length} rows`);
  
  if (rows.length > 0) {
    result[name] = {
      header: rows[0],
      rowCount: rows.length - 1,
      sampleRows: rows.slice(1, 6)
    };
  }
});

fs.writeFileSync('excel_structure.json', JSON.stringify(result, null, 2), 'utf8');
console.log('Saved excel_structure.json!');
