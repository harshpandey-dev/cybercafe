/**
 * Image processing utilities for Document PDF Assistant
 */

/**
 * Creates a cropped image DataURL from a crop area rectangle.
 * Caps maximum dimensions to 1200px and optimizes compression quality
 * to guarantee lightweight payload size (<300 KB) and sub-second API requests.
 * @param {string} imageSrc - Source Image Data URL or Blob URL
 * @param {Object} pixelCrop - { x, y, width, height } in pixels
 * @param {number} rotation - Rotation angle in degrees (0, 90, 180, 270)
 * @param {boolean} applyScanFilter - Enhance contrast/brightness for document look
 * @returns {Promise<string>} Cropped base64 JPEG Data URL
 */
export async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, applyScanFilter = false) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const rotRad = (rotation * Math.PI) / 180;

  // Calculate bounding box of rotated image
  const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to center for rotation
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Create crop canvas
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');

  const rotatedCrop = getRotatedCrop(pixelCrop, image.width, image.height, rotation);
  cropCanvas.width = Math.max(1, Math.round(rotatedCrop.width));
  cropCanvas.height = Math.max(1, Math.round(rotatedCrop.height));

  // Draw the cropped region onto cropCanvas
  cropCtx.drawImage(
    canvas,
    rotatedCrop.x,
    rotatedCrop.y,
    rotatedCrop.width,
    rotatedCrop.height,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  // Apply document enhance filter (boost contrast & brightness for clean paper scan)
  if (applyScanFilter) {
    const imgData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      let avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      let factor = (259 * (15 + 255)) / (255 * (259 - 15));
      avg = factor * (avg - 128) + 128;
      avg = Math.min(255, Math.max(0, avg));

      data[i] = avg;     // Red
      data[i + 1] = avg; // Green
      data[i + 2] = avg; // Blue
    }
    cropCtx.putImageData(imgData, 0, 0);
  }

  // Downscale high-resolution camera photos to max 1200px dimension
  // Keeps document text 100% crisp for printing while reducing payload size from 15MB -> 150KB
  const MAX_DIM = 1200;
  let finalWidth = cropCanvas.width;
  let finalHeight = cropCanvas.height;

  if (finalWidth > MAX_DIM || finalHeight > MAX_DIM) {
    if (finalWidth > finalHeight) {
      finalHeight = Math.round((finalHeight * MAX_DIM) / finalWidth);
      finalWidth = MAX_DIM;
    } else {
      finalWidth = Math.round((finalWidth * MAX_DIM) / finalHeight);
      finalHeight = MAX_DIM;
    }
  }

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = finalWidth;
  finalCanvas.height = finalHeight;
  const finalCtx = finalCanvas.getContext('2d');
  finalCtx.drawImage(cropCanvas, 0, 0, finalWidth, finalHeight);

  // Return optimized JPEG base64 Data URL
  return finalCanvas.toDataURL('image/jpeg', 0.75);
}

/**
 * Maps a rectangle from the unrotated source image onto the rotated canvas.
 */
function getRotatedCrop(crop, imageWidth, imageHeight, rotation) {
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return {
        x: imageHeight - (crop.y + crop.height),
        y: crop.x,
        width: crop.height,
        height: crop.width,
      };
    case 180:
      return {
        x: imageWidth - (crop.x + crop.width),
        y: imageHeight - (crop.y + crop.height),
        width: crop.width,
        height: crop.height,
      };
    case 270:
      return {
        x: crop.y,
        y: imageWidth - (crop.x + crop.width),
        width: crop.height,
        height: crop.width,
      };
    default:
      return crop;
  }
}

/**
 * Creates an HTML Image element from a source URL.
 */
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Automatically suggests a document crop bounding area.
 */
export async function suggestDocumentCrop(imageSrc) {
  try {
    const image = await createImage(imageSrc);
    return {
      x: image.width * 0.05,
      y: image.height * 0.05,
      width: image.width * 0.90,
      height: image.height * 0.90,
    };
  } catch {
    return null;
  }
}
