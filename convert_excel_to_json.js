const XLSX = require('xlsx');
const fs = require('fs');

console.log('Generating accurate initial_data.json from Master Sheets...');
const filename = '46+1 điểm TĐP và 28 điểm TĐP.xlsx';

const wb = XLSX.readFile(filename, { cellDates: true, sheetRows: 100 });

// Process ONLY the master sheets: '46 +1 điểm' (Đợt 1) and '28 điểm' (Đợt 2)
const masterSheets = ['46 +1 điểm', '28 điểm'];
const allStations = [];
const seenMaTram = new Set();

masterSheets.forEach(sheetName => {
  if (!wb.Sheets[sheetName]) return;
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet);

  json.forEach((rowObj, idx) => {
    const maTramRaw = rowObj['Mã trạm'] || rowObj['Mã Trạm'] || rowObj['mã trạm'];
    if (!maTramRaw) return;
    const maTram = String(maTramRaw).trim();
    if (!maTram || seenMaTram.has(maTram)) return;
    seenMaTram.add(maTram);

    // Determine batch (Đợt 1 / Đợt 2)
    let dot = String(rowObj['Đợt'] || rowObj['đợt'] || '').trim();
    if (!dot) {
      if (sheetName.includes('46')) dot = 'đợt 1';
      else if (sheetName.includes('28')) dot = 'đợt 2';
    }

    // Determine Power Phase: Check 'Điện Lực' vs 'Điện VNPT' columns
    const isEvn = Boolean(rowObj['Điện Lực'] && String(rowObj['Điện Lực']).trim().toLowerCase() === 'x');
    const isVnpt = Boolean(rowObj['Điện VNPT'] && String(rowObj['Điện VNPT']).trim().toLowerCase() === 'x');

    let paDien = 'Điện EVN 3P';
    let donViPhuTrach = 'Điện Lực';
    let is3Phase = false;

    if (isEvn) {
      paDien = 'Điện EVN 3P';
      donViPhuTrach = 'Điện Lực';
      is3Phase = true;
    } else if (isVnpt) {
      paDien = 'Điện VNPT 1P';
      donViPhuTrach = 'VNPT';
      is3Phase = false;
    } else {
      const paRaw = String(rowObj['PA Điện'] || rowObj['PA Điện'] || '').trim();
      if (paRaw.includes('3P') || paRaw.includes('3 pha')) {
        paDien = 'Điện EVN 3P';
        is3Phase = true;
      } else if (paRaw.includes('1P') || paRaw.includes('1 pha')) {
        paDien = 'Điện VNPT 1P';
        is3Phase = false;
      }
    }

    const lyDoVuongMac = String(rowObj['Lý do chưa triển khai lắp điện'] || rowObj['Vướng mắc'] || rowObj['Ghi Chú'] || '').trim();

    // Determine status
    let statusLapDat = 'Chưa lắp đặt';
    if (lyDoVuongMac.toLowerCase().includes('đã hoàn thành') || lyDoVuongMac.toLowerCase().includes('đã lắp') || lyDoVuongMac.toLowerCase().includes('xong')) {
      statusLapDat = 'Đã hoàn thành';
    } else if (lyDoVuongMac.toLowerCase().includes('đang') || lyDoVuongMac.toLowerCase().includes('khảo sát')) {
      statusLapDat = 'Đang triển khai';
    }

    let statusDienLuc = 'Chưa làm thủ tục';
    if (lyDoVuongMac.toLowerCase().includes('đã đóng điện') || lyDoVuongMac.toLowerCase().includes('nghiệm thu')) {
      statusDienLuc = 'Đã đóng điện';
    } else if (lyDoVuongMac.toLowerCase().includes('đã gửi') || lyDoVuongMac.toLowerCase().includes('khảo sát') || lyDoVuongMac.toLowerCase().includes('hợp đồng') || lyDoVuongMac.toLowerCase().includes('hồ sơ') || lyDoVuongMac.toLowerCase().includes('soạn hđ')) {
      statusDienLuc = 'Chờ Điện lực xử lý/HĐ';
    } else if (lyDoVuongMac.toLowerCase().includes('vướng') || lyDoVuongMac.toLowerCase().includes('chưa nhận')) {
      statusDienLuc = 'Có vướng mắc';
    } else {
      statusDienLuc = 'Chờ Điện lực xử lý/HĐ';
    }

    allStations.push({
      id: maTram,
      sheetSource: sheetName,
      stt: rowObj['STT'] || rowObj['Stt'] || idx + 1,
      dot: dot,
      ma_tram: maTram,
      to_ht: String(rowObj['Tổ HT'] || rowObj['Tổ hạ tầng'] || '').trim(),
      to_truong: String(rowObj['Tổ trưởng'] || '').trim(),
      sdt: String(rowObj['SĐT tổ trưởng'] || rowObj['SĐT'] || '').trim(),
      dia_ban: String(rowObj['Địa bàn'] || '').trim(),
      ten_co_so: String(rowObj['Tên cơ sở nhà đất'] || rowObj['Tên cơ sở'] || '').trim(),
      dia_chi: String(rowObj['Địa chỉ'] || '').trim(),
      phuong_xa: String(rowObj['Phường/Xã mới'] || rowObj['Phường/Xã'] || '').trim(),
      lat: parseFloat(rowObj['LAT'] || rowObj['Lat']) || null,
      lng: parseFloat(rowObj['LONG'] || rowObj['Long']) || null,
      pa_dien: paDien,
      don_vi_phu_trach: donViPhuTrach,
      is_3phase: is3Phase,
      status_lap_dat: statusLapDat,
      status_dien_luc: statusDienLuc,
      vuong_mac: lyDoVuongMac,
      so_luong_tu: parseInt(rowObj['Số lượng TĐP'] || rowObj['Số lượng tủ đổi pin'] || rowObj['Số lượng tủ'] || 2, 10) || 2,
      loai_tu: String(rowObj['Loại tủ'] || 'TĐP 12 ngăn').trim(),
      so_met_day: parseInt(rowObj['Số mét cáp nguồn'] || rowObj['Số mét dây nguồn'] || 30, 10) || 30
    });
  });
});

console.log(`\n========================================`);
console.log(`Total Master Stations Parsed: ${allStations.length}`);
const dot1 = allStations.filter(s => s.dot.includes('1'));
const dot2 = allStations.filter(s => s.dot.includes('2'));

console.log(`Đợt 1 Total: ${dot1.length} trạm (EVN 3P: ${dot1.filter(s => s.is_3phase).length}, VNPT 1P: ${dot1.filter(s => !s.is_3phase).length})`);
console.log(`Đợt 2 Total: ${dot2.length} trạm (EVN 3P: ${dot2.filter(s => s.is_3phase).length}, VNPT 1P: ${dot2.filter(s => !s.is_3phase).length})`);

if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/initial_data.json', JSON.stringify(allStations, null, 2), 'utf8');
console.log('Saved public/initial_data.json successfully!');
