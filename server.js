import express from 'express';
import crypto from 'crypto';
import os from 'os';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIRECTORY = path.join(__dirname, 'dist');
const TEMP_LINK_EXPIRY_MINUTES = 10;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = Math.ceil(MAX_PDF_BYTES * 1.37);
const CASE_CREATION_LIMIT = 20;
const CASE_CREATION_WINDOW_MS = 10 * 60 * 1000;
const UIDAI_RECIPIENT = process.env.UIDAI_RECIPIENT || 'help@uidai.gov.in';

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

const caseCreationAttempts = new Map();
app.use('/api/cases', (req, res, next) => {
  if (req.method !== 'POST') return next();

  const now = Date.now();
  const key = req.ip;
  const attempts = (caseCreationAttempts.get(key) || []).filter(
    (timestamp) => now - timestamp < CASE_CREATION_WINDOW_MS
  );

  if (attempts.length >= CASE_CREATION_LIMIT) {
    return res.status(429).json({ error: 'Too many case creation attempts. Please wait and try again.' });
  }

  attempts.push(now);
  caseCreationAttempts.set(key, attempts);
  next();
});

app.use(express.json({ limit: `${MAX_REQUEST_BYTES}b` }));

/**
 * Temporary In-Memory Storage for Customer Cases
 */
const tempCases = new Map();

/**
 * Periodic Garbage Collection Timer (Runs every 60 seconds)
 */
setInterval(() => {
  const now = Date.now();
  for (const [caseId, caseData] of tempCases.entries()) {
    if (now > caseData.expiresAt) {
      tempCases.delete(caseId);
      console.log(`[GC] Purged expired case: ${caseId}`);
    }
  }
}, 60 * 1000);

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

function isValidCaseId(caseId) {
  return /^[a-f0-9]{32}$/.test(caseId);
}

function maskAadhaar(aadhaarNumber) {
  const digits = String(aadhaarNumber || '').replace(/\D/g, '');
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function getPublicOrigin(req) {
  if (process.env.PUBLIC_ORIGIN) {
    return process.env.PUBLIC_ORIGIN.replace(/\/$/, '');
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';

  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${protocol}://${host}`;
  }

  return `${protocol}://${getLocalIpAddress()}:${PORT}`;
}

function getPdfBuffer(pdfBase64) {
  // Email-only mode: no PDF provided — return null (valid)
  if (!pdfBase64 || (typeof pdfBase64 === 'string' && pdfBase64.length === 0)) {
    return null;
  }

  const payload = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
  const pdfBuffer = Buffer.from(payload, 'base64');
  if (pdfBuffer.length === 0 || pdfBuffer.length > MAX_PDF_BYTES) {
    throw new Error('PDF must be a valid file no larger than 10 MB.');
  }

  return pdfBuffer;
}

// REST API Endpoints

/**
 * POST /api/cases
 */
app.post('/api/cases', (req, res) => {
  try {
    const {
      name,
      aadhaarNumber,
      oldDob,
      newDob,
      enrollmentNumber,
      enrollmentDateTime,
      emailSubject,
      emailBody,
      pdfBase64,
      pdfFilename,
    } = req.body;

    const cleanAadhaar = String(aadhaarNumber || '').replace(/\D/g, '');
    const cleanName = String(name || '').trim();
    const cleanEnrollmentNumber = String(enrollmentNumber || '').trim();

    if (!cleanName || !cleanEnrollmentNumber) {
      return res.status(400).json({ error: 'Missing required case parameters.' });
    }

    const caseId = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const expiresAt = now + TEMP_LINK_EXPIRY_MINUTES * 60 * 1000;

    const pdfBuffer = getPdfBuffer(pdfBase64);

    const caseData = {
      caseId,
      name: cleanName,
      aadhaarMasked: maskAadhaar(cleanAadhaar),
      emailTo: UIDAI_RECIPIENT,
      emailSubject: String(emailSubject || '').slice(0, 500),
      emailBody: String(emailBody || '').slice(0, 10_000),
      pdfBuffer,
      pdfFilename: pdfFilename || `Aadhaar_Documents_${cleanEnrollmentNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      createdAt: now,
      expiresAt,
    };

    tempCases.set(caseId, caseData);

    const resolvedOrigin = getPublicOrigin(req);
    console.log(`[CASE CREATED] ID: ${caseId} | Origin: ${resolvedOrigin} | Expires in 10 mins`);

    res.json({
      success: true,
      caseId,
      expiresAt,
      publicOrigin: resolvedOrigin,
      localIp: getLocalIpAddress(),
      expiresInMinutes: TEMP_LINK_EXPIRY_MINUTES,
    });
  } catch (err) {
    console.error('Error creating case:', err.message);
    res.status(400).json({ error: err.message || 'Could not create temporary case.' });
  }
});

/**
 * GET /api/cases/:caseId
 */
app.get('/api/cases/:caseId', (req, res) => {
  const { caseId } = req.params;
  if (!isValidCaseId(caseId)) {
    return res.status(404).json({ expired: true, message: 'This link has expired.' });
  }
  const caseData = tempCases.get(caseId);

  if (!caseData || Date.now() > caseData.expiresAt) {
    if (caseData) tempCases.delete(caseId);
    return res.status(410).json({
      expired: true,
      error: 'This link has expired.',
      message: 'This link has expired',
    });
  }

  res.json({
    caseId: caseData.caseId,
    name: caseData.name,
    aadhaarMasked: caseData.aadhaarMasked,
    emailTo: caseData.emailTo || UIDAI_RECIPIENT,
    emailSubject: caseData.emailSubject,
    emailBody: caseData.emailBody,
    pdfFilename: caseData.pdfBuffer ? caseData.pdfFilename : '',
    hasPdf: !!caseData.pdfBuffer,
    expiresAt: caseData.expiresAt,
    remainingSeconds: Math.max(0, Math.floor((caseData.expiresAt - Date.now()) / 1000)),
  });
});

/**
 * GET /api/cases/:caseId/download
 */
app.get('/api/cases/:caseId/download', (req, res) => {
  const { caseId } = req.params;
  if (!isValidCaseId(caseId)) {
    return res.status(404).send('<h1>This download link has expired.</h1>');
  }
  const caseData = tempCases.get(caseId);

  if (!caseData || Date.now() > caseData.expiresAt) {
    if (caseData) tempCases.delete(caseId);
    return res.status(410).send('<h1>This download link has expired.</h1>');
  }

  if (!caseData.pdfBuffer) {
    return res.status(404).send('<h1>No PDF available for this request. This was an email-only case.</h1>');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', caseData.pdfBuffer.length);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${caseData.pdfFilename}"`
  );
  res.send(caseData.pdfBuffer);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', (_req, res) => {
  res.json({ emailRecipient: UIDAI_RECIPIENT });
});

app.use(express.static(DIST_DIRECTORY, { index: false, maxAge: 0 }));
app.get('*', (_req, res) => res.sendFile(path.join(DIST_DIRECTORY, 'index.html')));

const tlsKeyPath = process.env.TLS_KEY_PATH;
const tlsCertPath = process.env.TLS_CERT_PATH;

const secureServer = tlsKeyPath && tlsCertPath
  ? https.createServer({ key: fs.readFileSync(tlsKeyPath), cert: fs.readFileSync(tlsCertPath) }, app)
  : null;
const server = secureServer || app;

if (!process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cyber Cafe service running on port ${PORT}`);
  });
}

export default app;
