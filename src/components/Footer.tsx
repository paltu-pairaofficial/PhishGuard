import React from 'react';
import { Shield, Lock, CheckCircle, Info } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer id="app-footer" className="bg-slate-950 border-t border-slate-800 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight">PhishGuard</span>
            <p className="text-xs text-slate-400">Phishing Detection & Online Safety Platform</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
          <button 
            id="footer-nav-url-scanner" 
            onClick={() => onNavigate('url_scanner')} 
            className="hover:text-emerald-400 transition-colors"
          >
            URL Scanner
          </button>
          <button 
            id="footer-nav-email-analyzer" 
            onClick={() => onNavigate('email_analyzer')} 
            className="hover:text-emerald-400 transition-colors"
          >
            Email & Message Analyzer
          </button>
          <button 
            id="footer-nav-awareness" 
            onClick={() => onNavigate('awareness')} 
            className="hover:text-emerald-400 transition-colors"
          >
            Cybersecurity Awareness
          </button>
          <button 
            id="footer-nav-reports" 
            onClick={() => onNavigate('reports')} 
            className="hover:text-emerald-400 transition-colors"
          >
            Threat Reports
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-1.5 text-center sm:text-right">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Rule-based detection & verified threat intelligence.</span>
        </div>
      </div>
    </footer>
  );
};
