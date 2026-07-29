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
    <header className="sticky top-0 z-40 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-slate-200/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1E1B3A] flex items-center justify-center shadow-md shadow-violet-950/20">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200">
                  REALTIME DASHBOARD
                </span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2 mt-0.5">
                <span>Tủ Đổi Pin & Tiến Độ Điện Lực</span>
              </h1>
            </div>
          </div>

          {/* Data Source Badge & Action Buttons */}
          <div className="flex items-center space-x-3">
            <div className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              dataSource === 'live'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
            }`}>
              <Database className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span>{dataSource === 'live' ? 'Live GAS API' : 'Excel Offline Data'}</span>
              {isSyncing && <RefreshCw className="w-3 h-3 ml-1.5 text-indigo-500 animate-spin" />}
            </div>

            <button
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 shadow-xs"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all border border-slate-200/80 flex items-center space-x-1.5 shadow-xs"
              title="Cấu hình kết nối Google Apps Script API"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Cấu hình API</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Tasklyn Neumorphic Dark Pill Style) */}
        <div className="flex space-x-1.5 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-200/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1E1B3A] text-white shadow-md shadow-violet-950/20 border border-violet-900/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
