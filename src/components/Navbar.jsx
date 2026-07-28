import React from 'react';
import { LayoutDashboard, Wrench, Zap, AlertTriangle, MapPin, Settings, RefreshCw, Database } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, dataSource, onRefresh, onOpenSettings, lastUpdated, isSyncing }) {
  const tabs = [
    { id: 'overview', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'eve', label: 'Tiến Độ Tủ EVE (33 trạm)', icon: Zap },
    { id: 'installation', label: 'Tiến Độ Lắp Tủ Pin', icon: Wrench },
    { id: 'power', label: 'Thống Kê Điện Lực EVN', icon: Zap },
    { id: 'bottlenecks', label: 'Báo Cáo Vướng Mắc', icon: AlertTriangle },
    { id: 'map', label: 'Bản Đồ Trạm', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#080e1e]/95 backdrop-blur-xl border-b border-blue-900/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Enterprise Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-400/30">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/40">
                  REALTIME DASHBOARD
                </span>
              </div>
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center space-x-2 mt-0.5">
                <span>Tủ Đổi Pin & Tiến Độ Điện Lực</span>
              </h1>
            </div>
          </div>

          {/* Data Source Badge & Action Buttons */}
          <div className="flex items-center space-x-3">
            <div className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
              dataSource === 'live'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                : 'bg-blue-950/60 text-blue-300 border border-blue-500/30 shadow-sm'
            }`}>
              <Database className="w-3 h-3 mr-1.5 text-blue-400" />
              <span>{dataSource === 'live' ? 'Live GAS API' : 'Excel Offline Data'}</span>
              {isSyncing && <RefreshCw className="w-3 h-3 ml-1.5 text-cyan-400 animate-spin" />}
            </div>

            <button
              onClick={onRefresh}
              className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-blue-950 rounded-lg transition-all border border-blue-900/40 hover:border-blue-500/40 shadow-sm"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-blue-950/60 hover:bg-blue-900/80 rounded-lg transition-all border border-blue-700/40 flex items-center space-x-1.5 shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Cấu hình API</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-blue-950/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-blue-950/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-400/70'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
