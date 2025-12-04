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

// ========== MACRO PLANS OPERATIONS ==========

export const macroPlansService = {
    // Get all macro plans
    getAll: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTIONS.MACRO_PLANS));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all macro plans:', error);
            throw error;
        }
    },

    // Get macro plan by ID
    getById: async (planId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MACRO_PLANS, planId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting macro plan ${planId}:`, error);
            throw error;
        }
    },

    // Get active macro plans
    getActive: async () => {
        try {
            const q = query(
                collection(db, COLLECTIONS.MACRO_PLANS),
                where('isActive', '==', true),
                orderBy('order')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting active macro plans:', error);
            throw error;
        }
    },

    // Add new macro plan
    add: async (planData, userId) => {
        try {
            const docData = {
                ...planData,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: userId || 'admin'
            };

            const docRef = await addDoc(collection(db, COLLECTIONS.MACRO_PLANS), docData);
            return docRef.id;
        } catch (error) {
            console.error('Error adding macro plan:', error);
            throw error;
        }
    },

    // Update macro plan
    update: async (planId, planData) => {
        try {
            const docRef = doc(db, COLLECTIONS.MACRO_PLANS, planId);
            await updateDoc(docRef, {
                ...planData,
                updatedAt: serverTimestamp()
            });

            // Update meal package pricing if mealTypePricing is included in the update
            if (planData.mealTypePricing) {
                try {
                    // Dynamic import to avoid circular dependency
                    const { mealPackagesService } = await import('./mealPackages');
                    await mealPackagesService.updatePricingFromMacroPlan(planId, planData);
                } catch (pricingError) {
                    console.error('Error updating meal package pricing:', pricingError);
                    // Don't throw here to avoid breaking the macro plan update
                }
            }

            return true;
        } catch (error) {
            console.error(`Error updating macro plan ${planId}:`, error);
            throw error;
        }
    },

    // Soft delete macro plan (set isActive to false)
    delete: async (planId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MACRO_PLANS, planId);
            await updateDoc(docRef, {
                isActive: false,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error(`Error deleting macro plan ${planId}:`, error);
            throw error;
        }
    },

    // Hard delete macro plan (permanently remove)
    hardDelete: async (planId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MACRO_PLANS, planId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error(`Error hard deleting macro plan ${planId}:`, error);
            throw error;
        }
    }
};

// ========== VALIDATION HELPERS ==========

export const macroPlanValidation = {
    // Validate macro plan data before saving
    validateMacroPlan: (planData) => {
        const errors = [];

        if (!planData.name || planData.name.trim().length < 3) {
            errors.push('Name must be at least 3 characters long');
        }

        if (!planData.description || planData.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters long');
        }

        if (!planData.targetCalories || planData.targetCalories <= 0) {
            errors.push('Target calories must be greater than 0');
        }

        if (!planData.macroPercentages) {
            errors.push('Macro percentages are required');
        } else {
            const { protein, carbs, fat } = planData.macroPercentages;
            const total = protein + carbs + fat;

            if (Math.abs(total - 100) > 0.1) {
                errors.push('Macro percentages must add up to 100%');
            }

            if (protein < 0 || carbs < 0 || fat < 0) {
                errors.push('Macro percentages cannot be negative');
            }
        }

        if (planData.order !== undefined && planData.order < 0) {
            errors.push('Order cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
