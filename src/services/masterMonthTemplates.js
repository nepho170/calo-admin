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

export const masterMonthTemplatesService = {
    // Get all master month templates
    getAll: async () => {
        try {
            const querySnapshot = await getDocs(
                query(collection(db, COLLECTIONS.MASTER_MONTH_TEMPLATES), orderBy('templateName'))
            );
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all master month templates:', error);
            throw error;
        }
    },

    // Get master month templates by macro plan
    getByMacroPlan: async (macroPlanId) => {
        try {
            const querySnapshot = await getDocs(
                query(
                    collection(db, COLLECTIONS.MASTER_MONTH_TEMPLATES),
                    where('macroPlanId', '==', macroPlanId),
                    orderBy('templateName')
                )
            );
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting master month templates by macro plan:', error);
            throw error;
        }
    },

    // Get master month template by ID
    getById: async (templateId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MASTER_MONTH_TEMPLATES, templateId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting master month template ${templateId}:`, error);
            throw error;
        }
    },

    // Get default template for macro plan
    getDefaultByMacroPlan: async (macroPlanId) => {
        try {
            const querySnapshot = await getDocs(
                query(
                    collection(db, COLLECTIONS.MASTER_MONTH_TEMPLATES),
                    where('macroPlanId', '==', macroPlanId),
                    where('isDefault', '==', true)
                )
            );

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error getting default master month template:', error);
            throw error;
        }
    },

    // Add new master month template
    add: async (templateData) => {
        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.MASTER_MONTH_TEMPLATES), {
                ...templateData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding master month template:', error);
            throw error;
        }
    },

    // Update master month template
    update: async (templateId, updateData) => {
        try {
            const docRef = doc(db, COLLECTIONS.MASTER_MONTH_TEMPLATES, templateId);
            await updateDoc(docRef, {
                ...updateData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error updating master month template ${templateId}:`, error);
            throw error;
        }
    },

    // Delete master month template
    delete: async (templateId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MASTER_MONTH_TEMPLATES, templateId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting master month template ${templateId}:`, error);
            throw error;
        }
    },

    // Set as default template for macro plan (unsets others)
    setAsDefault: async (templateId, macroPlanId) => {
        try {
            // First, unset all other default templates for this macro plan
            const querySnapshot = await getDocs(
                query(
                    collection(db, COLLECTIONS.MASTER_MONTH_TEMPLATES),
                    where('macroPlanId', '==', macroPlanId),
                    where('isDefault', '==', true)
                )
            );

            // Update all existing defaults to false
            const updatePromises = querySnapshot.docs.map(doc =>
                updateDoc(doc.ref, { isDefault: false, updatedAt: serverTimestamp() })
            );
            await Promise.all(updatePromises);

            // Set the new default
            const docRef = doc(db, COLLECTIONS.MASTER_MONTH_TEMPLATES, templateId);
            await updateDoc(docRef, {
                isDefault: true,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error setting template ${templateId} as default:`, error);
            throw error;
        }
    },

    // Get meal options for a specific day from template
    getDayMealOptions: async (templateId, dayNumber) => {
        try {
            const template = await this.getById(templateId);
            if (!template || !template.masterDays) {
                return null;
            }

            const dayKey = `day${dayNumber}`;
            return template.masterDays[dayKey] || null;
        } catch (error) {
            console.error(`Error getting day ${dayNumber} from template ${templateId}:`, error);
            throw error;
        }
    },

    // Update specific day in template
    updateDay: async (templateId, dayNumber, dayData) => {
        try {
            const dayKey = `day${dayNumber}`;
            const docRef = doc(db, COLLECTIONS.MASTER_MONTH_TEMPLATES, templateId);
            await updateDoc(docRef, {
                [`masterDays.${dayKey}`]: dayData,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error(`Error updating day ${dayNumber} in template ${templateId}:`, error);
            throw error;
        }
    }
};

export default masterMonthTemplatesService;
