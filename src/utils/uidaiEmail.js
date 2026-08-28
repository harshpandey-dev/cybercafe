/**
 * Official UIDAI Aadhaar DOB Limit Cross Email Helper
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
 * Format time string (HH:MM or HH:MM:SS) to 12-hour format with AM/PM
 */
export function formatTime(timeString) {
  if (!timeString) return '';
  const parts = timeString.split(':');
  let h = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const seconds = parts[2] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const formattedHours = h < 10 ? `0${h}` : h;
  return `${formattedHours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Combine date (YYYY-MM-DD) and time (HH:MM:SS) to formatted string
 */
export function formatDateTime(dateStr, timeStr) {
  const formattedD = formatDate(dateStr);
  const formattedT = formatTime(timeStr);
  if (formattedD && formattedT) {
    return `${formattedD} ${formattedT}`;
  }
  return formattedD || formattedT || '';
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
 * Constructs the 28-character Full Enrollment Number:
 * EnrollmentNo (14 digits) + YYYYMMDD (8 digits) + HHMMSS (6 digits)
 */
export function computeFullEnrollmentNumber(eid, dateStr, timeStr) {
  const cleanEid = String(eid || '').replace(/\D/g, '');

  // If user already entered full 28 digits, use directly
  if (cleanEid.length === 28) {
    return cleanEid;
  }

  let datePart = '';
  if (dateStr) {
    datePart = dateStr.replace(/\D/g, ''); // YYYYMMDD
  }

  let timePart = '120000';
  if (timeStr) {
    const timeDigits = timeStr.replace(/\D/g, '');
    if (timeDigits.length === 6) {
      timePart = timeDigits;
    } else if (timeDigits.length === 4) {
      timePart = `${timeDigits}00`;
    } else if (timeDigits.length === 2) {
      timePart = `${timeDigits}0000`;
    }
  }

  return `${cleanEid}${datePart}${timePart}`;
}

/**
 * Generate UIDAI Email Subject
 * Format: RO Lucknow DOB Limit Cross Enrolment No : [FULL ENROLLMENT NUMBER]
 */
export function generateEmailSubject({ enrollmentNumber, enrollmentDate, enrollmentTime, fullEnrollmentNumber }) {
  const fullEID = fullEnrollmentNumber || computeFullEnrollmentNumber(enrollmentNumber, enrollmentDate, enrollmentTime);
  return `RO Lucknow DOB Limit Cross Enrolment No : ${fullEID}`;
}

/**
 * Generate UIDAI Email Body according to exact user template.
 * Optional fields (Old DOB, Father Name, Mother Name, Mobile No.) are ONLY included if provided.
 */
export function generateEmailBody({
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
  const formattedOldDob = formatDate(oldDob);
  const formattedNewDob = formatDate(newDob);
  const formattedAadhaar = formatAadhaarNumber(aadhaarNumber);
  const fullEID = fullEnrollmentNumber || computeFullEnrollmentNumber(enrollmentNumber, enrollmentDate, enrollmentTime);

  let detailsLines = [];
  detailsLines.push(`Name              : ${name}`);
  detailsLines.push(`Aadhaar No.       : ${formattedAadhaar}`);

  if (formattedOldDob && formattedOldDob.trim()) {
    detailsLines.push(`Old DOB           : ${formattedOldDob}`);
  }

  detailsLines.push(`New DOB           : ${formattedNewDob}`);

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

/**
 * Generate Encoded Mailto URI for mobile mail app trigger
 * Format: mailto:help@uidai.gov.in?subject=...&body=...
 */
export function generateMailtoLink(param1, param2, param3) {
  let recipient = 'help@uidai.gov.in';
  let subject = '';
  let body = '';

  if (typeof param1 === 'string' && param1.includes('@')) {
    recipient = param1;
    subject = param2 || '';
    body = param3 || '';
  } else if (typeof param3 === 'string' && param3.includes('@')) {
    recipient = param3;
    subject = param1 || '';
    body = param2 || '';
  } else {
    subject = param1 || '';
    body = param2 || '';
  }

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:${encodeURIComponent(recipient)}?subject=${encodedSubject}&body=${encodedBody}`;
}
