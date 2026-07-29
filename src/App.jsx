import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import OverviewTab from './components/OverviewTab';
import EveProgressTab from './components/EveProgressTab';
import InstallationTab from './components/InstallationTab';
import PowerGridTab from './components/PowerGridTab';
import BottlenecksTab from './components/BottlenecksTab';
import MapTab from './components/MapTab';
import StationDetailModal from './components/StationDetailModal';
import SettingsModal from './components/SettingsModal';
import { fetchStationsData, updateStationFields } from './services/api';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('eve');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('local');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const res = await fetchStationsData();
      setStations(res.data || []);
      setDataSource(res.source);
      setLastUpdated(res.timestamp);
    } catch (err) {
      console.error('Error loading stations data:', err);
    } finally {
      if (!silent) setLoading(false);
      setIsSyncing(false);
    }
  };

  // Initial load + 15s Auto Polling sync for instant two-way updates
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handler for optimistic local update + API sync
  const handleUpdateStationLocally = async (stationId, updates) => {
    // 1. Optimistic update
    setStations(prev => prev.map(s => {
      if (s.id === stationId || s.ma_tram === stationId) {
        return { ...s, ...updates };
      }
      return s;
    }));

    if (selectedStation && (selectedStation.id === stationId || selectedStation.ma_tram === stationId)) {
      setSelectedStation(prev => ({ ...prev, ...updates }));
    }

    // 2. Async sync via API
    const res = await updateStationFields(stationId, updates);
    if (res && res.status === 'success') {
      loadData(true); // silent refetch
      return { success: true };
    }
    return { success: false, message: res ? res.message : 'Lỗi kết nối' };
  };

  return (
    <div className="min-h-screen bg-[#EBEFF5] text-slate-800 selection:bg-violet-600 selection:text-white p-2 sm:p-4 md:p-6 flex flex-col items-center">
      {/* Tasklyn Dashboard Main Container Box */}
      <div className="w-full max-w-[1440px] bg-[#F2F5FA] border border-white/80 rounded-[28px] sm:rounded-[36px] shadow-2xl shadow-slate-300/60 overflow-hidden flex flex-col flex-1 min-h-[90vh]">
        {/* Navigation Top Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dataSource={dataSource}
          onRefresh={() => loadData(false)}
          onOpenSettings={() => setShowSettings(true)}
          lastUpdated={lastUpdated}
          isSyncing={isSyncing}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <RefreshCw className="w-8 h-8 text-violet-600 animate-spin" />
              <p className="text-xs text-slate-600 font-semibold">Đang đồng bộ dữ liệu trạm tủ đổi pin...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  stations={stations}
                  onSelectStation={setSelectedStation}
                  onUpdateStation={handleUpdateStationLocally}
                />
              )}
              {activeTab === 'eve' && (
                <EveProgressTab
                  stations={stations}
                  onSelectStation={setSelectedStation}
                  onUpdateStation={handleUpdateStationLocally}
                />
              )}
              {activeTab === 'installation' && (
                <InstallationTab
                  stations={stations}
                  onSelectStation={setSelectedStation}
                  onUpdateStation={handleUpdateStationLocally}
                />
              )}
              {activeTab === 'power' && (
                <PowerGridTab
                  stations={stations}
                  onSelectStation={setSelectedStation}
                  onUpdateStation={handleUpdateStationLocally}
                />
              )}
              {activeTab === 'bottlenecks' && (
                <BottlenecksTab
                  stations={stations}
                  onSelectStation={setSelectedStation}
                  onUpdateStation={handleUpdateStationLocally}
                />
              )}
              {activeTab === 'map' && (
                <MapTab
                  stations={stations}
                  onSelectStation={setSelectedStation}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white/60 py-3.5 text-center text-xs text-slate-500 font-medium">
          Hệ thống Quản lý Tiến độ Tủ Đổi Pin & Điện Lực EVN
        </footer>
      </div>

      {/* Station Detail Modal Popup */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onUpdateStation={handleUpdateStationLocally}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaveSuccess={() => loadData(false)}
        />
      )}
    </div>
  );
}
