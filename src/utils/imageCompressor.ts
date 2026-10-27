/**
 * Image compressor & optimizer utility for University Marketplace
 * Shrinks raw camera/mobile device photos (often 3-10MB) into lightweight, high-clarity Data URLs
 * (~40-80KB each) to comfortably fit within Firestore's 1MB document limit.
 */

export async function compressAndOptimizeImage(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG, read directly as text/dataURL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio-preserved bounding box
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Fill white background for transparency in case of PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG Data URL
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // If still over 250KB, compress further to 0.60 quality
        if (dataUrl.length > 350 * 1024) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.60);
        }

        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Validates that an image URL can be loaded successfully by the browser.
 */
export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
