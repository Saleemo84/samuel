// utils/imageOptimizer.ts

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const MIME_TYPE = 'image/jpeg';
const QUALITY = 0.8; // 80% quality

export const optimizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        // Ensure it's an image file before proceeding
        if (!file.type.startsWith('image/')) {
            // If not an image, return original file (or handle as error)
            // For this app, we assume input is validated, but this is good practice
            return resolve(file);
        }

        const blobURL = URL.createObjectURL(file);
        const img = new Image();
        img.src = blobURL;

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error("Failed to load image for optimization."));
        };

        img.onload = () => {
            URL.revokeObjectURL(img.src);

            let { width, height } = img;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round(height * (MAX_WIDTH / width));
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round(width * (MAX_HEIGHT / height));
                    height = MAX_HEIGHT;
                }
            }
            
            // Don't upscale small images
            if (width > img.width || height > img.height) {
                width = img.width;
                height = img.height;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob conversion failed.'));
                    }
                    // Create a new file with a more descriptive name if needed, but original name is fine
                    const optimizedFile = new File([blob], file.name, {
                        type: MIME_TYPE,
                        lastModified: Date.now(),
                    });
                    resolve(optimizedFile);
                },
                MIME_TYPE,
                QUALITY
            );
        };
    });
};
