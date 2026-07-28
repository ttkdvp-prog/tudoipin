/**
 * GOOGLE APPS SCRIPT CHO DASHBOARD TỦ ĐỔI PIN & TIẾN ĐỘ ĐIỆN LỰC
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

function findColIndex(headers, targets) {
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').toLowerCase().trim();
    for (var t = 0; t < targets.length; t++) {
      var target = String(targets[t]).toLowerCase().trim();
      if (h === target || h.indexOf(target) !== -1) {
        return i;
      }
    }
  }
  return -1;
}

function getAllStationData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var result = [];
  var seenMaTram = {};

  sheets.forEach(function(sheet) {
    var sheetName = sheet.getName();
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return;

    var headers = values[0].map(function(h) { return String(h || '').trim(); });
    var maTramColIdx = findColIndex(headers, ['mã trạm', 'ma tram', 'matram']);

    if (maTramColIdx === -1) return;

    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      if (!row || row.length === 0) continue;

      var maTram = String(row[maTramColIdx] || '').trim();
      if (!maTram || seenMaTram[maTram]) continue;
      seenMaTram[maTram] = true;

      var colDot = findColIndex(headers, ['đợt']);
      var dot = colDot !== -1 ? String(row[colDot] || '').trim() : '';
      if (!dot) {
        if (sheetName.indexOf('46') !== -1) dot = 'đợt 1';
        else if (sheetName.indexOf('28') !== -1) dot = 'đợt 2';
        else dot = sheetName;
      }

      var colLapDien = findColIndex(headers, ['lắp điện', 'lắp đặt']);
      var lapDienVal = colLapDien !== -1 ? String(row[colLapDien] || '').trim() : '';

      var colLyDo = findColIndex(headers, ['lý do chưa triển khai', 'vướng mắc']);
      var colGhiChu = findColIndex(headers, ['ghi chú', 'ghi chu']);

      var lyDoVal = colLyDo !== -1 ? String(row[colLyDo] || '').trim() : '';
      var ghiChuVal = colGhiChu !== -1 ? String(row[colGhiChu] || '').trim() : '';
      var lyDoVuongMac = lyDoVal || ghiChuVal;

      var colDV = findColIndex(headers, ['đơn vị điện lực', 'điện lực']);
      var donViDienLucVal = colDV !== -1 ? String(row[colDV] || '').trim() : '';

      var colToHT = findColIndex(headers, ['tổ ht', 'tổ hạ tầng']);
      var toHtVal = colToHT !== -1 ? String(row[colToHT] || '').trim() : '';

      var colToTruong = findColIndex(headers, ['tổ trưởng']);
      var toTruongVal = colToTruong !== -1 ? String(row[colToTruong] || '').trim() : '';

      var colSDT = findColIndex(headers, ['sđt']);
      var sdtVal = colSDT !== -1 ? String(row[colSDT] || '').trim() : '';

      var colTenCoSo = findColIndex(headers, ['tên cơ sở', 'tên trạm']);
      var tenCoSoVal = colTenCoSo !== -1 ? String(row[colTenCoSo] || '').trim() : '';

      var colDiaChi = findColIndex(headers, ['địa chỉ']);
      var diaChiVal = colDiaChi !== -1 ? String(row[colDiaChi] || '').trim() : '';

      var colTu = findColIndex(headers, ['số lượng tđp', 'số lượng tủ']);
      var soLuongTuVal = colTu !== -1 ? (parseInt(row[colTu]) || 2) : 2;

      var combinedText = (lapDienVal + ' ' + lyDoVuongMac).toLowerCase();
      var statusLapDat = 'Chưa lắp đặt';
      var statusDienLuc = 'Chờ Điện lực xử lý/HĐ';

      if (combinedText.indexOf('đã lắp xong') !== -1 || combinedText.indexOf('đã đóng điện') !== -1 || combinedText.indexOf('nghiệm thu') !== -1 || combinedText.indexOf('hoàn thành') !== -1) {
        statusLapDat = 'Đã hoàn thành';
        statusDienLuc = 'Đã đóng điện';
      } else if (combinedText.indexOf('vướng') !== -1 || combinedText.indexOf('chưa nhận') !== -1 || combinedText.indexOf('mặt bằng') !== -1 || combinedText.indexOf('cắt tường') !== -1) {
        statusDienLuc = 'Có vướng mắc';
      }

      var colPa = findColIndex(headers, ['pa điện', 'pa điện', 'phương án điện']);
      var colEvnMark = findColIndex(headers, ['điện lực', 'evn']);
      var colVnptMark = findColIndex(headers, ['điện vnpt', 'vnpt']);

      var paVal = colPa !== -1 ? String(row[colPa] || '').trim().toUpperCase() : '';
      var isEvn = colEvnMark !== -1 && String(row[colEvnMark] || '').trim().toLowerCase() === 'x';
      var isVnpt = colVnptMark !== -1 && String(row[colVnpt] || '').trim().toLowerCase() === 'x';

      var paDien = 'Điện EVN 3P';
      var donViPhuTrach = 'Điện Lực';
      var is3Phase = true;
      var isEve = true;

      if (isVnpt || paVal.indexOf('1P') !== -1 || paVal.indexOf('VNPT') !== -1 || paVal.indexOf('1 PHA') !== -1) {
        paDien = 'Điện VNPT 1P';
        donViPhuTrach = 'VNPT';
        is3Phase = false;
        isEve = false;
      } else if (isEvn || paVal.indexOf('3P') !== -1 || paVal.indexOf('EVN') !== -1 || paVal.indexOf('3 PHA') !== -1) {
        paDien = 'Điện EVN 3P';
        donViPhuTrach = 'Điện Lực';
        is3Phase = true;
        isEve = true;
      }

      result.push({
        id: maTram,
        sheetSource: sheetName,
        rowNumber: r + 1,
        stt: r,
        dot: dot,
        ma_tram: maTram,
        to_ht: toHtVal,
        to_truong: toTruongVal,
        sdt: sdtVal,
        ten_co_so: tenCoSoVal,
        dia_chi: diaChiVal,
        pa_dien: paDien,
        don_vi_phu_trach: donViPhuTrach,
        don_vi_dien_luc: donViDienLucVal || ('Điện lực ' + toHtVal),
        is_3phase: is3Phase,
        is_eve: isEve,
        lap_dien: lapDienVal,
        status_lap_dat: statusLapDat,
        status_dien_luc: statusDienLuc,
        vuong_mac: lyDoVuongMac,
        so_luong_tu: soLuongTuVal,
        loai_tu: '6 ngăn',
        so_met_day: 30
      });
    }
  });

  return result;
}

function updateStationData(stationId, updates) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var updatedInfo = [];

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) continue;

    var headers = values[0].map(function(h) { return String(h || '').trim(); });
    var maTramColIdx = findColIndex(headers, ['mã trạm', 'ma tram', 'matram']);

    if (maTramColIdx === -1) continue;

    var targetId = String(stationId || '').trim().toLowerCase();

    for (var r = 1; r < values.length; r++) {
      var cellVal = String(values[r][maTramColIdx] || '').trim().toLowerCase();
      if (cellVal === targetId) {

        // 1. Lắp điện
        if (updates.lap_dien !== undefined || updates.status_dien_luc !== undefined) {
          var valLap = updates.lap_dien !== undefined ? updates.lap_dien : updates.status_dien_luc;
          var colLap = findColIndex(headers, ['lắp điện', 'lap dien', 'tình trạng lắp điện']);
          if (colLap !== -1) sheet.getRange(r + 1, colLap + 1).setValue(valLap);
        }

        // 2. Vướng mắc / Lý do / Ghi chú (XÓA & CẬP NHẬT CẢ CỘT S LẪN CỘT X)
        if (updates.vuong_mac !== undefined) {
          var valVuong = updates.vuong_mac || '';
          
          var colLyDo = findColIndex(headers, ['lý do chưa triển khai', 'vướng mắc']);
          if (colLyDo !== -1) sheet.getRange(r + 1, colLyDo + 1).setValue(valVuong);

          var colGhiChu = findColIndex(headers, ['ghi chú', 'ghi chu', 'note']);
          if (colGhiChu !== -1) sheet.getRange(r + 1, colGhiChu + 1).setValue(valVuong);
        }

        // 3. Đơn vị điện lực
        if (updates.don_vi_dien_luc !== undefined) {
          var colDV = findColIndex(headers, ['đơn vị điện lực', 'điện lực']);
          if (colDV !== -1) sheet.getRange(r + 1, colDV + 1).setValue(updates.don_vi_dien_luc);
        }

        // 4. Số lượng tủ
        if (updates.so_luong_tu !== undefined) {
          var colTu = findColIndex(headers, ['số lượng tđp', 'số lượng tủ']);
          if (colTu !== -1) sheet.getRange(r + 1, colTu + 1).setValue(updates.so_luong_tu);
        }

        // 5. Tổ HT
        if (updates.to_ht !== undefined) {
          var colTo = findColIndex(headers, ['tổ ht', 'tổ hạ tầng']);
          if (colTo !== -1) sheet.getRange(r + 1, colTo + 1).setValue(updates.to_ht);
        }

        // 6. Tổ trưởng & SĐT
        if (updates.to_truong !== undefined) {
          var colTT = findColIndex(headers, ['tổ trưởng']);
          if (colTT !== -1) sheet.getRange(r + 1, colTT + 1).setValue(updates.to_truong);
        }
        if (updates.sdt !== undefined) {
          var colSDT = findColIndex(headers, ['sđt']);
          if (colSDT !== -1) sheet.getRange(r + 1, colSDT + 1).setValue(updates.sdt);
        }

        updatedInfo.push({ row: r + 1, sheet: sheet.getName() });
      }
    }
  }

  if (updatedInfo.length > 0) {
    return { status: 'success', updated: updatedInfo };
  }
  return { status: 'error', message: 'Không tìm thấy Mã trạm: ' + stationId };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
