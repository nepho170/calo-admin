import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../configs/firebase.js';
import { COLLECTIONS } from '../configs/database-schema.js';

// Get all dietary filters
export const getAllDietaryFilters = async () => {
    try {
        const q = query(
            collection(db, COLLECTIONS.DIETARY_FILTERS),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching dietary filters:', error);
        throw error;
    }
};

// Get dietary filter by ID
export const getDietaryFilterById = async (filterId) => {
    try {
        const docRef = doc(db, COLLECTIONS.DIETARY_FILTERS, filterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            throw new Error('Dietary filter not found');
        }
    } catch (error) {
        console.error('Error fetching dietary filter:', error);
        throw error;
    }
};

// Create new dietary filter
export const createDietaryFilter = async (filterData) => {
    try {
        const newFilter = {
            ...filterData,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, COLLECTIONS.DIETARY_FILTERS), newFilter);
        return docRef.id;
    } catch (error) {
        console.error('Error creating dietary filter:', error);
        throw error;
    }
};

// Update dietary filter
export const updateDietaryFilter = async (filterId, updateData) => {
    try {
        const docRef = doc(db, COLLECTIONS.DIETARY_FILTERS, filterId);
        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating dietary filter:', error);
        throw error;
    }
};

// Delete dietary filter
export const deleteDietaryFilter = async (filterId) => {
    try {
        const docRef = doc(db, COLLECTIONS.DIETARY_FILTERS, filterId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting dietary filter:', error);
        throw error;
    }
};

// Soft delete dietary filter
export const deactivateDietaryFilter = async (filterId) => {
    try {
        await updateDietaryFilter(filterId, { isActive: false });
    } catch (error) {
        console.error('Error deactivating dietary filter:', error);
        throw error;
    }
};
