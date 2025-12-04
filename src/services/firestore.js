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
    limit,
    startAfter,
    Timestamp,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../configs/firebase';
import { COLLECTIONS } from '../configs/database-schema';

// ========== GENERIC FIRESTORE OPERATIONS ==========

// Get all documents from a collection
export const getAllDocuments = async (collectionName) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Error getting documents from ${collectionName}:`, error);
        throw error;
    }
};

// Get a single document
export const getDocument = async (collectionName, docId) => {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error getting document ${docId} from ${collectionName}:`, error);
        throw error;
    }
};

// Add a new document
export const addDocument = async (collectionName, data, userId = null) => {
    try {
        const docData = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...(userId && { createdBy: userId })
        };

        const docRef = await addDoc(collection(db, collectionName), docData);
        return docRef.id;
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw error;
    }
};

// Update a document
export const updateDocument = async (collectionName, docId, data) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error(`Error updating document ${docId} in ${collectionName}:`, error);
        throw error;
    }
};

// Delete a document
export const deleteDocument = async (collectionName, docId) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
        throw error;
    }
};

// ========== ACTIVITY LOGS OPERATIONS ==========

export const activityLogsService = {
    // Log admin actions
    logAction: async (userId, action, entityType, entityId, entityTitle, changes = {}) => {
        try {
            const logData = {
                userId,
                action,
                entityType,
                entityId,
                entityTitle,
                changes,
                timestamp: serverTimestamp(),
                ipAddress: 'N/A', // You can implement IP detection
                userAgent: navigator.userAgent
            };

            await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), logData);
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw error for logging failures
        }
    },

    // Get recent activity logs
    getRecentLogs: async (limitCount = 50) => {
        try {
            const q = query(
                collection(db, COLLECTIONS.ACTIVITY_LOGS),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting activity logs:', error);
            throw error;
        }
    }
};

// ========== BATCH OPERATIONS ==========

export const batchOperations = {
    // Batch update multiple documents
    batchUpdate: async (updates) => {
        try {
            const batch = writeBatch(db);

            updates.forEach(({ collection: collectionName, id, data }) => {
                const docRef = doc(db, collectionName, id);
                batch.update(docRef, {
                    ...data,
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error performing batch update:', error);
            throw error;
        }
    },

    // Batch create multiple documents
    batchCreate: async (creates) => {
        try {
            const batch = writeBatch(db);

            creates.forEach(({ collection: collectionName, data }) => {
                const docRef = doc(collection(db, collectionName));
                batch.set(docRef, {
                    ...data,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error performing batch create:', error);
            throw error;
        }
    }
};
