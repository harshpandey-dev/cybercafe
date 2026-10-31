/**
 * Official UIDAI Email Helper
 * Supports: DOB Limit Cross & Aadhaar Reactivation
 * RO Lucknow format
 */

/**
 * Format a Date object or YYYY-MM-DD string to DD/MM/YYYY
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

/**
 * Format 12-digit Aadhaar number as XXXX-XXXX-XXXX
 */
export function formatAadhaarNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join('-');
}

/**
 * Constructs the Full Enrollment Number:
 * EnrollmentNo (14 chars, may contain letters) + YYYYMMDD (8 digits) + HHMMSS (6 digits)
 *
 * Example: EID = 00150333145600, Date = 2026-08-28, Time = 10:15:55
 * Result:  00150333145600 + 20260828 + 101555 = 0015033314560020260828101555
 */
export function computeFullEnrollmentNumber(eid, dateStr, timeStr) {
  // Keep alphanumeric chars from EID (allows letters + digits)
  const cleanEid = String(eid || '').replace(/[^a-zA-Z0-9]/g, '');

  // If user already entered a very long string (28+), use as-is
  if (cleanEid.length >= 28) {
    return cleanEid;
  }

  // Date part: YYYYMMDD from YYYY-MM-DD
  let datePart = '';
  if (dateStr) {
    datePart = dateStr.replace(/\D/g, ''); // YYYYMMDD = 8 digits
  }

  // Time part: HHMMSS from HH:MM:SS (24-hour, NO AM/PM)
  let timePart = '120000';
  if (timeStr) {
    const timeDigits = timeStr.replace(/\D/g, '');
    if (timeDigits.length >= 6) {
      timePart = timeDigits.slice(0, 6); // HHMMSS
    } else if (timeDigits.length >= 4) {
      timePart = `${timeDigits.slice(0, 4)}00`; // HHMM + 00
    } else if (timeDigits.length >= 2) {
      timePart = `${timeDigits.slice(0, 2)}0000`; // HH + 0000
    }
  }

  return `${cleanEid}${datePart}${timePart}`;
}

// ============================================================
// DOB LIMIT CROSS EMAIL
// ============================================================

/**
 * Generate DOB Limit Cross Email Subject
 * Format: RO Lucknow DOB Limit Cross Enrolment No : [full enrollment number]
 */
export function generateDobEmailSubject({ enrollmentNumber, enrollmentDate, enrollmentTime, fullEnrollmentNumber }) {
  const fullEID = fullEnrollmentNumber || computeFullEnrollmentNumber(enrollmentNumber, enrollmentDate, enrollmentTime);
  return `RO Lucknow DOB Limit Cross Enrolment No : ${fullEID}`;
}

/**
 * Generate DOB Limit Cross Email Body.
 * ONLY includes fields that are provided. If a field is empty/blank, that line is omitted entirely.
 */
export function generateDobEmailBody({
  name,
  aadhaarNumber,
  oldDob,
  newDob,
  fatherName,
  motherName,
  mobileNumber,
  enrollmentNumber,
  enrollmentDate,
  enrollmentTime,
  fullEnrollmentNumber,
}) {
  const formattedAadhaar = formatAadhaarNumber(aadhaarNumber);
  const fullEID = fullEnrollmentNumber || computeFullEnrollmentNumber(enrollmentNumber, enrollmentDate, enrollmentTime);

  const detailsLines = [];
  detailsLines.push(`Name              : ${name}`);
  detailsLines.push(`Aadhaar No.       : ${formattedAadhaar}`);

  if (oldDob && oldDob.trim()) {
    detailsLines.push(`Old DOB           : ${formatDate(oldDob)}`);
  }

  detailsLines.push(`New DOB           : ${formatDate(newDob)}`);

  if (fatherName && fatherName.trim()) {
    detailsLines.push(`Father Name       : ${fatherName.trim()}`);
  }

  if (motherName && motherName.trim()) {
    detailsLines.push(`Mother Name       : ${motherName.trim()}`);
  }

  if (mobileNumber && mobileNumber.trim()) {
    detailsLines.push(`Mobile No.        : ${mobileNumber.trim()}`);
  }

  detailsLines.push(`Enrollment URN    : ${fullEID}`);

  const detailsBlock = detailsLines.join('\n');

  return `Dear Sir/Madam,

I am writing to request your assistance regarding my Aadhaar update. My Date of Birth update limit has been crossed, and I am unable to complete the Aadhaar update through the normal process.

My Aadhaar details are as follows:

${detailsBlock}

I have completed the required Aadhaar update process and am attaching the relevant supporting documents as a single PDF for your reference.

I kindly request you to verify my details and guide me regarding the further process required for my Aadhaar update.

Please consider my request and provide the necessary assistance at the earliest.

Thank you for your time and support.

Regards,
${name}`;
}

// ============================================================
// AADHAAR REACTIVATION EMAIL
// ============================================================

/**
 * Generate Aadhaar Reactivation Email Subject
 * Format: RO Lucknow Aadhaar Reactivation Enrolment No : [full enrollment number]
 */
export function generateReactivationEmailSubject({ enrollmentNumber, enrollmentDate, enrollmentTime, fullEnrollmentNumber }) {
  const fullEID = fullEnrollmentNumber || computeFullEnrollmentNumber(enrollmentNumber, enrollmentDate, enrollmentTime);
  return `RO Lucknow Aadhaar Reactivation Enrolment No : ${fullEID}`;
}

/**
 * Generate Aadhaar Reactivation Email Body.
 * ONLY includes fields that are provided. If a field is empty/blank, that line is omitted entirely.
 */
export function generateReactivationEmailBody({
  name,
  aadhaarNumber,
  fatherName,
  motherName,
  mobileNumber,
  enrollmentNumber,
  enrollmentDate,
  enrollmentTime,
  fullEnrollmentNumber,
}) {
  const formattedAadhaar = formatAadhaarNumber(aadhaarNumber);
  const fullEID = fullEnrollmentNumber || computeFullEnrollmentNumber(enrollmentNumber, enrollmentDate, enrollmentTime);

  const detailsLines = [];
  detailsLines.push(`Name              : ${name}`);
  detailsLines.push(`Aadhaar No.       : ${formattedAadhaar}`);

  if (fatherName && fatherName.trim()) {
    detailsLines.push(`Father Name       : ${fatherName.trim()}`);
  }

  if (motherName && motherName.trim()) {
    detailsLines.push(`Mother Name       : ${motherName.trim()}`);
  }

  if (mobileNumber && mobileNumber.trim()) {
    detailsLines.push(`Mobile No.        : ${mobileNumber.trim()}`);
  }

  detailsLines.push(`Enrollment URN    : ${fullEID}`);

  const detailsBlock = detailsLines.join('\n');

  return `Dear Sir/Madam,

I am writing to request your assistance regarding the reactivation of my Aadhaar. My Aadhaar has been deactivated, and I am unable to use it for Aadhaar-related services.

My Aadhaar details are as follows:

${detailsBlock}

I have completed the required Aadhaar reactivation process and am attaching the relevant supporting documents as a single PDF for your reference.

I kindly request you to verify my details and guide me regarding the further process required for my Aadhaar reactivation.

Please consider my request and provide the necessary assistance at the earliest.

Thank you for your time and support.

Regards,
${name}`;
}

// ============================================================
// UNIVERSAL HELPERS (used by both email types)
// ============================================================

/**
 * Pick subject/body generators based on emailType
 * emailType: 'dob_limit_cross' | 'reactivation'
 */
export function generateEmailSubject(details, emailType) {
  if (emailType === 'reactivation') {
    return generateReactivationEmailSubject(details);
  }
  return generateDobEmailSubject(details);
}

export function generateEmailBody(details, emailType) {
  if (emailType === 'reactivation') {
    return generateReactivationEmailBody(details);
  }
  return generateDobEmailBody(details);
}

/**
 * Generate Encoded Mailto URI for mobile mail app trigger
 * Format: mailto:help@uidai.gov.in?subject=...&body=...
 */
export function generateMailtoLink(recipient, subject, body) {
  const to = (recipient && recipient.includes('@')) ? recipient : 'help@uidai.gov.in';
  const encodedSubject = encodeURIComponent(subject || '');
  const encodedBody = encodeURIComponent(body || '');
  return `mailto:${encodeURIComponent(to)}?subject=${encodedSubject}&body=${encodedBody}`;
}
