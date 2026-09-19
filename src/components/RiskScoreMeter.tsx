import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface RiskScoreMeterProps {
  score: number;
  level: 'Safe' | 'Low Risk' | 'Suspicious' | 'High Risk' | 'Critical';
  size?: 'sm' | 'md' | 'lg';
}

export const RiskScoreMeter: React.FC<RiskScoreMeterProps> = ({ score, level, size = 'md' }) => {
  const getLevelConfig = () => {
    switch (level) {
      case 'Safe':
        return {
          textColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          barColor: 'bg-emerald-500',
          icon: ShieldCheck,
          label: 'Safe (0–20)'
        };
      case 'Low Risk':
        return {
          textColor: 'text-sky-400',
          bgColor: 'bg-sky-500/10',
          borderColor: 'border-sky-500/30',
          barColor: 'bg-sky-500',
          icon: CheckCircle2,
          label: 'Low Risk (21–40)'
        };
      case 'Suspicious':
        return {
          textColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          barColor: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'Suspicious (41–60)'
        };
      case 'High Risk':
        return {
          textColor: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          barColor: 'bg-orange-500',
          icon: ShieldAlert,
          label: 'High Risk (61–80)'
        };
      case 'Critical':
      default:
        return {
          textColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          barColor: 'bg-red-500',
          icon: AlertOctagon,
          label: 'Critical (81–100)'
        };
    }
  };

  const config = getLevelConfig();
  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{level} ({score}%)</span>
      </span>
    );
  }

  return (
    <div id="risk-score-meter" className={`p-5 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-lg bg-slate-900 border ${config.borderColor}`}>
            <Icon className={`w-6 h-6 ${config.textColor}`} />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Risk Assessment</div>
            <div className={`text-xl font-bold tracking-tight ${config.textColor}`}>{level}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-extrabold text-white tracking-tight">{score}<span className="text-sm font-semibold text-slate-400">/100</span></div>
          <div className="text-xs text-slate-400">{config.label}</div>
        </div>
      </div>

      {/* Progress Bar with Tier Ranges */}
      <div className="w-full bg-slate-800/80 rounded-full h-3 p-0.5 overflow-hidden border border-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ${config.barColor}`}
          style={{ width: `${Math.max(4, score)}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono px-0.5">
        <span>0 (Safe)</span>
        <span>20</span>
        <span>40 (Low)</span>
        <span>60 (Suspicious)</span>
        <span>80 (High)</span>
        <span>100 (Critical)</span>
      </div>
    </div>
  );
};
