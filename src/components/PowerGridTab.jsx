import React, { useState, useMemo } from 'react';
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  Cpu,
  Download,
  Edit3,
  MapPin,
  Phone,
  XCircle,
  ListFilter
} from 'lucide-react';

export default function PowerGridTab({ stations, onSelectStation, onUpdateStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState('ALL');
  const [selectedPhase, setSelectedPhase] = useState('ALL'); // ALL, 3P, 1P
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, DONE, PENDING_EVN, PENDING_DOCS, ISSUE
  const [selectedTeam, setSelectedTeam] = useState('ALL');

  // Dynamic Batch (Đợt) List
  const dotsList = useMemo(() => {
    const set = new Set(stations.map(s => s.dot).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Dynamic Team List
  const teamsList = useMemo(() => {
    const set = new Set(stations.map(s => s.to_ht).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Helper to categorize power status
  const getPowerCategory = (s) => {
    const ld = (s.lap_dien || '').toLowerCase();
    const vm = (s.vuong_mac || '').toLowerCase();
    const comb = (ld + ' ' + vm).trim();

    if (comb.includes('đã lắp xong') || comb.includes('đóng điện') || comb.includes('nghiệm thu') || s.status_dien_luc === 'Đã đóng điện') {
      return 'DONE';
    } else if (comb.includes('vướng') || comb.includes('chưa nhận') || comb.includes('mặt bằng') || comb.includes('cắt tường')) {
      return 'ISSUE';
    } else if (comb.includes('vgreen')) {
      return 'PENDING_DOCS';
    } else {
      return 'PENDING_EVN';
    }
  };

  // Base Filtered Stations (Search, Dot, Team)
  const baseFilteredStations = useMemo(() => {
    return stations.filter(s => {
      const matchSearch = searchTerm === '' ||
        s.ma_tram.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ten_co_so.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_ht.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dia_chi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_truong.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.lap_dien && s.lap_dien.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.vuong_mac && s.vuong_mac.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDot = selectedDot === 'ALL' || s.dot === selectedDot;
      const matchTeam = selectedTeam === 'ALL' || s.to_ht === selectedTeam;

      return matchSearch && matchDot && matchTeam;
    });
  }, [stations, searchTerm, selectedDot, selectedTeam]);

  // 3P vs 1P Counts within current scope
  const phase3PCount = useMemo(() => {
    return baseFilteredStations.filter(s => {
      if (s.is_3phase !== undefined) return s.is_3phase;
      const pa = (s.pa_dien || '').toLowerCase();
      const dev = (s.don_vi_phu_trach || '').toLowerCase();
      return dev.includes('điện lực') || pa.includes('3p') || pa.includes('3 pha');
    }).length;
  }, [baseFilteredStations]);

  const phase1PCount = useMemo(() => {
    return baseFilteredStations.length - phase3PCount;
  }, [baseFilteredStations, phase3PCount]);

  // Phase Filtered Stations
  const phaseFilteredStations = useMemo(() => {
    return baseFilteredStations.filter(s => {
      const is3P = s.is_3phase !== undefined ? s.is_3phase : ((s.don_vi_phu_trach || '').toLowerCase().includes('điện lực') || (s.pa_dien || '').toLowerCase().includes('3p'));
      if (selectedPhase === '3P') return is3P;
      if (selectedPhase === '1P') return !is3P;
      return true;
    });
  }, [baseFilteredStations, selectedPhase]);

  // Aggregate stats by power status in current phase scope
  const stats = useMemo(() => {
    let powerDone = 0;
    let pendingEVN = 0;
    let pendingDocs = 0;
    let issueDocs = 0;

    phaseFilteredStations.forEach(s => {
      const cat = getPowerCategory(s);
      if (cat === 'DONE') powerDone++;
      else if (cat === 'ISSUE') issueDocs++;
      else if (cat === 'PENDING_DOCS') pendingDocs++;
      else pendingEVN++;
    });

    return { powerDone, pendingEVN, pendingDocs, issueDocs };
  }, [phaseFilteredStations]);

  // Final Filtered Stations (incorporating selectedStatus)
  const finalFilteredStations = useMemo(() => {
    return phaseFilteredStations.filter(s => {
      if (selectedStatus === 'ALL') return true;
      return getPowerCategory(s) === selectedStatus;
    });
  }, [phaseFilteredStations, selectedStatus]);

  // Group by Tổ Hạ Tầng (Team)
  const teamPowerStats = useMemo(() => {
    const map = {};
    phaseFilteredStations.forEach(s => {
      const team = s.to_ht || 'Khác';
      if (!map[team]) map[team] = { team, total: 0, powerDone: 0, pendingEVN: 0, issues: 0, p3Count: 0, p1Count: 0 };
      map[team].total++;

      const is3P = s.is_3phase !== undefined ? s.is_3phase : ((s.don_vi_phu_trach || '').toLowerCase().includes('điện lực') || (s.pa_dien || '').toLowerCase().includes('3p'));
      if (is3P) map[team].p3Count++;
      else map[team].p1Count++;

      const cat = getPowerCategory(s);
      if (cat === 'DONE') map[team].powerDone++;
      else if (cat === 'ISSUE') map[team].issues++;
      else map[team].pendingEVN++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [phaseFilteredStations]);

  const totalFilteredScope = phaseFilteredStations.length || 1;

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['STT', 'Mã Trạm', 'Đợt', 'Tên Cơ Sở', 'Tổ HT', 'Tổ Trưởng', 'SĐT', 'Phương Án Điện', 'Tình Trạng Lắp Điện', 'Tồn Lại / Vướng Mắc'];
    const rows = finalFilteredStations.map((s, idx) => [
      idx + 1,
      `"${s.ma_tram || ''}"`,
      `"${s.dot || ''}"`,
      `"${(s.ten_co_so || '').replace(/"/g, '""')}"`,
      `"${s.to_ht || ''}"`,
      `"${s.to_truong || ''}"`,
      `"${s.sdt || ''}"`,
      `"${s.pa_dien || ''}"`,
      `"${(s.lap_dien || s.status_dien_luc || '').replace(/"/g, '""')}"`,
      `"${(s.vuong_mac || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Thong_Ke_Danh_Sach_Lap_Dien_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedDot('ALL');
    setSelectedPhase('ALL');
    setSelectedStatus('ALL');
    setSelectedTeam('ALL');
  };

  const hasActiveFilters = searchTerm !== '' || selectedDot !== 'ALL' || selectedPhase !== 'ALL' || selectedStatus !== 'ALL' || selectedTeam !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Top Banner EVN Status */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden bg-gradient-to-r from-violet-50 via-indigo-50/60 to-blue-50 border border-violet-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-violet-100 text-violet-800 border border-violet-200 mb-2">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-amber-500" />
              Thống Kê Tiến Độ Cấp Điện Điện Lực (EVN)
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Quản Lý & Theo Dõi Thủ Tục Đấu Nối Điện Lực</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-medium">
              Phân tích chuẩn xác số liệu đấu nối điện theo từng <strong>Đợt triển khai</strong> và đọc cột <strong>Lắp Điện / Ghi Chú</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold">Tỷ lệ đóng điện xong</div>
              <div className="text-2xl font-black text-emerald-600">{Math.round((stats.powerDone / totalFilteredScope) * 100)}%</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Universal Search & Multi-Filters Toolbar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 border border-slate-200/80 shadow-xs">
        {/* Universal Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tổ HT, Tên địa điểm, Lắp điện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Đợt Filter */}
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

          {/* Điện 3P vs 1P Filter */}
          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5">
            <Cpu className="w-3.5 h-3.5 text-orange-500" />
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả PA điện ({baseFilteredStations.length} trạm)</option>
              <option value="3P">Điện 3 Pha EVN ({phase3PCount} trạm)</option>
              <option value="1P">Điện 1 Pha / VNPT ({phase1PCount} trạm)</option>
            </select>
          </div>

          {/* Trạng thái Lắp điện Filter */}
          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-violet-600" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả tiến độ</option>
              <option value="DONE">Đã đóng điện / Đã lắp xong</option>
              <option value="PENDING_EVN">Chờ HĐ / Khảo sát EVN</option>
              <option value="PENDING_DOCS">Chờ hồ sơ / VGREEN</option>
              <option value="ISSUE">Vướng thủ tục cấp điện</option>
            </select>
          </div>

          {/* Tổ HT Filter */}
          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
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
        </div>
      </div>

      {/* Power Supply Phase Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setSelectedPhase(prev => prev === '3P' ? 'ALL' : '3P')}
          className={`rounded-2xl p-5 cursor-pointer border flex items-center justify-between transition-all shadow-xs ${
            selectedPhase === '3P' ? 'bg-[#D6E8FC] border-blue-400 ring-2 ring-blue-500/30' : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Điện 3 Pha (EVN 3P)</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{phase3PCount} <span className="text-xs text-slate-500 font-normal">trạm</span></div>
            <p className="text-[11px] text-blue-700 font-semibold mt-0.5">Click để lọc danh sách trạm đấu nối 3 pha Điện lực EVN</p>
          </div>
          <div className={`p-3 rounded-2xl font-mono font-black text-lg ${
            selectedPhase === '3P' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-100 text-blue-800'
          }`}>
            3P
          </div>
        </div>

        <div
          onClick={() => setSelectedPhase(prev => prev === '1P' ? 'ALL' : '1P')}
          className={`rounded-2xl p-5 cursor-pointer border flex items-center justify-between transition-all shadow-xs ${
            selectedPhase === '1P' ? 'bg-[#FDE3D9] border-orange-400 ring-2 ring-orange-500/30' : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div>
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Điện 1 Pha / VNPT</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{phase1PCount} <span className="text-xs text-slate-500 font-normal">trạm</span></div>
            <p className="text-[11px] text-orange-700 font-semibold mt-0.5">Click để lọc danh sách trạm dùng hạ tầng điện VNPT / 1 Pha</p>
          </div>
          <div className={`p-3 rounded-2xl font-mono font-black text-lg ${
            selectedPhase === '1P' ? 'bg-orange-600 text-white shadow-xs' : 'bg-orange-100 text-orange-800'
          }`}>
            1P
          </div>
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedStatus(prev => prev === 'DONE' ? 'ALL' : 'DONE')}
          className={`rounded-2xl p-4 cursor-pointer border transition-all shadow-xs ${
            selectedStatus === 'DONE' ? 'bg-[#D1F4E0] border-emerald-400 ring-2 ring-emerald-500/30' : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase">1. ĐÃ ĐÓNG ĐIỆN / ĐÃ LẮP XONG</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.powerDone} <span className="text-xs text-slate-500 font-normal">trạm</span></div>
          <p className="text-[11px] text-emerald-800 font-semibold mt-1">Cột Lắp điện "Đã lắp xong" / Đóng điện</p>
        </div>

        <div
          onClick={() => setSelectedStatus(prev => prev === 'PENDING_EVN' ? 'ALL' : 'PENDING_EVN')}
          className={`rounded-2xl p-4 cursor-pointer border transition-all shadow-xs ${
            selectedStatus === 'PENDING_EVN' ? 'bg-[#FDE3D9] border-orange-400 ring-2 ring-orange-500/30' : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase">2. CHỜ HĐ / KHẢO SÁT EVN</span>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.pendingEVN} <span className="text-xs text-slate-500 font-normal">trạm</span></div>
          <p className="text-[11px] text-orange-800 font-semibold mt-1">Điện lực đang khảo sát / soạn HĐ</p>
        </div>

        <div
          onClick={() => setSelectedStatus(prev => prev === 'PENDING_DOCS' ? 'ALL' : 'PENDING_DOCS')}
          className={`rounded-2xl p-4 cursor-pointer border transition-all shadow-xs ${
            selectedStatus === 'PENDING_DOCS' ? 'bg-[#ECE8FE] border-purple-400 ring-2 ring-purple-500/30' : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase">3. CHỜ HỒ SƠ / VGREEN</span>
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.pendingDocs} <span className="text-xs text-slate-500 font-normal">trạm</span></div>
          <p className="text-[11px] text-purple-800 font-semibold mt-1">Gửi hồ sơ nhận phản hồi VGREEN</p>
        </div>

        <div
          onClick={() => setSelectedStatus(prev => prev === 'ISSUE' ? 'ALL' : 'ISSUE')}
          className={`rounded-2xl p-4 cursor-pointer border transition-all shadow-xs ${
            selectedStatus === 'ISSUE' ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-500/30' : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase">4. VƯỚNG THỦ TỤC CẤP ĐIỆN</span>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.issueDocs} <span className="text-xs text-slate-500 font-normal">trạm</span></div>
          <p className="text-[11px] text-orange-800 font-semibold mt-1">Cần hỗ trợ xử lý tồn lại/vướng mắc</p>
        </div>
      </div>

      {/* Detailed Station Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        {/* Table Header & Active Filter Chips */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <ListFilter className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Thống Kê Danh Sách Chi Tiết Trạm Cấp Điện EVN
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-violet-100 text-violet-800 border border-violet-200">
                {finalFilteredStations.length} trạm
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Hiển thị chi tiết Mã trạm, Tên cơ sở, Tổ HT, Tình trạng lắp điện và Tồn lại / Ghi chú vướng mắc.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-[#1E1B3A] hover:bg-[#2B274F] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold">Đang lọc theo:</span>
            {selectedDot !== 'ALL' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                {selectedDot}
              </span>
            )}
            {selectedPhase !== 'ALL' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-bold">
                {selectedPhase === '3P' ? 'Điện 3 Pha EVN' : 'Điện 1 Pha VNPT'}
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-bold">
                {selectedStatus === 'DONE' && 'Đã đóng điện / Đã lắp xong'}
                {selectedStatus === 'PENDING_EVN' && 'Chờ HĐ / Khảo sát EVN'}
                {selectedStatus === 'PENDING_DOCS' && 'Chờ hồ sơ / VGREEN'}
                {selectedStatus === 'ISSUE' && 'Vướng thủ tục cấp điện'}
              </span>
            )}
            {selectedTeam !== 'ALL' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300 font-bold">
                Tổ HT: {selectedTeam}
              </span>
            )}
            {searchTerm !== '' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300 font-medium">
                Từ khóa: "{searchTerm}"
              </span>
            )}
          </div>
        )}

        {/* Table Element */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3.5 text-center w-12">STT</th>
                <th className="py-3.5 px-4">Mã Trạm / Đợt</th>
                <th className="py-3.5 px-4">Tên Cơ Sở & Địa Chỉ</th>
                <th className="py-3.5 px-4">Tổ HT & Phụ Trách</th>
                <th className="py-3.5 px-4">Tình Trạng Lắp Điện</th>
                <th className="py-3.5 px-4">Tồn Lại & Ghi Chú Vướng Mắc</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {finalFilteredStations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-slate-400" />
                      <p className="font-semibold text-slate-600">Không tìm thấy dữ liệu trạm phù hợp với bộ lọc</p>
                      <button
                        onClick={clearAllFilters}
                        className="mt-2 text-violet-700 underline hover:text-violet-900 text-xs font-bold"
                      >
                        Xóa bộ lọc để xem tất cả ({stations.length} trạm)
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                finalFilteredStations.map((station, index) => {
                  const powerCat = getPowerCategory(station);
                  const statusText = station.lap_dien || station.status_dien_luc || 'Chưa triển khai';
                  const vuongMacText = station.vuong_mac || station.lyDoVuongMac || '';

                  return (
                    <tr key={station.id || station.ma_tram} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3.5 text-center font-mono text-slate-500 font-bold">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-violet-700 text-xs tracking-wide">
                          {station.ma_tram}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                            {station.dot || 'đợt 1'}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            station.is_3phase ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}>
                            {station.is_3phase ? 'EVN 3P' : 'VNPT 1P'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {station.ten_co_so}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center mt-1 font-medium">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{station.dia_chi || station.phuong_xa || station.dia_ban || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">{station.to_ht}</div>
                        <div className="text-[11px] text-slate-500 flex items-center mt-0.5 space-x-1 font-medium">
                          <span>{station.to_truong || 'Chưa gán'}</span>
                          {station.sdt && (
                            <a href={`tel:${station.sdt}`} className="text-violet-700 hover:underline font-mono text-[10px] flex items-center font-bold">
                              <Phone className="w-2.5 h-2.5 ml-1 mr-0.5" />
                              {station.sdt}
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          powerCat === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : powerCat === 'ISSUE'
                            ? 'bg-orange-100 text-orange-800 border-orange-200'
                            : powerCat === 'PENDING_DOCS'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {powerCat === 'DONE' && <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />}
                          {powerCat === 'ISSUE' && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600 shrink-0" />}
                          {powerCat === 'PENDING_EVN' && <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />}
                          {powerCat === 'PENDING_DOCS' && <Clock className="w-3.5 h-3.5 mr-1 text-purple-600 shrink-0" />}
                          <span className="truncate">{statusText}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {vuongMacText ? (
                          <div className="text-xs text-orange-900 bg-orange-100/70 border border-orange-200 px-2.5 py-1.5 rounded-xl leading-relaxed font-medium">
                            <span className="font-bold text-orange-950 mr-1">Tồn lại:</span>
                            {vuongMacText}
                          </div>
                        ) : powerCat === 'DONE' ? (
                          <span className="text-emerald-700 text-xs font-bold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Không có tồn lại
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic font-medium">
                            Đang theo dõi thủ tục
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectStation(station)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa thông số</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="bg-slate-50/90 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 font-medium">
          <div>
            Hiển thị <strong className="text-slate-900">{finalFilteredStations.length}</strong> / <strong>{stations.length}</strong> trạm tổng số
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-700 font-bold">
              Đã hoàn thành: {finalFilteredStations.filter(s => getPowerCategory(s) === 'DONE').length} trạm
            </span>
            <span className="text-amber-700 font-bold">
              Chờ xử lý: {finalFilteredStations.filter(s => getPowerCategory(s) === 'PENDING_EVN' || getPowerCategory(s) === 'PENDING_DOCS').length} trạm
            </span>
            <span className="text-orange-700 font-bold">
              Tồn lại/Vướng: {finalFilteredStations.filter(s => getPowerCategory(s) === 'ISSUE').length} trạm
            </span>
          </div>
        </div>
      </div>

      {/* Team Level Progress Breakdown */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="flex items-center">
            <Zap className="w-4 h-4 mr-2 text-violet-600" />
            Tiến Độ Lắp Điện EVN Theo Tổ Hạ Tầng
          </span>
          <span className="text-xs text-slate-500 font-bold">
            Phạm vi: {phaseFilteredStations.length} trạm
          </span>
        </h3>

        <div className="space-y-4">
          {teamPowerStats.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              Không tìm thấy trạm phù hợp với bộ lọc tìm kiếm.
            </div>
          ) : (
            teamPowerStats.map((item) => {
              const powerPct = Math.round((item.powerDone / item.total) * 100);
              const pendingPct = Math.round((item.pendingEVN / item.total) * 100);
              const issuePct = Math.round((item.issues / item.total) * 100);
              const isSelected = selectedTeam === item.team;

              return (
                <div
                  key={item.team}
                  onClick={() => setSelectedTeam(prev => prev === item.team ? 'ALL' : item.team)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-violet-50/50 border-violet-400 ring-2 ring-violet-500/20'
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs mb-2 gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900">{item.team}</span>
                      <span className="text-slate-500 font-medium">({item.total} trạm: {item.p3Count} trạm 3P, {item.p1Count} trạm 1P)</span>
                      {isSelected && (
                        <span className="text-[10px] bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full font-bold">Đang chọn</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] font-bold">
                      <span className="text-emerald-700">{item.powerDone} xong</span>
                      <span className="text-amber-700">{item.pendingEVN} chờ EVN</span>
                      <span className="text-orange-700">{item.issues} vướng</span>
                    </div>
                  </div>

                  {/* Progress bar stack */}
                  <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden flex border border-slate-200">
                    <div style={{ width: `${powerPct}%` }} className="bg-emerald-500 h-full" title={`Đã xong: ${powerPct}%`} />
                    <div style={{ width: `${pendingPct}%` }} className="bg-amber-500 h-full" title={`Chờ EVN: ${pendingPct}%`} />
                    <div style={{ width: `${issuePct}%` }} className="bg-orange-500 h-full" title={`Vướng mắc: ${issuePct}%`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
