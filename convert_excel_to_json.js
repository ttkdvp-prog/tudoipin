const XLSX = require('xlsx');
const fs = require('fs');

console.log('Reading Excel file with row limits...');
const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';

const wb = XLSX.readFile(filename, { sheetRows: 100, cellDates: true });

const targetSheets = ['46 +1 điểm', '28 điểm'];
const allStations = [];

targetSheets.forEach(sheetName => {
  if (!wb.Sheets[sheetName]) return;
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (json.length < 2) return;

  const headers = json[0].map(c => String(c || '').trim());
  console.log(`Sheet "${sheetName}": ${json.length - 1} data rows`);

  for (let r = 1; r < json.length; r++) {
    const row = json[r];
    if (!row || row.length === 0) continue;

    const rowObj = {};
    headers.forEach((h, colIdx) => {
      if (h) rowObj[h] = row[colIdx];
    });

    const maTram = rowObj['Mã trạm'] || rowObj['Mã Trạm'] || rowObj['mã trạm'];
    if (!maTram || String(maTram).trim() === '') continue;

    let dot = rowObj['Đợt'] || rowObj['đợt'] || '';
    if (!dot) {
      if (sheetName.includes('46')) dot = 'Đợt 1';
      else if (sheetName.includes('28')) dot = 'Đợt 2';
    }

    const lyDoVuongMac = String(rowObj['Lý do chưa triển khai lắp điện'] || rowObj['Vướng mắc'] || rowObj['Ghi Chú'] || '').trim();

    // Determine status of Installation and Power Connection
    // Let's analyze common strings in lyDoVuongMac:
    // e.g. "Đã gửi toàn bộ giấy tờ...", "Đã khảo sát xong...", "Điện lực đã khảo sát...", "hồ sơ gửi VGREEN..."
    let statusLapDat = 'Chưa lắp đặt';
    let statusDienLuc = 'Chưa làm thủ tục';

    if (lyDoVuongMac.toLowerCase().includes('đã hoàn thành') || lyDoVuongMac.toLowerCase().includes('đã lắp') || lyDoVuongMac.toLowerCase().includes('xong')) {
      statusLapDat = 'Đã hoàn thành';
    } else if (lyDoVuongMac.toLowerCase().includes('đang') || lyDoVuongMac.toLowerCase().includes('khảo sát')) {
      statusLapDat = 'Đang triển khai';
    }

    if (lyDoVuongMac.toLowerCase().includes('đã đóng điện') || lyDoVuongMac.toLowerCase().includes('nghiệm thu')) {
      statusDienLuc = 'Đã đóng điện';
    } else if (lyDoVuongMac.toLowerCase().includes('đã gửi') || lyDoVuongMac.toLowerCase().includes('khảo sát') || lyDoVuongMac.toLowerCase().includes('hợp đồng') || lyDoVuongMac.toLowerCase().includes('hồ sơ')) {
      statusDienLuc = 'Chờ Điện lực xử lý/HĐ';
    } else if (lyDoVuongMac.toLowerCase().includes('vương') || lyDoVuongMac.toLowerCase().includes('vướng') || lyDoVuongMac.toLowerCase().includes('chưa nhận')) {
      statusDienLuc = 'Có vướng mắc';
    }

    allStations.push({
      id: String(maTram).trim(),
      sheetSource: sheetName,
      stt: rowObj['STT'] || rowObj['Stt'] || r,
      dot: String(dot).trim(),
      ma_tram: String(maTram).trim(),
      to_ht: String(rowObj['Tổ HT'] || rowObj['Tổ hạ tầng'] || '').trim(),
      to_truong: String(rowObj['Tổ trưởng'] || '').trim(),
      sdt: String(rowObj['SĐT tổ trưởng'] || rowObj['SĐT'] || '').trim(),
      dia_ban: String(rowObj['Địa bàn'] || '').trim(),
      ten_co_so: String(rowObj['Tên cơ sở nhà đất'] || rowObj['Tên cơ sở'] || '').trim(),
      dia_chi: String(rowObj['Địa chỉ'] || '').trim(),
      phuong_xa: String(rowObj['Phường/Xã mới'] || rowObj['Phường/Xã'] || '').trim(),
      lat: parseFloat(rowObj['LAT'] || rowObj['Lat'] || rowObj['Vĩ độ']) || null,
      lng: parseFloat(rowObj['LONG'] || rowObj['Long'] || rowObj['Kinh độ']) || null,
      pa_dien: String(rowObj['PA Điện'] || rowObj['PA Điện'] || 'Điện EVN 3P').trim(),
      don_vi_phu_trach: rowObj['Điện Lực'] ? 'Điện Lực' : (rowObj['Điện VNPT'] ? 'VNPT' : 'Điện Lực'),
      status_lap_dat: statusLapDat,
      status_dien_luc: statusDienLuc,
      vuong_mac: lyDoVuongMac,
      so_luong_tu: parseInt(rowObj['Số lượng TĐP'] || rowObj['Số lượng tủ đổi pin'] || rowObj['Số lượng tủ'] || 2, 10) || 2,
      loai_tu: String(rowObj['Loại tủ'] || 'TĐP 12 ngăn').trim(),
      so_met_day: parseInt(rowObj['Số mét cáp nguồn'] || rowObj['Số mét dây nguồn'] || 30, 10) || 30
    });
  }
});

console.log(`Parsed total ${allStations.length} stations.`);

if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/initial_data.json', JSON.stringify(allStations, null, 2), 'utf8');
console.log('Saved public/initial_data.json successfully!');
