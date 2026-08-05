import React, { useState, useMemo } from 'react';
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Edit3,
  Building2,
  Users,
  Save,
  Check,
  RefreshCw,
  Layers,
  Activity,
  ClipboardList,
  FileSearch
} from 'lucide-react';

// Helper to accurately classify station status
export function getStationStatusCategory(s) {
  const ld = (s.lap_dien || '').toLowerCase().trim();
  const vm = (s.vuong_mac || '').toLowerCase().trim();
  const comb = (ld + ' ' + vm).trim();

  // 1. Completed
  if (
    comb.includes('đã lắp xong') ||
    comb.includes('đã đóng điện') ||
    comb.includes('nghiệm thu') ||
    comb.includes('hoàn thành') ||
    ld === 'đã lắp xong'
  ) {
    return 'DONE';
  }

  // 2. Real Issues / Vướng mắc / Trở ngại / Yêu cầu đặc biệt (ví dụ: "Điện lực yêu cầu làm 1 đầu mối ký hợp đồng")
  const isExplicitIssue =
    comb.includes('vướng') ||
    comb.includes('yêu cầu') ||
    comb.includes('mặt bằng') ||
    comb.includes('thi công') ||
    comb.includes('cắt tường') ||
    comb.includes('chưa nhận') ||
    comb.includes('chưa đồng ý') ||
    comb.includes('không đồng ý') ||
    comb.includes('trở ngại') ||
    comb.includes('khó khăn') ||
    comb.includes('tạm dừng') ||
    comb.includes('từ chối') ||
    comb.includes('vgreen') ||
    ld.includes('vướng');

  if (isExplicitIssue) {
    return 'ISSUE';
  }

  // 3. Pending (Waiting for survey / procedure / contract / standard pending)
  return 'PENDING';
}

export default function EveProgressTab({ stations, onSelectStation, onUpdateStation }) {
  const [selectedDot, setSelectedDot] = useState('ALL'); // 'ALL', 'đợt 1', 'đợt 2'
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inline editing state
  const [editingRows, setEditingRows] = useState({});

  // 1. Filter EVE Stations scope (EVN 3-Phase stations dynamically)
  const eveStations = useMemo(() => {
    return stations.filter(s => {
      if (s.is_eve === false || s.is_3phase === false) return false;
      const pa = (s.pa_dien || '').toLowerCase();
      const dev = (s.don_vi_phu_trach || '').toLowerCase();
      if (dev.includes('vnpt') || pa.includes('vnpt') || pa.includes('1p')) return false;
      return s.is_eve === true || dev.includes('điện lực') || pa.includes('3p') || pa.includes('evn');
    });
  }, [stations]);

  // 2. Count by Batch (Đợt 1, Đợt 2)
  const dot1Count = useMemo(() => {
    return eveStations.filter(s => {
      const ma = (s.ma_tram || s.id || '').trim();
      const dotVal = (s.eve_dot || s.dot || '').toLowerCase();
      return dotVal.includes('1') || s.sheetSource === '46 điểm' || ma.startsWith('V.E.PTH13');
    }).length;
  }, [eveStations]);

  const dot2Count = useMemo(() => {
    return eveStations.filter(s => {
      const ma = (s.ma_tram || s.id || '').trim();
      const dotVal = (s.eve_dot || s.dot || '').toLowerCase();
      return dotVal.includes('2') || s.sheetSource === '28 điểm' || ma.startsWith('V.E.PTH14');
    }).length;
  }, [eveStations]);

  // 3. Filtered stations
  const filteredEveStations = useMemo(() => {
    return eveStations.filter(s => {
      const ma = (s.ma_tram || s.id || '').trim();
      const dotVal = (s.eve_dot || s.dot || '').toLowerCase();
      const isDot1 = dotVal.includes('1') || s.sheetSource === '46 điểm' || ma.startsWith('V.E.PTH13');
      const isDot2 = dotVal.includes('2') || s.sheetSource === '28 điểm' || ma.startsWith('V.E.PTH14');

      const matchDot = selectedDot === 'ALL' ||
        (selectedDot === 'đợt 1' && isDot1) ||
        (selectedDot === 'đợt 2' && isDot2 && !isDot1);

      const matchTeam = selectedTeam === 'ALL' || s.to_ht === selectedTeam;

      const cat = getStationStatusCategory(s);
      const matchStatus = statusFilter === 'ALL' || cat === statusFilter;

      const search = searchTerm.toLowerCase();
      const matchSearch = searchTerm === '' ||
        (s.ma_tram || '').toLowerCase().includes(search) ||
        (s.ten_co_so || '').toLowerCase().includes(search) ||
        (s.dia_chi || '').toLowerCase().includes(search) ||
        (s.to_ht || '').toLowerCase().includes(search) ||
        (s.to_truong || '').toLowerCase().includes(search) ||
        (s.lap_dien || '').toLowerCase().includes(search) ||
        (s.vuong_mac || '').toLowerCase().includes(search);

      return matchDot && matchTeam && matchStatus && matchSearch;
    });
  }, [eveStations, selectedDot, selectedTeam, statusFilter, searchTerm]);

  // 4. Progress per Infrastructure Team
  const teamProgressList = useMemo(() => {
    const map = {};
    const scopeStations = eveStations.filter(s => {
      const dotVal = s.eve_dot || s.dot || '';
      return selectedDot === 'ALL' ||
        (selectedDot === 'đợt 1' && dotVal.includes('1')) ||
        (selectedDot === 'đợt 2' && dotVal.includes('2'));
    });

    scopeStations.forEach(s => {
      const team = s.to_ht || 'Khác';
      if (!map[team]) {
        map[team] = { team, total: 0, done: 0, pending: 0, issue: 0, leader: s.to_truong, phone: s.sdt };
      }
      map[team].total++;

      const cat = getStationStatusCategory(s);
      if (cat === 'DONE') map[team].done++;
      else if (cat === 'ISSUE') map[team].issue++;
      else map[team].pending++;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [eveStations, selectedDot]);

  // 5. Total statistics
  const stats = useMemo(() => {
    let total = filteredEveStations.length;
    let done = 0;
    let pending = 0;
    let issue = 0;

    filteredEveStations.forEach(s => {
      const cat = getStationStatusCategory(s);
      if (cat === 'DONE') done++;
      else if (cat === 'ISSUE') issue++;
      else pending++;
    });

    return { total, done, pending, issue };
  }, [filteredEveStations]);

  // 6. Handle inline state change
  const handleInlineChange = (stationId, field, value) => {
    setEditingRows(prev => {
      const current = prev[stationId] || {
        lap_dien: eveStations.find(s => (s.id || s.ma_tram) === stationId)?.lap_dien || '',
        vuong_mac: eveStations.find(s => (s.id || s.ma_tram) === stationId)?.vuong_mac || '',
        isDirty: false
      };
      return {
        ...prev,
        [stationId]: {
          ...current,
          [field]: value,
          isDirty: true
        }
      };
    });
  };

  // 7. Save inline edits
  const handleSaveInline = async (station, overrideData = null) => {
    const stationId = station.id || station.ma_tram;
    const editData = editingRows[stationId];
    if (!editData && !overrideData) return;

    setEditingRows(prev => ({
      ...prev,
      [stationId]: { ...(prev[stationId] || {}), isSaving: true }
    }));

    const updates = {
      lap_dien: overrideData?.lap_dien !== undefined ? overrideData.lap_dien : (editData?.lap_dien ?? station.lap_dien ?? ''),
      vuong_mac: overrideData?.vuong_mac !== undefined ? overrideData.vuong_mac : (editData?.vuong_mac ?? station.vuong_mac ?? '')
    };

    const res = await onUpdateStation(stationId, updates);

    setEditingRows(prev => ({
      ...prev,
      [stationId]: {
        ...(prev[stationId] || {}),
        isSaving: false,
        isDirty: false,
        savedSuccess: true
      }
    }));

    setTimeout(() => {
      setEditingRows(prev => {
        const copy = { ...prev };
        if (copy[stationId]) {
          copy[stationId].savedSuccess = false;
        }
        return copy;
      });
    }, 2000);
  };

  // 8. Export CSV
  const handleExportCSV = () => {
    const headers = [
      'STT', 'Đợt', 'Mã trạm', 'Tên trạm / Tên cơ sở', 'Đơn vị điện lực',
      'Tổ Hạ Tầng', 'Tổ trưởng', 'SĐT', 'Lắp điện', 'Lý do chưa triển khai lắp điện'
    ];

    const rows = filteredEveStations.map((s, idx) => [
      idx + 1,
      `"${s.eve_dot || s.dot || ''}"`,
      `"${s.ma_tram || ''}"`,
      `"${(s.ten_co_so || '').replace(/"/g, '""')}"`,
      `"${((s.don_vi_dien_luc && s.don_vi_dien_luc.toLowerCase() !== 'x') ? s.don_vi_dien_luc : ('Điện lực ' + (s.to_ht || ''))).replace(/"/g, '""')}"`,
      `"${s.to_ht || ''}"`,
      `"${s.to_truong || ''}"`,
      `"${s.sdt || ''}"`,
      `"${(s.lap_dien || '').replace(/"/g, '""')}"`,
      `"${(s.vuong_mac || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tien_Do_Lap_Tu_Doi_Pin_EVE_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Overview Header */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden bg-gradient-to-r from-[#0b152b] via-[#0f1d3a] to-[#091124] border border-blue-500/25 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-500/30 mb-2">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              BÁO CÁO TIẾN ĐỘ LẮP TỦ ĐỔI PIN EVN (EVN 3 PHA)
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Theo Dõi Tiến Độ Lắp điện Tủ đổi pin của EVN
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Theo dõi chi tiết <strong className="text-blue-300">{eveStations.length} trạm EVN</strong> (Đợt 1: <strong className="text-sky-300">{dot1Count} trạm</strong> | Đợt 2: <strong className="text-emerald-300">{dot2Count} trạm</strong>).
            </p>
          </div>

          {/* Batch Selector Pills */}
          <div className="flex items-center space-x-2 bg-[#060c18] p-1.5 rounded-xl border border-blue-900/40 shrink-0">
            <button
              onClick={() => setSelectedDot('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDot === 'ALL'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/20 border border-blue-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
              }`}
            >
              Tất Cả ({eveStations.length} trạm)
            </button>
            <button
              onClick={() => setSelectedDot('đợt 1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDot === 'đợt 1'
                  ? 'bg-blue-800 text-white border border-blue-400/40 shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
              }`}
            >
              Đợt 1 ({dot1Count} trạm)
            </button>
            <button
              onClick={() => setSelectedDot('đợt 2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDot === 'đợt 2'
                  ? 'bg-emerald-800/90 text-white border border-emerald-400/40 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
              }`}
            >
              Đợt 2 ({dot2Count} trạm)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Power BI Metric Card Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border border-blue-500/20 bg-[#0c162c]/90">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>TỔNG SỐ TRẠM EVN</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2 tracking-tight">
            {stats.total} <span className="text-xs font-normal text-slate-400">trạm</span>
          </div>
          <div className="text-[11px] text-blue-300/80 mt-1 font-medium">
            Phạm vi đang lọc
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-emerald-500/25 bg-[#0a1c24]/90">
          <div className="flex justify-between items-center text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span>1. ĐÃ LẮP XONG / ĐÓNG ĐIỆN</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300 mt-2 tracking-tight">
            {stats.done} <span className="text-xs font-normal text-slate-400">trạm</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">
            Đã hoàn thành thủ tục đấu nối
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-sky-500/30 bg-[#0c1c33]/90">
          <div className="flex justify-between items-center text-xs font-semibold text-sky-300 uppercase tracking-wider">
            <span>2. CHỜ EVN KHẢO SÁT / SOẠN HĐ</span>
            <ClipboardList className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-200 mt-2 tracking-tight">
            {stats.pending} <span className="text-xs font-normal text-slate-400">trạm</span>
          </div>
          <div className="text-[11px] text-sky-300/80 mt-1 font-medium">
            Đang chờ EVN khảo sát & làm thủ tục
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-amber-500/25 bg-[#1a1721]/90">
          <div className="flex justify-between items-center text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <span>3. CÓ VƯỚNG MẮC / CHỜ MẶT BẰNG</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-200 mt-2 tracking-tight">
            {stats.issue} <span className="text-xs font-normal text-slate-400">trạm</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
            Cần hỗ trợ phối hợp xử lý
          </div>
        </div>
      </div>

      {/* Team-by-Team Progress Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Tiến Độ Triển Khai Theo Từng Tổ Hạ Tầng
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {teamProgressList.length} Tổ Hạ Tầng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {teamProgressList.map(item => {
            const percentDone = Math.round((item.done / item.total) * 100) || 0;
            const isSelected = selectedTeam === item.team;

            return (
              <div
                key={item.team}
                onClick={() => setSelectedTeam(prev => prev === item.team ? 'ALL' : item.team)}
                className={`glass-card glass-card-hover p-4 rounded-xl cursor-pointer border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-400 bg-[#122244] ring-2 ring-blue-500/40 shadow-lg'
                    : 'border-blue-900/30 bg-[#0c162b]/80 hover:border-blue-500/40'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-white flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                      Tổ Hạ Tầng {item.team}
                    </h4>
                    {item.leader && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center">
                        <span>{item.leader}</span>
                        {item.phone && (
                          <span className="ml-2 font-mono text-[10px] text-slate-500">({item.phone})</span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800/40">
                    {item.total} trạm
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className="text-slate-400">Tiến độ:</span>
                    <span className={percentDone === 100 ? 'text-emerald-400 font-bold' : 'text-blue-300 font-bold'}>
                      {percentDone}% ({item.done}/{item.total})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex border border-blue-950">
                    <div
                      style={{ width: `${(item.done / item.total) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(item.issue / item.total) * 100}%` }}
                      className="bg-amber-600 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(item.pending / item.total) * 100}%` }}
                      className="bg-blue-600 transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Status Breakdown Badges */}
                <div className="flex items-center space-x-2 mt-3 text-[10px] font-semibold">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {item.done} xong
                  </span>
                  {item.pending > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/40 shadow-sm">
                      <ClipboardList className="w-3 h-3 mr-1 text-sky-400" /> {item.pending} chờ khảo sát
                    </span>
                  )}
                  {item.issue > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {item.issue} vướng
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 border border-blue-900/30">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tên cơ sở, Tổ HT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#080f1d] border border-blue-900/50 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 bg-[#080f1d] border border-blue-900/50 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0b132b]">Tất cả trạng thái</option>
              <option value="DONE" className="bg-[#0b132b]">Đã lắp xong / Đóng điện</option>
              <option value="PENDING" className="bg-[#0b132b]">📋 Chờ EVN khảo sát / Chờ HĐ</option>
              <option value="ISSUE" className="bg-[#0b132b]">⚠️ Vướng thủ tục / Vướng mặt bằng</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#080f1d] border border-blue-900/50 rounded-lg px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0b132b]">Tất cả Tổ Hạ Tầng</option>
              {teamProgressList.map(t => (
                <option key={t.team} value={t.team} className="bg-[#0b132b]">Tổ {t.team} ({t.total} trạm)</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-500/40 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel EVN</span>
          </button>
        </div>
      </div>

      {/* Main EVN Station Data Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-blue-900/40 shadow-2xl">
        <div className="p-4 bg-[#080f1e]/90 border-b border-blue-900/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center tracking-wide">
              <Zap className="w-4 h-4 text-blue-400 mr-2" />
              Danh Sách Chi Tiết Trạm EVN & Chỉnh Sửa Trực Tiếp
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cập nhật cột <strong className="text-blue-300">Lắp điện</strong> và <strong className="text-slate-300">Lý do chưa triển khai lắp điện</strong> ngay trên từng dòng.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800/40">
            {filteredEveStations.length} / {eveStations.length} trạm
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#091224] text-slate-300 uppercase tracking-wider font-semibold border-b border-blue-950">
              <tr>
                <th className="py-3 px-3 text-center w-10">STT</th>
                <th className="py-3 px-4 w-36">Mã Trạm / Đợt</th>
                <th className="py-3 px-4 min-w-[190px]">Tên Cơ Sở</th>
                <th className="py-3 px-4 min-w-[180px]">Đơn Vị Điện Lực</th>
                <th className="py-3 px-4 w-36">Tổ Hạ Tầng</th>
                <th className="py-3 px-4 min-w-[180px]">
                  <span className="text-blue-300 font-bold">Lắp Điện ✏️</span>
                </th>
                <th className="py-3 px-4 min-w-[240px]">
                  <span className="text-slate-200 font-bold">Lý Do Chưa Triển Khai ✏️</span>
                </th>
                <th className="py-3 px-4 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-950/60 bg-[#070e1c]/40">
              {filteredEveStations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p className="font-semibold text-slate-300">Không tìm thấy trạm EVN phù hợp</p>
                  </td>
                </tr>
              ) : (
                filteredEveStations.map((station, index) => {
                  const stationId = station.id || station.ma_tram;
                  const rowEditState = editingRows[stationId] || {
                    lap_dien: station.lap_dien || '',
                    vuong_mac: station.vuong_mac || ''
                  };

                  const isDirty = rowEditState.isDirty;
                  const isSaving = rowEditState.isSaving;
                  const savedSuccess = rowEditState.savedSuccess;

                  return (
                    <tr key={stationId} className="hover:bg-blue-950/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-300 text-xs">
                          {station.ma_tram}
                        </div>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-200 border border-blue-800/40">
                            {station.eve_dot || station.dot || 'đợt 1'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100 text-xs leading-snug">
                          {station.ten_co_so}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-blue-300 font-medium leading-snug">
                          {(station.don_vi_dien_luc && station.don_vi_dien_luc.toLowerCase() !== 'x') ? station.don_vi_dien_luc : ('Điện lực ' + (station.to_ht || station.dia_ban || ''))}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-200 text-xs">{station.to_ht}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {station.to_truong}
                        </div>
                      </td>

                      {/* Editable Column 1: Lắp điện */}
                      <td className="py-2.5 px-3">
                        {(() => {
                          const val = (rowEditState.lap_dien || '').trim();
                          const lower = val.toLowerCase();
                          let styleClass = 'bg-[#060b18]/60 text-slate-500/80 italic border border-slate-800/80 hover:border-blue-500/50 hover:text-slate-300 font-normal';
                          
                          if (lower.includes('lắp xong') || lower.includes('đóng điện') || lower.includes('nghiệm thu') || lower.includes('hoàn thành')) {
                            styleClass = 'bg-emerald-950/90 text-emerald-300 border-2 border-emerald-500 font-extrabold shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/30';
                          } else if (lower.includes('vướng') || lower.includes('chưa nhận') || lower.includes('mặt bằng') || lower.includes('cắt tường')) {
                            styleClass = 'bg-amber-950/90 text-amber-300 border border-amber-500/80 font-bold';
                          } else if (lower.includes('khảo sát') || lower.includes('chờ')) {
                            styleClass = 'bg-sky-950/90 text-sky-300 border border-sky-500/80 font-semibold shadow-sm';
                          } else if (val && !lower.includes('chưa')) {
                            styleClass = 'bg-blue-950/90 text-blue-200 border border-blue-500/70 font-semibold';
                          }

                          return (
                            <select
                              value={rowEditState.lap_dien || ''}
                              onChange={(e) => {
                                const newval = e.target.value;
                                handleInlineChange(stationId, 'lap_dien', newval);
                                // Auto save immediately on selection change
                                setTimeout(() => {
                                  handleSaveInline(station, { lap_dien: newval });
                                }, 50);
                              }}
                              className={`w-full p-2 rounded-lg text-xs focus:outline-none transition-all duration-200 cursor-pointer ${styleClass}`}
                            >
                              <option value="" className="bg-[#0b132b] text-slate-500 italic font-normal">
                                Chưa xong
                              </option>
                              <option value="Đã lắp xong" className="bg-[#0b132b] text-emerald-400 font-bold">
                                ✅ Đã lắp xong (Hoàn thành)
                              </option>
                              <option value="Chờ EVN khảo sát" className="bg-[#0b132b] text-sky-300 font-bold">
                                📋 Chờ EVN khảo sát
                              </option>
                              <option value="Điện lực đang khảo sát" className="bg-[#0b132b] text-cyan-300 font-semibold">
                                🔍 Điện lực đang khảo sát
                              </option>
                              <option value="Điện lực đã khảo sát và soạn HĐ" className="bg-[#0b132b] text-blue-300">
                                ⚡ Điện lực đã khảo sát & soạn HĐ
                              </option>
                              <option value="Đã khảo sát xong, chờ hợp đồng điện lực gửi" className="bg-[#0b132b] text-cyan-300">
                                📄 Chờ hợp đồng điện lực gửi
                              </option>
                              <option value="Hồ sơ gửi VGREEN, chưa nhận lại" className="bg-[#0b132b] text-indigo-300">
                                🕒 Chờ phản hồi VGREEN
                              </option>
                              <option value="Vướng mặt bằng / thi công" className="bg-[#0b132b] text-amber-400 font-bold">
                                ⚠️ Vướng mặt bằng / thi công
                              </option>
                            </select>
                          );
                        })()}
                      </td>

                      {/* Editable Column 2: Lý do chưa triển khai */}
                      <td className="py-2.5 px-3">
                        <textarea
                          rows="2"
                          value={rowEditState.vuong_mac || ''}
                          onChange={(e) => handleInlineChange(stationId, 'vuong_mac', e.target.value)}
                          onBlur={() => {
                            if (isDirty) {
                              handleSaveInline(station);
                            }
                          }}
                          placeholder="Lý do chưa triển khai / vướng mắc..."
                          className="w-full p-2 bg-[#060c18] border border-blue-900/60 hover:border-blue-500/60 focus:border-blue-400 rounded-lg text-[11px] text-slate-400 focus:text-slate-200 placeholder-slate-500 focus:outline-none transition-colors leading-relaxed"
                        />
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isDirty && (
                            <button
                              onClick={() => handleSaveInline(station)}
                              disabled={isSaving}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-md shadow-blue-600/30 transition-all border border-blue-400/30"
                            >
                              {isSaving ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              <span>Lưu</span>
                            </button>
                          )}

                          {savedSuccess && (
                            <span className="inline-flex items-center px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold">
                              <Check className="w-3 h-3 mr-0.5" /> Đã lưu!
                            </span>
                          )}

                          {!isDirty && !savedSuccess && (
                            <button
                              onClick={() => onSelectStation(station)}
                              className="px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 border border-blue-800/40 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-[#080f1e]/90 px-4 py-3 border-t border-blue-950 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            Hiển thị <strong className="text-white">{filteredEveStations.length}</strong> / <strong className="text-blue-300">{eveStations.length} trạm EVN</strong>
          </div>
          <div className="text-[11px] text-slate-500">
            Tự động đồng bộ 2 chiều dữ liệu thời gian thực
          </div>
        </div>
      </div>
    </div>
  );
}
