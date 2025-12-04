import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../configs/firebase';
import { COLLECTIONS } from '../configs/database-schema';

// ========== LABELS OPERATIONS ==========

export const labelsService = {
    // Get all labels
    getAll: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTIONS.LABELS));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all labels:', error);
            throw error;
        }
    },

    // Get label by ID
    getById: async (labelId) => {
        try {
            const docRef = doc(db, COLLECTIONS.LABELS, labelId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting label ${labelId}:`, error);
            throw error;
        }
    },

    // Get labels by category
    getByCategory: async (category) => {
        try {
            const q = query(
                collection(db, COLLECTIONS.LABELS),
                where('category', '==', category),
                where('isActive', '==', true),
                orderBy('order')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting labels by category:', error);
            throw error;
        }
    },

    // Add new label
    add: async (labelData, userId) => {
        try {
            const docData = {
                ...labelData,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: userId || 'admin'
            };

            const docRef = await addDoc(collection(db, COLLECTIONS.LABELS), docData);
            return docRef.id;
        } catch (error) {
            console.error('Error adding label:', error);
            throw error;
        }
    },

    // Update label
    update: async (labelId, labelData) => {
        try {
            const docRef = doc(db, COLLECTIONS.LABELS, labelId);
            await updateDoc(docRef, {
                ...labelData,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error(`Error updating label ${labelId}:`, error);
            throw error;
        }
    },

    // Soft delete label (set isActive to false)
    delete: async (labelId) => {
        try {
            const docRef = doc(db, COLLECTIONS.LABELS, labelId);
            await updateDoc(docRef, {
                isActive: false,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error(`Error deleting label ${labelId}:`, error);
            throw error;
        }
    },

    // Hard delete label (permanently remove)
    hardDelete: async (labelId) => {
        try {
            const docRef = doc(db, COLLECTIONS.LABELS, labelId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error(`Error hard deleting label ${labelId}:`, error);
            throw error;
        }
    }
};

// ========== VALIDATION HELPERS ==========

export const labelValidation = {
    // Validate label data before saving
    validateLabel: (labelData) => {
        const errors = [];

        if (!labelData.name || labelData.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (labelData.order !== undefined && labelData.order < 0) {
            errors.push('Order cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
