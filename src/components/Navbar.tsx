import React, { useState } from 'react';
import { Shield, Globe, Mail, LayoutDashboard, History, FileText, BookOpen, Sliders, LogIn, LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Shield, authRequired: false },
    { id: 'url_scanner', label: 'URL Scanner', icon: Globe, authRequired: false },
    { id: 'email_analyzer', label: 'Email Analyzer', icon: Mail, authRequired: false },
    { id: 'awareness', label: 'Safety Awareness', icon: BookOpen, authRequired: false },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, authRequired: true },
    { id: 'history', label: 'Scan History', icon: History, authRequired: true },
    { id: 'reports', label: 'Threat Reports', icon: FileText, authRequired: true },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: Sliders, authRequired: true });
  }

  return (
    <nav id="app-navbar" className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            id="brand-header" 
            onClick={() => handleNav('home')} 
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">PhishGuard</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Phishing Detection & Online Safety Platform</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems
              .filter(item => !item.authRequired || (item.authRequired && user))
              .map((item) => {
                const Icon = item.icon;
                const active = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => handleNav(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>

          {/* User Status / Auth Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-200 flex items-center space-x-1.5 justify-end">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.name}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {user.role === 'admin' ? (
                      <span className="text-amber-400 font-semibold">Administrator</span>
                    ) : (
                      <span>Standard User</span>
                    )}
                  </div>
                </div>
                <button
                  id="btn-logout"
                  onClick={logout}
                  title="Log out of account"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-800 hover:bg-red-950 hover:text-red-300 border border-slate-700 hover:border-red-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="btn-nav-login"
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md border border-slate-700 transition-colors"
                >
                  Log In
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => handleNav('register')}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 font-semibold rounded-md transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems
            .filter(item => !item.authRequired || (item.authRequired && user))
            .map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-base font-medium ${
                    active ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

          <div className="pt-3 border-t border-slate-800 mt-2">
            {user ? (
              <div className="flex items-center justify-between px-2">
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email} ({user.role})</p>
                </div>
                <button
                  id="mobile-btn-logout"
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs text-red-400 bg-red-950/40 rounded border border-red-900"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="mobile-btn-login"
                  onClick={() => handleNav('login')}
                  className="w-full text-center py-2 text-sm text-slate-200 bg-slate-800 rounded-md border border-slate-700"
                >
                  Log In
                </button>
                <button
                  id="mobile-btn-register"
                  onClick={() => handleNav('register')}
                  className="w-full text-center py-2 text-sm font-semibold text-slate-950 bg-emerald-400 rounded-md"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
