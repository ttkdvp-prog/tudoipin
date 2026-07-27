/**
 * GOOGLE APPS SCRIPT CHO DASHBOARD TỦ ĐỔI PIN & TIẾN ĐỘ ĐIỆN LỰC (HỖ TRỢ ĐỒNG BỘ 2 CHIỀU TỨC THÌ)
 * Spreadsheet ID: 1lYCGrd20SgUCSy5U3au_sZx2ci9WewiYzfl9OJMg3rM
 * GitHub Repository: https://github.com/ttkdvp-prog/tudoipin
 * 
 * Tính năng chính:
 * 1. Tự động quét TẤT CẢ các sheet (Đợt 1, Đợt 2, Đợt 3, Đợt 4...) không giới hạn số đợt.
 * 2. Xuất API JSON đầy đủ cho WebApp (doGet).
 * 3. Cho phép CẬP NHẬT TỨC THÌ mọi tham số (trạng thái, vướng mắc, số tủ, tổ HT, tổ trưởng...) từ WebApp về Sheet (doPost).
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

/**
 * Quét động TẤT CẢ các Sheet có trong Google Spreadsheet (Tự động hỗ trợ Đợt 1, Đợt 2, Đợt 3, Đợt 4...)
 */
function getAllStationData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var result = [];

  sheets.forEach(function(sheet) {
    var sheetName = sheet.getName();
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return;

    var headers = values[0].map(function(h) { return String(h || '').trim(); });

    // Tim cot Ma tram
    var maTramColIdx = -1;
    headers.forEach(function(h, idx) {
      var lowerH = h.toLowerCase();
      if (lowerH === 'mã trạm' || lowerH === 'mã trạm ' || lowerH === 'matram') {
        maTramColIdx = idx;
      }
    });

    if (maTramColIdx === -1) return; // Khong phai sheet quan ly tramm

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      if (!row || row.length === 0) continue;

      var maTram = String(row[maTramColIdx] || '').trim();
      if (!maTram) continue;

      var rowObj = {};
      headers.forEach(function(h, cIdx) {
        if (h) rowObj[h] = row[cIdx];
      });

      // Standardize Đợt
      var dot = rowObj['Đợt'] || rowObj['đợt'] || rowObj['ĐỢT'] || '';
      if (!dot) {
        if (sheetName.indexOf('46') !== -1) dot = 'Đợt 1';
        else if (sheetName.indexOf('28') !== -1) dot = 'Đợt 2';
        else dot = sheetName;
      }

      var lyDoVuongMac = String(rowObj['Lý do chưa triển khai lắp điện'] || rowObj['Vướng mắc'] || rowObj['Ghi Chú'] || rowObj['Ghi chú'] || '').trim();

      // Formats & Classification
      var statusLapDat = String(rowObj['Trạng thái lắp đặt'] || rowObj['Lắp đặt'] || '').trim();
      if (!statusLapDat) {
        if (lyDoVuongMac.toLowerCase().indexOf('đã hoàn thành') !== -1 || lyDoVuongMac.toLowerCase().indexOf('đã lắp') !== -1 || lyDoVuongMac.toLowerCase().indexOf('xong') !== -1) {
          statusLapDat = 'Đã hoàn thành';
        } else if (lyDoVuongMac.toLowerCase().indexOf('đang') !== -1 || lyDoVuongMac.toLowerCase().indexOf('khảo sát') !== -1) {
          statusLapDat = 'Đang thi công';
        } else {
          statusLapDat = 'Chưa triển khai';
        }
      }

      var statusDienLuc = String(rowObj['Trạng thái điện lực'] || rowObj['Điện lực'] || '').trim();
      if (!statusDienLuc) {
        if (lyDoVuongMac.toLowerCase().indexOf('đã đóng điện') !== -1 || lyDoVuongMac.toLowerCase().indexOf('nghiệm thu') !== -1) {
          statusDienLuc = 'Đã đóng điện 3P';
        } else if (lyDoVuongMac.toLowerCase().indexOf('đã gửi') !== -1 || lyDoVuongMac.toLowerCase().indexOf('khảo sát') !== -1 || lyDoVuongMac.toLowerCase().indexOf('hợp đồng') !== -1 || lyDoVuongMac.toLowerCase().indexOf('hồ sơ') !== -1) {
          statusDienLuc = 'Chờ Điện lực xử lý/HĐ';
        } else if (lyDoVuongMac.toLowerCase().indexOf('vướng') !== -1 || lyDoVuongMac.toLowerCase().indexOf('chưa nhận') !== -1) {
          statusDienLuc = 'Vướng mắc thủ tục';
        } else {
          statusDienLuc = 'Chưa làm thủ tục';
        }
      }

      result.push({
        id: maTram,
        sheetSource: sheetName,
        rowNumber: r + 1,
        stt: rowObj['STT'] || rowObj['Stt'] || r,
        dot: String(dot).trim(),
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
        pa_dien: String(rowObj['PA Điện'] || rowObj['PA Điện'] || 'Điện EVN 3P').trim(),
        don_vi_phu_trach: rowObj['Điện Lực'] ? 'Điện Lực' : (rowObj['Điện VNPT'] ? 'VNPT' : 'Điện Lực'),
        status_lap_dat: statusLapDat,
        status_dien_luc: statusDienLuc,
        vuong_mac: lyDoVuongMac,
        so_luong_tu: parseInt(rowObj['Số lượng TĐP'] || rowObj['Số lượng tủ đổi pin'] || rowObj['Số lượng tủ'] || 2) || 2,
        loai_tu: String(rowObj['Loại tủ'] || 'TĐP 12 ngăn').trim(),
        so_met_day: parseInt(rowObj['Số mét cáp nguồn'] || rowObj['Số mét dây nguồn'] || 30) || 30,
        ghi_chu: String(rowObj['Ghi Chú'] || rowObj['Ghi chú'] || '').trim()
      });
    }
  });

  return result;
}

/**
 * Cập nhật thông số trạm trên Google Sheet khi người dùng chỉnh sửa trên WebApp
 */
function updateStationData(stationId, updates) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
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
        // Tim thay trAM
        
        // Cap nhat Vuong mac / Ghi chu
        if (updates.vuong_mac !== undefined) {
          var colIdx = headers.indexOf('Lý do chưa triển khai lắp điện');
          if (colIdx === -1) colIdx = headers.indexOf('Vướng mắc');
          if (colIdx === -1) colIdx = headers.indexOf('Ghi Chú');
          if (colIdx === -1) colIdx = headers.indexOf('Ghi chú');
          if (colIdx !== -1) sheet.getRange(r + 1, colIdx + 1).setValue(updates.vuong_mac);
        }

        // Cap nhat So luong tu
        if (updates.so_luong_tu !== undefined) {
          var colIdxTu = headers.indexOf('Số lượng TĐP');
          if (colIdxTu === -1) colIdxTu = headers.indexOf('Số lượng tủ đổi pin');
          if (colIdxTu === -1) colIdxTu = headers.indexOf('Số lượng tủ');
          if (colIdxTu !== -1) sheet.getRange(r + 1, colIdxTu + 1).setValue(updates.so_luong_tu);
        }

        // Cap nhat Loai tu
        if (updates.loai_tu !== undefined) {
          var colIdxLoai = headers.indexOf('Loại tủ');
          if (colIdxLoai === -1) colIdxLoai = headers.indexOf('Loại Tủ');
          if (colIdxLoai !== -1) sheet.getRange(r + 1, colIdxLoai + 1).setValue(updates.loai_tu);
        }

        // Cap nhat To HT
        if (updates.to_ht !== undefined) {
          var colIdxTo = headers.indexOf('Tổ HT');
          if (colIdxTo === -1) colIdxTo = headers.indexOf('Tổ hạ tầng');
          if (colIdxTo !== -1) sheet.getRange(r + 1, colIdxTo + 1).setValue(updates.to_ht);
        }

        // Cap nhat To truong & SDT
        if (updates.to_truong !== undefined) {
          var colIdxTT = headers.indexOf('Tổ trưởng');
          if (colIdxTT !== -1) sheet.getRange(r + 1, colIdxTT + 1).setValue(updates.to_truong);
        }
        if (updates.sdt !== undefined) {
          var colIdxSDT = headers.indexOf('SĐT tổ trưởng');
          if (colIdxSDT === -1) colIdxSDT = headers.indexOf('SĐT');
          if (colIdxSDT !== -1) sheet.getRange(r + 1, colIdxSDT + 1).setValue(updates.sdt);
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
