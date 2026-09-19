import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle, ShieldAlert, AlertCircle, Copy, Check, 
  FileText, ExternalLink, Calendar, Server, Shield
} from 'lucide-react';
import { ScanResultDetail } from '../types';
import { RiskScoreMeter } from './RiskScoreMeter';

interface ScanResultCardProps {
  content: string;
  scanType: 'url' | 'message';
  result: ScanResultDetail;
  createdAt?: string;
  onReportThreat?: () => void;
  onScanAnother?: () => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({
  content,
  scanType,
  result,
  createdAt,
  onReportThreat,
  onScanAnother
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const summary = `[PhishGuard Analysis Report]
Type: ${scanType.toUpperCase()}
Content: ${content}
Risk Level: ${result.level} (Score: ${result.score}/100)
Status: ${result.status}
Indicators:
${result.indicators.map(i => ` - ${i}`).join('\n')}
Recommendations:
${result.recommendations.map(r => ` - ${r}`).join('\n')}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="scan-result-card" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {scanType === 'url' ? 'URL Verification Result' : 'Message & Email Analysis Result'}
          </span>
          <h2 className="text-lg font-bold text-white mt-1.5 break-all">
            {scanType === 'url' ? (
              <span className="font-mono text-emerald-400">{content}</span>
            ) : (
              <span className="text-slate-300 font-normal italic line-clamp-2">"{content.substring(0, 160)}{content.length > 160 ? '...' : ''}"</span>
            )}
          </h2>
          {createdAt && (
            <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Analyzed on {new Date(createdAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-copy-scan-report"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Report' : 'Copy Summary'}</span>
          </button>
          {onScanAnother && (
            <button
              id="btn-scan-another"
              onClick={onScanAnother}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-colors"
            >
              New Scan
            </button>
          )}
        </div>
      </div>

      {/* Risk Score Meter & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <RiskScoreMeter score={result.score} level={result.level} />
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between p-5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Threat Assessment Overview</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {result.status}
            </p>
          </div>

          {result.security_api_results && (
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center space-x-1">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>Security Intelligence APIs</span>
              </div>
              <div className="space-y-1 text-xs">
                {result.security_api_results.google_safe_browsing && (
                  <div className="text-slate-300 flex items-start space-x-1.5">
                    <span className="font-semibold text-slate-400">Google Safe Browsing:</span>
                    <span className="text-slate-200">{result.security_api_results.google_safe_browsing}</span>
                  </div>
                )}
                {result.security_api_results.virustotal && (
                  <div className="text-slate-300 flex items-start space-x-1.5">
                    <span className="font-semibold text-slate-400">VirusTotal:</span>
                    <span className="text-slate-200">{result.security_api_results.virustotal}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detection Indicators */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Detected Indicators & Signals ({result.indicators.length})</span>
        </h3>
        
        {result.indicators.length === 0 ? (
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No suspicious indicators or anomaly patterns were detected.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {result.indicators.map((indicator, idx) => {
              const isPositive = indicator.includes('HTTPS protocol verified') || indicator.includes('Clean -');
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs flex items-start space-x-2.5 border ${
                    isPositive
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  {isPositive ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{indicator}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Recommendations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-sky-400" />
          <span>Safety Recommendations</span>
        </h3>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          {result.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      {onReportThreat && (
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Did you identify an active cyberattack or fake login page?
          </div>
          <button
            id="btn-report-threat-from-scan"
            onClick={onReportThreat}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Document & Submit Threat Report</span>
          </button>
        </div>
      )}
    </div>
  );
};
