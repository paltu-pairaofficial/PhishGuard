import React from 'react';
import { Shield, Globe, Mail, BookOpen, AlertTriangle, CheckCircle, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section id="hero-section" className="relative py-12 md:py-16 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Shield className="w-4 h-4" />
          <span>Real-Time Phishing Threat Detection</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight sm:leading-none">
          Identify Suspicious URLs, Emails & Messages
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          <strong className="text-white">PhishGuard</strong> analyzes suspicious links, emails, and urgent messages using 
          multi-point rule-based detection, domain structure inspection, keyword analysis, and security reputation checks.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="hero-btn-url-scanner"
            onClick={() => onNavigate('url_scanner')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Launch URL Scanner</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="hero-btn-email-analyzer"
            onClick={() => onNavigate('email_analyzer')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Analyze Email / Message</span>
          </button>
        </div>

        {!user && (
          <p className="text-xs text-slate-400 mt-4">
            Guest scanning available. <button onClick={() => onNavigate('register')} className="text-emerald-400 underline hover:text-emerald-300">Create an account</button> to track scan history & file reports.
          </p>
        )}
      </section>

      {/* Core Scanners Overview */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: URL Scanner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">URL Scanner</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Inspects domain attributes, HTTPS encryption, subdomain depth, high-risk TLDs, numerical IP hosts, and security API reputation feeds.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 mb-6">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>HTTPS & SSL validity checking</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Brand impersonation detection</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Google Safe Browsing & VirusTotal</span>
              </li>
            </ul>
          </div>
          <button
            id="card-btn-url-scanner"
            onClick={() => onNavigate('url_scanner')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>Scan a Website URL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Email & Message Analyzer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Email & Message Analyzer</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Paste suspicious SMS text, unexpected security notices, or invoice alerts to evaluate high-pressure language and credential demands.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 mb-6">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Urgency and coercion recognition</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Password, PIN & OTP solicitations</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Embedded link extraction & auditing</span>
              </li>
            </ul>
          </div>
          <button
            id="card-btn-email-analyzer"
            onClick={() => onNavigate('email_analyzer')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400 border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>Analyze Suspicious Text</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Cybersecurity Awareness */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Awareness & Quiz</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Explore documented phishing patterns, deceptive login tactics, and test your defensive skills with the interactive phishing identification quiz.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 mb-6">
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Anatomy of fake login pages</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Red flags in executive impersonation</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Interactive 5-question scenario quiz</span>
              </li>
            </ul>
          </div>
          <button
            id="card-btn-awareness"
            onClick={() => onNavigate('awareness')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>Explore Awareness & Quiz</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Detection Architecture Diagram Breakdown */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Detection Pipeline</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">How PhishGuard Analyzes Threats</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Combining deterministic rule-based checks, keyword analysis, URL structure inspection, and security API reputation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-center">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-mono text-sm font-bold mb-1">01</div>
              <div className="text-xs font-semibold text-white">Rule-Based Checks</div>
              <p className="text-[11px] text-slate-400 mt-1">HTTPS, IP addresses, subdomains, character obfuscation</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-mono text-sm font-bold mb-1">02</div>
              <div className="text-xs font-semibold text-white">Keyword Matching</div>
              <p className="text-[11px] text-slate-400 mt-1">Urgency words, credential requests, financial triggers</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-mono text-sm font-bold mb-1">03</div>
              <div className="text-xs font-semibold text-white">Structure Analysis</div>
              <p className="text-[11px] text-slate-400 mt-1">Disposable TLDs, length anomalies, brand impersonation</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-mono text-sm font-bold mb-1">04</div>
              <div className="text-xs font-semibold text-white">Security APIs</div>
              <p className="text-[11px] text-slate-400 mt-1">Google Safe Browsing & VirusTotal reputation feeds</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-emerald-500/40 bg-emerald-950/20">
              <div className="text-emerald-400 font-mono text-sm font-bold mb-1">05</div>
              <div className="text-xs font-semibold text-emerald-300">Risk Assessment</div>
              <p className="text-[11px] text-slate-300 mt-1">Normalized 0–100 score with safety recommendations</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
