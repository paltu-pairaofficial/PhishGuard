import { db, ScanResultDetail } from './db.js';

const SUSPICIOUS_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'click', 'buzz', 'fit', 
  'work', 'country', 'stream', 'download', 'racing', 'win', 'bid', 'loan',
  'accountant', 'date', 'faith', 'review', 'party', 'cricket', 'science'
]);

const KNOWN_BRANDS = [
  'paypal', 'apple', 'google', 'microsoft', 'netflix', 'amazon', 'chase',
  'wellsfargo', 'bankofamerica', 'citibank', 'facebook', 'instagram',
  'whatsapp', 'binance', 'coinbase', 'steam', 'ebay', 'dhl', 'fedex', 'usps'
];

const KNOWN_PHISHING_KEYWORDS = [
  'verify', 'verification', 'secure', 'login', 'signin', 'account', 'update',
  'suspend', 'suspended', 'banking', 'wallet', 'security', 'billing', 'confirm',
  'alert', 'validation', 'authenticate', 'password', 'recover', 'unlock'
];

const KNOWN_MALICIOUS_DOMAINS = [
  'paypal-security-alert-account-suspended.ga',
  'appleid-verify-alert.xyz',
  'chase-online-secure-auth.top',
  'netflix-billing-update-now.click',
  'login-microsoft-security-check.tk'
];

interface ApiCheckResult {
  service: string;
  configured: boolean;
  threatFound: boolean;
  details: string;
}

async function checkGoogleSafeBrowsing(url: string): Promise<ApiCheckResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key') {
    return {
      service: 'Google Safe Browsing API',
      configured: false,
      threatFound: false,
      details: 'API key not configured in environment (Rule-based heuristics active)'
    };
  }

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    const body = {
      client: {
        clientId: 'phishguard',
        clientVersion: '1.0.0'
      },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }]
      }
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      return {
        service: 'Google Safe Browsing API',
        configured: true,
        threatFound: false,
        details: `Service returned HTTP ${res.status} (Fallback to heuristic scoring)`
      };
    }

    const data = await res.json();
    if (data.matches && data.matches.length > 0) {
      const threatType = data.matches[0].threatType;
      return {
        service: 'Google Safe Browsing API',
        configured: true,
        threatFound: true,
        details: `Flagged as malicious threat: ${threatType}`
      };
    }

    return {
      service: 'Google Safe Browsing API',
      configured: true,
      threatFound: false,
      details: 'Clean - No threats recorded in Google Safe Browsing database'
    };
  } catch (err: any) {
    return {
      service: 'Google Safe Browsing API',
      configured: true,
      threatFound: false,
      details: `Service connection error: ${err.message || 'Offline'}`
    };
  }
}

async function checkVirusTotal(url: string): Promise<ApiCheckResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_key') {
    return {
      service: 'VirusTotal API',
      configured: false,
      threatFound: false,
      details: 'API key not configured in environment (Multi-engine heuristic fallback)'
    };
  }

  try {
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { 'x-apikey': apiKey }
    });

    if (!res.ok) {
      return {
        service: 'VirusTotal API',
        configured: true,
        threatFound: false,
        details: `VirusTotal returned status ${res.status} (Heuristic mode active)`
      };
    }

    const data = await res.json();
    const stats = data.data?.attributes?.last_analysis_stats;
    if (stats && (stats.malicious > 0 || stats.suspicious > 0)) {
      return {
        service: 'VirusTotal API',
        configured: true,
        threatFound: true,
        details: `Detected malicious by ${stats.malicious} engine(s) and suspicious by ${stats.suspicious} engine(s)`
      };
    }

    return {
      service: 'VirusTotal API',
      configured: true,
      threatFound: false,
      details: 'Clean - 0 malicious detections across security engines'
    };
  } catch (err: any) {
    return {
      service: 'VirusTotal API',
      configured: true,
      threatFound: false,
      details: `VirusTotal connection error: ${err.message || 'Offline'}`
    };
  }
}

export function determineRiskLevel(score: number): 'Safe' | 'Low Risk' | 'Suspicious' | 'High Risk' | 'Critical' {
  if (score <= 20) return 'Safe';
  if (score <= 40) return 'Low Risk';
  if (score <= 60) return 'Suspicious';
  if (score <= 80) return 'High Risk';
  return 'Critical';
}

export async function analyzeUrl(rawUrl: string): Promise<ScanResultDetail> {
  let score = 0;
  const indicators: string[] = [];
  const recommendations: string[] = [];

  let normalizedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'http://' + normalizedUrl;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch (e) {
    return {
      score: 85,
      level: 'Critical',
      status: 'Malformed URL structure detected. Unsafe to navigate.',
      indicators: ['Invalid or corrupted URL syntax', 'Potential URI obfuscation attack'],
      recommendations: ['Do NOT navigate to this address.', 'Verify link origin directly through official channels.']
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const search = parsed.search.toLowerCase();
  const fullAddress = parsed.href.toLowerCase();

  // 1. HTTPS Protocol Check
  if (protocol === 'http:') {
    score += 20;
    indicators.push('Unencrypted HTTP protocol in use (Missing SSL/TLS encryption)');
  } else if (protocol === 'https:') {
    indicators.push('HTTPS SSL/TLS encryption protocol present');
  }

  // 2. IP Address as Hostname Check
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIpAddress) {
    score += 45;
    indicators.push(`Host is a raw numerical IP address (${hostname}) instead of a registered domain name`);
  }

  // 3. Known Blacklist Check
  if (KNOWN_MALICIOUS_DOMAINS.includes(hostname)) {
    score += 65;
    indicators.push(`Domain (${hostname}) matches internal blacklist of confirmed phishing targets`);
  }

  // 4. Domain Subdomain & Length Analysis
  const hostParts = hostname.split('.');
  const tld = hostParts[hostParts.length - 1];
  
  if (SUSPICIOUS_TLDS.has(tld)) {
    score += 30;
    indicators.push(`High-risk top-level domain (.${tld}) frequently leveraged in bulk disposable scams`);
  }

  if (hostParts.length > 3) {
    score += 20;
    indicators.push(`Excessive subdomain nesting (${hostParts.length - 2} levels) often used to conceal real hosting domain`);
  }

  if (rawUrl.length > 80) {
    score += 15;
    indicators.push(`Abnormally long URL string (${rawUrl.length} characters) potentially hiding malicious destination`);
  }

  // 5. Special Character Obfuscation
  if (rawUrl.includes('@')) {
    score += 40;
    indicators.push('URL contains "@" symbol, which can redirect the browser to credentials/alternative host');
  }
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    score += 20;
    indicators.push(`Multiple hyphens (${hyphenCount}) detected in domain name indicating synthetic domain generation`);
  }

  // 6. Brand Spoofing / Lookalike Check
  const registeredDomain = hostParts.slice(-2).join('.');
  for (const brand of KNOWN_BRANDS) {
    if (fullAddress.includes(brand) && !registeredDomain.includes(brand)) {
      score += 40;
      indicators.push(`Target brand mimicry detected: mentions "${brand}" while host is "${registeredDomain}"`);
      break;
    }
  }

  // 7. Suspicious Keywords in URL
  const matchedKeywords: string[] = [];
  for (const kw of KNOWN_PHISHING_KEYWORDS) {
    if (pathname.includes(kw) || search.includes(kw) || hostname.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }
  if (matchedKeywords.length > 0) {
    const kwPenalty = Math.min(30, matchedKeywords.length * 10);
    score += kwPenalty;
    indicators.push(`Found sensitive phishing-associated keywords in URL: ${matchedKeywords.join(', ')}`);
  }

  // 8. Dynamic Keywords from DB
  const dbKeywords = await db.getKeywords();
  for (const kwItem of dbKeywords) {
    if (fullAddress.includes(kwItem.keyword.toLowerCase())) {
      score += Math.min(25, kwItem.weight);
      indicators.push(`Matched active suspicious keyword "${kwItem.keyword}" (${kwItem.category})`);
    }
  }

  // 9. Security APIs Check (Safe Browsing & VirusTotal)
  const [safeBrowsing, virusTotal] = await Promise.all([
    checkGoogleSafeBrowsing(normalizedUrl),
    checkVirusTotal(normalizedUrl)
  ]);

  if (safeBrowsing.threatFound) {
    score += 50;
    indicators.push(`Google Safe Browsing: ${safeBrowsing.details}`);
  }
  if (virusTotal.threatFound) {
    score += 50;
    indicators.push(`VirusTotal: ${virusTotal.details}`);
  }

  // Clamp score to 0–100
  score = Math.max(0, Math.min(100, score));
  const level = determineRiskLevel(score);

  // Status & Recommendations
  let status = '';
  if (level === 'Safe') {
    status = 'Legitimate URL structure with standard domain attributes and no malicious flags.';
    recommendations.push('This web address appears safe for regular browsing.');
    recommendations.push('Always ensure the address bar retains this exact domain before entering credentials.');
  } else if (level === 'Low Risk') {
    status = 'Low-risk profile with minor security anomalies or standard unencrypted protocol.';
    recommendations.push('Proceed with caution; verify the website security certificate if available.');
    recommendations.push('Do not submit sensitive financial information over non-HTTPS connections.');
  } else if (level === 'Suspicious') {
    status = 'Suspicious URL characteristics detected that mirror known social-engineering tactics.';
    recommendations.push('Avoid clicking links or downloading any files from this site.');
    recommendations.push('Verify the sender identity and navigate to the official website manually via bookmark or search.');
  } else if (level === 'High Risk') {
    status = 'Strong indicators of an active phishing attempt or credential harvester.';
    recommendations.push('Do NOT open this URL or submit any user IDs, passwords, or personal details.');
    recommendations.push('Report this link to your organization administrator or security team.');
  } else {
    status = 'Critical phishing threat detected. Immediate danger of credential theft or malware.';
    recommendations.push('Block this web address immediately.');
    recommendations.push('If you already visited this link and entered credentials, change your passwords on a trusted device immediately.');
  }

  return {
    score,
    level,
    status,
    indicators,
    security_api_results: {
      google_safe_browsing: safeBrowsing.details,
      virustotal: virusTotal.details
    },
    recommendations
  };
}

export async function analyzeMessage(messageContent: string): Promise<ScanResultDetail> {
  let score = 0;
  const indicators: string[] = [];
  const recommendations: string[] = [];

  const text = messageContent.toLowerCase();

  // 1. Urgency Patterns
  const urgencyPatterns = [
    { regex: /\b(immediately|urgent|right now|within 24 hours|within 12 hours|act now|hurry)\b/i, label: 'High urgency language pressuring rapid user action', weight: 20 },
    { regex: /\b(suspended|terminated|deactivated|cancelled|locked|restricted)\b/i, label: 'Coercive threat of account restriction or service termination', weight: 25 },
    { regex: /\b(legal action|law enforcement|police|arrest|court summons|penalties)\b/i, label: 'Intimidating legal or law enforcement threats', weight: 30 }
  ];

  for (const pattern of urgencyPatterns) {
    if (pattern.regex.test(text)) {
      score += pattern.weight;
      indicators.push(pattern.label);
    }
  }

  // 2. Credential & Sensitive Data Requests
  const credentialPatterns = [
    { regex: /\b(password|passcode|pin code|security pin)\b/i, label: 'Explicit request for login password or PIN code', weight: 35 },
    { regex: /\b(otp|one-time password|verification code|2fa code|authenticator)\b/i, label: 'Request for secondary authentication code / OTP', weight: 35 },
    { regex: /\b(credit card|cvv|cvc|expiration date|card number|bank account number|ssn|social security)\b/i, label: 'Request for sensitive financial or personal identification details', weight: 35 }
  ];

  for (const pattern of credentialPatterns) {
    if (pattern.regex.test(text)) {
      score += pattern.weight;
      indicators.push(pattern.label);
    }
  }

  // 3. Fake Security Alerts / Social Engineering
  const alertPatterns = [
    { regex: /\b(security alert|unauthorized login|suspicious activity|fraud alert|compromised)\b/i, label: 'Simulated security warning designed to incite panic', weight: 20 },
    { regex: /\b(winner|lottery|inheritance|prize|refund pending|unclaimed funds)\b/i, label: 'Advance-fee or prize scam solicitation', weight: 25 },
    { regex: /\b(click the link below|click here to verify|confirm identity here)\b/i, label: 'Call-to-action urging user to follow external verification link', weight: 15 }
  ];

  for (const pattern of alertPatterns) {
    if (pattern.regex.test(text)) {
      score += pattern.weight;
      indicators.push(pattern.label);
    }
  }

  // 4. Embedded URL Extraction and Inspection
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|xyz|top|click|tk|ml|ga|xyz)\/[^\s]*)/gi;
  const embeddedUrls = text.match(urlRegex) || [];

  if (embeddedUrls.length > 0) {
    indicators.push(`Contains ${embeddedUrls.length} embedded web link(s) for user interaction`);
    score += 15;

    for (const url of embeddedUrls) {
      if (/(\d{1,3}\.){3}\d{1,3}/.test(url)) {
        score += 30;
        indicators.push(`Suspicious numerical IP address embedded in message: ${url}`);
      }
      if (/(tk|ml|ga|cf|gq|xyz|top|click)/i.test(url)) {
        score += 20;
        indicators.push(`Suspicious low-reputation domain extension in link: ${url}`);
      }
    }
  }

  // 5. Database Keywords check
  const dbKeywords = await db.getKeywords();
  for (const kwItem of dbKeywords) {
    if (text.includes(kwItem.keyword.toLowerCase())) {
      score += Math.min(20, Math.floor(kwItem.weight * 0.7));
      indicators.push(`Matched known scam pattern keyword: "${kwItem.keyword}" (${kwItem.category})`);
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));
  const level = determineRiskLevel(score);

  // Status & Recommendations
  let status = '';
  if (level === 'Safe') {
    status = 'Content does not demonstrate coercive urgency or unauthorized credential solicitation.';
    recommendations.push('This message appears to be standard communication.');
    recommendations.push('Remember that legitimate organizations never request your secret password or OTP.');
  } else if (level === 'Low Risk') {
    status = 'Low threat detected. Message has minor promotional or urgency markers.';
    recommendations.push('Verify sender address and headers before taking any requested action.');
  } else if (level === 'Suspicious') {
    status = 'Suspicious message with noticeable pressure tactics or unverified links.';
    recommendations.push('Do NOT click links or reply with personal data.');
    recommendations.push('Contact the service provider directly via their official app or verified phone number.');
  } else if (level === 'High Risk') {
    status = 'High probability phishing or credential harvesting message.';
    recommendations.push('Do NOT provide your OTP, PIN, or password under any circumstances.');
    recommendations.push('Mark this communication as spam/phishing in your email or messaging client.');
  } else {
    status = 'Critical phishing communication with coercive threats and direct credential harvesting.';
    recommendations.push('Delete this message immediately without interacting with any links or attachments.');
    recommendations.push('If you already submitted credentials, reset your accounts and alert your bank immediately.');
  }

  return {
    score,
    level,
    status,
    indicators,
    recommendations
  };
}
