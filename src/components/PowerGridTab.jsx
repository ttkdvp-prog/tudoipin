import React, { useState, useMemo } from 'react';
import { Zap, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Search, Filter, Layers, Cpu } from 'lucide-react';

export default function PowerGridTab({ stations, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState('ALL');
  const [selectedPhase, setSelectedPhase] = useState('ALL'); // ALL, 3P, 1P
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

  // Filtered Stations (First filter by Search, Dot, Team)
  const baseFilteredStations = useMemo(() => {
    return stations.filter(s => {
      const matchSearch = searchTerm === '' ||
        s.ma_tram.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ten_co_so.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_ht.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dia_chi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_truong.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDot = selectedDot === 'ALL' || s.dot === selectedDot;
      const matchTeam = selectedTeam === 'ALL' || s.to_ht === selectedTeam;

      return matchSearch && matchDot && matchTeam;
    });
  }, [stations, searchTerm, selectedDot, selectedTeam]);

  // 3P vs 1P Counts within the selected Đợt & Search scope
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

  // Final Filtered Stations (also incorporating selectedPhase filter)
  const filteredStations = useMemo(() => {
    return baseFilteredStations.filter(s => {
      const is3P = s.is_3phase !== undefined ? s.is_3phase : ((s.don_vi_phu_trach || '').toLowerCase().includes('điện lực') || (s.pa_dien || '').toLowerCase().includes('3p'));
      if (selectedPhase === '3P') return is3P;
      if (selectedPhase === '1P') return !is3P;
      return true;
    });
  }, [baseFilteredStations, selectedPhase]);

  // Aggregate stats by power connection status
  const stats = useMemo(() => {
    let powerDone = 0; // Đã đóng điện / Đã lắp xong
    let pendingEVN = 0; // Chờ Điện lực khảo sát/HĐ
    let pendingDocs = 0; // Chờ hồ sơ VGREEN
    let issueDocs = 0; // Vướng mắc thủ tục

    filteredStations.forEach(s => {
      const ld = (s.lap_dien || '').toLowerCase();
      const vm = (s.vuong_mac || '').toLowerCase();
      const comb = (ld + ' ' + vm).trim();

      if (comb.includes('đã lắp xong') || comb.includes('đóng điện') || comb.includes('nghiệm thu') || s.status_dien_luc === 'Đã đóng điện') {
        powerDone++;
      } else if (comb.includes('vướng') || comb.includes('chưa nhận') || comb.includes('mặt bằng') || comb.includes('cắt tường')) {
        issueDocs++;
      } else if (comb.includes('vgreen')) {
        pendingDocs++;
      } else {
        pendingEVN++;
      }
    });

    return { powerDone, pendingEVN, pendingDocs, issueDocs };
  }, [filteredStations]);

  // Group by Tổ Hạ Tầng (Team)
  const teamPowerStats = useMemo(() => {
    const map = {};
    filteredStations.forEach(s => {
      const team = s.to_ht || 'Khác';
      if (!map[team]) map[team] = { team, total: 0, powerDone: 0, pendingEVN: 0, issues: 0, p3Count: 0, p1Count: 0 };
      map[team].total++;

      const is3P = s.is_3phase !== undefined ? s.is_3phase : ((s.don_vi_phu_trach || '').toLowerCase().includes('điện lực') || (s.pa_dien || '').toLowerCase().includes('3p'));
      if (is3P) map[team].p3Count++;
      else map[team].p1Count++;

      const ld = (s.lap_dien || '').toLowerCase();
      const vm = (s.vuong_mac || '').toLowerCase();
      const comb = (ld + ' ' + vm).trim();

      if (comb.includes('đã lắp xong') || comb.includes('đóng điện') || comb.includes('nghiệm thu') || s.status_dien_luc === 'Đã đóng điện') {
        map[team].powerDone++;
      } else if (comb.includes('vướng') || comb.includes('chưa nhận') || comb.includes('mặt bằng') || comb.includes('cắt tường')) {
        map[team].issues++;
      } else {
        map[team].pendingEVN++;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredStations]);

  const totalFiltered = filteredStations.length || 1;

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
              <div className="text-2xl font-black text-emerald-400">{Math.round((stats.powerDone / totalFiltered) * 100)}%</div>
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
            placeholder="Tìm theo Mã trạm, Tổ hạ tầng, Tên địa điểm..."
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
              <option value="ALL" className="bg-slate-900">Tất cả các đợt (74 trạm)</option>
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
              <option value="ALL" className="bg-slate-900">Tất cả phương án điện ({baseFilteredStations.length} trạm)</option>
              <option value="3P" className="bg-slate-900">Điện 3 Pha EVN ({phase3PCount} trạm)</option>
              <option value="1P" className="bg-slate-900">Điện 1 Pha / VNPT ({phase1PCount} trạm)</option>
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
          onClick={() => setSelectedPhase('3P')}
          className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 border-l-cyan-500 flex items-center justify-between transition-all ${
            selectedPhase === '3P' ? 'ring-2 ring-cyan-500/50 bg-slate-800/80' : ''
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điện 3 Pha (EVN 3P)</span>
            <div className="text-2xl font-black text-white mt-1">{phase3PCount} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
            <p className="text-[11px] text-cyan-400 mt-0.5">Yêu cầu làm thủ tục đấu nối công tơ 3 pha với Điện lực</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 font-mono font-black text-lg">
            3P
          </div>
        </div>

        <div
          onClick={() => setSelectedPhase('1P')}
          className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer border-l-4 border-l-amber-500 flex items-center justify-between transition-all ${
            selectedPhase === '1P' ? 'ring-2 ring-amber-500/50 bg-slate-800/80' : ''
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điện 1 Pha / VNPT</span>
            <div className="text-2xl font-black text-white mt-1">{phase1PCount} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
            <p className="text-[11px] text-amber-400 mt-0.5">Sử dụng hạ tầng điện hiện hữu VNPT / 1 Pha</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-black text-lg">
            1P
          </div>
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">1. ĐÃ ĐÓNG ĐIỆN / ĐÃ LẮP XONG</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.powerDone} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-emerald-400 mt-1">Ghi nhận cột Lắp điện "Đã lắp xong"</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">2. CHỜ HĐ / KHẢO SÁT EVN</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.pendingEVN} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-amber-400 mt-1">Điện lực đang khảo sát/soạn HĐ</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-4 border-l-cyan-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">3. CHỜ HỒ SƠ / VGREEN</span>
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.pendingDocs} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-cyan-400 mt-1">Gửi hồ sơ nhận phản hồi</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-4 border-l-rose-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">4. VƯỚNG THỦ TỤC CẤP ĐIỆN</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.issueDocs} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-rose-400 mt-1">Cần hỗ trợ giải quyết gấp</p>
        </div>
      </div>

      {/* Team Level Progress Breakdown */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="flex items-center">
            <Zap className="w-4 h-4 mr-2 text-amber-400" />
            Tiến Độ Lắp Điện EVN Theo Tổ Hạ Tầng
          </span>
          <span className="text-xs text-slate-400 font-normal">Hiển thị: {filteredStations.length} trạm</span>
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

              return (
                <div key={item.team} className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs mb-1.5 gap-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100">{item.team}</span>
                      <span className="text-slate-400">({item.total} trạm: {item.p3Count} trạm 3P, {item.p1Count} trạm 1P)</span>
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
