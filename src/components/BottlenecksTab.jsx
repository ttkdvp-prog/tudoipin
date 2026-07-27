import React, { useState, useMemo } from 'react';
import { AlertTriangle, Search, Filter, MessageSquare, CheckCircle, Clock, ExternalLink, Layers } from 'lucide-react';

export default function BottlenecksTab({ stations, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Dynamic Batch List
  const dotsList = useMemo(() => {
    const set = new Set(stations.map(s => s.dot).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Categorize bottleneck types
  const categorizedStations = useMemo(() => {
    return stations.map(s => {
      const vm = (s.vuong_mac || '').toLowerCase();
      let category = 'Khác';

      if (vm.includes('vgreen') || vm.includes('chưa nhận lại')) {
        category = 'Chờ VGREEN phản hồi hồ sơ';
      } else if (vm.includes('hợp đồng') || vm.includes('khảo sát') || vm.includes('chờ điện lực') || vm.includes('soạn hđ')) {
        category = 'Chờ Điện Lực (EVN) khảo sát/HĐ';
      } else if (vm.includes('cắt tường') || vm.includes('mặt bằng') || vm.includes('ngầm')) {
        category = 'Vướng thi công / Mặt bằng / Cắt tường';
      } else if (vm.includes('vật tư') || vm.includes('dây') || vm.includes('cáp')) {
        category = 'Chờ vật tư cáp / ống ngầm';
      } else if (vm.length <= 3 || vm.includes('không') || vm.includes('đã hoàn thành') || vm.includes('đóng điện')) {
        category = 'Đã hoàn thành / Không vướng';
      }

      return { ...s, category };
    });
  }, [stations]);

  // Categories list
  const categories = [
    'ALL',
    'Chờ VGREEN phản hồi hồ sơ',
    'Chờ Điện Lực (EVN) khảo sát/HĐ',
    'Vướng thi công / Mặt bằng / Cắt tường',
    'Chờ vật tư cáp / ống ngầm',
    'Khác'
  ];

  // Filtered issue list
  const filteredIssues = useMemo(() => {
    return categorizedStations.filter(s => {
      const hasIssue = s.vuong_mac && s.vuong_mac.trim().length > 2 && s.category !== 'Đã hoàn thành / Không vướng';
      if (!hasIssue && selectedCategory === 'ALL') return false;

      // Universal search matching Mã trạm, Tổ HT, Tên địa điểm, Địa chỉ, Người phụ trách
      const matchSearch = searchTerm === '' ||
        s.ma_tram.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ten_co_so.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_ht.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dia_chi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_truong.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.vuong_mac.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDot = selectedDot === 'ALL' || s.dot === selectedDot;
      const matchCat = selectedCategory === 'ALL' ? true : s.category === selectedCategory;

      return matchSearch && matchDot && matchCat;
    });
  }, [categorizedStations, searchTerm, selectedDot, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Theo Dõi Trực Quan: Vướng Mắc Ở Đâu?
          </div>
          <h2 className="text-lg font-bold text-white">Báo Cáo Tổng Hợp Vướng Mắc & Điểm Nghẽn Triển Khai</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân loại nguyên nhân chậm tiến độ theo đơn vị trách nhiệm (VGREEN, EVN Điện lực, Vật tư, Mặt bằng) để xử lý dứt điểm.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Số vướng mắc đang hiển thị</span>
            <span className="text-xl font-extrabold text-amber-400">
              {filteredIssues.length} trạm
            </span>
          </div>
        </div>
      </div>

      {/* Universal Search Bar & Filters */}
      <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Universal Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tổ hạ tầng, Tên địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Dynamic Đợt Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={selectedDot}
            onChange={(e) => setSelectedDot(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900">Tất cả các đợt ({dotsList.length} đợt)</option>
            {dotsList.map(d => (
              <option key={d} value={d} className="bg-slate-900">{d}</option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat === 'ALL' ? 'Tất cả vướng mắc' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="col-span-full glass-card rounded-xl p-8 text-center text-slate-400 text-xs">
            Không tìm thấy thông tin vướng mắc nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          filteredIssues.map((station) => (
            <div
              key={station.id}
              onClick={() => onSelectStation(station)}
              className="glass-card glass-card-hover rounded-xl p-4 relative flex flex-col justify-between cursor-pointer border-l-4 border-l-amber-500"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-cyan-400">{station.ma_tram}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {station.to_ht} • {station.dot}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white mt-1.5 truncate">{station.ten_co_so}</h4>
                <p className="text-[11px] text-slate-400 truncate">{station.dia_chi || station.dia_ban}</p>

                {/* Category Badge */}
                <div className="mt-2.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {station.category}
                  </span>
                </div>

                {/* Detailed Vuong Mac Note */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-amber-200/90 leading-relaxed font-medium">
                  <MessageSquare className="w-3 h-3 text-amber-400 inline mr-1.5 shrink-0" />
                  "{station.vuong_mac}"
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Phụ trách: <strong>{station.to_truong || 'Chưa rõ'}</strong></span>
                <span className="text-cyan-400 hover:underline flex items-center">
                  Sửa ghi chú <ExternalLink className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
