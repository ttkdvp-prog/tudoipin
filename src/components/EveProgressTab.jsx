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
  Activity
} from 'lucide-react';

const EVE_33_IDS = new Set([
  "V.E.PTH13628", "V.E.PTH13629", "V.E.PTH13630", "V.E.PTH13632", "V.E.PTH13635",
  "V.E.PTH13638", "V.E.PTH13639", "V.E.PTH13644", "V.E.PTH13645", "V.E.PTH13647",
  "V.E.PTH13650", "V.E.PTH13651", "V.E.PTH13654", "V.E.PTH13655", "V.E.PTH13656",
  "V.E.PTH13658", "V.E.PTH13659", "V.E.PTH13661", "V.E.PTH13662", "V.E.PTH13671",
  "V.E.PTH13674", "V.E.PTH13675", "V.E.PTH13677", "V.E.PTH14857", "V.E.PTH14859",
  "V.E.PTH14861", "V.E.PTH14862", "V.E.PTH14869", "V.E.PTH14890", "V.E.PTH14892",
  "V.E.PTH14928", "V.E.PTH14929", "V.E.PTH14931"
]);

export default function EveProgressTab({ stations, onSelectStation, onUpdateStation }) {
  const [selectedDot, setSelectedDot] = useState('ALL'); // 'ALL', 'đợt 1', 'đợt 2'
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Inline editing state
  const [editingRows, setEditingRows] = useState({});

  // 1. Filter EVE 33 Stations scope (strictly 33 EVN 3-Phase stations: 23 Đợt 1 + 10 Đợt 2)
  const eveStations = useMemo(() => {
    return stations.filter(s => {
      const ma = (s.ma_tram || s.id || '').trim();
      if (EVE_33_IDS.has(ma)) return true;
      return s.is_eve === true && s.is_3phase !== false;
    });
  }, [stations]);

  // 2. Count by Batch (Đợt 1 = 23, Đợt 2 = 10)
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

  // 5. Total statistics
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
      `"${(s.don_vi_dien_luc || ('Điện lực ' + (s.to_ht || ''))).replace(/"/g, '""')}"`,
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
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden bg-gradient-to-r from-violet-50 via-indigo-50/60 to-blue-50 border border-violet-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-violet-100 text-violet-800 border border-violet-200 mb-2">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-violet-600" />
              BÁO CÁO TIẾN ĐỘ LẮP TỦ ĐỔI PIN EVE (EVN 3 PHA)
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Theo Dõi Tiến Độ Lắp Tủ Đổi Pin Của EVE Theo Tổ Hạ Tầng
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed font-medium">
              Theo dõi chi tiết <strong className="text-violet-700 font-extrabold">33 trạm EVE</strong> (Đợt 1: <strong className="text-blue-700 font-bold">23 trạm</strong> | Đợt 2: <strong className="text-emerald-700 font-bold">10 trạm</strong>). Cho phép cập nhật trực tiếp trạng thái <strong className="text-slate-900 font-bold">Lắp điện</strong> và <strong className="text-slate-900 font-bold">Lý do chưa triển khai</strong>.
            </p>
          </div>

          {/* Batch Selector Pills */}
          <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-full border border-slate-200/80 shadow-xs shrink-0">
            <button
              onClick={() => setSelectedDot('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedDot === 'ALL'
                  ? 'bg-[#1E1B3A] text-white shadow-md shadow-violet-950/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tất Cả (33 trạm)
            </button>
            <button
              onClick={() => setSelectedDot('đợt 1')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedDot === 'đợt 1'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Đợt 1 ({dot1Count} trạm)
            </button>
            <button
              onClick={() => setSelectedDot('đợt 2')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedDot === 'đợt 2'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Đợt 2 ({dot2Count} trạm)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Power BI Metric Card Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 border border-blue-200/60 bg-[#D6E8FC] shadow-xs">
          <div className="flex justify-between items-center text-[11px] font-extrabold text-blue-900/80 uppercase tracking-wider">
            <span>TỔNG SỐ TRẠM EVE</span>
            <Activity className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {stats.total} <span className="text-xs font-bold text-slate-600">trạm</span>
          </div>
          <div className="text-[11px] text-blue-900/70 mt-1 font-semibold">
            Phạm vi đang lọc
          </div>
        </div>

        <div className="rounded-2xl p-4 border border-emerald-200/60 bg-[#D1F4E0] shadow-xs">
          <div className="flex justify-between items-center text-[11px] font-extrabold text-emerald-900/80 uppercase tracking-wider">
            <span>1. ĐÃ LẮP XONG / ĐÓNG ĐIỆN</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {stats.done} <span className="text-xs font-bold text-slate-600">trạm</span>
          </div>
          <div className="text-[11px] text-emerald-900/70 mt-1 font-semibold">
            Đã hoàn thành thủ tục đấu nối
          </div>
        </div>

        <div className="rounded-2xl p-4 border border-purple-200/60 bg-[#ECE8FE] shadow-xs">
          <div className="flex justify-between items-center text-[11px] font-extrabold text-purple-900/80 uppercase tracking-wider">
            <span>2. CHỜ EVN SOẠN HĐ / KHẢO SÁT</span>
            <Clock className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {stats.pending} <span className="text-xs font-bold text-slate-600">trạm</span>
          </div>
          <div className="text-[11px] text-purple-900/70 mt-1 font-semibold">
            Đang tiến hành theo đúng thủ tục
          </div>
        </div>

        <div className="rounded-2xl p-4 border border-orange-200/60 bg-[#FDE3D9] shadow-xs">
          <div className="flex justify-between items-center text-[11px] font-extrabold text-orange-900/80 uppercase tracking-wider">
            <span>3. CÓ VƯỚNG MẮC / CHỜ MẶT BẰNG</span>
            <AlertTriangle className="w-4 h-4 text-orange-700" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {stats.issue} <span className="text-xs font-bold text-slate-600">trạm</span>
          </div>
          <div className="text-[11px] text-orange-900/70 mt-1 font-semibold">
            Cần hỗ trợ phối hợp xử lý
          </div>
        </div>
      </div>

      {/* Team-by-Team Progress Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-violet-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Tiến Độ Triển Khai Theo Từng Tổ Hạ Tầng (Các Tổ Lắp Đến Đâu)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
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
                className={`glass-card glass-card-hover p-4 rounded-2xl cursor-pointer border transition-all relative overflow-hidden shadow-xs ${
                  isSelected
                    ? 'border-violet-500 bg-white ring-2 ring-violet-500/30 shadow-md'
                    : 'border-slate-200/80 bg-white hover:border-violet-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-violet-600" />
                      Tổ Hạ Tầng {item.team}
                    </h4>
                    {item.leader && (
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center font-medium">
                        <span>{item.leader}</span>
                        {item.phone && (
                          <span className="ml-2 font-mono text-[10px] text-slate-400">({item.phone})</span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {item.total} trạm
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className="text-slate-500">Tiến độ:</span>
                    <span className={percentDone === 100 ? 'text-emerald-600 font-extrabold' : 'text-violet-700 font-extrabold'}>
                      {percentDone}% ({item.done}/{item.total})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60">
                    <div
                      style={{ width: `${(item.done / item.total) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(item.issue / item.total) * 100}%` }}
                      className="bg-orange-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(item.pending / item.total) * 100}%` }}
                      className="bg-blue-500 transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Status Breakdown Badges */}
                <div className="flex items-center space-x-2 mt-3 text-[10px] font-bold">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {item.done} xong
                  </span>
                  {item.pending > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      <Clock className="w-3 h-3 mr-1" /> {item.pending} chờ
                    </span>
                  )}
                  {item.issue > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
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
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 border border-slate-200/80 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã trạm, Tên cơ sở, Tổ HT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-violet-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DONE">Đã lắp xong / Đóng điện</option>
              <option value="PENDING">Đang khảo sát / Chờ HĐ</option>
              <option value="ISSUE">Vướng thủ tục / Vướng mặt bằng</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả Tổ Hạ Tầng</option>
              {teamProgressList.map(t => (
                <option key={t.team} value={t.team}>Tổ {t.team} ({t.total} trạm)</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#1E1B3A] hover:bg-[#2B274F] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel EVE</span>
          </button>
        </div>
      </div>

      {/* Main EVE Station Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-900 flex items-center tracking-wide uppercase">
              <Zap className="w-4 h-4 text-violet-600 mr-2" />
              Danh Sách Chi Tiết Trạm EVE & Chỉnh Sửa Trực Tiếp
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Cập nhật cột <strong className="text-violet-700 font-bold">Lắp điện</strong> và <strong className="text-slate-800 font-bold">Lý do chưa triển khai lắp điện</strong> ngay trên từng dòng.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-violet-100 text-violet-800 border border-violet-200">
            {filteredEveStations.length} / {eveStations.length} trạm
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 text-center w-10">STT</th>
                <th className="py-3.5 px-4 w-36">Mã Trạm / Đợt</th>
                <th className="py-3.5 px-4 min-w-[190px]">Tên Cơ Sở</th>
                <th className="py-3.5 px-4 min-w-[180px]">Đơn Vị Điện Lực</th>
                <th className="py-3.5 px-4 w-36">Tổ Hạ Tầng</th>
                <th className="py-3.5 px-4 min-w-[180px]">
                  <span className="text-violet-700 font-extrabold">Lắp Điện ✏️</span>
                </th>
                <th className="py-3.5 px-4 min-w-[240px]">
                  <span className="text-slate-800 font-extrabold">Lý Do Chưa Triển Khai ✏️</span>
                </th>
                <th className="py-3.5 px-4 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEveStations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-600">Không tìm thấy trạm EVE phù hợp</p>
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
                    <tr key={stationId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-bold">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-violet-700 text-xs">
                          {station.ma_tram}
                        </div>
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {station.eve_dot || station.dot || 'đợt 1'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {station.ten_co_so}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-600 font-medium leading-snug">
                          {station.don_vi_dien_luc || ('Điện lực ' + (station.to_ht || station.dia_ban || ''))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">{station.to_ht}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {station.to_truong}
                        </div>
                      </td>

                      {/* Editable Column 1: Lắp điện */}
                      <td className="py-2.5 px-3">
                        {(() => {
                          const val = (rowEditState.lap_dien || '').trim();
                          const lower = val.toLowerCase();
                          let styleClass = 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-violet-400 font-medium';
                          
                          if (lower.includes('lắp xong') || lower.includes('đóng điện') || lower.includes('nghiệm thu') || lower.includes('hoàn thành')) {
                            styleClass = 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 font-extrabold shadow-xs';
                          } else if (lower.includes('vướng') || lower.includes('chưa nhận') || lower.includes('mặt bằng') || lower.includes('cắt tường')) {
                            styleClass = 'bg-orange-100 text-orange-800 border border-orange-300 font-bold';
                          } else if (val && !lower.includes('chưa')) {
                            styleClass = 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold';
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
                              className={`w-full p-2 rounded-xl text-xs focus:outline-none transition-all duration-200 cursor-pointer ${styleClass}`}
                            >
                              <option value="" className="text-slate-500 italic font-normal">
                                Chưa xong
                              </option>
                              <option value="Đã lắp xong" className="text-emerald-700 font-bold">
                                ✅ Đã lắp xong (Hoàn thành)
                              </option>
                              <option value="Điện lực đã khảo sát và soạn HĐ" className="text-blue-700 font-semibold">
                                ⚡ Điện lực đã khảo sát & soạn HĐ
                              </option>
                              <option value="Đã khảo sát xong, chờ hợp đồng điện lực gửi" className="text-indigo-700">
                                📄 Chờ hợp đồng điện lực gửi
                              </option>
                              <option value="Điện lực đang khảo sát" className="text-amber-700">
                                🔍 Điện lực đang khảo sát
                              </option>
                              <option value="Hồ sơ gửi VGREEN, chưa nhận lại" className="text-purple-700">
                                🕒 Chờ phản hồi VGREEN
                              </option>
                              <option value="Vướng mặt bằng / thi công" className="text-orange-700 font-bold">
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
                          className="w-full p-2 bg-slate-50 border border-slate-200 hover:border-violet-400 focus:border-violet-500 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors leading-relaxed font-medium"
                        />
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isDirty && (
                            <button
                              onClick={() => handleSaveInline(station)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-[#1E1B3A] hover:bg-[#2B274F] text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-all"
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
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[10px] font-bold">
                              <Check className="w-3 h-3 mr-0.5" /> Đã lưu!
                            </span>
                          )}

                          {!isDirty && !savedSuccess && (
                            <button
                              onClick={() => onSelectStation(station)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
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
        <div className="bg-slate-50/90 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            Hiển thị <strong className="text-slate-900">{filteredEveStations.length}</strong> / <strong className="text-violet-700 font-bold">33 trạm EVE</strong>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Tự động đồng bộ 2 chiều dữ liệu thời gian thực
          </div>
        </div>
      </div>
    </div>
  );
}
