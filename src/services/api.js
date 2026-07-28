// Service layer for fetching data from GAS API or local offline JSON with instant 2-way sync and persistent local overrides

const GAS_URL_STORAGE_KEY = 'GAS_ENDPOINT_URL';
const OVERRIDES_STORAGE_KEY = 'LOCAL_STATION_OVERRIDES';
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

export function getStoredOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveStoredOverride(stationId, updates) {
  try {
    const overrides = getStoredOverrides();
    overrides[stationId] = {
      ...(overrides[stationId] || {}),
      ...updates
    };
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Failed to save override to localStorage:', e);
  }
}

export function applyStoredOverrides(stationsList) {
  const overrides = getStoredOverrides();
  if (!overrides || Object.keys(overrides).length === 0) return stationsList;

  return stationsList.map(station => {
    const sId = station.id || station.ma_tram;
    if (overrides[sId]) {
      return { ...station, ...overrides[sId] };
    }
    return station;
  });
}

export async function fetchStationsData() {
  const gasUrl = getStoredGasUrl();
  
  if (gasUrl) {
    try {
      console.log('Fetching live data from Google Apps Script:', gasUrl);
      const res = await fetch(gasUrl);
      const json = await res.json();
      
      if (json && json.status === 'success' && Array.isArray(json.data)) {
        const mergedData = applyStoredOverrides(json.data);
        return {
          source: 'live',
          timestamp: json.timestamp || new Date().toISOString(),
          data: mergedData
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
    const mergedData = applyStoredOverrides(localData);
    return {
      source: 'local',
      timestamp: new Date().toISOString(),
      data: mergedData
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
  // 1. Always persist override locally first for instant, guaranteed persistence on client
  saveStoredOverride(stationId, updates);

  const gasUrl = getStoredGasUrl();
  if (!gasUrl) {
    return {
      status: 'success',
      savedLocally: true,
      message: 'Đã lưu tức thì trên Web App! (Để đồng bộ về file Google Sheet gốc, hãy nhập URL Web App Google Apps Script trong Cấu hình API)'
    };
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
    console.error('Error updating station fields via GAS:', err);
    return {
      status: 'success',
      savedLocally: true,
      message: 'Đã lưu tức thì trên Web App! Lỗi gửi tới Apps Script: ' + err.toString()
    };
  }
}
