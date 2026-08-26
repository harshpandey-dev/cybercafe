import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TEMP_DIR = '/tmp';
const tempCasesInMemory = global.tempCasesInMemory || new Map();
global.tempCasesInMemory = tempCasesInMemory;

function getCaseFilePath(caseId) {
  return path.join(TEMP_DIR, `case_${caseId}.json`);
}

function saveCase(caseId, caseData) {
  tempCasesInMemory.set(caseId, caseData);
  try {
    fs.writeFileSync(getCaseFilePath(caseId), JSON.stringify(caseData));
  } catch (err) {
    console.error('Error writing temp case file:', err);
  }
}

function loadCase(caseId) {
  if (!caseId) return null;

  // 1. Check in-memory map
  let caseData = tempCasesInMemory.get(caseId);
  if (caseData) {
    if (Date.now() > caseData.expiresAt) {
      tempCasesInMemory.delete(caseId);
      try { fs.unlinkSync(getCaseFilePath(caseId)); } catch {}
      return null;
    }
    return caseData;
  }

  // 2. Check /tmp disk storage
  try {
    const filePath = getCaseFilePath(caseId);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      caseData = JSON.parse(raw);
      if (Date.now() > caseData.expiresAt) {
        try { fs.unlinkSync(filePath); } catch {}
        return null;
      }
      tempCasesInMemory.set(caseId, caseData);
      return caseData;
    }
  } catch (err) {
    console.error('Error reading temp case file:', err);
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  // 1. POST /api/cases
  if (req.method === 'POST') {
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
      } = req.body || {};

      if (!name || !aadhaarNumber || !enrollmentNumber || !pdfBase64) {
        return res.status(400).json({ error: 'Missing required parameters.' });
      }

      const caseId = crypto.randomBytes(16).toString('hex');
      const now = Date.now();
      const expiresAt = now + 10 * 60 * 1000; // 10 mins

      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const publicOrigin = `${protocol}://${host}`;

      const caseData = {
        caseId,
        name,
        aadhaarMasked: `XXXX-XXXX-${aadhaarNumber.replace(/\D/g, '').slice(-4)}`,
        emailTo: 'help@uidai.gov.in',
        emailSubject,
        emailBody,
        pdfBase64,
        pdfFilename: pdfFilename || `Aadhaar_Documents_${enrollmentNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        createdAt: now,
        expiresAt,
      };

      saveCase(caseId, caseData);

      console.log(`[CASE CREATED] ID: ${caseId} | Expires in 10 mins`);

      return res.status(200).json({
        success: true,
        caseId,
        expiresAt,
        publicOrigin,
        expiresInMinutes: 10,
      });
    } catch (err) {
      console.error('API Error:', err);
      return res.status(500).json({ error: 'Failed to create case.' });
    }
  }

  // 2. GET /api/cases/:caseId OR GET /api/cases/:caseId/download
  if (req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;
    const urlParts = pathname.split('/').filter(Boolean);

    let targetCaseId = req.query.caseId;
    let isDownload = pathname.endsWith('/download') || req.query.download === 'true';

    if (!targetCaseId && urlParts.length >= 2) {
      targetCaseId = urlParts[1];
      if (targetCaseId === 'download' && urlParts.length >= 3) {
        targetCaseId = urlParts[1];
      }
    }

    if (!targetCaseId || targetCaseId === 'cases') {
      return res.status(400).json({ error: 'Missing case ID.' });
    }

    const caseData = loadCase(targetCaseId);

    if (!caseData) {
      if (isDownload) {
        return res.status(410).send('<h1>This download link has expired.</h1>');
      }
      return res.status(410).json({ expired: true, message: 'This link has expired.' });
    }

    if (isDownload) {
      const pdfBuffer = Buffer.from(
        caseData.pdfBase64.replace(/^data:application\/pdf;base64,/, ''),
        'base64'
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${caseData.pdfFilename}"`
      );
      return res.status(200).send(pdfBuffer);
    }

    return res.status(200).json({
      caseId: caseData.caseId,
      name: caseData.name,
      aadhaarMasked: caseData.aadhaarMasked,
      emailTo: caseData.emailTo,
      emailSubject: caseData.emailSubject,
      emailBody: caseData.emailBody,
      pdfFilename: caseData.pdfFilename,
      expiresAt: caseData.expiresAt,
      remainingSeconds: Math.max(0, Math.floor((caseData.expiresAt - Date.now()) / 1000)),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
