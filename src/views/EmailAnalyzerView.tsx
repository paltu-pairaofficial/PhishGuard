import React, { useState } from 'react';
import { ArrowRight, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import { api } from '../api/client';
import { ScanHistoryItem } from '../types';
import { ScanResultCard } from '../components/ScanResultCard';

interface EmailAnalyzerViewProps {
  onReportThreat: (content: string, riskLevel: string) => void;
  initialScan?: ScanHistoryItem | null;
}

export const EmailAnalyzerView: React.FC<EmailAnalyzerViewProps> = ({ onReportThreat, initialScan }) => {
  const [message, setMessage] = useState(initialScan?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentScan, setCurrentScan] = useState<ScanHistoryItem | null>(initialScan || null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const targetText = message.trim();
    if (!targetText) {
      setError('Please paste or type the email/message content to analyze.');
      return;
    }

    setLoading(true);
    setCurrentScan(null);

    try {
      const res = await api.scan.message(targetText);
      setCurrentScan(res.scan);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze message content.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="email-analyzer-page" className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase mb-3">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Social Engineering & Phishing Analysis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Email & Message Analyzer</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Paste suspicious emails, SMS alerts, or chat messages to identify psychological urgency, credential demands, and fraudulent warnings.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Paste Suspicious Email or Message Text
            </label>
            <textarea
              id="input-scan-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste email body, subject line, or message text here..."
              className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {message.length} characters entered
            </span>
            <button
              id="btn-submit-message-scan"
              type="submit"
              disabled={loading || !message.trim()}
              className="px-5 py-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow transition-colors disabled:opacity-40"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Text...</span>
                </>
              ) : (
                <>
                  <span>Analyze Message</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
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
        <div id="message-scan-loading" className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto" />
          <div className="text-sm font-semibold text-white">Analyzing Message Content & Patterns...</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Evaluating pressure vocabulary, credential queries, embedded links, and known social engineering indicators.
          </p>
        </div>
      )}

      {/* Results Display */}
      {currentScan && !loading && (
        <ScanResultCard
          content={currentScan.content}
          scanType="message"
          result={currentScan.result}
          createdAt={currentScan.created_at}
          onScanAnother={() => {
            setMessage('');
            setCurrentScan(null);
          }}
          onReportThreat={() => onReportThreat(currentScan.content, currentScan.risk_level)}
        />
      )}
    </div>
  );
};
