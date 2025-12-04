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

export const monthOverridesService = {
    // Get all month overrides
    getAll: async () => {
        try {
            const querySnapshot = await getDocs(
                query(collection(db, COLLECTIONS.MONTH_OVERRIDES), orderBy('date'))
            );
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all month overrides:', error);
            throw error;
        }
    },

    // Get month overrides by macro plan
    getByMacroPlan: async (macroPlanId) => {
        try {
            const querySnapshot = await getDocs(
                query(
                    collection(db, COLLECTIONS.MONTH_OVERRIDES),
                    where('macroPlanId', '==', macroPlanId),
                    orderBy('date')
                )
            );
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting month overrides by macro plan:', error);
            throw error;
        }
    },

    // Get override for specific date and macro plan
    getByDateAndMacroPlan: async (date, macroPlanId) => {
        try {
            const querySnapshot = await getDocs(
                query(
                    collection(db, COLLECTIONS.MONTH_OVERRIDES),
                    where('date', '==', date),
                    where('macroPlanId', '==', macroPlanId),
                    where('isActive', '==', true)
                )
            );

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error(`Error getting override for date ${date}:`, error);
            throw error;
        }
    },

    // Get month override by ID
    getById: async (overrideId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MONTH_OVERRIDES, overrideId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting month override ${overrideId}:`, error);
            throw error;
        }
    },

    // Get overrides for date range
    getByDateRange: async (startDate, endDate, macroPlanId = null) => {
        try {
            let q = query(
                collection(db, COLLECTIONS.MONTH_OVERRIDES),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                where('isActive', '==', true)
            );

            if (macroPlanId) {
                q = query(q, where('macroPlanId', '==', macroPlanId));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error getting overrides for date range ${startDate} to ${endDate}:`, error);
            throw error;
        }
    },

    // Add new month override
    add: async (overrideData) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.MONTH_OVERRIDES), {
                ...overrideData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding month override:', error);
            throw error;
        }
    },

    // Update month override
    update: async (overrideId, updateData) => {
        try {
            const docRef = doc(db, COLLECTIONS.MONTH_OVERRIDES, overrideId);
            await updateDoc(docRef, {
                ...updateData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error updating month override ${overrideId}:`, error);
            throw error;
        }
    },

    // Delete month override
    delete: async (overrideId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MONTH_OVERRIDES, overrideId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting month override ${overrideId}:`, error);
            throw error;
        }
    },

    // Toggle override active status
    toggleActive: async (overrideId) => {
        try {
            const override = await this.getById(overrideId);
            if (!override) throw new Error('Override not found');

            const docRef = doc(db, COLLECTIONS.MONTH_OVERRIDES, overrideId);
            await updateDoc(docRef, {
                isActive: !override.isActive,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error toggling override ${overrideId}:`, error);
            throw error;
        }
    },

    // Get upcoming overrides (next 30 days)
    getUpcoming: async (macroPlanId = null) => {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const endDate = futureDate.toISOString().split('T')[0];

            return await this.getByDateRange(today, endDate, macroPlanId);
        } catch (error) {
            console.error('Error getting upcoming overrides:', error);
            throw error;
        }
    },

    // Check if date has override
    hasOverride: async (date, macroPlanId) => {
        try {
            const override = await this.getByDateAndMacroPlan(date, macroPlanId);
            return override !== null;
        } catch (error) {
            console.error(`Error checking override for date ${date}:`, error);
            return false;
        }
    }
};

export default monthOverridesService;
