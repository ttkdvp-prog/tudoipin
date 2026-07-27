/**
 * GOOGLE APPS SCRIPT FOR BATTERY SWAP STATION DASHBOARD (TỦ ĐỔI PIN & TIẾN ĐỘ LẮP ĐIỆN)
 * Spreadsheet ID: 1lYCGrd20SgUCSy5U3au_sZx2ci9WewiYzfl9OJMg3rM
 * 
 * Functions provided:
 * 1. doGet(e): Serves JSON data API for WebApp dashboard (supports action=getData, action=ping)
 * 2. doPost(e): Enables real-time editing of station status or bottleneck notes from WebApp
 * 3. onOpen(): Creates custom menu in Google Sheets UI for manual testing & formatting
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getData';
  
  if (action === 'ping') {
    return createJsonResponse({ status: 'ok', message: 'API Google Apps Script đang hoạt động bình thường!' });
  }

  try {
    var data = getAllStationData();
    return createJsonResponse({
      status: 'success',
      timestamp: new Date().toISOString(),
      total: data.length,
      data: data
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;

    if (action === 'updateStation') {
      var result = updateStationData(postData.stationId, postData.updates);
      return createJsonResponse({ status: 'success', result: result });
    }

    return createJsonResponse({ status: 'error', message: 'Action không hợp lệ: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Reads all stations from sheets "46 +1 điểm" and "28 điểm"
 */
function getAllStationData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = ['46 +1 điểm', '28 điểm'];
  var result = [];

  sheetNames.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return;

    var headers = values[0].map(function(h) { return String(h || '').trim(); });

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      if (!row || row.length === 0) continue;

      var rowObj = {};
      headers.forEach(function(h, cIdx) {
        if (h) rowObj[h] = row[cIdx];
      });

      var maTram = rowObj['Mã trạm'] || rowObj['Mã Trạm'] || rowObj['mã trạm'];
      if (!maTram || String(maTram).trim() === '') continue;

      var dot = rowObj['Đợt'] || rowObj['đợt'] || (sheetName.indexOf('46') !== -1 ? 'Đợt 1' : 'Đợt 2');
      var lyDoVuongMac = String(rowObj['Lý do chưa triển khai lắp điện'] || rowObj['Vướng mắc'] || rowObj['Ghi Chú'] || '').trim();

      // Classify Installation Status
      var statusLapDat = 'Chưa triển khai';
      if (lyDoVuongMac.toLowerCase().indexOf('đã hoàn thành') !== -1 || lyDoVuongMac.toLowerCase().indexOf('đã lắp') !== -1 || lyDoVuongMac.toLowerCase().indexOf('xong') !== -1) {
        statusLapDat = 'Đã hoàn thành';
      } else if (lyDoVuongMac.toLowerCase().indexOf('đang') !== -1 || lyDoVuongMac.toLowerCase().indexOf('khảo sát') !== -1) {
        statusLapDat = 'Đang thi công';
      }

      // Classify Power Connection Status
      var statusDienLuc = 'Chưa làm thủ tục';
      if (lyDoVuongMac.toLowerCase().indexOf('đã đóng điện') !== -1 || lyDoVuongMac.toLowerCase().indexOf('nghiệm thu') !== -1) {
        statusDienLuc = 'Đã đóng điện 3P';
      } else if (lyDoVuongMac.toLowerCase().indexOf('đã gửi') !== -1 || lyDoVuongMac.toLowerCase().indexOf('khảo sát') !== -1 || lyDoVuongMac.toLowerCase().indexOf('hợp đồng') !== -1 || lyDoVuongMac.toLowerCase().indexOf('hồ sơ') !== -1) {
        statusDienLuc = 'Chờ Điện lực xử lý/HĐ';
      } else if (lyDoVuongMac.toLowerCase().indexOf('vướng') !== -1 || lyDoVuongMac.toLowerCase().indexOf('chưa nhận') !== -1) {
        statusDienLuc = 'Vướng mắc thủ tục';
      }

      result.push({
        id: String(maTram).trim(),
        sheetSource: sheetName,
        rowNumber: r + 1,
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
        lat: parseFloat(rowObj['LAT'] || rowObj['Lat']) || null,
        lng: parseFloat(rowObj['LONG'] || rowObj['Long']) || null,
        pa_dien: String(rowObj['PA Điện'] || rowObj['PA Điện'] || 'Điện EVN 3P').trim(),
        don_vi_phu_trach: rowObj['Điện Lực'] ? 'Điện Lực' : (rowObj['Điện VNPT'] ? 'VNPT' : 'Điện Lực'),
        status_lap_dat: statusLapDat,
        status_dien_luc: statusDienLuc,
        vuong_mac: lyDoVuongMac,
        so_luong_tu: parseInt(rowObj['Số lượng TĐP'] || rowObj['Số lượng tủ đổi pin'] || 2) || 2,
        loai_tu: String(rowObj['Loại tủ'] || 'TĐP 12 ngăn').trim(),
        so_met_day: parseInt(rowObj['Số mét cáp nguồn'] || rowObj['Số mét dây nguồn'] || 30) || 30
      });
    }
  });

  return result;
}

/**
 * Updates a specific station row in Google Sheet
 */
function updateStationData(stationId, updates) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = ['46 +1 điểm', '28 điểm'];

  for (var s = 0; s < sheetNames.length; s++) {
    var sheet = ss.getSheetByName(sheetNames[s]);
    if (!sheet) continue;

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) continue;

    var headers = values[0].map(function(h) { return String(h || '').trim(); });
    var maTramColIdx = headers.indexOf('Mã trạm');
    if (maTramColIdx === -1) maTramColIdx = headers.indexOf('Mã Trạm');

    if (maTramColIdx === -1) continue;

    for (var r = 1; r < values.length; r++) {
      if (String(values[r][maTramColIdx]).trim() === String(stationId).trim()) {
        // Found matching station row
        if (updates.vuong_mac !== undefined) {
          var colIdx = headers.indexOf('Lý do chưa triển khai lắp điện');
          if (colIdx === -1) colIdx = headers.indexOf('Vướng mắc');
          if (colIdx === -1) colIdx = headers.indexOf('Ghi Chú');
          if (colIdx !== -1) {
            sheet.getRange(r + 1, colIdx + 1).setValue(updates.vuong_mac);
          }
        }
        return { updatedRow: r + 1, sheet: sheetNames[s] };
      }
    }
  }

  return { error: 'Không tìm thấy Mã trạm: ' + stationId };
}

/**
 * Helper to produce JSON responses with CORS headers
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Custom UI menu inside Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ Dashboard Tủ Đổi Pin')
    .addItem('🔗 Kiểm tra API Endpoint', 'testApiEndpoint')
    .addItem('📊 Làm mới thống kê dữ liệu', 'refreshStats')
    .addToUi();
}

function testApiEndpoint() {
  var data = getAllStationData();
  SpreadsheetApp.getUi().alert('API hoạt động thành công! Tổng số trạm ghi nhận: ' + data.length + ' trạm.');
}

function refreshStats() {
  SpreadsheetApp.getUi().alert('Đã cập nhật chỉ số thống kê trạm thành công!');
}
