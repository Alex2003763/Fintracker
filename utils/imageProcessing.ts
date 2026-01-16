/**
 * Processes an image to make it semi-transparent and optimized for card backgrounds
 */
export const processImageForBackground = (imageSrc: string, themeColors?: { isDark: boolean; primaryColor?: string }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const process = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to maintain aspect ratio but limit max dimensions
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, width, height);
        
        // Set global alpha for transparency effect
        ctx.globalAlpha = 0.6;
        
        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Apply theme-aware overlay for better readability
        ctx.globalAlpha = 0.15;
        const overlayColor = themeColors?.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)';
        ctx.fillStyle = overlayColor;
        ctx.fillRect(0, 0, width, height);
        
        // Add subtle gradient based on theme
        if (themeColors?.primaryColor) {
          ctx.globalAlpha = 0.05;
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, themeColors.primaryColor + '00');
          gradient.addColorStop(1, themeColors.primaryColor + '40');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
        
        // Convert to data URL
        const dataURL = canvas.toDataURL('image/png', 0.8);
        resolve(dataURL);
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(process);
      } else {
        setTimeout(process, 0);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
};

/**
 * Compresses an image file to reduce size for storage
 * Resizes large images and converts to JPEG with quality adjustment
 */
export const compressImage = (file: File, options: { maxWidth?: number, maxHeight?: number, quality?: number } = {}): Promise<File> => {
    return new Promise((resolve, reject) => {
        const { maxWidth = 1024, maxHeight = 1024, quality = 0.7 } = options;
        const reader = new FileReader();
        
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                
                // Calculate new dimensions
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob and then new File
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to compress image'));
                        return;
                    }
                    
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image for compression'));
            };
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read image file'));
        };
    });
};

/**
 * Creates a pattern effect on the image for better card integration
 */
export const createPatternBackground = (imageSrc: string, themeColors?: { isDark: boolean; primaryColor?: string }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const process = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Create a subtle pattern effect
        ctx.clearRect(0, 0, width, height);
        
        // Draw image with reduced opacity
        ctx.globalAlpha = 0.4;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Add theme-aware gradient overlay
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        if (themeColors?.isDark) {
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        }
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add primary color accent if provided
        if (themeColors?.primaryColor) {
          ctx.globalAlpha = 0.08;
          const accentGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
          accentGradient.addColorStop(0, themeColors.primaryColor + '40');
          accentGradient.addColorStop(1, themeColors.primaryColor + '00');
          ctx.fillStyle = accentGradient;
          ctx.fillRect(0, 0, width, height);
        }
        
        const dataURL = canvas.toDataURL('image/png', 0.9);
        resolve(dataURL);
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(process);
      } else {
        setTimeout(process, 0);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
};