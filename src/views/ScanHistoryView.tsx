import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Trash2, Download, RefreshCw, 
  Globe, Mail, AlertCircle, Eye, Calendar, X 
} from 'lucide-react';
import { api } from '../api/client';
import { ScanHistoryItem } from '../types';
import { RiskScoreMeter } from '../components/RiskScoreMeter';
import { ScanResultCard } from '../components/ScanResultCard';

interface ScanHistoryViewProps {
  onReportThreat: (content: string, riskLevel: string) => void;
}

export const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({ onReportThreat }) => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.history.getAll({
        search: search.trim() || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        risk_level: riskFilter !== 'all' ? riskFilter : undefined
      });
      setHistory(res.history);
    } catch (err: any) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [typeFilter, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this scan record from your history?')) return;
    try {
      await api.history.delete(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedScan?.id === id) setSelectedScan(null);
      setFeedbackMessage('Scan record deleted.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete scan record');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear your ENTIRE scan history? This action cannot be undone.')) return;
    try {
      await api.history.clearAll();
      setHistory([]);
      setSelectedScan(null);
      setFeedbackMessage('Entire scan history has been cleared.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to clear history');
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `phishguard_scans_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="scan-history-page" className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Scan History & Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, filter, and export all URLs and messages scanned by your account.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-export-history"
            onClick={handleExport}
            disabled={history.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export JSON</span>
          </button>

          <button
            id="btn-clear-history"
            onClick={handleClearAll}
            disabled={history.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950 text-red-300 border border-red-900/60 text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs">
          {feedbackMessage}
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              id="input-history-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by URL, domain, or content keywords..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center space-x-2">
            <select
              id="select-history-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="url">URLs Only</option>
              <option value="message">Messages Only</option>
            </select>

            <select
              id="select-history-risk"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="Safe">Safe</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Suspicious">Suspicious</option>
              <option value="High Risk">High Risk</option>
              <option value="Critical">Critical</option>
            </select>

            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading scan history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <History className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
            <p className="font-semibold text-slate-300">No matching scan history records found.</p>
            <p className="text-slate-400 text-[11px]">Run a URL scan or message analysis to populate this log.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Submitted Content</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Indicators Found</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        scan.scan_type === 'url' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
                      }`}>
                        {scan.scan_type === 'url' ? <Globe className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        <span>{scan.scan_type}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs md:max-w-sm truncate font-mono text-slate-200">
                      {scan.content}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskScoreMeter score={scan.risk_score} level={scan.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {scan.result.indicators.length} signal{scan.result.indicators.length === 1 ? '' : 's'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(scan.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedScan(scan)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                        title="View Full Scan Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(scan.id)}
                        className="p-1.5 rounded bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/60"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Scan Detailed Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setSelectedScan(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <ScanResultCard
              content={selectedScan.content}
              scanType={selectedScan.scan_type}
              result={selectedScan.result}
              createdAt={selectedScan.created_at}
              onReportThreat={() => {
                const targetContent = selectedScan.content;
                const targetLevel = selectedScan.risk_level;
                setSelectedScan(null);
                onReportThreat(targetContent, targetLevel);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
