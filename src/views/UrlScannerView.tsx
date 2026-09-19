import React, { useState } from 'react';
import { Globe, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { ScanHistoryItem } from '../types';
import { ScanResultCard } from '../components/ScanResultCard';

interface UrlScannerViewProps {
  onReportThreat: (content: string, riskLevel: string) => void;
  initialScan?: ScanHistoryItem | null;
}

export const UrlScannerView: React.FC<UrlScannerViewProps> = ({ onReportThreat, initialScan }) => {
  const [url, setUrl] = useState(initialScan?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScan, setCurrentScan] = useState<ScanHistoryItem | null>(initialScan || null);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const targetUrl = url.trim();
    if (!targetUrl) {
      setError('Please provide a URL to scan.');
      return;
    }

    setLoading(true);
    setCurrentScan(null);

    try {
      const res = await api.scan.url(targetUrl);
      setCurrentScan(res.scan);
    } catch (err: any) {
      setError(err.message || 'Failed to scan URL. Please verify format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="url-scanner-page" className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase mb-3">
          <Globe className="w-3.5 h-3.5" />
          <span>Website & Domain Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">URL Phishing Scanner</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Submit any website address to inspect domain legitimacy, SSL certificates, high-risk TLDs, and reputation status.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Target Website URL
            </label>
            <div className="relative flex items-center">
              <input
                id="input-scan-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://example-login.xyz or http://192.168.1.1/verify"
                className="w-full pl-10 pr-28 py-3 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Globe className="w-5 h-5 text-slate-400 absolute left-3 pointer-events-none" />

              <button
                id="btn-submit-url-scan"
                type="submit"
                disabled={loading || !url.trim()}
                className="absolute right-2 px-4 py-2 rounded-md bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Scan URL</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading State Animation */}
      {loading && (
        <div id="url-scan-loading" className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <div className="text-sm font-semibold text-white">Analyzing Domain & Security Signals...</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Checking HTTPS protocol, parsing subdomains, evaluating lookalike brand patterns, and querying threat reputation services.
          </p>
        </div>
      )}

      {/* Scan Results Display */}
      {currentScan && !loading && (
        <ScanResultCard
          content={currentScan.content}
          scanType="url"
          result={currentScan.result}
          createdAt={currentScan.created_at}
          onScanAnother={() => {
            setUrl('');
            setCurrentScan(null);
          }}
          onReportThreat={() => onReportThreat(currentScan.content, currentScan.risk_level)}
        />
      )}
    </div>
  );
};
