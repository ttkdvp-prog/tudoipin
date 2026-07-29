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
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden bg-gradient-to-r from-orange-50 via-amber-50/60 to-rose-50 border border-orange-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-800 border border-orange-200 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
            Theo Dõi Trực Quan: Vướng Mắc & Ghi Chú Tiến Độ
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Báo Cáo Phân Loại Vướng Mắc & Thủ Tục Triển Khai</h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium">
            Phân định rõ giữa <strong>Trạm có vướng mắc thực sự</strong> (Chờ VGREEN, Cắt tường/mặt bằng) và <strong>Trạm đang làm thủ tục EVN bình thường</strong>.
          </p>
        </div>

        {/* Breakdown Badges */}
        <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-center pr-3 border-r border-slate-200">
            <span className="text-[10px] text-rose-600 uppercase font-extrabold block">Vướng mắc cần xử lý</span>
            <span className="text-xl font-black text-rose-700">{realIssuesCount} <span className="text-xs font-bold text-slate-500">trạm</span></span>
          </div>
          <div className="text-center pl-1">
            <span className="text-[10px] text-orange-600 uppercase font-extrabold block">Đang thủ tục EVN</span>
            <span className="text-xl font-black text-orange-700">{evnPendingCount} <span className="text-xs font-bold text-slate-500">trạm</span></span>
          </div>
        </div>
      </div>

      {/* Universal Search Bar & Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 border border-slate-200/80 shadow-xs">
        {/* Universal Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tổ hạ tầng, Tên địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
          />
        </div>

        {/* Dynamic Đợt Filter */}
        <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5">
          <Layers className="w-3.5 h-3.5 text-violet-600" />
          <select
            value={selectedDot}
            onChange={(e) => setSelectedDot(e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả các đợt ({stations.length} trạm)</option>
            {dotsList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Real Issue Toggle */}
        <button
          onClick={() => setOnlyRealIssues(!onlyRealIssues)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            onlyRealIssues
              ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-xs'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#1E1B3A] text-white shadow-md shadow-violet-950/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
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
          <div className="col-span-full glass-card rounded-2xl p-8 text-center text-slate-500 text-xs font-medium border border-slate-200/80">
            Không tìm thấy ghi chú vướng mắc nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          filteredIssues.map((station) => {
            const isRedIssue = station.isRealIssue;

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`glass-card glass-card-hover rounded-2xl p-4 relative flex flex-col justify-between cursor-pointer border shadow-xs transition-all ${
                  isRedIssue ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300' : 'bg-orange-50/40 border-orange-200 hover:border-orange-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-violet-700">{station.ma_tram}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-800 border border-slate-200">
                      {station.to_ht} • {station.dot}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-900 mt-2 truncate">{station.ten_co_so}</h4>
                  <p className="text-[11px] text-slate-500 truncate font-medium">{station.dia_chi || station.dia_ban}</p>

                  {/* Category Badge */}
                  <div className="mt-2.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isRedIssue ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-orange-100 text-orange-800 border-orange-200'
                    }`}>
                      {station.category}
                    </span>
                  </div>

                  {/* Detailed Vuong Mac Note */}
                  <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-medium shadow-xs">
                    <MessageSquare className={`w-3.5 h-3.5 inline mr-1.5 shrink-0 ${isRedIssue ? 'text-rose-600' : 'text-orange-600'}`} />
                    "{station.vuong_mac}"
                  </div>
                </div>

                {/* Footer info */}
                <div className="mt-4 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Phụ trách: <strong className="text-slate-800">{station.to_truong || 'Chưa rõ'}</strong></span>
                  <span className="text-violet-700 hover:underline font-bold">
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
