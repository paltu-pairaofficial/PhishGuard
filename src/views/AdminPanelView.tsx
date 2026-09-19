import React, { useState, useEffect } from 'react';
import { 
  Sliders, Users, FileText, Activity, Key, Plus, Trash2, 
  CheckCircle, Clock, AlertTriangle, RefreshCw, Search, Shield, Globe, Mail 
} from 'lucide-react';
import { api } from '../api/client';
import { ThreatReport, SuspiciousKeyword, ScanHistoryItem, AdminAnalytics, User } from '../types';
import { RiskScoreMeter } from '../components/RiskScoreMeter';

export const AdminPanelView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'reports' | 'keywords' | 'users' | 'scans'>('analytics');
  
  // Data states
  const [stats, setStats] = useState<AdminAnalytics | null>(null);
  const [reports, setReports] = useState<ThreatReport[]>([]);
  const [keywords, setKeywords] = useState<SuspiciousKeyword[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Keyword Form
  const [newKeywordWord, setNewKeywordWord] = useState('');
  const [newKeywordCat, setNewKeywordCat] = useState<'urgency' | 'threat' | 'credential' | 'finance' | 'impersonation'>('urgency');
  const [newKeywordWeight, setNewKeywordWeight] = useState(15);
  const [keywordSubmitting, setKeywordSubmitting] = useState(false);
  const [keywordFeedback, setKeywordFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, keywordsRes, usersRes, logsRes] = await Promise.all([
        api.admin.getAnalytics(),
        api.reports.getAll(),
        api.admin.getKeywords(),
        api.admin.getUsers(),
        api.admin.getLogs()
      ]);
      setStats(statsRes);
      setReports(reportsRes.reports);
      setKeywords(keywordsRes.keywords);
      setUsers(usersRes.users);
      setScans(logsRes.logs);
    } catch (err: any) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateReportStatus = async (reportId: string, newStatus: 'pending' | 'reviewed' | 'resolved') => {
    try {
      const res = await api.reports.updateStatus(reportId, newStatus);
      setReports(prev => prev.map(r => r.id === reportId ? res.report : r));
    } catch (err: any) {
      alert(err.message || 'Failed to update report status');
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordWord.trim()) return;

    setKeywordSubmitting(true);
    try {
      const res = await api.admin.addKeyword({
        keyword: newKeywordWord.trim().toLowerCase(),
        category: newKeywordCat,
        weight: Number(newKeywordWeight)
      });
      setKeywords(prev => [...prev, res.keyword]);
      setNewKeywordWord('');
      setKeywordFeedback('Rule keyword added successfully to detection engine.');
      setTimeout(() => setKeywordFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add keyword');
    } finally {
      setKeywordSubmitting(false);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!window.confirm('Delete this suspicious keyword rule?')) return;
    try {
      await api.admin.deleteKeyword(id);
      setKeywords(prev => prev.filter(k => k.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete keyword');
    }
  };

  return (
    <div id="admin-panel-page" className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Administrative Controls</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Administration Panel</h1>
          <p className="text-xs text-slate-400 mt-1">
            System metrics, user audit logs, threat incident reviews, and detection engine keyword rules.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Metrics</span>
        </button>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        <button
          id="admin-tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'analytics'
              ? 'bg-emerald-400 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>System Analytics</span>
        </button>

        <button
          id="admin-tab-reports"
          onClick={() => setActiveTab('reports')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'reports'
              ? 'bg-emerald-400 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Threat Reports ({reports.length})</span>
        </button>

        <button
          id="admin-tab-keywords"
          onClick={() => setActiveTab('keywords')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'keywords'
              ? 'bg-emerald-400 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Suspicious Keywords ({keywords.length})</span>
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'bg-emerald-400 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory ({users.length})</span>
        </button>

        <button
          id="admin-tab-scans"
          onClick={() => setActiveTab('scans')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'scans'
              ? 'bg-emerald-400 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Global Scan Logs ({scans.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Loading admin intelligence...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: System Analytics */}
          {activeTab === 'analytics' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <span className="text-xs uppercase text-slate-400 font-semibold">Total Scans Executed</span>
                  <div className="text-3xl font-black text-white mt-1">{stats.totalScans}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{stats.urlScans} URLs • {stats.messageScans} Messages</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <span className="text-xs uppercase text-red-400 font-semibold">Threats Flagged</span>
                  <div className="text-3xl font-black text-red-400 mt-1">{stats.highRiskScans + stats.criticalScans + stats.suspiciousScans}</div>
                  <div className="text-[11px] text-red-400/80 mt-1">{stats.highRiskScans + stats.criticalScans} High Risk / Critical</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <span className="text-xs uppercase text-amber-400 font-semibold">Filed Threat Reports</span>
                  <div className="text-3xl font-black text-amber-400 mt-1">{stats.totalReports}</div>
                  <div className="text-[11px] text-amber-400/80 mt-1">{stats.pendingReports} awaiting review</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <span className="text-xs uppercase text-emerald-400 font-semibold">Registered Users</span>
                  <div className="text-3xl font-black text-emerald-400 mt-1">{stats.totalUsers}</div>
                  <div className="text-[11px] text-emerald-400/80 mt-1">Active registered accounts</div>
                </div>
              </div>

              {/* Threat Distribution Bars */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Platform Threat Level Breakdown
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400 font-semibold">Safe Activity</span>
                      <span className="text-slate-300 font-mono">{stats.safeScans} scans</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.totalScans ? (stats.safeScans / stats.totalScans) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-amber-400 font-semibold">Suspicious Activity</span>
                      <span className="text-slate-300 font-mono">{stats.suspiciousScans} scans</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.totalScans ? (stats.suspiciousScans / stats.totalScans) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400 font-semibold">High Risk Phishing Attacks</span>
                      <span className="text-slate-300 font-mono">{stats.highRiskScans + stats.criticalScans} scans</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${stats.totalScans ? ((stats.highRiskScans + stats.criticalScans) / stats.totalScans) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Threat Reports Review */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Report Queue & Incident Management
                  </h3>
                  <span className="text-xs text-slate-400">Update report status to manage security triage</span>
                </div>

                {reports.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No threat reports filed yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs uppercase font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                              {report.report_type}
                            </span>
                            <span className="text-xs font-bold text-white">ID: #{report.id.substring(4, 10)}</span>
                            <span className="text-xs text-slate-400">by {report.user_name}</span>
                          </div>

                          {/* Status changer buttons */}
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleUpdateReportStatus(report.id, 'pending')}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                                report.status === 'pending'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'text-slate-400 hover:text-white bg-slate-800'
                              }`}
                            >
                              Pending
                            </button>
                            <button
                              onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                                report.status === 'reviewed'
                                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                  : 'text-slate-400 hover:text-white bg-slate-800'
                              }`}
                            >
                              Reviewed
                            </button>
                            <button
                              onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                                report.status === 'resolved'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'text-slate-400 hover:text-white bg-slate-800'
                              }`}
                            >
                              Resolved
                            </button>
                          </div>
                        </div>

                        <div className="font-mono text-xs text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 break-all">
                          {report.content}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/60">
                          {report.details}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Suspicious Keywords Management */}
          {activeTab === 'keywords' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form to Add New Keyword */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Add Detection Rule Keyword</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Keywords added here are dynamically integrated into the PhishGuard detection scoring engine.
                </p>

                {keywordFeedback && (
                  <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs">
                    {keywordFeedback}
                  </div>
                )}

                <form onSubmit={handleAddKeyword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Keyword or Phrase
                    </label>
                    <input
                      id="input-admin-keyword"
                      type="text"
                      required
                      value={newKeywordWord}
                      onChange={(e) => setNewKeywordWord(e.target.value)}
                      placeholder="e.g., account termination"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      id="select-admin-keyword-cat"
                      value={newKeywordCat}
                      onChange={(e: any) => setNewKeywordCat(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="urgency">Urgency / Panic Trigger</option>
                      <option value="threat">Threat / Coercion</option>
                      <option value="credential">Credential Harvesting</option>
                      <option value="finance">Financial / Scam Alert</option>
                      <option value="impersonation">Brand Impersonation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Risk Weight Points ({newKeywordWeight} pts)
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={40}
                      step={5}
                      value={newKeywordWeight}
                      onChange={(e) => setNewKeywordWeight(Number(e.target.value))}
                      className="w-full accent-emerald-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Low (5)</span>
                      <span>Medium (20)</span>
                      <span>Critical (40)</span>
                    </div>
                  </div>

                  <button
                    id="btn-admin-add-keyword"
                    type="submit"
                    disabled={keywordSubmitting}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Keyword Rule</span>
                  </button>
                </form>
              </div>

              {/* Keywords Table */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Active Detection Engine Keywords ({keywords.length})
                  </h3>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Keyword</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Weight</th>
                        <th className="py-2.5 px-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {keywords.map((kw) => (
                        <tr key={kw.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-semibold text-white">
                            {kw.keyword}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-950 text-slate-300 border border-slate-800">
                              {kw.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-amber-400 font-bold">
                            +{kw.weight}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteKeyword(kw.id)}
                              className="p-1 rounded text-red-400 hover:bg-red-950/40"
                              title="Delete Keyword"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: User Directory */}
          {activeTab === 'users' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Registered Users ({users.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">System Role</th>
                      <th className="py-3 px-4">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Global Scans */}
          {activeTab === 'scans' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Platform Scan History Log ({scans.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Submitted Content</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {scans.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-300">{s.scan_type}</td>
                        <td className="py-3 px-4 max-w-md truncate font-mono text-slate-200">{s.content}</td>
                        <td className="py-3 px-4">
                          <RiskScoreMeter score={s.risk_score} level={s.risk_level} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{s.risk_score}/100</td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(s.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
