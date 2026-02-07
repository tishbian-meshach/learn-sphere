/**
 * Compresses an image file before upload.
 * @param file The original image file
 * @param maxWidth Max width of the image (default: 1200px)
 * @param quality Compression quality (0 to 1, default: 0.8)
 * @returns A compressed Blob
 */
export async function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<Blob | File> {
  // Only compress images
  if (!file.type.startsWith('image/')) return file;
  
  // Don't compress small icons or SVGs
  if (file.type === 'image/svg+xml' || file.size < 100 * 1024) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and resize if needed
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback to original
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
