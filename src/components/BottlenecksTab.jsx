import React, { useState, useMemo } from 'react';
import { AlertTriangle, Search, Filter, MessageSquare, ExternalLink, Layers, CheckCircle2, Clock, Wrench } from 'lucide-react';

export default function BottlenecksTab({ stations, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyRealIssues, setOnlyRealIssues] = useState(false); // Toggle to filter real bottlenecks vs all status notes

  // Dynamic Batch List
  const dotsList = useMemo(() => {
    const set = new Set(stations.map(s => s.dot).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Precise categorization of every note
  const categorizedStations = useMemo(() => {
    return stations.map(s => {
      const vm = (s.vuong_mac || '').toLowerCase().trim();
      let category = 'Bình thường / Chưa ghi chú';
      let isRealIssue = false;

      if (vm.includes('vgreen') || vm.includes('chưa nhận lại')) {
        category = 'Chờ VGREEN phản hồi hồ sơ';
        isRealIssue = true;
      } else if (vm.includes('cắt tường') || vm.includes('mặt bằng') || vm.includes('thi công')) {
        category = 'Vướng thi công / Mặt bằng / Cắt tường';
        isRealIssue = true;
      } else if (vm.includes('hợp đồng') || vm.includes('khảo sát') || vm.includes('chờ điện lực') || vm.includes('soạn hđ') || vm.includes('giấy tờ') || vm.includes('trình ban')) {
        category = 'Chờ Điện Lực (EVN) khảo sát/HĐ';
        isRealIssue = false; // In-progress procedure
      } else if (vm.length > 0) {
        category = 'Ghi chú tiến độ khác';
        isRealIssue = true;
      }

      return { ...s, category, isRealIssue, hasNote: vm.length > 0 };
    });
  }, [stations]);

  // Categories list
  const categories = [
    'ALL',
    'Chờ VGREEN phản hồi hồ sơ',
    'Vướng thi công / Mặt bằng / Cắt tường',
    'Chờ Điện Lực (EVN) khảo sát/HĐ',
    'Ghi chú tiến độ khác'
  ];

  // Filtered stations for bottleneck tab
  const filteredIssues = useMemo(() => {
    return categorizedStations.filter(s => {
      // Must have note
      if (!s.hasNote) return false;

      if (onlyRealIssues && !s.isRealIssue) return false;

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
  }, [categorizedStations, searchTerm, selectedDot, selectedCategory, onlyRealIssues]);

  // Counts for header summary
  const realIssuesCount = useMemo(() => {
    return categorizedStations.filter(s => {
      const matchDot = selectedDot === 'ALL' || s.dot === selectedDot;
      return matchDot && s.isRealIssue;
    }).length;
  }, [categorizedStations, selectedDot]);

  const evnPendingCount = useMemo(() => {
    return categorizedStations.filter(s => {
      const matchDot = selectedDot === 'ALL' || s.dot === selectedDot;
      return matchDot && s.category === 'Chờ Điện Lực (EVN) khảo sát/HĐ';
    }).length;
  }, [categorizedStations, selectedDot]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Theo Dõi Trực Quan: Vướng Mắc & Ghi Chú Tiến Độ
          </div>
          <h2 className="text-lg font-bold text-white">Báo Cáo Phân Loại Vướng Mắc & Thủ Tục Triển Khai</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân định rõ giữa **Trạm có vướng mắc thực sự** (Chờ VGREEN, Cắt tường/mặt bằng) và **Trạm đang làm thủ tục EVN bình thường**.
          </p>
        </div>

        {/* Breakdown Badges */}
        <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
          <div className="text-center pr-3 border-r border-slate-700">
            <span className="text-[10px] text-rose-400 uppercase font-bold block">Vướng mắc cần xử lý</span>
            <span className="text-xl font-extrabold text-rose-400">{realIssuesCount} <span className="text-xs font-normal">trạm</span></span>
          </div>
          <div className="text-center pl-1">
            <span className="text-[10px] text-amber-400 uppercase font-bold block">Đang thủ tục EVN</span>
            <span className="text-xl font-extrabold text-amber-400">{evnPendingCount} <span className="text-xs font-normal">trạm</span></span>
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
            <option value="ALL" className="bg-slate-900">Tất cả các đợt (74 trạm)</option>
            {dotsList.map(d => (
              <option key={d} value={d} className="bg-slate-900">{d}</option>
            ))}
          </select>
        </div>

        {/* Real Issue Toggle */}
        <button
          onClick={() => setOnlyRealIssues(!onlyRealIssues)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            onlyRealIssues
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {onlyRealIssues ? '✓ Chỉ xem vướng mắc thực sự' : 'Xem tất cả ghi chú'}
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả nhóm ghi chú' : cat}
            </button>
          );
        })}
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="col-span-full glass-card rounded-xl p-8 text-center text-slate-400 text-xs">
            Không tìm thấy ghi chú vướng mắc nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          filteredIssues.map((station) => {
            const isRedIssue = station.isRealIssue;

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`glass-card glass-card-hover rounded-xl p-4 relative flex flex-col justify-between cursor-pointer border-l-4 ${
                  isRedIssue ? 'border-l-rose-500' : 'border-l-amber-500'
                }`}
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
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isRedIssue ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {station.category}
                    </span>
                  </div>

                  {/* Detailed Vuong Mac Note */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-medium">
                    <MessageSquare className={`w-3 h-3 inline mr-1.5 shrink-0 ${isRedIssue ? 'text-rose-400' : 'text-amber-400'}`} />
                    "{station.vuong_mac}"
                  </div>
                </div>

                {/* Footer info */}
                <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Phụ trách: <strong>{station.to_truong || 'Chưa rõ'}</strong></span>
                  <span className="text-cyan-400 hover:underline font-semibold">
                    Sửa thông số ✎
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
