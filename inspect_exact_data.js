const XLSX = require('xlsx');
const fs = require('fs');

const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';
console.log('Inspecting exact Excel sheet contents...');

const wb = XLSX.readFile(filename, { cellDates: true, sheetRows: 100 });

wb.SheetNames.forEach(sheetName => {
  console.log('\n========================================');
  console.log('SHEET:', sheetName);
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet);
  console.log(`Data rows in sheet "${sheetName}":`, json.length);

  const maTrams = json.map(r => r['Mã trạm'] || r['Mã Trạm'] || r['mã trạm']).filter(Boolean);
  console.log('Unique station codes:', new Set(maTrams).size);
  console.log('Sample station codes:', maTrams.slice(0, 5));

  // Count 3P vs 1P vs EVN
  let evn3P = 0;
  let vnpt1P = 0;

  json.forEach(r => {
    const pa = String(r['PA Điện'] || r['PA Điện'] || r['Phương án điện'] || '').trim();
    const evnCol = r['Điện Lực'];
    const vnptCol = r['Điện VNPT'];
    
    if (evnCol && String(evnCol).toLowerCase() === 'x') evn3P++;
    else if (vnptCol && String(vnptCol).toLowerCase() === 'x') vnpt1P++;
    else if (pa.includes('3P') || pa.includes('3 pha')) evn3P++;
    else if (pa.includes('1P') || pa.includes('1 pha')) vnpt1P++;
  });

  console.log(`EVN 3P marked 'x' or 3P: ${evn3P}`);
  console.log(`VNPT marked 'x' or 1P: ${vnpt1P}`);
});
