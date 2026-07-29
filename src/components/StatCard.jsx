import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'cyan', percent }) {
  const colorMap = {
    cyan: {
      card: 'bg-[#D6E8FC] border-blue-200/60 text-slate-900',
      icon: 'bg-white/80 text-blue-700 border border-blue-200/60 shadow-xs',
      bar: 'bg-blue-600',
      sub: 'text-blue-900/80',
    },
    purple: {
      card: 'bg-[#ECE8FE] border-purple-200/60 text-slate-900',
      icon: 'bg-white/80 text-purple-700 border border-purple-200/60 shadow-xs',
      bar: 'bg-purple-600',
      sub: 'text-purple-900/80',
    },
    amber: {
      card: 'bg-[#FDE3D9] border-orange-200/60 text-slate-900',
      icon: 'bg-white/80 text-orange-700 border border-orange-200/60 shadow-xs',
      bar: 'bg-orange-500',
      sub: 'text-orange-900/80',
    },
    emerald: {
      card: 'bg-[#D1F4E0] border-emerald-200/60 text-slate-900',
      icon: 'bg-white/80 text-emerald-700 border border-emerald-200/60 shadow-xs',
      bar: 'bg-emerald-600',
      sub: 'text-emerald-900/80',
    },
    red: {
      card: 'bg-rose-100/70 border-rose-200/60 text-slate-900',
      icon: 'bg-white/80 text-rose-700 border border-rose-200/60 shadow-xs',
      bar: 'bg-rose-600',
      sub: 'text-rose-900/80',
    },
  };

  const currentTheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-sm border ${currentTheme.card}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
          {subtext && <p className={`text-xs font-semibold mt-1 ${currentTheme.sub}`}>{subtext}</p>}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-2xl ${currentTheme.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {percent !== undefined && (
        <div className="mt-3.5">
          <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden border border-black/5">
            <div
              className={`h-2 rounded-full ${currentTheme.bar} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
          <p className={`text-[11px] text-right font-extrabold mt-1.5 ${currentTheme.sub}`}>{percent}% hoàn thành</p>
        </div>
      )}
    </div>
  );
}
