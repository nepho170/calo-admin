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

// ========== MEAL PACKAGES OPERATIONS ==========

export const mealPackagesService = {
    // Get all meal packages
    getAll: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTIONS.MEAL_PACKAGES));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all meal packages:', error);
            throw error;
        }
    },

    // Get meal package by ID
    getById: async (packageId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MEAL_PACKAGES, packageId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting meal package ${packageId}:`, error);
            throw error;
        }
    },

    // Get meal packages by macro plan
    getByMacroPlan: async (macroPlanId) => {
        try {
            const q = query(
                collection(db, COLLECTIONS.MEAL_PACKAGES),
                where('macroPlanId', '==', macroPlanId),
                where('isActive', '==', true),
                orderBy('order')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting meal packages by macro plan:', error);
            throw error;
        }
    },

    // Get active meal packages
    getActive: async () => {
        try {
            const q = query(
                collection(db, COLLECTIONS.MEAL_PACKAGES),
                where('isActive', '==', true),
                orderBy('order')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting active meal packages:', error);
            throw error;
        }
    },

    // Add new meal package
    add: async (packageData, userId) => {
        try {
            const docData = {
                ...packageData,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: userId || 'admin'
            };

            const docRef = await addDoc(collection(db, COLLECTIONS.MEAL_PACKAGES), docData);
            return docRef.id;
        } catch (error) {
            console.error('Error adding meal package:', error);
            throw error;
        }
    },

    // Update meal package
    update: async (packageId, packageData) => {
        try {
            const docRef = doc(db, COLLECTIONS.MEAL_PACKAGES, packageId);
            await updateDoc(docRef, {
                ...packageData,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error(`Error updating meal package ${packageId}:`, error);
            throw error;
        }
    },

    // Soft delete meal package (set isActive to false)
    delete: async (packageId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MEAL_PACKAGES, packageId);
            await updateDoc(docRef, {
                isActive: false,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error(`Error deleting meal package ${packageId}:`, error);
            throw error;
        }
    },

    // Hard delete meal package (permanently remove)
    hardDelete: async (packageId) => {
        try {
            const docRef = doc(db, COLLECTIONS.MEAL_PACKAGES, packageId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error(`Error hard deleting meal package ${packageId}:`, error);
            throw error;
        }
    },

    // Update meal package pricing based on macro plan data
    updatePricingFromMacroPlan: async (macroPlanId, macroPlanData) => {
        try {
            // Get all meal packages for this macro plan
            const packages = await mealPackagesService.getByMacroPlan(macroPlanId);

            if (!packages || packages.length === 0) {
                console.log(`No meal packages found for macro plan ${macroPlanId}`);
                return;
            }

            console.log(`Updating pricing for ${packages.length} packages for macro plan ${macroPlanId}`);

            // Update each package with new pricing from macro plan
            const updatePromises = packages.map(async (pkg) => {
                const updatedPricing = {};

                // Calculate new pricing based on macro plan meal type pricing
                if (macroPlanData.mealTypePricing && pkg.includedMealTypes) {
                    let dailyPrice = 0;

                    // Calculate daily price based on included meal types
                    pkg.includedMealTypes.forEach(mealType => {
                        if (macroPlanData.mealTypePricing[mealType]) {
                            dailyPrice += macroPlanData.mealTypePricing[mealType];
                        }
                    });

                    // Update package pricing
                    updatedPricing.pricePerDay = dailyPrice;

                    console.log(`Package "${pkg.title}" - Included meals: [${pkg.includedMealTypes.join(', ')}], Daily price: $${dailyPrice}`);
                }

                // Update the package document
                if (Object.keys(updatedPricing).length > 0) {
                    await mealPackagesService.update(pkg.id, updatedPricing);
                    console.log(`✅ Updated pricing for package "${pkg.title}": $${updatedPricing.pricePerDay}/day`);
                }
            });

            await Promise.all(updatePromises);
            console.log(`🎉 Successfully updated pricing for ${packages.length} meal packages`);

        } catch (error) {
            console.error('❌ Error updating meal package pricing from macro plan:', error);
            throw error;
        }
    }
};

// ========== VALIDATION HELPERS ==========

export const mealPackageValidation = {
    // Validate meal package data before saving
    validateMealPackage: (packageData) => {
        const errors = [];

        if (!packageData.name || packageData.name.trim().length < 3) {
            errors.push('Name must be at least 3 characters long');
        }

        if (!packageData.description || packageData.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters long');
        }

        if (!packageData.macroPlanId || packageData.macroPlanId.trim().length < 1) {
            errors.push('Macro plan ID is required');
        }

        if (!packageData.price || packageData.price <= 0) {
            errors.push('Price must be greater than 0');
        }

        if (!packageData.duration || packageData.duration <= 0) {
            errors.push('Duration must be greater than 0');
        }



        if (packageData.order !== undefined && packageData.order < 0) {
            errors.push('Order cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
