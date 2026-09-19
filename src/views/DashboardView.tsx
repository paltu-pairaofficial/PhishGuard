import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon, Globe, 
  Mail, ArrowRight, History, Plus, RefreshCw, Calendar, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ScanHistoryItem } from '../types';
import { RiskScoreMeter } from '../components/RiskScoreMeter';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectScan: (scan: ScanHistoryItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectScan }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.history.getAll();
      setHistory(res.history);
    } catch (err) {
      console.error('Failed to load dashboard scans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalScans = history.length;
  const safeScans = history.filter(s => s.risk_level === 'Safe').length;
  const lowRiskScans = history.filter(s => s.risk_level === 'Low Risk').length;
  const suspiciousScans = history.filter(s => s.risk_level === 'Suspicious').length;
  const highRiskDetections = history.filter(s => s.risk_level === 'High Risk' || s.risk_level === 'Critical').length;

  const urlScansCount = history.filter(s => s.scan_type === 'url').length;
  const messageScansCount = history.filter(s => s.scan_type === 'message').length;

  const recentScans = history.slice(0, 5);

  return (
    <div id="user-dashboard" className="space-y-8 pb-12">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, <span className="text-white font-medium">{user?.name}</span>. Here is your recent threat inspection activity.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="dash-btn-refresh"
            onClick={fetchDashboardData}
            title="Refresh dashboard stats"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="dash-btn-quick-url"
            onClick={() => onNavigate('url_scanner')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Scan URL</span>
          </button>

          <button
            id="dash-btn-quick-message"
            onClick={() => onNavigate('email_analyzer')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Check Message</span>
          </button>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Scans */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">Total Scans</span>
            <div className="text-2xl font-black text-white mt-1">{totalScans}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {urlScansCount} URLs • {messageScansCount} Messages
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <History className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Safe Scans */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-medium text-emerald-400 tracking-wider">Safe Content</span>
            <div className="text-2xl font-black text-white mt-1">{safeScans}</div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              {totalScans > 0 ? `${Math.round((safeScans / totalScans) * 100)}% verified clean` : 'No scans yet'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Suspicious Scans */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-medium text-amber-400 tracking-wider">Suspicious Items</span>
            <div className="text-2xl font-black text-white mt-1">{suspiciousScans}</div>
            <div className="text-[11px] text-amber-400/80 mt-1">
              Require caution / verification
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: High-Risk Detections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-medium text-red-400 tracking-wider">High Risk / Critical</span>
            <div className="text-2xl font-black text-white mt-1">{highRiskDetections}</div>
            <div className="text-[11px] text-red-400/80 mt-1">
              Active phishing threats identified
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Detection Statistics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Detection Statistics & Risk Distribution
            </h2>
            <span className="text-xs text-slate-400 font-mono">Based on your activity</span>
          </div>

          {totalScans === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No scan activity recorded yet. Run your first URL or email scan to view risk distributions.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-semibold">Safe (0–20 Score)</span>
                  <span className="text-slate-300 font-mono">{safeScans} scans ({Math.round((safeScans / totalScans) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(safeScans / totalScans) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-sky-400 font-semibold">Low Risk (21–40 Score)</span>
                  <span className="text-slate-300 font-mono">{lowRiskScans} scans ({Math.round((lowRiskScans / totalScans) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${(lowRiskScans / totalScans) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-semibold">Suspicious (41–60 Score)</span>
                  <span className="text-slate-300 font-mono">{suspiciousScans} scans ({Math.round((suspiciousScans / totalScans) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(suspiciousScans / totalScans) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400 font-semibold">High Risk & Critical (61–100 Score)</span>
                  <span className="text-slate-300 font-mono">{highRiskDetections} scans ({Math.round((highRiskDetections / totalScans) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${(highRiskDetections / totalScans) * 100}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Launch Cards */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Verify Web Link</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Inspect suspicious SMS links, banking URLs, or unknown domain registrations.
            </p>
            <button
              onClick={() => onNavigate('url_scanner')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 flex items-center justify-between"
            >
              <span>Open URL Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-1.5">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Inspect Email Body</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Paste urgent warnings, account lock notices, or prize notifications.
            </p>
            <button
              onClick={() => onNavigate('email_analyzer')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400 border border-slate-700 flex items-center justify-between"
            >
              <span>Open Message Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Scans
          </h2>
          <button
            id="dash-btn-view-all-history"
            onClick={() => onNavigate('history')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No previous scans found. Use the buttons above to run your first security scan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Submitted Content</th>
                  <th className="py-2.5 px-3">Risk Assessment</th>
                  <th className="py-2.5 px-3">Scan Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        scan.scan_type === 'url' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
                      }`}>
                        {scan.scan_type === 'url' ? <Globe className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        <span>{scan.scan_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs sm:max-w-md truncate font-mono text-slate-200">
                      {scan.content}
                    </td>
                    <td className="py-3 px-3">
                      <RiskScoreMeter score={scan.risk_score} level={scan.risk_level} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectScan(scan)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
