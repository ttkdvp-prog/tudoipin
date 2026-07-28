/**
 * GOOGLE APPS SCRIPT CHO DASHBOARD TỦ ĐỔI PIN & TIẾN ĐỘ ĐIỆN LỰC (ĐỌC CỘT "LẮP ĐIỆN")
 * Spreadsheet ID: 1lYCGrd20SgUCSy5U3au_sZx2ci9WewiYzfl9OJMg3rM
 * GitHub Repository: https://github.com/ttkdvp-prog/tudoipin
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getData';
  
  if (action === 'ping') {
    return createJsonResponse({ status: 'ok', message: 'API Google Apps Script hoạt động bình thường!' });
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
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    var action = postData.action;

    if (action === 'updateStation' || action === 'updateField') {
      var result = updateStationData(postData.stationId, postData.updates);
      return createJsonResponse({ status: 'success', result: result, timestamp: new Date().toISOString() });
    }

    return createJsonResponse({ status: 'error', message: 'Action không hợp lệ: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function getAllStationData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var result = [];
  var seenMaTram = {};

  sheets.forEach(function(sheet) {
    var sheetName = sheet.getName();
    
    if (sheetName.indexOf('DS lắp điện') !== -1 || sheetName.indexOf('danh sách') !== -1) {
      return;
    }

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return;

    var headers = values[0].map(function(h) { return String(h || '').trim(); });

    var maTramColIdx = -1;
    headers.forEach(function(h, idx) {
      var lowerH = h.toLowerCase();
      if (lowerH === 'mã trạm' || lowerH === 'mã trạm ' || lowerH === 'matram') {
        maTramColIdx = idx;
      }
    });

    if (maTramColIdx === -1) return;

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      if (!row || row.length === 0) continue;

      var maTram = String(row[maTramColIdx] || '').trim();
      if (!maTram || seenMaTram[maTram]) continue;
      seenMaTram[maTram] = true;

      var rowObj = {};
      headers.forEach(function(h, cIdx) {
        if (h) rowObj[h] = row[cIdx];
      });

      var dot = String(rowObj['Đợt'] || rowObj['đợt'] || '').trim();
      if (!dot) {
        if (sheetName.indexOf('46') !== -1) dot = 'đợt 1';
        else if (sheetName.indexOf('28') !== -1) dot = 'đợt 2';
        else dot = sheetName;
      }

      var isEvn = Boolean(rowObj['Điện Lực'] && String(rowObj['Điện Lực']).trim().toLowerCase() === 'x');
      var isVnpt = Boolean(rowObj['Điện VNPT'] && String(rowObj['Điện VNPT']).trim().toLowerCase() === 'x');

      var paDien = 'Điện EVN 3P';
      var donViPhuTrach = 'Điện Lực';
      var is3Phase = true;

      if (isEvn) {
        paDien = 'Điện EVN 3P';
        donViPhuTrach = 'Điện Lực';
        is3Phase = true;
      } else if (isVnpt) {
        paDien = 'Điện VNPT 1P';
        donViPhuTrach = 'VNPT';
        is3Phase = false;
      } else {
        var paRaw = String(rowObj['PA Điện'] || rowObj['PA Điện'] || '').trim();
        if (paRaw.indexOf('3P') !== -1 || paRaw.indexOf('3 pha') !== -1) {
          paDien = 'Điện EVN 3P';
          is3Phase = true;
        } else if (paRaw.indexOf('1P') !== -1 || paRaw.indexOf('1 pha') !== -1) {
          paDien = 'Điện VNPT 1P';
          is3Phase = false;
        }
      }

      var lapDienVal = String(rowObj['Lắp điện'] || rowObj['Lắp Điện'] || '').trim();
      var lyDoVuongMac = String(rowObj['Lý do chưa triển khai lắp điện'] || rowObj['Vướng mắc'] || rowObj['Ghi Chú'] || '').trim();
      var donViDienLucVal = String(rowObj['Đơn vị điện lực'] || rowObj['Đơn vị Điện Lực'] || rowObj['Đơn vị điện lực '] || '').trim();

      var combinedText = (lapDienVal + ' ' + lyDoVuongMac).toLowerCase();

      var statusLapDat = 'Chưa lắp đặt';
      var statusDienLuc = 'Chờ Điện lực xử lý/HĐ';

      if (combinedText.indexOf('đã lắp xong') !== -1 || combinedText.indexOf('đã đóng điện') !== -1 || combinedText.indexOf('nghiệm thu') !== -1 || combinedText.indexOf('hoàn thành') !== -1) {
        statusLapDat = 'Đã hoàn thành';
        statusDienLuc = 'Đã đóng điện';
      } else if (combinedText.indexOf('vướng') !== -1 || combinedText.indexOf('chưa nhận') !== -1 || combinedText.indexOf('mặt bằng') !== -1 || combinedText.indexOf('cắt tường') !== -1) {
        statusDienLuc = 'Có vướng mắc';
        if (combinedText.indexOf('đang') !== -1) statusLapDat = 'Đang triển khai';
      } else if (combinedText.indexOf('đang') !== -1 || combinedText.indexOf('khảo sát') !== -1) {
        statusLapDat = 'Đang triển khai';
        statusDienLuc = 'Chờ Điện lực xử lý/HĐ';
      }

      result.push({
        id: maTram,
        sheetSource: sheetName,
        rowNumber: r + 1,
        stt: rowObj['STT'] || rowObj['Stt'] || r,
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
        don_vi_dien_luc: donViDienLucVal || ('Điện lực ' + String(rowObj['Tổ HT'] || rowObj['Tổ hạ tầng'] || '').trim()),
        is_3phase: is3Phase,
        lap_dien: lapDienVal,
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

function updateStationData(stationId, updates) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    if (sheet.getName().indexOf('DS lắp điện') !== -1) continue;

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) continue;

    var headers = values[0].map(function(h) { return String(h || '').trim(); });
    var maTramColIdx = -1;
    headers.forEach(function(h, idx) {
      var lowerH = h.toLowerCase();
      if (lowerH === 'mã trạm' || lowerH === 'mã trạm ' || lowerH === 'matram') maTramColIdx = idx;
    });

    if (maTramColIdx === -1) continue;

    for (var r = 1; r < values.length; r++) {
      if (String(values[r][maTramColIdx]).trim() === String(stationId).trim()) {
        if (updates.lap_dien !== undefined || updates.status_dien_luc !== undefined) {
          var colIdxLap = headers.indexOf('Lắp điện');
          if (colIdxLap === -1) colIdxLap = headers.indexOf('Lắp Điện');
          if (colIdxLap !== -1) sheet.getRange(r + 1, colIdxLap + 1).setValue(updates.lap_dien || updates.status_dien_luc);
        }
        if (updates.vuong_mac !== undefined) {
          var colIdx = headers.indexOf('Lý do chưa triển khai lắp điện');
          if (colIdx === -1) colIdx = headers.indexOf('Vướng mắc');
          if (colIdx === -1) colIdx = headers.indexOf('Ghi Chú');
          if (colIdx !== -1) sheet.getRange(r + 1, colIdx + 1).setValue(updates.vuong_mac);
        }
        if (updates.so_luong_tu !== undefined) {
          var colIdxTu = headers.indexOf('Số lượng TĐP');
          if (colIdxTu === -1) colIdxTu = headers.indexOf('Số lượng tủ đổi pin');
          if (colIdxTu !== -1) sheet.getRange(r + 1, colIdxTu + 1).setValue(updates.so_luong_tu);
        }
        if (updates.to_ht !== undefined) {
          var colIdxTo = headers.indexOf('Tổ HT');
          if (colIdxTo !== -1) sheet.getRange(r + 1, colIdxTo + 1).setValue(updates.to_ht);
        }
        if (updates.to_truong !== undefined) {
          var colIdxTT = headers.indexOf('Tổ trưởng');
          if (colIdxTT !== -1) sheet.getRange(r + 1, colIdxTT + 1).setValue(updates.to_truong);
        }
        if (updates.sdt !== undefined) {
          var colIdxSDT = headers.indexOf('SĐT tổ trưởng');
          if (colIdxSDT === -1) colIdxSDT = headers.indexOf('SĐT');
          if (colIdxSDT !== -1) sheet.getRange(r + 1, colIdxSDT + 1).setValue(updates.sdt);
        }
        if (updates.don_vi_dien_luc !== undefined) {
          var colIdxDV = headers.indexOf('Đơn vị điện lực');
          if (colIdxDV === -1) colIdxDV = headers.indexOf('Đơn vị Điện Lực');
          if (colIdxDV !== -1) sheet.getRange(r + 1, colIdxDV + 1).setValue(updates.don_vi_dien_luc);
        }
        return { updatedRow: r + 1, sheet: sheet.getName() };
      }
    }
  }
  return { error: 'Không tìm thấy Mã trạm: ' + stationId };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
