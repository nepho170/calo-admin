import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../configs/firebase';

const COLLECTION_NAME = 'allergies';

// ========== ALLERGIES OPERATIONS ==========

export const allergiesService = {
    // Get all allergies
    getAll: async () => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all allergies:', error);
            throw error;
        }
    },

    // Get active allergies only
    getActive: async () => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('name')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(allergy => allergy.isActive);
        } catch (error) {
            console.error('Error getting active allergies:', error);
            throw error;
        }
    },

    // Get allergy by ID
    getById: async (allergyId) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, allergyId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting allergy ${allergyId}:`, error);
            throw error;
        }
    },

    // Add new allergy
    add: async (allergyData) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...allergyData,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding allergy:', error);
            throw error;
        }
    },

    // Update allergy
    update: async (allergyId, allergyData) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, allergyId);
            await updateDoc(docRef, {
                ...allergyData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error updating allergy ${allergyId}:`, error);
            throw error;
        }
    },

    // Delete allergy
    delete: async (allergyId) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, allergyId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting allergy ${allergyId}:`, error);
            throw error;
        }
    },

    // Toggle active status
    toggleActive: async (allergyId) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, allergyId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const currentStatus = docSnap.data().isActive;
                await updateDoc(docRef, {
                    isActive: !currentStatus,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error(`Error toggling allergy ${allergyId}:`, error);
            throw error;
        }
    }
};
