import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db, User, ScanHistory, ThreatReport, SuspiciousKeyword } from './server/db.js';
import { analyzeUrl, analyzeMessage } from './server/detector.js';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'phishguard_secure_jwt_secret_change_in_production';

app.use(express.json());

// Extend express Request interface for typed user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

// Auth Middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = decoded;
    next();
  });
}

// Optional Auth (for public/anonymous scans that can attach to user if token provided)
function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (!err && decoded) {
        req.user = decoded;
      }
      next();
    });
  } else {
    next();
  }
}

// Admin only middleware
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }
  next();
}

/* 
   AUTHENTICATION ENDPOINTS
*/

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userRole = role === 'admin' ? 'admin' : 'user';

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: userRole,
      created_at: new Date().toISOString()
    };

    await db.createUser(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Failed to complete registration.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Failed to complete login.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err: any) {
    console.error('Auth check error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch user profile.' });
  }
});

/* 
   SCANNING & RISK ANALYSIS ENDPOINTS
 */

app.post('/api/scan/url', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    return res.status(400).json({ error: 'Please enter a valid website URL to analyze.' });
  }

  try {
    const analysis = await analyzeUrl(url.trim());
    const userId = req.user ? req.user.id : 'usr_guest';

    const scanRecord: ScanHistory = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      scan_type: 'url',
      content: url.trim(),
      result: analysis,
      risk_level: analysis.level,
      risk_score: analysis.score,
      created_at: new Date().toISOString()
    };

    // Store in PostgreSQL
    await db.addScan(scanRecord);

    return res.json({
      scan: scanRecord
    });
  } catch (err: any) {
    console.error('URL scan error:', err);
    return res.status(500).json({ error: 'Failed to complete URL analysis. Please try again.' });
  }
});

app.post('/api/scan/message', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Please enter or paste the message/email content to analyze.' });
  }

  try {
    const analysis = await analyzeMessage(message.trim());
    const userId = req.user ? req.user.id : 'usr_guest';

    const scanRecord: ScanHistory = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      scan_type: 'message',
      content: message.trim(),
      result: analysis,
      risk_level: analysis.level,
      risk_score: analysis.score,
      created_at: new Date().toISOString()
    };

    await db.addScan(scanRecord);

    return res.json({
      scan: scanRecord
    });
  } catch (err: any) {
    console.error('Message analysis error:', err);
    return res.status(500).json({ error: 'Failed to complete message analysis. Please try again.' });
  }
});

/* 
   SCAN HISTORY ENDPOINTS
 */

app.get('/api/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { search, type, risk_level } = req.query;

    let history = await db.getScanHistory(userId);

    if (type && typeof type === 'string' && (type === 'url' || type === 'message')) {
      history = history.filter(item => item.scan_type === type);
    }

    if (risk_level && typeof risk_level === 'string') {
      history = history.filter(item => item.risk_level.toLowerCase() === risk_level.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      history = history.filter(item => 
        item.content.toLowerCase().includes(q) ||
        item.result.status.toLowerCase().includes(q) ||
        item.result.indicators.some(ind => ind.toLowerCase().includes(q))
      );
    }

    return res.json({ history });
  } catch (err: any) {
    console.error('History fetch error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve scan history.' });
  }
});

app.get('/api/history/export', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = await db.getScanHistory(userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="phishguard_scans_${Date.now()}.json"`);
    return res.send(JSON.stringify(history, null, 2));
  } catch (err: any) {
    console.error('History export error:', err);
    return res.status(500).json({ error: err.message || 'Failed to export history.' });
  }
});

app.get('/api/history/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scan = await db.getScanById(req.params.id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan result record not found.' });
    }

    if (scan.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this record.' });
    }

    return res.json({ scan });
  } catch (err: any) {
    console.error('Get scan by ID error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve record.' });
  }
});

app.delete('/api/history/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await db.deleteScan(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Record not found or access denied.' });
    }

    return res.json({ message: 'Scan history record deleted successfully.' });
  } catch (err: any) {
    console.error('Delete scan error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete record.' });
  }
});

app.delete('/api/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.clearUserScanHistory(req.user!.id);
    return res.json({ message: 'All scan history cleared successfully.' });
  } catch (err: any) {
    console.error('Clear history error:', err);
    return res.status(500).json({ error: err.message || 'Failed to clear history.' });
  }
});

/* 
   THREAT REPORTS ENDPOINTS
 */

app.get('/api/reports', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
    const reports = await db.getReports(userId);
    return res.json({ reports });
  } catch (err: any) {
    console.error('Get reports error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve threat reports.' });
  }
});

app.post('/api/reports', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { report_type, content, risk_level, details } = req.body;

    if (!content || !details) {
      return res.status(400).json({ error: 'Content and report details are required.' });
    }

    const user = await db.getUserById(req.user!.id);
    const newReport: ThreatReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: req.user!.id,
      user_name: user ? user.name : 'Unknown User',
      report_type: report_type || 'suspicious_url',
      content: content.trim(),
      risk_level: risk_level || 'Suspicious',
      details: details.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await db.createReport(newReport);
    return res.status(201).json({ report: newReport });
  } catch (err: any) {
    console.error('Create report error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit report.' });
  }
});

app.patch('/api/reports/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Valid status must be pending, reviewed, or resolved.' });
    }

    const updated = await db.updateReportStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Threat report not found.' });
    }

    return res.json({ report: updated });
  } catch (err: any) {
    console.error('Update report status error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update report status.' });
  }
});

/* 
   ADMIN MANAGEMENT ENDPOINTS
 */

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersList = await db.getUsers();
    const users = usersList.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at
    }));
    return res.json({ users });
  } catch (err: any) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve users.' });
  }
});

app.get('/api/admin/logs', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allLogs = await db.getScanHistory();
    return res.json({ logs: allLogs });
  } catch (err: any) {
    console.error('Admin logs error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve logs.' });
  }
});

app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [allScans, allUsers, allReports] = await Promise.all([
      db.getScanHistory(),
      db.getUsers(),
      db.getReports()
    ]);

    const totalScans = allScans.length;
    const safeScans = allScans.filter(s => s.risk_level === 'Safe').length;
    const lowRiskScans = allScans.filter(s => s.risk_level === 'Low Risk').length;
    const suspiciousScans = allScans.filter(s => s.risk_level === 'Suspicious').length;
    const highRiskScans = allScans.filter(s => s.risk_level === 'High Risk').length;
    const criticalScans = allScans.filter(s => s.risk_level === 'Critical').length;

    const urlScans = allScans.filter(s => s.scan_type === 'url').length;
    const messageScans = allScans.filter(s => s.scan_type === 'message').length;

    return res.json({
      totalScans,
      safeScans,
      lowRiskScans,
      suspiciousScans,
      highRiskScans,
      criticalScans,
      urlScans,
      messageScans,
      totalUsers: allUsers.length,
      totalReports: allReports.length,
      pendingReports: allReports.filter(r => r.status === 'pending').length
    });
  } catch (err: any) {
    console.error('Admin analytics error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve analytics.' });
  }
});

app.get('/api/admin/keywords', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const keywords = await db.getKeywords();
    return res.json({ keywords });
  } catch (err: any) {
    console.error('Admin keywords fetch error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve keywords.' });
  }
});

app.post('/api/admin/keywords', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keyword, category, weight } = req.body;

    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return res.status(400).json({ error: 'Keyword string is required.' });
    }

    const validCategories = ['urgency', 'threat', 'credential', 'finance', 'impersonation'];
    const cat = validCategories.includes(category) ? category : 'urgency';
    const numWeight = typeof weight === 'number' && weight > 0 && weight <= 50 ? weight : 20;

    const newKw: SuspiciousKeyword = {
      id: `kw_${Date.now()}`,
      keyword: keyword.trim().toLowerCase(),
      category: cat as any,
      weight: numWeight,
      created_at: new Date().toISOString()
    };

    await db.addKeyword(newKw);
    return res.status(201).json({ keyword: newKw });
  } catch (err: any) {
    console.error('Admin add keyword error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add keyword.' });
  }
});

app.delete('/api/admin/keywords/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await db.deleteKeyword(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Keyword not found.' });
    }
    return res.json({ message: 'Keyword deleted successfully.' });
  } catch (err: any) {
    console.error('Admin delete keyword error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete keyword.' });
  }
});

/* 
   FRONTEND VITE INTEGRATION & SERVER STARTUP
*/

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PhishGuard] Backend server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL) {
  // Vercel imports the Express app through api/index.ts
} else {
  startServer();
}

export default app;