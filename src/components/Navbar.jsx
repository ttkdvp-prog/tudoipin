import React from 'react';
import { LayoutDashboard, Wrench, Zap, AlertTriangle, MapPin, Settings, RefreshCw, Database } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, dataSource, onRefresh, onOpenSettings, lastUpdated }) {
  const tabs = [
    { id: 'overview', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'eve', label: 'Tiến Độ Tủ EVE (33 trạm)', icon: Zap },
    { id: 'installation', label: 'Tiến Độ Lắp Tủ Pin', icon: Wrench },
    { id: 'power', label: 'Thống Kê Điện Lực EVN', icon: Zap },
    { id: 'bottlenecks', label: 'Báo Cáo Vướng Mắc', icon: AlertTriangle },
    { id: 'map', label: 'Bản Đồ Trạm', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                Tủ Đổi Pin & Lắp Điện EVN
              </h1>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>Hệ thống Quản lý Tiến độ 74 Trạm</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  dataSource === 'live' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  <Database className="w-2.5 h-2.5 mr-1" />
                  {dataSource === 'live' ? 'Live Apps Script API' : 'Excel Offline Data'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex items-center space-x-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Cấu hình API</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
