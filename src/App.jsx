import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverviewTab from './components/OverviewTab';
import InstallationTab from './components/InstallationTab';
import PowerGridTab from './components/PowerGridTab';
import BottlenecksTab from './components/BottlenecksTab';
import MapTab from './components/MapTab';
import StationDetailModal from './components/StationDetailModal';
import SettingsModal from './components/SettingsModal';
import { fetchStationsData } from './services/api';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('local');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchStationsData();
      setStations(res.data || []);
      setDataSource(res.source);
      setLastUpdated(res.timestamp);
    } catch (err) {
      console.error('Error loading stations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataSource={dataSource}
        onRefresh={loadData}
        onOpenSettings={() => setShowSettings(true)}
        lastUpdated={lastUpdated}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Đang tải dữ liệu tiến độ trạm tủ đổi pin...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab stations={stations} onSelectStation={setSelectedStation} />
            )}
            {activeTab === 'installation' && (
              <InstallationTab stations={stations} onSelectStation={setSelectedStation} />
            )}
            {activeTab === 'power' && (
              <PowerGridTab stations={stations} onSelectStation={setSelectedStation} />
            )}
            {activeTab === 'bottlenecks' && (
              <BottlenecksTab stations={stations} onSelectStation={setSelectedStation} />
            )}
            {activeTab === 'map' && (
              <MapTab stations={stations} onSelectStation={setSelectedStation} />
            )}
          </>
        )}
      </main>

      {/* Station Detail Modal Popup */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onRefreshData={loadData}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaveSuccess={loadData}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Dashboard Quản Lý Lắp Đặt Tủ Đổi Pin & Tiến Độ Điện Lực EVN • Sẵn sàng đẩy GitHub & Deploy Vercel
      </footer>
    </div>
  );
}
