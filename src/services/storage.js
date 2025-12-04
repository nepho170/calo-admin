import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata
} from 'firebase/storage';
import { storage } from '../configs/firebase';

// ========== STORAGE PATHS ==========
const STORAGE_PATHS = {
    INGREDIENTS: 'ingredients',
    MEALS: 'meals',
    PLANS: 'plans',
    MEAL_PACKAGES: 'meal-packages',
    LABELS: 'labels',
    TEMP: 'temp'
};

// ========== HELPER FUNCTIONS ==========

// Generate unique filename
const generateUniqueFilename = (originalName) => {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const nameWithoutExtension = originalName.split('.').slice(0, -1).join('.');
    const cleanName = nameWithoutExtension.replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanName}_${timestamp}.${extension}`;
};

// Validate image file
const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
    }

    return true;
};

// ========== IMAGE UPLOAD FUNCTIONS ==========

export const imageUploadService = {
    // Upload ingredient image
    uploadIngredientImage: async (file, ingredientId) => {
        try {
            validateImageFile(file);

            const filename = generateUniqueFilename(file.name);
            const storageRef = ref(storage, `${STORAGE_PATHS.INGREDIENTS}/${ingredientId}/${filename}`);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                url: downloadURL,
                path: snapshot.ref.fullPath,
                filename: filename
            };
        } catch (error) {
            console.error('Error uploading ingredient image:', error);
            throw error;
        }
    },

    // Upload meal image
    uploadMealImage: async (file, mealId) => {
        try {
            validateImageFile(file);

            const filename = generateUniqueFilename(file.name);
            const storageRef = ref(storage, `${STORAGE_PATHS.MEALS}/${mealId}/${filename}`);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                url: downloadURL,
                path: snapshot.ref.fullPath,
                filename: filename
            };
        } catch (error) {
            console.error('Error uploading meal image:', error);
            throw error;
        }
    },

    // Upload plan image
    uploadPlanImage: async (file, planId) => {
        try {
            validateImageFile(file);

            const filename = generateUniqueFilename(file.name);
            const storageRef = ref(storage, `${STORAGE_PATHS.PLANS}/${planId}/${filename}`);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                url: downloadURL,
                path: snapshot.ref.fullPath,
                filename: filename
            };
        } catch (error) {
            console.error('Error uploading plan image:', error);
            throw error;
        }
    },

    // Upload label icon
    uploadLabelIcon: async (file, labelId) => {
        try {
            validateImageFile(file);

            const filename = generateUniqueFilename(file.name);
            const storageRef = ref(storage, `${STORAGE_PATHS.LABELS}/${labelId}/${filename}`);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                url: downloadURL,
                path: snapshot.ref.fullPath,
                filename: filename
            };
        } catch (error) {
            console.error('Error uploading label icon:', error);
            throw error;
        }
    },

    // Upload meal package image
    uploadMealPackageImage: async (file, packageId) => {
        try {
            validateImageFile(file);

            const filename = generateUniqueFilename(file.name);
            const storageRef = ref(storage, `${STORAGE_PATHS.MEAL_PACKAGES}/${packageId}/${filename}`);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                url: downloadURL,
                path: snapshot.ref.fullPath,
                filename: filename
            };
        } catch (error) {
            console.error('Error uploading meal package image:', error);
            throw error;
        }
    },

    // Upload multiple images
    uploadMultipleImages: async (files, category, entityId) => {
        try {
            const uploads = files.map(file => {
                switch (category) {
                    case 'ingredient':
                        return imageUploadService.uploadIngredientImage(file, entityId);
                    case 'meal':
                        return imageUploadService.uploadMealImage(file, entityId);
                    case 'plan':
                        return imageUploadService.uploadPlanImage(file, entityId);
                    case 'meal-package':
                        return imageUploadService.uploadMealPackageImage(file, entityId);
                    case 'label':
                        return imageUploadService.uploadLabelIcon(file, entityId);
                    default:
                        throw new Error('Invalid category');
                }
            });

            const results = await Promise.all(uploads);
            return results;
        } catch (error) {
            console.error('Error uploading multiple images:', error);
            throw error;
        }
    },

    // Delete image
    deleteImage: async (imagePath) => {
        try {
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef);
            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    },

    // Get all images for an entity
    getEntityImages: async (category, entityId) => {
        try {
            const pathKey = category.toUpperCase().replace('-', '_');
            const folderRef = ref(storage, `${STORAGE_PATHS[pathKey]}/${entityId}`);
            const listResult = await listAll(folderRef);

            const imagePromises = listResult.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                const metadata = await getMetadata(itemRef);

                return {
                    url,
                    path: itemRef.fullPath,
                    name: itemRef.name,
                    size: metadata.size,
                    contentType: metadata.contentType,
                    timeCreated: metadata.timeCreated,
                    updated: metadata.updated
                };
            });

            const images = await Promise.all(imagePromises);
            return images;
        } catch (error) {
            console.error('Error getting entity images:', error);
            throw error;
        }
    },

    // Clean up unused images
    cleanupUnusedImages: async (category, entityId, usedImageUrls) => {
        try {
            const allImages = await imageUploadService.getEntityImages(category, entityId);
            const unusedImages = allImages.filter(image => !usedImageUrls.includes(image.url));

            const deletePromises = unusedImages.map(image =>
                imageUploadService.deleteImage(image.path)
            );

            await Promise.all(deletePromises);
            return unusedImages.length;
        } catch (error) {
            console.error('Error cleaning up unused images:', error);
            throw error;
        }
    }
};

// ========== GENERIC UPLOAD FUNCTION ==========

// Generic upload function for components
export const uploadImage = async (file, category, entityId = null) => {
    try {
        validateImageFile(file);

        const filename = generateUniqueFilename(file.name);
        let storagePath;

        // Determine storage path based on category
        switch (category) {
            case 'ingredients':
                storagePath = `${STORAGE_PATHS.INGREDIENTS}/${entityId || 'general'}/${filename}`;
                break;
            case 'meals':
                storagePath = `${STORAGE_PATHS.MEALS}/${entityId || 'general'}/${filename}`;
                break;
            case 'plans':
                storagePath = `${STORAGE_PATHS.PLANS}/${entityId || 'general'}/${filename}`;
                break;
            case 'labels':
                storagePath = `${STORAGE_PATHS.LABELS}/${entityId || 'general'}/${filename}`;
                break;
            default:
                storagePath = `${STORAGE_PATHS.TEMP}/${filename}`;
        }

        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

// ========== IMAGE PROCESSING HELPERS ==========

export const imageProcessingService = {
    // Compress image before upload
    compressImage: (file, maxWidth = 1200, quality = 0.8) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                // Draw and compress
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    }));
                }, file.type, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    },

    // Create thumbnail
    createThumbnail: (file, size = 150) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = size;
                canvas.height = size;

                // Calculate crop area for square thumbnail
                const sourceSize = Math.min(img.width, img.height);
                const sourceX = (img.width - sourceSize) / 2;
                const sourceY = (img.height - sourceSize) / 2;

                ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

                canvas.toBlob((blob) => {
                    resolve(new File([blob], `thumb_${file.name}`, {
                        type: file.type,
                        lastModified: Date.now()
                    }));
                }, file.type, 0.8);
            };

            img.src = URL.createObjectURL(file);
        });
    },

    // Get image dimensions
    getImageDimensions: (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.src = URL.createObjectURL(file);
        });
    }
};

// ========== UPLOAD PROGRESS TRACKING ==========

export class UploadProgressTracker {
    constructor() {
        this.uploads = new Map();
    }

    startUpload(uploadId, filename) {
        this.uploads.set(uploadId, {
            filename,
            progress: 0,
            status: 'uploading',
            startTime: Date.now()
        });
    }

    updateProgress(uploadId, progress) {
        const upload = this.uploads.get(uploadId);
        if (upload) {
            upload.progress = progress;
            upload.status = progress === 100 ? 'completed' : 'uploading';
        }
    }

    setError(uploadId, error) {
        const upload = this.uploads.get(uploadId);
        if (upload) {
            upload.status = 'error';
            upload.error = error;
        }
    }

    getUpload(uploadId) {
        return this.uploads.get(uploadId);
    }

    getAllUploads() {
        return Array.from(this.uploads.entries()).map(([id, upload]) => ({
            id,
            ...upload
        }));
    }

    clearCompleted() {
        for (const [id, upload] of this.uploads.entries()) {
            if (upload.status === 'completed') {
                this.uploads.delete(id);
            }
        }
    }
}

// Create global upload tracker instance
export const uploadTracker = new UploadProgressTracker();
