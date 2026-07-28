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
  MapPin,
  Phone,
  Layers,
  Save,
  Check,
  Building2,
  Users,
  RefreshCw
} from 'lucide-react';

export default function EveProgressTab({ stations, onSelectStation, onUpdateStation }) {
  const [selectedDot, setSelectedDot] = useState('ALL'); // 'ALL', 'đợt 1', 'đợt 2'
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inline editing state: { stationId: { lap_dien, vuong_mac, isSaving, savedSuccess } }
  const [editingRows, setEditingRows] = useState({});

  // 1. Filter EVE 33 Stations scope
  const eveStations = useMemo(() => {
    return stations.filter(s => {
      // Station is EVE if is_eve flag is true, or sheetSource includes 23 / 10, or id matches s1/s2 lists
      if (s.is_eve !== undefined) return s.is_eve;
      const ma = s.ma_tram || s.id;
      // Fallback detection for EVE 33 stations
      const isDot1_23 = s.dot === 'đợt 1' && (s.is_3phase || (s.pa_dien || '').includes('3P'));
      const isDot2_10 = s.dot === 'đợt 2' && (s.is_3phase || (s.pa_dien || '').includes('3P'));
      return isDot1_23 || isDot2_10;
    });
  }, [stations]);

  // 2. Count by Batch (Đợt 1 = 23, Đợt 2 = 10)
  const dot1Count = useMemo(() => {
    return eveStations.filter(s => (s.eve_dot === 'đợt 1' || s.dot === 'đợt 1')).length;
  }, [eveStations]);

  const dot2Count = useMemo(() => {
    return eveStations.filter(s => (s.eve_dot === 'đợt 2' || s.dot === 'đợt 2')).length;
  }, [eveStations]);

  // 3. Filtered stations based on user selection
  const filteredEveStations = useMemo(() => {
    return eveStations.filter(s => {
      // Dot match
      const dotVal = s.eve_dot || s.dot || '';
      const matchDot = selectedDot === 'ALL' ||
        (selectedDot === 'đợt 1' && dotVal.includes('1')) ||
        (selectedDot === 'đợt 2' && dotVal.includes('2'));

      // Team match
      const matchTeam = selectedTeam === 'ALL' || s.to_ht === selectedTeam;

      // Status match
      const ld = (s.lap_dien || '').toLowerCase();
      const vm = (s.vuong_mac || '').toLowerCase();
      const comb = (ld + ' ' + vm).trim();
      let cat = 'PENDING';
      if (comb.includes('đã lắp xong') || comb.includes('đã đóng điện') || comb.includes('nghiệm thu') || comb.includes('hoàn thành')) {
        cat = 'DONE';
      } else if (comb.includes('vướng') || comb.includes('chưa nhận') || comb.includes('mặt bằng') || comb.includes('cắt tường') || vm.length > 5) {
        cat = 'ISSUE';
      }

      const matchStatus = statusFilter === 'ALL' || cat === statusFilter;

      // Search term
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

  // 4. Progress per Infrastructure Team ("Các tổ lắp đến đâu")
  const teamProgressList = useMemo(() => {
    const map = {};
    
    // First calculate base on scope of selectedDot
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
      
      const ld = (s.lap_dien || '').toLowerCase();
      const vm = (s.vuong_mac || '').toLowerCase();
      const comb = (ld + ' ' + vm).trim();

      if (comb.includes('đã lắp xong') || comb.includes('đã đóng điện') || comb.includes('nghiệm thu') || comb.includes('hoàn thành')) {
        map[team].done++;
      } else if (comb.includes('vướng') || comb.includes('chưa nhận') || comb.includes('mặt bằng') || comb.includes('cắt tường') || vm.length > 5) {
        map[team].issue++;
      } else {
        map[team].pending++;
      }
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [eveStations, selectedDot]);

  // 5. Total statistics for KPI cards
  const stats = useMemo(() => {
    let total = filteredEveStations.length;
    let done = 0;
    let pending = 0;
    let issue = 0;

    filteredEveStations.forEach(s => {
      const ld = (s.lap_dien || '').toLowerCase();
      const vm = (s.vuong_mac || '').toLowerCase();
      const comb = (ld + ' ' + vm).trim();

      if (comb.includes('đã lắp xong') || comb.includes('đã đóng điện') || comb.includes('nghiệm thu') || comb.includes('hoàn thành')) {
        done++;
      } else if (comb.includes('vướng') || comb.includes('chưa nhận') || comb.includes('mặt bằng') || comb.includes('cắt tường') || vm.length > 5) {
        issue++;
      } else {
        pending++;
      }
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

  // 7. Save inline edits for a specific row
  const handleSaveInline = async (station) => {
    const stationId = station.id || station.ma_tram;
    const editData = editingRows[stationId];
    if (!editData || !editData.isDirty) return;

    setEditingRows(prev => ({
      ...prev,
      [stationId]: { ...prev[stationId], isSaving: true }
    }));

    const updates = {
      lap_dien: editData.lap_dien,
      vuong_mac: editData.vuong_mac
    };

    const res = await onUpdateStation(stationId, updates);

    setEditingRows(prev => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
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

  // 8. Export CSV for EVE stations
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Đợt',
      'Mã trạm',
      'Tên trạm / Tên cơ sở',
      'Địa chỉ',
      'Tổ Hạ Tầng',
      'Tổ trưởng',
      'SĐT',
      'Lắp điện',
      'Lý do chưa triển khai lắp điện'
    ];

    const rows = filteredEveStations.map((s, idx) => [
      idx + 1,
      `"${s.eve_dot || s.dot || ''}"`,
      `"${s.ma_tram || ''}"`,
      `"${(s.ten_co_so || '').replace(/"/g, '""')}"`,
      `"${(s.dia_chi || s.phuong_xa || s.dia_ban || '').replace(/"/g, '""')}"`,
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
      {/* Top Banner: Overview of EVE Cabinet Progress */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-cyan-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 mb-2">
              <Zap className="w-4 h-4 mr-1.5 text-amber-400 animate-pulse" />
              Tiến Độ Triển Khai Lắp Tủ Đổi Pin EVE (EVN 3P)
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Theo Dõi Tiến Độ Lắp Tủ Đổi Pin Của EVE Theo Tổ Hạ Tầng
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Quản lý tổng cộng <strong className="text-cyan-400 font-bold">33 trạm tủ đổi pin EVE</strong> (Đợt 1: <strong className="text-amber-400">23 trạm</strong> | Đợt 2: <strong className="text-emerald-400">10 trạm</strong>). Cập nhật & chỉnh sửa trực tiếp trạng thái <strong className="text-cyan-300">Lắp điện</strong> và <strong className="text-amber-300">Lý do chưa triển khai lắp điện</strong>.
            </p>
          </div>

          {/* Quick Batch Filter Selector Pills */}
          <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
            <button
              onClick={() => setSelectedDot('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                selectedDot === 'ALL'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Tất Cả (33 trạm)
            </button>
            <button
              onClick={() => setSelectedDot('đợt 1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                selectedDot === 'đợt 1'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Đợt 1 ({dot1Count} trạm)
            </button>
            <button
              onClick={() => setSelectedDot('đợt 2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                selectedDot === 'đợt 2'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Đợt 2 ({dot2Count} trạm)
            </button>
          </div>
        </div>
      </div>

      {/* Team-by-Team Progress Matrix: "Các tổ lắp đến đâu" */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Tiến Độ Triển Khai Theo Từng Tổ Hạ Tầng (Các Tổ Lắp Đến Đâu)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {teamProgressList.length} Tổ Hạ Tầng đang phụ trách
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
                    ? 'border-cyan-500 bg-cyan-950/40 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center">
                      <Building2 className="w-4 h-4 mr-1.5 text-cyan-400" />
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-800 text-cyan-300 border border-slate-700">
                    {item.total} trạm
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className="text-slate-400">Tiến độ hoàn thành:</span>
                    <span className={percentDone === 100 ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                      {percentDone}% ({item.done}/{item.total})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(item.done / item.total) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Đã lắp xong: ${item.done}`}
                    />
                    <div
                      style={{ width: `${(item.issue / item.total) * 100}%` }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`Vướng mắc: ${item.issue}`}
                    />
                    <div
                      style={{ width: `${(item.pending / item.total) * 100}%` }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`Chờ xử lý: ${item.pending}`}
                    />
                  </div>
                </div>

                {/* Status Breakdown Badges */}
                <div className="flex items-center space-x-2 mt-3 text-[10px] font-semibold">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {item.done} xong
                  </span>
                  {item.pending > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Clock className="w-3 h-3 mr-1" /> {item.pending} chờ
                    </span>
                  )}
                  {item.issue > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {item.issue} vướng
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Cards & Filter Bar */}
      <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tên cơ sở, Tổ HT, Lắp điện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả trạng thái tiến độ</option>
              <option value="DONE" className="bg-slate-900">Đã lắp xong / Đóng điện</option>
              <option value="PENDING" className="bg-slate-900">Đang khảo sát / Chờ HĐ EVN</option>
              <option value="ISSUE" className="bg-slate-900">Vướng thủ tục / Vướng mặt bằng</option>
            </select>
          </div>

          {/* Infrastructure Team Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Tất cả Tổ Hạ Tầng</option>
              {teamProgressList.map(t => (
                <option key={t.team} value={t.team} className="bg-slate-900">Tổ {t.team} ({t.total} trạm)</option>
              ))}
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel EVE</span>
          </button>
        </div>
      </div>

      {/* Main EVE Station Data Table with Direct Inline Editing */}
      <div className="glass-card rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl">
        <div className="p-4 bg-slate-900/90 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center">
              <Zap className="w-5 h-5 text-cyan-400 mr-2" />
              Danh Sách Trạm Tủ Đổi Pin EVE & Chỉnh Sửa Trực Tiếp Trạng Thái Lắp Điện
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cho phép chỉnh sửa trực tiếp cột <strong className="text-cyan-300">Lắp điện</strong> và <strong className="text-amber-300">Lý do chưa triển khai lắp điện</strong> ngay trên từng dòng.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            {filteredEveStations.length} / {eveStations.length} trạm EVE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-3 text-center w-10">STT</th>
                <th className="py-3.5 px-4 w-36">Mã Trạm / Đợt</th>
                <th className="py-3.5 px-4 min-w-[200px]">Tên Cơ Sở</th>
                <th className="py-3.5 px-4 min-w-[180px]">Địa Chỉ</th>
                <th className="py-3.5 px-4 w-40">Tổ Hạ Tầng</th>
                <th className="py-3.5 px-4 min-w-[180px]">
                  <span className="text-cyan-300 font-bold">Lắp Điện ✏️</span>
                </th>
                <th className="py-3.5 px-4 min-w-[240px]">
                  <span className="text-amber-300 font-bold">Lý Do Chưa Triển Khai Lắp Điện ✏️</span>
                </th>
                <th className="py-3.5 px-4 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredEveStations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                    <p className="font-semibold text-slate-300">Không tìm thấy trạm EVE phù hợp với bộ lọc</p>
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
                    <tr key={stationId} className="hover:bg-slate-800/50 transition-colors">
                      {/* STT */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      {/* Mã trạm & Đợt */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-black text-cyan-400 text-xs tracking-wide">
                          {station.ma_tram}
                        </div>
                        <div className="mt-1 flex items-center space-x-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            (station.eve_dot || station.dot || '').includes('1')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {station.eve_dot || station.dot || 'đợt 1'}
                          </span>
                        </div>
                      </td>

                      {/* Tên cơ sở */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 text-xs leading-snug">
                          {station.ten_co_so}
                        </div>
                      </td>

                      {/* Địa chỉ */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-300 leading-snug">
                          {station.dia_chi || station.phuong_xa || station.dia_ban || 'N/A'}
                        </div>
                      </td>

                      {/* Tổ Hạ Tầng */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-cyan-300 text-xs">{station.to_ht}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {station.to_truong}
                          {station.sdt && (
                            <a href={`tel:${station.sdt}`} className="block text-cyan-400 text-[10px] hover:underline font-mono">
                              {station.sdt}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Editable Column 1: Lắp điện */}
                      <td className="py-3 px-3">
                        <div className="space-y-1.5">
                          <select
                            value={rowEditState.lap_dien}
                            onChange={(e) => handleInlineChange(stationId, 'lap_dien', e.target.value)}
                            className="w-full p-1.5 bg-slate-950 border border-slate-700 hover:border-cyan-500 focus:border-cyan-400 rounded-lg text-xs text-white focus:outline-none transition-colors"
                          >
                            <option value="" className="bg-slate-900">-- Chọn/Nhập trạng thái --</option>
                            <option value="Đã lắp xong" className="bg-slate-900">Đã lắp xong (Đã hoàn thành)</option>
                            <option value="Điện lực đã khảo sát và soạn HĐ" className="bg-slate-900">Điện lực đã khảo sát và soạn HĐ</option>
                            <option value="Đã khảo sát xong, chờ hợp đồng điện lực gửi" className="bg-slate-900">Đã khảo sát xong, chờ HĐ</option>
                            <option value="Điện lực đang khảo sát" className="bg-slate-900">Điện lực đang khảo sát</option>
                            <option value="Hồ sơ gửi VGREEN, chưa nhận lại" className="bg-slate-900">Hồ sơ gửi VGREEN, chờ phản hồi</option>
                            <option value="Vướng mặt bằng / thi công" className="bg-slate-900">Vướng mặt bằng / thi công</option>
                          </select>
                        </div>
                      </td>

                      {/* Editable Column 2: Lý do chưa triển khai lắp điện */}
                      <td className="py-3 px-3">
                        <textarea
                          rows="2"
                          value={rowEditState.vuong_mac}
                          onChange={(e) => handleInlineChange(stationId, 'vuong_mac', e.target.value)}
                          placeholder="Nhập lý do chưa triển khai lắp điện / vướng mắc..."
                          className="w-full p-2 bg-slate-950 border border-slate-700 hover:border-amber-500 focus:border-amber-400 rounded-lg text-xs text-amber-200 placeholder-slate-500 focus:outline-none transition-colors leading-relaxed"
                        />
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Save Button for row edits */}
                          {isDirty && (
                            <button
                              onClick={() => handleSaveInline(station)}
                              disabled={isSaving}
                              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 transition-all animate-pulse"
                              title="Lưu thay đổi dòng này"
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
                            <span className="inline-flex items-center px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-[10px] font-bold">
                              <Check className="w-3 h-3 mr-0.5" /> Đã lưu!
                            </span>
                          )}

                          {!isDirty && !savedSuccess && (
                            <button
                              onClick={() => onSelectStation(station)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                              title="Xem/Chỉnh sửa tất cả thông số trạm"
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

        {/* Footer Summary */}
        <div className="bg-slate-900/90 px-4 py-3 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            Hiển thị <strong className="text-white">{filteredEveStations.length}</strong> trạm EVE / tổng số <strong className="text-cyan-400">33 trạm</strong> (Đợt 1: 23 | Đợt 2: 10)
          </div>
          <div className="text-[11px] text-slate-500">
            Dữ liệu đồng bộ 2 chiều trực tiếp với Google Sheet khi bấm **Lưu**
          </div>
        </div>
      </div>
    </div>
  );
}
