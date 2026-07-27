const XLSX = require('xlsx');

const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';
console.log('Auditing Column "Lắp điện" across all sheets...');

const wb = XLSX.readFile(filename, { cellDates: true, sheetRows: 100 });

['46 +1 điểm', '28 điểm'].forEach(sheetName => {
  console.log('\n========================================');
  console.log('SHEET:', sheetName);
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet);

  json.forEach((row, idx) => {
    const maTram = row['Mã trạm'] || row['Mã Trạm'];
    if (!maTram) return;

    const lapDienVal = String(row['Lắp điện'] || row['Lắp Điện'] || '').trim();
    const vuongMacVal = String(row['Lý do chưa triển khai lắp điện'] || row['Vướng mắc'] || row['Ghi Chú'] || '').trim();

    if (lapDienVal || maTram === 'V.E.PTH13651') {
      console.log(`[${sheetName}] Row ${idx + 1} | ${maTram} | Lắp điện: "${lapDienVal}" | Vướng mắc: "${vuongMacVal}"`);
    }
  });
});
