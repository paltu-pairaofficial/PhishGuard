/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Views
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { DashboardView } from './views/DashboardView';
import { UrlScannerView } from './views/UrlScannerView';
import { EmailAnalyzerView } from './views/EmailAnalyzerView';
import { ScanHistoryView } from './views/ScanHistoryView';
import { ThreatReportsView } from './views/ThreatReportsView';
import { AwarenessView } from './views/AwarenessView';
import { AdminPanelView } from './views/AdminPanelView';
import { ScanHistoryItem } from './types';

function MainApp() {
  const { user, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedScanForInspection, setSelectedScanForInspection] = useState<ScanHistoryItem | null>(null);
  const [reportPrefillData, setReportPrefillData] = useState<{ content: string; riskLevel: string } | null>(null);

  const handleNavigate = (view: string) => {
    // If navigating to protected view without auth, show login
    const protectedViews = ['dashboard', 'history', 'reports', 'admin'];
    if (protectedViews.includes(view) && !user) {
      setCurrentView('login');
      return;
    }
    if (view === 'admin' && !isAdmin) {
      setCurrentView('dashboard');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportThreatFromScan = (content: string, riskLevel: string) => {
    setReportPrefillData({ content, riskLevel });
    if (!user) {
      setCurrentView('login');
    } else {
      setCurrentView('reports');
    }
  };

  const handleSelectScanFromDashboard = (scan: ScanHistoryItem) => {
    setSelectedScanForInspection(scan);
    if (scan.scan_type === 'url') {
      setCurrentView('url_scanner');
    } else {
      setCurrentView('email_analyzer');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'login' && (
          <LoginView
            onNavigate={handleNavigate}
            onSuccess={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'register' && (
          <RegisterView
            onNavigate={handleNavigate}
            onSuccess={() => handleNavigate('dashboard')}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={handleNavigate}
            onSelectScan={handleSelectScanFromDashboard}
          />
        )}

        {currentView === 'url_scanner' && (
          <UrlScannerView
            onReportThreat={handleReportThreatFromScan}
            initialScan={selectedScanForInspection?.scan_type === 'url' ? selectedScanForInspection : null}
          />
        )}

        {currentView === 'email_analyzer' && (
          <EmailAnalyzerView
            onReportThreat={handleReportThreatFromScan}
            initialScan={selectedScanForInspection?.scan_type === 'message' ? selectedScanForInspection : null}
          />
        )}

        {currentView === 'history' && (
          <ScanHistoryView
            onReportThreat={handleReportThreatFromScan}
          />
        )}

        {currentView === 'reports' && (
          <ThreatReportsView
            initialReportData={reportPrefillData}
            onClearInitialReport={() => setReportPrefillData(null)}
          />
        )}

        {currentView === 'awareness' && (
          <AwarenessView />
        )}

        {currentView === 'admin' && isAdmin && (
          <AdminPanelView />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
