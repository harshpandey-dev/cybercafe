import { PDFDocument, PageSizes } from 'pdf-lib';

/**
 * Converts an array of cropped image Data URLs into a single compressed PDF file.
 * @param {Array<string>} imagePages - Array of base64 JPEG Data URLs
 * @param {Object} options - Options for PDF generation (compression quality, page size)
 * @returns {Promise<{ pdfBytes: Uint8Array, pdfBlob: Blob, sizeFormatted: string, pageCount: number }>}
 */
export async function createPdfFromImages(imagePages, options = {}) {
  if (!imagePages || imagePages.length === 0) {
    throw new Error('No document pages provided to generate PDF.');
  }

  // Create a new PDF Document
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < imagePages.length; i++) {
    const dataUrl = imagePages[i];
    
    // Extract base64 image data
    const imageBytes = dataUrlToBytes(dataUrl);

    // Embed JPEG image into PDF
    const embeddedImage = await pdfDoc.embedJpg(imageBytes);
    
    // Set PDF page size to match the EXACT cropped image dimensions (No white margins/background!)
    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    // Add page with exact image width & height
    const page = pdfDoc.addPage([imgWidth, imgHeight]);

    // Draw image to fill entire page from top-left (0,0) to (imgWidth, imgHeight)
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight,
    });
  }

  // Save the PDF as Uint8Array
  const pdfBytes = await pdfDoc.save();

  // Create a Blob for preview / download
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

  // Format file size
  const sizeFormatted = formatBytes(pdfBlob.size);

  return {
    pdfBytes,
    pdfBlob,
    sizeFormatted,
    pageCount: imagePages.length,
  };
}

/**
 * Converts a Data URL string into Uint8Array bytes
 */
function dataUrlToBytes(dataUrl) {
  const base64Str = dataUrl.split(',')[1];
  const binaryStr = atob(base64Str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Format bytes to readable string (e.g. 1.2 MB or 450 KB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
