import React, { useMemo } from 'react';
import { Zap, CheckCircle2, Clock, AlertTriangle, ShieldCheck, PieChart } from 'lucide-react';

export default function PowerGridTab({ stations, onSelectStation }) {
  // Aggregate stats by power connection status
  const stats = useMemo(() => {
    let powerDone = 0; // Đã đóng điện 3P
    let pendingEVN = 0; // Chờ Điện lực khảo sát/HĐ
    let pendingDocs = 0; // Chờ làm thủ tục/Nộp hồ sơ
    let issueDocs = 0; // Vướng mắc thủ tục

    stations.forEach(s => {
      const vm = (s.vuong_mac || '').toLowerCase();
      if (vm.includes('đóng điện') || vm.includes('nghiệm thu') || s.status_dien_luc === 'Đã đóng điện 3P') {
        powerDone++;
      } else if (vm.includes('khảo sát') || vm.includes('hợp đồng') || vm.includes('chờ điện lực')) {
        pendingEVN++;
      } else if (vm.includes('chờ') || vm.includes('vgreen') || vm.includes('hồ sơ')) {
        pendingDocs++;
      } else {
        issueDocs++;
      }
    });

    return { powerDone, pendingEVN, pendingDocs, issueDocs };
  }, [stations]);

  // Group by Tổ Hạ Tầng (Team)
  const teamPowerStats = useMemo(() => {
    const map = {};
    stations.forEach(s => {
      const team = s.to_ht || 'Khác';
      if (!map[team]) map[team] = { team, total: 0, powerDone: 0, pendingEVN: 0, issues: 0 };
      map[team].total++;

      const vm = (s.vuong_mac || '').toLowerCase();
      if (vm.includes('đóng điện') || vm.includes('nghiệm thu') || s.status_dien_luc === 'Đã đóng điện 3P') {
        map[team].powerDone++;
      } else if (vm.includes('khảo sát') || vm.includes('hợp đồng') || vm.includes('chờ điện lực')) {
        map[team].pendingEVN++;
      } else {
        map[team].issues++;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [stations]);

  const total = stations.length || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner EVN Status */}
      <div className="glass-card rounded-xl p-6 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-cyan-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-evn-blue/30 text-cyan-300 border border-cyan-500/30 mb-2">
              <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Thống Kê Tiến Độ Cấp Điện 3 Pha Điện Lực (EVN)
            </div>
            <h2 className="text-xl font-extrabold text-white">Quản Lý & Theo Dõi Thủ Tục Đấu Nối Điện Lực</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Thống kê tiến độ nộp hồ sơ, khảo sát phương án 3P, ký kết hợp đồng mua bán điện và tiến độ đấu nối cấp điện 3 pha cho các tủ đổi pin.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Tỷ lệ đấu nối hoàn tất</div>
              <div className="text-2xl font-black text-emerald-400">{Math.round((stats.powerDone / total) * 100)}%</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">1. Đã Đóng Điện 3P</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.powerDone} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-emerald-400 mt-1">Đã đấu nối công tơ & vận hành</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">2. Chờ HĐ / Khảo Sát EVN</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.pendingEVN} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-amber-400 mt-1">Điện lực đang khảo sát/soạn HĐ</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-4 border-l-cyan-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">3. Chờ Hồ Sơ / VGREEN</span>
            <PieChart className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.pendingDocs} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-cyan-400 mt-1">Gửi hồ sơ nhận phản hồi</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-4 border-l-rose-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">4. Vướng Thủ Tục Cấp Điện</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{stats.issueDocs} <span className="text-xs text-slate-400 font-normal">trạm</span></div>
          <p className="text-[11px] text-rose-400 mt-1">Cần hỗ trợ giải quyết gấp</p>
        </div>
      </div>

      {/* Team Level Progress Breakdown */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
          <Zap className="w-4 h-4 mr-2 text-amber-400" />
          Tiến Độ Lắp Điện EVN Chi Tiết Theo Tổ Hạ Tầng
        </h3>

        <div className="space-y-4">
          {teamPowerStats.map((item) => {
            const powerPct = Math.round((item.powerDone / item.total) * 100);
            const pendingPct = Math.round((item.pendingEVN / item.total) * 100);
            const issuePct = Math.round((item.issues / item.total) * 100);

            return (
              <div key={item.team} className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100">{item.team}</span>
                    <span className="text-slate-400">({item.total} trạm)</span>
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
          })}
        </div>
      </div>
    </div>
  );
}
