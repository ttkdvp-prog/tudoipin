const XLSX = require('xlsx');

const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';
const wb = XLSX.readFile(filename, { cellDates: true, sheetRows: 100 });

['46 +1 điểm', '28 điểm'].forEach(sheetName => {
  console.log('==================================================');
  console.log('SHEET:', sheetName);
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet);

  let evn3P = 0;
  let vnpt1P = 0;
  let hasNoteCount = 0;

  json.forEach((row, idx) => {
    const maTram = row['Mã trạm'] || row['Mã Trạm'];
    if (!maTram) return;

    const isEvn = Boolean(row['Điện Lực'] && String(row['Điện Lực']).trim().toLowerCase() === 'x');
    const isVnpt = Boolean(row['Điện VNPT'] && String(row['Điện VNPT']).trim().toLowerCase() === 'x');

    if (isEvn) evn3P++;
    else if (isVnpt) vnpt1P++;

    const note = String(row['Lý do chưa triển khai lắp điện'] || row['Vướng mắc'] || row['Ghi Chú'] || '').trim();
    if (note.length > 0) {
      hasNoteCount++;
      console.log(`[${sheetName}] Row ${idx + 1} | ${maTram} | Note: "${note}"`);
    }
  });

  console.log(`SUMMARY ${sheetName}: Total=${json.length}, EVN 3P=${evn3P}, VNPT 1P=${vnpt1P}, Has Note=${hasNoteCount}\n`);
});
