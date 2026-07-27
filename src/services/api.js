// Service layer for fetching data from GAS API or local offline JSON with instant 2-way sync

const GAS_URL_STORAGE_KEY = 'GAS_ENDPOINT_URL';
const DEFAULT_GAS_URL = ''; // User can set via Settings modal

export function getStoredGasUrl() {
  return localStorage.getItem(GAS_URL_STORAGE_KEY) || DEFAULT_GAS_URL;
}

export function setStoredGasUrl(url) {
  if (url) {
    localStorage.setItem(GAS_URL_STORAGE_KEY, url.trim());
  } else {
    localStorage.removeItem(GAS_URL_STORAGE_KEY);
  }
}

export async function fetchStationsData() {
  const gasUrl = getStoredGasUrl();
  
  if (gasUrl) {
    try {
      console.log('Fetching live data from Google Apps Script:', gasUrl);
      const res = await fetch(gasUrl);
      const json = await res.json();
      
      if (json && json.status === 'success' && Array.isArray(json.data)) {
        return {
          source: 'live',
          timestamp: json.timestamp || new Date().toISOString(),
          data: json.data
        };
      }
    } catch (err) {
      console.warn('Failed to fetch from GAS endpoint, falling back to initial data:', err);
    }
  }

  // Fallback to local static JSON parsed from Excel
  try {
    const res = await fetch('/initial_data.json');
    const localData = await res.json();
    return {
      source: 'local',
      timestamp: new Date().toISOString(),
      data: localData
    };
  } catch (err) {
    console.error('Failed to load initial_data.json:', err);
    return {
      source: 'empty',
      timestamp: new Date().toISOString(),
      data: []
    };
  }
}

export async function updateStationFields(stationId, updates) {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) {
    return { success: false, message: 'Chưa kết nối URL Google Apps Script! (Vui lòng chọn ⚙️ Cấu hình API)' };
  }

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'updateStation',
        stationId: stationId,
        updates: updates
      })
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error('Error updating station fields:', err);
    return { success: false, message: err.toString() };
  }
}
