import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'cyan', percent }) {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
    red: 'from-red-500/20 to-rose-500/10 text-red-400 border-red-500/30',
    purple: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30',
  };

  const bgGradient = colorMap[color] || colorMap.cyan;

  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-white mt-1">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${bgGradient} border`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {percent !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full bg-${color === 'cyan' ? 'cyan' : color}-500 transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          </div>
          <p className="text-[11px] text-right font-medium text-slate-400 mt-1">{percent}% hoàn thành</p>
        </div>
      )}
    </div>
  );
}
