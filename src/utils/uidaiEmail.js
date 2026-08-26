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
  const [hours, minutes] = timeString.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const formattedHours = h < 10 ? `0${h}` : h;
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Combine date (YYYY-MM-DD) and time (HH:MM) to formatted string
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
  const digits = value.replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join('-');
}

/**
 * Generate UIDAI Email Subject
 */
export function generateEmailSubject({ enrollmentNumber, enrollmentDate, enrollmentTime }) {
  const dateTimeStr = formatDateTime(enrollmentDate, enrollmentTime);
  return `Aadhaar DOB Update Request – ${enrollmentNumber} – ${dateTimeStr}`;
}

/**
 * Generate UIDAI Email Body
 */
export function generateEmailBody({
  name,
  aadhaarNumber,
  oldDob,
  newDob,
  enrollmentNumber,
  enrollmentDate,
  enrollmentTime,
}) {
  const formattedOldDob = formatDate(oldDob);
  const formattedNewDob = formatDate(newDob);
  const dateTimeStr = formatDateTime(enrollmentDate, enrollmentTime);
  const formattedAadhaar = formatAadhaarNumber(aadhaarNumber);

  return `Dear Sir/Madam,

I am ${name}.

My Aadhaar Card Date of Birth update limit has been crossed. I request you to kindly help me update/correct my Date of Birth.

My Aadhaar Details

1. Name: ${name}

2. Aadhaar Number: ${formattedAadhaar}

3. DOB mentioned in Aadhaar: ${formattedOldDob}

4. Correct DOB: ${formattedNewDob}

5. Enrollment Number: ${enrollmentNumber}

6. Enrollment Date & Time: ${dateTimeStr}


Kindly look into my request and help me update the Date of Birth.

Thank you.

Regards,
${name}`;
}

/**
 * Generate Encoded Mailto URI for mobile mail app trigger
 */
export function generateMailtoLink(recipient, subject, body) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${encodeURIComponent(recipient)}?subject=${encodedSubject}&body=${encodedBody}`;
}
