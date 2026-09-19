import pg from 'pg';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
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

export interface ScanHistory {
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

let supabasePool: pg.Pool | null = null;
let schemaInitPromise: Promise<void> | null = null;

/**
 * Returns or initializes the Supabase PostgreSQL connection pool.
 * Expected environment variables:
 * - SUPABASE_DB_URL (preferred) or DATABASE_URL
 * - Fallback to PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 */
export function getSupabasePool(): pg.Pool {
  if (supabasePool) {
    return supabasePool;
  }

  const connectionString =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL;

  if (connectionString) {
    console.log('[Supabase] Initializing PostgreSQL connection pool with connection string...');
    supabasePool = new pg.Pool({
      connectionString,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    });
  } else if (process.env.PGHOST) {
    console.log('[Supabase] Initializing PostgreSQL connection pool with host parameters...');
    supabasePool = new pg.Pool({
      host: process.env.PGHOST,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    });
  } else {
    throw new Error(
      'Supabase PostgreSQL database connection not configured. Please set the SUPABASE_DB_URL (or DATABASE_URL) environment variable.'
    );
  }

  supabasePool.on('error', (err) => {
    console.error('[Supabase PostgreSQL] Unexpected client pool error:', err);
  });

  return supabasePool;
}

/**
 * Ensures required tables and seed data exist in Supabase PostgreSQL.
 * Safe to execute: uses IF NOT EXISTS and ON CONFLICT DO NOTHING.
 */
async function ensureSupabaseSchema(pool: pg.Pool): Promise<void> {
  if (schemaInitPromise) {
    return schemaInitPromise;
  }

  schemaInitPromise = (async () => {
    try {
      const schemaSql = `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(32) NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS scan_history (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          scan_type VARCHAR(32) NOT NULL,
          content TEXT NOT NULL,
          result JSONB NOT NULL,
          risk_level VARCHAR(32) NOT NULL,
          risk_score INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_user_scan FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS reports (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          report_type VARCHAR(64) NOT NULL,
          content TEXT NOT NULL,
          risk_level VARCHAR(32) NOT NULL,
          details TEXT NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_user_report FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS suspicious_keywords (
          id VARCHAR(64) PRIMARY KEY,
          keyword VARCHAR(255) NOT NULL UNIQUE,
          category VARCHAR(64) NOT NULL,
          weight INTEGER NOT NULL DEFAULT 10,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;

      await pool.query(schemaSql);

      // System users for FK integrity when scans or reports are run anonymously
      await pool.query(`
        INSERT INTO users (id, name, email, password, role, created_at)
        VALUES 
          ('usr_system', 'PhishGuard System', 'system@phishguard.internal', 'SYSTEM_INTERNAL_NOLOGIN', 'admin', NOW()),
          ('usr_guest', 'Guest User', 'guest@phishguard.internal', 'GUEST_INTERNAL_NOLOGIN', 'user', NOW())
        ON CONFLICT (id) DO NOTHING;
      `);

      // Seed initial keyword set if table is empty
      const kwCountRes = await pool.query('SELECT COUNT(*) as count FROM suspicious_keywords');
      const count = parseInt(kwCountRes.rows[0]?.count || '0', 10);
      if (count === 0) {
        const defaultKeywords = [
          { id: 'kw_1', keyword: 'immediately', category: 'urgency', weight: 15 },
          { id: 'kw_2', keyword: 'within 24 hours', category: 'urgency', weight: 20 },
          { id: 'kw_3', keyword: 'account suspended', category: 'urgency', weight: 25 },
          { id: 'kw_4', keyword: 'verify your account', category: 'credential', weight: 20 },
          { id: 'kw_5', keyword: 'password expired', category: 'credential', weight: 20 },
          { id: 'kw_6', keyword: 'otp code', category: 'credential', weight: 25 },
          { id: 'kw_7', keyword: 'wire transfer', category: 'finance', weight: 20 },
          { id: 'kw_8', keyword: 'tax refund', category: 'finance', weight: 15 },
          { id: 'kw_9', keyword: 'bitcoin wallet', category: 'finance', weight: 20 },
          { id: 'kw_10', keyword: 'security alert', category: 'threat', weight: 15 },
          { id: 'kw_11', keyword: 'unauthorized login', category: 'threat', weight: 20 },
          { id: 'kw_12', keyword: 'law enforcement', category: 'threat', weight: 25 },
          { id: 'kw_13', keyword: 'irs audit', category: 'threat', weight: 25 },
          { id: 'kw_14', keyword: 'paypal security', category: 'impersonation', weight: 20 },
          { id: 'kw_15', keyword: 'microsoft support', category: 'impersonation', weight: 20 },
          { id: 'kw_16', keyword: 'apple id locked', category: 'impersonation', weight: 20 },
        ];

        for (const kw of defaultKeywords) {
          await pool.query(
            `INSERT INTO suspicious_keywords (id, keyword, category, weight, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (id) DO NOTHING`,
            [kw.id, kw.keyword, kw.category, kw.weight]
          );
        }
      }
    } catch (err) {
      console.warn('[Supabase] Schema initialization check notice:', err);
    }
  })();

  return schemaInitPromise;
}

async function querySupabase<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }> {
  const pool = getSupabasePool();
  await ensureSupabaseSchema(pool);
  const res = await pool.query(sql, params);
  return { rows: res.rows as T[] };
}

export const db = {
  getUsers: async (): Promise<User[]> => {
    const res = await querySupabase('SELECT * FROM users ORDER BY created_at DESC');
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role as 'user' | 'admin',
      created_at: new Date(row.created_at).toISOString(),
    }));
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    const res = await querySupabase('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return undefined;
    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role as 'user' | 'admin',
      created_at: new Date(row.created_at).toISOString(),
    };
  },

  getUserByEmail: async (email: string): Promise<User | undefined> => {
    const res = await querySupabase('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (res.rows.length === 0) return undefined;
    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role as 'user' | 'admin',
      created_at: new Date(row.created_at).toISOString(),
    };
  },

  createUser: async (user: User): Promise<User> => {
    await querySupabase(
      `INSERT INTO users (id, name, email, password, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, user.name, user.email, user.password, user.role, user.created_at || new Date().toISOString()]
    );
    return user;
  },

  getScanHistory: async (userId?: string): Promise<ScanHistory[]> => {
    let sql = 'SELECT * FROM scan_history';
    const params: any[] = [];
    if (userId) {
      sql += ' WHERE user_id = $1';
      params.push(userId);
    }
    sql += ' ORDER BY created_at DESC';
    const res = await querySupabase(sql, params);
    return res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      scan_type: row.scan_type as 'url' | 'message',
      content: row.content,
      result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result,
      risk_level: row.risk_level as 'Safe' | 'Low Risk' | 'Suspicious' | 'High Risk' | 'Critical',
      risk_score: Number(row.risk_score),
      created_at: new Date(row.created_at).toISOString(),
    }));
  },

  getScanById: async (id: string): Promise<ScanHistory | undefined> => {
    const res = await querySupabase('SELECT * FROM scan_history WHERE id = $1', [id]);
    if (res.rows.length === 0) return undefined;
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      scan_type: row.scan_type as 'url' | 'message',
      content: row.content,
      result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result,
      risk_level: row.risk_level as 'Safe' | 'Low Risk' | 'Suspicious' | 'High Risk' | 'Critical',
      risk_score: Number(row.risk_score),
      created_at: new Date(row.created_at).toISOString(),
    };
  },

  addScan: async (scan: ScanHistory): Promise<ScanHistory> => {
    // Guarantee relational FK integrity
    await querySupabase(
      `INSERT INTO users (id, name, email, password, role, created_at)
       VALUES ($1, 'PhishGuard User', $2, 'INTERNAL_NOLOGIN', 'user', NOW())
       ON CONFLICT (id) DO NOTHING`,
      [scan.user_id, `${scan.user_id}@phishguard.internal`]
    );

    await querySupabase(
      `INSERT INTO scan_history (id, user_id, scan_type, content, result, risk_level, risk_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        scan.id,
        scan.user_id,
        scan.scan_type,
        scan.content,
        typeof scan.result === 'string' ? scan.result : JSON.stringify(scan.result),
        scan.risk_level,
        scan.risk_score,
        scan.created_at || new Date().toISOString(),
      ]
    );
    return scan;
  },

  deleteScan: async (id: string, userId: string): Promise<boolean> => {
    if (userId === 'admin') {
      await querySupabase('DELETE FROM scan_history WHERE id = $1', [id]);
    } else {
      await querySupabase('DELETE FROM scan_history WHERE id = $1 AND user_id = $2', [id, userId]);
    }
    return true;
  },

  clearUserScanHistory: async (userId: string): Promise<void> => {
    await querySupabase('DELETE FROM scan_history WHERE user_id = $1', [userId]);
  },

  getReports: async (userId?: string): Promise<ThreatReport[]> => {
    let sql = 'SELECT * FROM reports';
    const params: any[] = [];
    if (userId) {
      sql += ' WHERE user_id = $1';
      params.push(userId);
    }
    sql += ' ORDER BY created_at DESC';
    const res = await querySupabase(sql, params);
    return res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      report_type: row.report_type as 'suspicious_url' | 'phishing_email' | 'scam_message' | 'fake_login',
      content: row.content,
      risk_level: row.risk_level,
      details: row.details,
      status: row.status as 'pending' | 'reviewed' | 'resolved',
      created_at: new Date(row.created_at).toISOString(),
    }));
  },

  createReport: async (report: ThreatReport): Promise<ThreatReport> => {
    // Guarantee relational FK integrity
    await querySupabase(
      `INSERT INTO users (id, name, email, password, role, created_at)
       VALUES ($1, $2, $3, 'INTERNAL_NOLOGIN', 'user', NOW())
       ON CONFLICT (id) DO NOTHING`,
      [report.user_id, report.user_name || 'Reporter', `${report.user_id}@phishguard.internal`]
    );

    await querySupabase(
      `INSERT INTO reports (id, user_id, user_name, report_type, content, risk_level, details, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        report.id,
        report.user_id,
        report.user_name,
        report.report_type,
        report.content,
        report.risk_level,
        report.details,
        report.status || 'pending',
        report.created_at || new Date().toISOString(),
      ]
    );
    return report;
  },

  updateReportStatus: async (
    id: string,
    status: 'pending' | 'reviewed' | 'resolved'
  ): Promise<ThreatReport | undefined> => {
    const res = await querySupabase(
      `UPDATE reports SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (res.rows.length === 0) return undefined;
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      report_type: row.report_type as 'suspicious_url' | 'phishing_email' | 'scam_message' | 'fake_login',
      content: row.content,
      risk_level: row.risk_level,
      details: row.details,
      status: row.status as 'pending' | 'reviewed' | 'resolved',
      created_at: new Date(row.created_at).toISOString(),
    };
  },

  getKeywords: async (): Promise<SuspiciousKeyword[]> => {
    const res = await querySupabase('SELECT * FROM suspicious_keywords ORDER BY weight DESC');
    return res.rows.map((row) => ({
      id: row.id,
      keyword: row.keyword,
      category: row.category as 'urgency' | 'threat' | 'credential' | 'finance' | 'impersonation',
      weight: Number(row.weight),
      created_at: new Date(row.created_at).toISOString(),
    }));
  },

  addKeyword: async (kw: SuspiciousKeyword): Promise<SuspiciousKeyword> => {
    await querySupabase(
      `INSERT INTO suspicious_keywords (id, keyword, category, weight, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [kw.id, kw.keyword, kw.category, kw.weight, kw.created_at || new Date().toISOString()]
    );
    return kw;
  },

  deleteKeyword: async (id: string): Promise<boolean> => {
    await querySupabase('DELETE FROM suspicious_keywords WHERE id = $1', [id]);
    return true;
  },
};
