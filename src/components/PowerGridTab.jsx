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
      <div className="glass-card rounded-xl p-5 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-cyan-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-evn-blue/40 text-cyan-300 border border-cyan-500/30 mb-2">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Thống Kê Tiến Độ Cấp Điện Điện Lực (EVN)
            </div>
            <h2 className="text-xl font-extrabold text-white">Quản Lý & Theo Dõi Thủ Tục Đấu Nối Điện Lực</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Phân tích chuẩn xác số liệu đấu nối điện theo từng **Đợt triển khai** và đọc cột **Lắp Điện / Ghi Chú**.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Tỷ lệ đóng điện xong</div>
              <div className="text-2xl font-black text-emerald-400">{Math.round((stats.powerDone / totalFilteredScope) * 100)}%</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Universal Search & Multi-Filters Toolbar */}
      <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Universal Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tổ HT, Tên địa điểm, Lắp điện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Đợt Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedDot}
              onChange={(e) => setSelectedDot(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả các đợt ({stations.length} trạm)</option>
              {dotsList.map(d => (
                <option key={d} value={d} className="bg-slate-900">{d}</option>
              ))}
            </select>
          </div>

          {/* Điện 3P vs 1P Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả PA điện ({baseFilteredStations.length} trạm)</option>
              <option value="3P" className="bg-slate-900">Điện 3 Pha EVN ({phase3PCount} trạm)</option>
              <option value="1P" className="bg-slate-900">Điện 1 Pha / VNPT ({phase1PCount} trạm)</option>
            </select>
          </div>

          {/* Trạng thái Lắp điện Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả tiến độ</option>
              <option value="DONE" className="bg-slate-900">Đã đóng điện / Đã lắp xong</option>
              <option value="PENDING_EVN" className="bg-slate-900">Chờ HĐ / Khảo sát EVN</option>
              <option value="PENDING_DOCS" className="bg-slate-900">Chờ hồ sơ / VGREEN</option>
              <option value="ISSUE" className="bg-slate-900">Vướng thủ tục cấp điện</option>
            </select>
          </div>

          {/* Tổ HT Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả Tổ Hạ Tầng</option>
              {teamsList.map(t => (
                <option key={t} value={t} className="bg-slate-900">{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Power Supply Phase Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setSelectedPhase(prev => prev === '3P' ? 'ALL' : '3P')}
          className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 border-l-cyan-500 flex items-center justify-between transition-all ${
            selectedPhase === '3P' ? 'ring-2 ring-cyan-500 bg-cyan-950/30' : ''
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điện 3 Pha (EVN 3P)</span>
            <div className="text-2xl font-black text-white mt-1">{phase3PCount} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
            <p className="text-[11px] text-cyan-400 mt-0.5">Click để lọc danh sách trạm đấu nối 3 pha Điện lực EVN</p>
          </div>
          <div className={`p-3 rounded-xl font-mono font-black text-lg ${
            selectedPhase === '3P' ? 'bg-cyan-500 text-slate-950' : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            3P
          </div>
        </div>

        <div
          onClick={() => setSelectedPhase(prev => prev === '1P' ? 'ALL' : '1P')}
          className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 border-l-amber-500 flex items-center justify-between transition-all ${
            selectedPhase === '1P' ? 'ring-2 ring-amber-500 bg-amber-950/30' : ''
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điện 1 Pha / VNPT</span>
            <div className="text-2xl font-black text-white mt-1">{phase1PCount} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
            <p className="text-[11px] text-amber-400 mt-0.5">Click để lọc danh sách trạm dùng hạ tầng điện VNPT / 1 Pha</p>
          </div>
          <div className={`p-3 rounded-xl font-mono font-black text-lg ${
            selectedPhase === '1P' ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/20 text-amber-400'
          }`}>
            1P
          </div>
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedStatus(prev => prev === 'DONE' ? 'ALL' : 'DONE')}
          className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 border-l-emerald-500 transition-all ${
            selectedStatus === 'DONE' ? 'ring-2 ring-emerald-500 bg-emerald-950/30' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">1. ĐÃ ĐÓNG ĐIỆN / ĐÃ LẮP XONG</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.powerDone} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-emerald-400 mt-1">Cột Lắp điện "Đã lắp xong" / Đóng điện</p>
        </div>

        <div
          onClick={() => setSelectedStatus(prev => prev === 'PENDING_EVN' ? 'ALL' : 'PENDING_EVN')}
          className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 border-l-amber-500 transition-all ${
            selectedStatus === 'PENDING_EVN' ? 'ring-2 ring-amber-500 bg-amber-950/30' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">2. CHỜ HĐ / KHẢO SÁT EVN</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.pendingEVN} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-amber-400 mt-1">Điện lực đang khảo sát / soạn HĐ</p>
        </div>

        <div
          onClick={() => setSelectedStatus(prev => prev === 'PENDING_DOCS' ? 'ALL' : 'PENDING_DOCS')}
          className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 border-l-cyan-500 transition-all ${
            selectedStatus === 'PENDING_DOCS' ? 'ring-2 ring-cyan-500 bg-cyan-950/30' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">3. CHỜ HỒ SƠ / VGREEN</span>
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.pendingDocs} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-cyan-400 mt-1">Gửi hồ sơ nhận phản hồi VGREEN</p>
        </div>

        <div
          onClick={() => setSelectedStatus(prev => prev === 'ISSUE' ? 'ALL' : 'ISSUE')}
          className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 border-l-amber-500 transition-all ${
            selectedStatus === 'ISSUE' ? 'ring-2 ring-amber-500 bg-amber-950/30' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">4. VƯỚNG THỦ TỤC CẤP ĐIỆN</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.issueDocs} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-amber-400 mt-1">Cần hỗ trợ xử lý tồn lại/vướng mắc</p>
        </div>
      </div>

      {/* Detailed Station Data Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-slate-700/80 shadow-xl">
        {/* Table Header & Active Filter Chips */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <ListFilter className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Thống Kê Danh Sách Chi Tiết Trạm Cấp Điện EVN
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {finalFilteredStations.length} trạm
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Hiển thị chi tiết Mã trạm, Tên cơ sở, Tổ HT, Tình trạng lắp điện và Tồn lại / Ghi chú vướng mắc.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Đang lọc theo:</span>
            {selectedDot !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                {selectedDot}
              </span>
            )}
            {selectedPhase !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                {selectedPhase === '3P' ? 'Điện 3 Pha EVN' : 'Điện 1 Pha VNPT'}
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                {selectedStatus === 'DONE' && 'Đã đóng điện / Đã lắp xong'}
                {selectedStatus === 'PENDING_EVN' && 'Chờ HĐ / Khảo sát EVN'}
                {selectedStatus === 'PENDING_DOCS' && 'Chờ hồ sơ / VGREEN'}
                {selectedStatus === 'ISSUE' && 'Vướng thủ tục cấp điện'}
              </span>
            )}
            {selectedTeam !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-semibold">
                Tổ HT: {selectedTeam}
              </span>
            )}
            {searchTerm !== '' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Từ khóa: "{searchTerm}"
              </span>
            )}
          </div>
        )}

        {/* Table Element */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">STT</th>
                <th className="py-3 px-4">Mã Trạm / Đợt</th>
                <th className="py-3 px-4">Tên Cơ Sở & Địa Chỉ</th>
                <th className="py-3 px-4">Tổ HT & Phụ Trách</th>
                <th className="py-3 px-4">Tình Trạng Lắp Điện</th>
                <th className="py-3 px-4">Tồn Lại & Ghi Chú Vướng Mắc</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {finalFilteredStations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-slate-500" />
                      <p className="font-semibold text-slate-300">Không tìm thấy dữ liệu trạm phù hợp với bộ lọc</p>
                      <button
                        onClick={clearAllFilters}
                        className="mt-2 text-cyan-400 underline hover:text-cyan-300 text-xs font-medium"
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
                    <tr key={station.id || station.ma_tram} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-3.5 text-center font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-black text-cyan-400 text-xs tracking-wide">
                          {station.ma_tram}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                            {station.dot || 'đợt 1'}
                          </span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            station.is_3phase ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {station.is_3phase ? 'EVN 3P' : 'VNPT 1P'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-100 text-xs leading-snug">
                          {station.ten_co_so}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1 text-slate-500 shrink-0" />
                          <span className="truncate">{station.dia_chi || station.phuong_xa || station.dia_ban || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200 text-xs">{station.to_ht}</div>
                        <div className="text-[11px] text-slate-400 flex items-center mt-0.5 space-x-1">
                          <span>{station.to_truong || 'Chưa gán'}</span>
                          {station.sdt && (
                            <a href={`tel:${station.sdt}`} className="text-cyan-400 hover:underline font-mono text-[10px] flex items-center">
                              <Phone className="w-2.5 h-2.5 ml-1 mr-0.5" />
                              {station.sdt}
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          powerCat === 'DONE'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : powerCat === 'ISSUE'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            : powerCat === 'PENDING_DOCS'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                            : 'bg-amber-950/40 text-amber-200 border-amber-500/20'
                        }`}>
                          {powerCat === 'DONE' && <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />}
                          {powerCat === 'ISSUE' && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />}
                          {powerCat === 'PENDING_EVN' && <Clock className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />}
                          {powerCat === 'PENDING_DOCS' && <Clock className="w-3.5 h-3.5 mr-1 text-cyan-400 shrink-0" />}
                          <span className="truncate">{statusText}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {vuongMacText ? (
                          <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg leading-relaxed">
                            <span className="font-bold text-amber-400 mr-1">Tồn lại:</span>
                            {vuongMacText}
                          </div>
                        ) : powerCat === 'DONE' ? (
                          <span className="text-emerald-400 text-xs font-medium flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            Không có tồn lại
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Đang theo dõi thủ tục
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectStation(station)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
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
        <div className="bg-slate-900/80 px-4 py-3 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            Hiển thị <strong>{finalFilteredStations.length}</strong> / <strong>{stations.length}</strong> trạm tổng số
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400 font-medium">
              Đã hoàn thành: {finalFilteredStations.filter(s => getPowerCategory(s) === 'DONE').length} trạm
            </span>
            <span className="text-amber-400 font-medium">
              Chờ xử lý: {finalFilteredStations.filter(s => getPowerCategory(s) === 'PENDING_EVN' || getPowerCategory(s) === 'PENDING_DOCS').length} trạm
            </span>
            <span className="text-rose-400 font-medium">
              Tồn lại/Vướng: {finalFilteredStations.filter(s => getPowerCategory(s) === 'ISSUE').length} trạm
            </span>
          </div>
        </div>
      </div>

      {/* Team Level Progress Breakdown */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="flex items-center">
            <Zap className="w-4 h-4 mr-2 text-amber-400" />
            Tiến Độ Lắp Điện EVN Theo Tổ Hạ Tầng
          </span>
          <span className="text-xs text-slate-400 font-normal">
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
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500/80 ring-1 ring-cyan-500/40'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs mb-1.5 gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100">{item.team}</span>
                      <span className="text-slate-400">({item.total} trạm: {item.p3Count} trạm 3P, {item.p1Count} trạm 1P)</span>
                      {isSelected && (
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-semibold">Đang chọn</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-[11px]">
                      <span className="text-emerald-400 font-medium">{item.powerDone} xong</span>
                      <span className="text-amber-400 font-medium">{item.pendingEVN} chờ EVN</span>
                      <span className="text-rose-400 font-medium">{item.issues} vướng</span>
                    </div>
                  </div>

                  {/* Progress bar stack */}
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
                    <div style={{ width: `${powerPct}%` }} className="bg-emerald-500 h-full" title={`Đã xong: ${powerPct}%`} />
                    <div style={{ width: `${pendingPct}%` }} className="bg-amber-500 h-full" title={`Chờ EVN: ${pendingPct}%`} />
                    <div style={{ width: `${issuePct}%` }} className="bg-rose-500 h-full" title={`Vướng mắc: ${issuePct}%`} />
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
