import React, { useState, useMemo } from 'react';
import StatCard from './StatCard';
import { Wrench, Zap, AlertTriangle, Layers, Building2, CheckCircle2, Search, Filter } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function OverviewTab({ stations, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState('ALL');

  // Dynamic Batch (Đợt) List
  const dotsList = useMemo(() => {
    const set = new Set(stations.map(s => s.dot).filter(Boolean));
    return Array.from(set).sort();
  }, [stations]);

  // Filtered Stations based on universal search & batch filter
  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      const matchSearch = searchTerm === '' ||
        s.ma_tram.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ten_co_so.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_ht.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dia_chi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_truong.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDot = selectedDot === 'ALL' || s.dot === selectedDot;

      return matchSearch && matchDot;
    });
  }, [stations, searchTerm, selectedDot]);

  const totalStations = filteredStations.length;
  const totalCabinets = filteredStations.reduce((acc, s) => acc + (s.so_luong_tu || 2), 0);

  // Status counters
  const installedDone = filteredStations.filter(s => s.status_lap_dat === 'Đã hoàn thành').length;
  const installedProgress = filteredStations.filter(s => s.status_lap_dat === 'Đang thi công').length;

  const powerDone = filteredStations.filter(s => {
    const vm = (s.vuong_mac || '').toLowerCase();
    return vm.includes('đóng điện') || vm.includes('nghiệm thu') || vm.includes('đã hoàn thành') || s.status_dien_luc === 'Đã đóng điện 3P';
  }).length;

  const powerPending = filteredStations.filter(s => {
    const vm = (s.vuong_mac || '').toLowerCase();
    return vm.includes('khảo sát') || vm.includes('hợp đồng') || vm.includes('chờ điện lực') || vm.includes('soạn hđ');
  }).length;

  const totalIssues = filteredStations.filter(s => s.vuong_mac && s.vuong_mac.trim().length > 3 && !(s.vuong_mac.toLowerCase().includes('đã hoàn thành') || s.vuong_mac.toLowerCase().includes('đã đóng điện'))).length;

  // Breakdown by Tổ Hạ Tầng
  const teamsMap = {};
  filteredStations.forEach(s => {
    const team = s.to_ht || 'Khác';
    if (!teamsMap[team]) teamsMap[team] = { total: 0, installed: 0, powerDone: 0, issues: 0 };
    teamsMap[team].total++;
    if (s.status_lap_dat === 'Đã hoàn thành') teamsMap[team].installed++;

    const vm = (s.vuong_mac || '').toLowerCase();
    if (vm.includes('đóng điện') || vm.includes('nghiệm thu') || vm.includes('đã hoàn thành') || s.status_dien_luc === 'Đã đóng điện 3P') {
      teamsMap[team].powerDone++;
    }
    if (s.vuong_mac && s.vuong_mac.trim().length > 3 && !(vm.includes('đã hoàn thành') || vm.includes('đã đóng điện'))) {
      teamsMap[team].issues++;
    }
  });

  const teamLabels = Object.keys(teamsMap);
  const teamTotalData = teamLabels.map(t => teamsMap[t].total);
  const teamPowerDoneData = teamLabels.map(t => teamsMap[t].powerDone);
  const teamIssuesData = teamLabels.map(t => teamsMap[t].issues);

  const barChartData = {
    labels: teamLabels,
    datasets: [
      {
        label: 'Tổng trạm',
        data: teamTotalData,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
      },
      {
        label: 'Đã đóng điện EVN',
        data: teamPowerDoneData,
        backgroundColor: '#10B981',
        borderRadius: 8,
      },
      {
        label: 'Có vướng mắc',
        data: teamIssuesData,
        backgroundColor: '#FF6B57',
        borderRadius: 8,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#475569', font: { family: 'Inter', size: 11, weight: '600' } } },
      tooltip: { backgroundColor: '#1E1B3A', titleColor: '#fff', bodyColor: '#e2e8f0', borderRadius: 8 }
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { family: 'Inter', size: 10, weight: '500' } }, grid: { display: false } },
      y: { ticks: { color: '#64748b', font: { family: 'Inter', size: 10, weight: '500' } }, grid: { color: 'rgba(226, 232, 240, 0.8)' } }
    }
  };

  const doughnutData = {
    labels: ['Đã đóng điện', 'Chờ xử lý EVN', 'Có vướng mắc'],
    datasets: [
      {
        data: [powerDone, powerPending, Math.max(0, totalStations - powerDone - powerPending)],
        backgroundColor: ['#9A5CFF', '#FF6B57', '#3B82F6'],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Universal Search & Batch Filter Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm border border-slate-200/80">
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
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-3.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-violet-600" />
            <select
              value={selectedDot}
              onChange={(e) => setSelectedDot(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các đợt ({dotsList.length} đợt)</option>
              {dotsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Số Trạm Quản Lý"
          value={`${totalStations} Trạm`}
          subtext={`Lọc theo kết quả tìm kiếm`}
          icon={Building2}
          color="cyan"
        />
        <StatCard
          title="Tổng Số Tủ Pin"
          value={`${totalCabinets} Tủ`}
          subtext="Các loại tủ 6-12 ngăn"
          icon={Wrench}
          color="purple"
        />
        <StatCard
          title="Tiến Độ Điện Lực EVN"
          value={`${powerDone}/${totalStations} Trạm`}
          subtext={`${powerPending} trạm đang tiến hành thủ tục`}
          icon={Zap}
          color="emerald"
          percent={Math.round((powerDone / (totalStations || 1)) * 100)}
        />
        <StatCard
          title="Trạm Có Vướng Mắc"
          value={`${totalIssues} Trạm`}
          subtext="Cần xử lý dứt điểm trở ngại"
          icon={AlertTriangle}
          color="amber"
          percent={Math.round((totalIssues / (totalStations || 1)) * 100)}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-2 text-violet-600" />
              Thống Kê Tiến Độ Theo Tổ Hạ Tầng
            </h3>
            <span className="text-xs font-bold text-slate-500">Đơn vị: Trạm</span>
          </div>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between shadow-sm border border-slate-200/80">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            Tỷ Lệ Đóng Điện EVN
          </h3>
          <div className="h-52 relative flex items-center justify-center my-2">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#475569', font: { size: 11, weight: '600' } } } } }} />
          </div>
          <div className="text-center text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
            Tỷ lệ phủ điện EVN đạt <span className="text-violet-700 font-extrabold">{Math.round((powerDone / (totalStations || 1)) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Quick Recent Issues List */}
      <div className="glass-card rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
            Các Trạm Cần Chú Ý Xử Lý Vướng Mắc Gần Đây
          </h3>
          <span className="text-xs font-semibold text-slate-500">Lọc theo từ khóa tìm kiếm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStations.filter(s => s.vuong_mac && s.vuong_mac.trim().length > 3 && !(s.vuong_mac.toLowerCase().includes('đã hoàn thành') || s.vuong_mac.toLowerCase().includes('đã đóng điện'))).slice(0, 6).map((station) => (
            <div
              key={station.id}
              onClick={() => onSelectStation(station)}
              className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/60 hover:border-orange-300 hover:bg-orange-50/90 cursor-pointer transition-all shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-violet-700">{station.ma_tram}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-orange-700 border border-orange-200">
                  {station.to_ht}
                </span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 mt-1 truncate">{station.ten_co_so}</p>
              <p className="text-xs text-orange-900/90 mt-1 line-clamp-2 italic font-medium">
                "{station.vuong_mac}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
