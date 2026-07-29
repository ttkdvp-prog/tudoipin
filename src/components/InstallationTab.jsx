import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronRight, Phone, MapPin, Wrench, Edit3 } from 'lucide-react';

export default function InstallationTab({ stations, onSelectStation, onUpdateStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');

  // Dynamic extraction of ALL batches (Đợt 1, Đợt 2, Đợt 3, Đợt 4...)
  const dotsList = useMemo(() => {
    const set = new Set(stations.map(s => s.dot).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Dynamic extraction of teams
  const teamsList = useMemo(() => {
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

      const matchDot = selectedDot === 'ALL' || s.dot === selectedDot;
      const matchTeam = selectedTeam === 'ALL' || s.to_ht === selectedTeam;

      return matchSearch && matchDot && matchTeam;
    });
  }, [stations, searchTerm, selectedDot, selectedTeam]);

  // Export CSV
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
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 border border-slate-200/80 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tên cơ sở, Tổ trưởng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Dynamic Đợt Filter */}
          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-violet-600" />
            <select
              value={selectedDot}
              onChange={(e) => setSelectedDot(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các đợt ({dotsList.length} đợt)</option>
              {dotsList.map(dot => (
                <option key={dot} value={dot}>{dot}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Tổ HT Filter */}
          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả Tổ Hạ Tầng</option>
              {teamsList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#1E1B3A] hover:bg-[#2B274F] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Mã trạm / Đợt</th>
                <th className="py-3.5 px-4">Tên Cơ Sở & Địa Chỉ</th>
                <th className="py-3.5 px-4">Tổ HT & Phụ Trách</th>
                <th className="py-3.5 px-4 text-center">Số Tủ & Loại Tủ</th>
                <th className="py-3.5 px-4">Phương Án Điện</th>
                <th className="py-3.5 px-4">Ghi Chú Vướng Mắc</th>
                <th className="py-3.5 px-4 text-right">Sửa / Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
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
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-violet-700 text-xs">{station.ma_tram}</div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200 mt-1 font-bold">
                        {station.dot}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900">{station.ten_co_so}</div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        {station.dia_chi || station.phuong_xa || station.dia_ban}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{station.to_ht}</div>
                      <div className="text-[11px] text-slate-500 flex items-center mt-0.5 font-medium">
                        <span>{station.to_truong}</span>
                        {station.sdt && (
                          <span className="ml-1.5 text-slate-400 font-mono text-[10px]">({station.sdt})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <Wrench className="w-3 h-3 mr-1 text-blue-600" />
                        {station.so_luong_tu} Tủ ({station.loai_tu})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">{station.pa_dien || 'Điện EVN 3P'}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {station.vuong_mac ? (
                        <p className="text-xs text-orange-900 bg-orange-100/70 border border-orange-200 px-2.5 py-1 rounded-xl line-clamp-2 font-medium">
                          {station.vuong_mac}
                        </p>
                      ) : (
                        <span className="text-emerald-700 text-[11px] font-bold flex items-center">
                          ✓ Không vướng mắc
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectStation(station)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa thông số</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50/90 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center font-medium">
          <span>Hiển thị <strong className="text-slate-900">{filteredStations.length}</strong> / <strong>{stations.length}</strong> trạm</span>
          <span>Tổng số tủ đổi pin: <strong className="text-violet-700">{filteredStations.reduce((a, b) => a + (b.so_luong_tu || 2), 0)}</strong> tủ</span>
        </div>
      </div>
    </div>
  );
}
