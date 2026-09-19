import React, { useState, useEffect } from 'react';
import { FileText, Plus, AlertCircle, CheckCircle, Clock, ShieldAlert, X, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { ThreatReport } from '../types';

interface ThreatReportsViewProps {
  initialReportData?: { content: string; riskLevel: string } | null;
  onClearInitialReport?: () => void;
}

export const ThreatReportsView: React.FC<ThreatReportsViewProps> = ({
  initialReportData,
  onClearInitialReport
}) => {
  const [reports, setReports] = useState<ThreatReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(!!initialReportData);

  const [reportType, setReportType] = useState('suspicious_url');
  const [content, setContent] = useState(initialReportData?.content || '');
  const [riskLevel, setRiskLevel] = useState(initialReportData?.riskLevel || 'High Risk');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.reports.getAll();
      setReports(res.reports);
    } catch (err: any) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (initialReportData) {
      setContent(initialReportData.content);
      setRiskLevel(initialReportData.riskLevel || 'High Risk');
      setShowModal(true);
    }
  }, [initialReportData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !details.trim()) {
      setErrorMsg('Content and incident description are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.reports.create({
        report_type: reportType,
        content: content.trim(),
        risk_level: riskLevel,
        details: details.trim()
      });

      setReports(prev => [res.report, ...prev]);
      setShowModal(false);
      setContent('');
      setDetails('');
      setSuccessMsg('Threat report submitted successfully and queued for review.');
      setTimeout(() => setSuccessMsg(null), 4000);
      if (onClearInitialReport) onClearInitialReport();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit threat report.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950 text-sky-300 border border-sky-800">
            <Clock className="w-3 h-3" />
            <span>Reviewed</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            <AlertCircle className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div id="threat-reports-page" className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Threat Reports Documentation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            File structured reports on identified phishing schemes, fraudulent links, and spoofed authentication pages.
          </p>
        </div>

        <button
          id="btn-open-submit-report"
          onClick={() => {
            setErrorMsg(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Threat Report</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Reports Listing */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading threat reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
            <p className="font-semibold text-slate-300">No threat reports submitted yet.</p>
            <p className="text-slate-400 text-[11px]">When you detect high-risk URLs or fraudulent messages, document them here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {reports.map((report) => (
              <div key={report.id} className="p-5 hover:bg-slate-800/40 transition-colors space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {report.report_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-white">Report #{report.id.substring(4, 10)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    {getStatusBadge(report.status)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-semibold mb-0.5">Suspicious Target:</div>
                  <div className="font-mono text-xs text-emerald-400 break-all bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                    {report.content}
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded border border-slate-800/60">
                  <span className="text-slate-400 font-semibold block mb-0.5">Incident Observation & Context:</span>
                  {report.details}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Assessed Threat Level: <strong className="text-slate-200">{report.risk_level}</strong></span>
                  <span>Submitted by: {report.user_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => {
                setShowModal(false);
                if (onClearInitialReport) onClearInitialReport();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>Submit Threat Report</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Document suspicious indicators and cyber threat activity for administrative investigation.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Report Type
                </label>
                <select
                  id="select-report-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="suspicious_url">Suspicious URL / Phishing Domain</option>
                  <option value="phishing_email">Phishing Email</option>
                  <option value="scam_message">SMS / Social Engineering Scam Message</option>
                  <option value="fake_login">Fake Brand Login / Credential Harvester</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Suspicious URL or Content Excerpt
                </label>
                <input
                  id="input-report-content"
                  type="text"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="e.g., http://secure-paypal-login.xyz/auth.php"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Assessed Risk Level
                </label>
                <select
                  id="select-report-risk"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Safe">Safe</option>
                  <option value="Low Risk">Low Risk</option>
                  <option value="Suspicious">Suspicious</option>
                  <option value="High Risk">High Risk</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Incident Description & Details
                </label>
                <textarea
                  id="input-report-details"
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Explain how this threat was encountered, sender information, spoofed brand details, or observed deceptive patterns..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-threat-report-form"
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'File Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
