export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface ScanResultDetail {
  score: number;
  level: 'Safe' | 'Low Risk' | 'Suspicious' | 'High Risk' | 'Critical';
  status: string;
  indicators: string[];
  security_api_results?: {
    google_safe_browsing?: string;
    virustotal?: string;
  };
  recommendations: string[];
}

export interface ScanHistoryItem {
  id: string;
  user_id: string;
  scan_type: 'url' | 'message';
  content: string;
  result: ScanResultDetail;
  risk_level: 'Safe' | 'Low Risk' | 'Suspicious' | 'High Risk' | 'Critical';
  risk_score: number;
  created_at: string;
}

export interface ThreatReport {
  id: string;
  user_id: string;
  user_name: string;
  report_type: 'suspicious_url' | 'phishing_email' | 'scam_message' | 'fake_login';
  content: string;
  risk_level: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface SuspiciousKeyword {
  id: string;
  keyword: string;
  category: 'urgency' | 'threat' | 'credential' | 'finance' | 'impersonation';
  weight: number;
  created_at: string;
}

export interface AdminAnalytics {
  totalScans: number;
  safeScans: number;
  lowRiskScans: number;
  suspiciousScans: number;
  highRiskScans: number;
  criticalScans: number;
  urlScans: number;
  messageScans: number;
  totalUsers: number;
  totalReports: number;
  pendingReports: number;
}

export interface QuizQuestion {
  id: number;
  scenario: string;
  sampleText: string;
  options: {
    text: string;
    isPhishing: boolean;
    explanation: string;
  }[];
}
