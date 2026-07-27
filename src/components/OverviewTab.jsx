import React from 'react';
import StatCard from './StatCard';
import { Wrench, Zap, AlertTriangle, Layers, Building2, CheckCircle2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function OverviewTab({ stations, onSelectStation }) {
  const totalStations = stations.length;
  const dot1Count = stations.filter(s => s.dot.includes('1')).length;
  const dot2Count = stations.filter(s => s.dot.includes('2')).length;

  const totalCabinets = stations.reduce((acc, s) => acc + (s.so_luong_tu || 2), 0);

  // Status counters
  const installedDone = stations.filter(s => s.status_lap_dat === 'Đã hoàn thành').length;
  const installedProgress = stations.filter(s => s.status_lap_dat === 'Đang thi công').length;
  const installedPending = totalStations - installedDone - installedProgress;

  const powerDone = stations.filter(s => s.status_dien_luc === 'Đã đóng điện 3P').length;
  const powerPending = stations.filter(s => s.status_dien_luc === 'Chờ Điện lực xử lý/HĐ').length;
  const powerIssue = stations.filter(s => s.status_dien_luc === 'Vướng mắc thủ tục').length;

  const totalIssues = stations.filter(s => s.vuong_mac && s.vuong_mac.trim().length > 3).length;

  // Breakdown by Tổ Hạ Tầng
  const teamsMap = {};
  stations.forEach(s => {
    const team = s.to_ht || 'Khác';
    if (!teamsMap[team]) teamsMap[team] = { total: 0, installed: 0, powerDone: 0, issues: 0 };
    teamsMap[team].total++;
    if (s.status_lap_dat === 'Đã hoàn thành') teamsMap[team].installed++;
    if (s.status_dien_luc === 'Đã đóng điện 3P') teamsMap[team].powerDone++;
    if (s.vuong_mac && s.vuong_mac.trim().length > 3) teamsMap[team].issues++;
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
        backgroundColor: 'rgba(56, 189, 248, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Đã đóng điện 3P',
        data: teamPowerDoneData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Có vướng mắc',
        data: teamIssuesData,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#fff', bodyColor: '#cbd5e1' }
    },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
    }
  };

  const doughnutData = {
    labels: ['Đã hoàn thành', 'Chờ xử lý EVN', 'Vướng mắc'],
    datasets: [
      {
        data: [powerDone, powerPending, powerIssue + (totalStations - powerDone - powerPending - powerIssue)],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng Số Trạm Tủ Đổi Pin"
          value={`${totalStations} Trạm`}
          subtext={`Đợt 1: ${dot1Count} trạm | Đợt 2: ${dot2Count} trạm`}
          icon={Building2}
          color="cyan"
        />
        <StatCard
          title="Tổng Số Tủ Lắp Đặt"
          value={`${totalCabinets} Tủ`}
          subtext="Các loại tủ 6 ngăn và 12 ngăn"
          icon={Wrench}
          color="purple"
        />
        <StatCard
          title="Tiến Độ Điện Lực EVN"
          value={`${powerDone}/${totalStations} Trạm`}
          subtext={`${powerPending} trạm đang chờ thủ tục EVN`}
          icon={Zap}
          color="emerald"
          percent={Math.round((powerDone / (totalStations || 1)) * 100)}
        />
        <StatCard
          title="Trạm Có Vướng Mắc"
          value={`${totalIssues} Trạm`}
          subtext="Vướng mặt bằng, hợp đồng, cắt tường..."
          icon={AlertTriangle}
          color="red"
          percent={Math.round((totalIssues / (totalStations || 1)) * 100)}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-2 text-cyan-400" />
              Thống Kê Tiến Độ Theo Tổ Hạ Tầng
            </h3>
            <span className="text-xs text-slate-400">Đơn vị: Trạm</span>
          </div>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
            Tỷ Lệ Hoàn Thành EVN
          </h3>
          <div className="h-52 relative flex items-center justify-center my-2">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }} />
          </div>
          <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-3">
            Tỷ lệ phủ điện 3 Pha EVN đạt <span className="text-emerald-400 font-bold">{Math.round((powerDone / (totalStations || 1)) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Quick Recent Issues List */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
            Các Trạm Cần Chú Ý Xử Lý Vướng Mắc Gần Đây
          </h3>
          <span className="text-xs text-slate-400">Hiển thị trạm có ghi chú vướng mắc</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stations.filter(s => s.vuong_mac && s.vuong_mac.trim().length > 3).slice(0, 6).map((station) => (
            <div
              key={station.id}
              onClick={() => onSelectStation(station)}
              className="p-3.5 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{station.ma_tram}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {station.to_ht}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200 mt-1 truncate">{station.ten_co_so}</p>
              <p className="text-xs text-amber-300/90 mt-1 line-clamp-2 italic">
                "{station.vuong_mac}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
