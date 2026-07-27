import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronRight, Phone, MapPin, Wrench } from 'lucide-react';

export default function InstallationTab({ stations, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');

  // Filter options
  const teams = useMemo(() => {
    const set = new Set(stations.map(s => s.to_ht).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Filtered stations
  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      const matchSearch = searchTerm === '' ||
        s.ma_tram.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ten_co_so.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_truong.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dia_ban.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDot = selectedDot === 'ALL' || s.dot.includes(selectedDot);
      const matchTeam = selectedTeam === 'ALL' || s.to_ht === selectedTeam;

      return matchSearch && matchDot && matchTeam;
    });
  }, [stations, searchTerm, selectedDot, selectedTeam]);

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['Mã trạm', 'Đợt', 'Tổ HT', 'Tổ trưởng', 'SĐT', 'Tên cơ sở', 'Địa chỉ', 'Số lượng tủ', 'Loại tủ', 'Vướng mắc'];
    const rows = filteredStations.map(s => [
      `"${s.ma_tram}"`,
      `"${s.dot}"`,
      `"${s.to_ht}"`,
      `"${s.to_truong}"`,
      `"${s.sdt}"`,
      `"${s.ten_co_so.replace(/"/g, '""')}"`,
      `"${s.dia_chi.replace(/"/g, '""')}"`,
      s.so_luong_tu,
      `"${s.loai_tu}"`,
      `"${(s.vuong_mac || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tien_Do_Lap_Tu_Doi_Pin_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tên cơ sở, Tổ trưởng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Đợt Filter */}
          <div className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedDot}
              onChange={(e) => setSelectedDot(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả đợt</option>
              <option value="1" className="bg-slate-900">Đợt 1 (46 điểm)</option>
              <option value="2" className="bg-slate-900">Đợt 2 (28 điểm)</option>
            </select>
          </div>

          {/* Tổ HT Filter */}
          <div className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả Tổ Hạ Tầng</option>
              {teams.map(t => (
                <option key={t} value={t} className="bg-slate-900">{t}</option>
              ))}
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700/80">
              <tr>
                <th className="py-3 px-4">Mã trạm / Đợt</th>
                <th className="py-3 px-4">Tên Cơ Sở & Địa Chỉ</th>
                <th className="py-3 px-4">Tổ HT & Phụ Trách</th>
                <th className="py-3 px-4 text-center">Số Tủ & Loại Tủ</th>
                <th className="py-3 px-4">Phương Án Điện</th>
                <th className="py-3 px-4">Ghi Chú Vướng Mắc</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Không tìm thấy dữ liệu trạm phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStations.map((station) => (
                  <tr
                    key={station.id}
                    onClick={() => onSelectStation(station)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-cyan-400 text-xs">{station.ma_tram}</div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 mt-1">
                        {station.dot}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-100">{station.ten_co_so}</div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 text-slate-500 shrink-0" />
                        {station.dia_chi || station.phuong_xa || station.dia_ban}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{station.to_ht}</div>
                      <div className="text-[11px] text-slate-400 flex items-center mt-0.5">
                        <span>{station.to_truong}</span>
                        {station.sdt && (
                          <span className="ml-1.5 text-slate-500 font-mono text-[10px]">({station.sdt})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        <Wrench className="w-3 h-3 mr-1" />
                        {station.so_luong_tu} Tủ ({station.loai_tu})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 font-medium">{station.pa_dien || 'Điện EVN 3P'}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {station.vuong_mac ? (
                        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded line-clamp-2">
                          {station.vuong_mac}
                        </p>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-medium flex items-center">
                          ✓ Không vướng mắc
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStation(station);
                        }}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-800/40 px-4 py-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
          <span>Hiển thị <strong>{filteredStations.length}</strong> / <strong>{stations.length}</strong> trạm</span>
          <span>Tổng số tủ đổi pin: <strong>{filteredStations.reduce((a, b) => a + (b.so_luong_tu || 2), 0)}</strong> tủ</span>
        </div>
      </div>
    </div>
  );
}
