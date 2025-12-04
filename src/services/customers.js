/**
 * Customers Service
 * Handles all customer operations for the admin panel
 */

import { db } from '../configs/firebase';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'users';

// ========== CUSTOMERS OPERATIONS ==========

export const customersService = {
    /**
     * Get all customers
     * @returns {Promise<Array>} Array of customers with their details
     */
    getAll: async () => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);

            const customers = [];
            querySnapshot.forEach((doc) => {
                customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return customers;
        } catch (error) {
            console.error('Error fetching all customers:', error);
            throw error;
        }
    },

    /**
     * Get customer by ID
     * @param {string} customerId - Customer ID
     * @returns {Promise<Object|null>} Customer data or null if not found
     */
    getById: async (customerId) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, customerId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching customer by ID:', error);
            throw error;
        }
    },

    /**
     * Get customers with completed profiles
     * @returns {Promise<Array>} Array of customers with completed profiles
     */
    getWithCompletedProfiles: async () => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('profileCompleted', '==', true),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);

            const customers = [];
            querySnapshot.forEach((doc) => {
                customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return customers;
        } catch (error) {
            console.error('Error fetching customers with completed profiles:', error);
            throw error;
        }
    },

    /**
     * Get customers by activity level
     * @param {string} activityLevel - Activity level to filter by
     * @returns {Promise<Array>} Array of customers with specified activity level
     */
    getByActivityLevel: async (activityLevel) => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('activityLevel', '==', activityLevel),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);

            const customers = [];
            querySnapshot.forEach((doc) => {
                customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return customers;
        } catch (error) {
            console.error('Error fetching customers by activity level:', error);
            throw error;
        }
    },

    /**
     * Get customers by main goal
     * @param {string} mainGoal - Main goal to filter by
     * @returns {Promise<Array>} Array of customers with specified main goal
     */
    getByMainGoal: async (mainGoal) => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('mainGoal', '==', mainGoal),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);

            const customers = [];
            querySnapshot.forEach((doc) => {
                customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return customers;
        } catch (error) {
            console.error('Error fetching customers by main goal:', error);
            throw error;
        }
    },

    /**
     * Search customers by name or email
     * @param {string} searchTerm - Search term to look for in name or email
     * @returns {Promise<Array>} Array of matching customers
     */
    search: async (searchTerm) => {
        try {
            // Get all customers and filter locally (Firestore doesn't support OR queries easily)
            const allCustomers = await customersService.getAll();

            const filteredCustomers = allCustomers.filter(customer =>
                customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return filteredCustomers;
        } catch (error) {
            console.error('Error searching customers:', error);
            throw error;
        }
    },

    /**
     * Update customer profile
     * @param {string} customerId - Customer ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<void>}
     */
    updateProfile: async (customerId, updateData) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, customerId);
            const dataToUpdate = {
                ...updateData,
                updatedAt: Timestamp.now()
            };

            await updateDoc(docRef, dataToUpdate);
            console.log('Customer profile updated successfully');
        } catch (error) {
            console.error('Error updating customer profile:', error);
            throw error;
        }
    },

    /**
     * Delete customer (soft delete by setting isActive to false)
     * @param {string} customerId - Customer ID
     * @returns {Promise<void>}
     */
    deactivate: async (customerId) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, customerId);
            await updateDoc(docRef, {
                isActive: false,
                updatedAt: Timestamp.now()
            });
            console.log('Customer deactivated successfully');
        } catch (error) {
            console.error('Error deactivating customer:', error);
            throw error;
        }
    },

    /**
     * Get customer statistics
     * @returns {Promise<Object>} Customer statistics
     */
    getStatistics: async () => {
        try {
            const allCustomers = await customersService.getAll();

            const stats = {
                total: allCustomers.length,
                profileCompleted: allCustomers.filter(c => c.profileCompleted).length,
                byGender: {
                    male: allCustomers.filter(c => c.gender === 'male').length,
                    female: allCustomers.filter(c => c.gender === 'female').length
                },
                byMainGoal: {
                    gain_weight: allCustomers.filter(c => c.mainGoal === 'gain_weight').length,
                    lose_weight: allCustomers.filter(c => c.mainGoal === 'lose_weight').length,
                    maintain_weight: allCustomers.filter(c => c.mainGoal === 'maintain_weight').length,
                    build_muscle: allCustomers.filter(c => c.mainGoal === 'build_muscle').length
                },
                byActivityLevel: {
                    sedentary: allCustomers.filter(c => c.activityLevel === 'sedentary').length,
                    lightly_active: allCustomers.filter(c => c.activityLevel === 'lightly_active').length,
                    moderately_active: allCustomers.filter(c => c.activityLevel === 'moderately_active').length,
                    very_active: allCustomers.filter(c => c.activityLevel === 'very_active').length,
                    extremely_active: allCustomers.filter(c => c.activityLevel === 'extremely_active').length
                }
            };

            return stats;
        } catch (error) {
            console.error('Error getting customer statistics:', error);
            throw error;
        }
    }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Calculate BMI for a customer
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {number} BMI value
 */
export const calculateBMI = (weight, height) => {
    if (!weight || !height) return 0;
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

/**
 * Get BMI category
 * @param {number} bmi - BMI value
 * @returns {Object} BMI category with label and color
 */
export const getBMICategory = (bmi) => {
    if (bmi < 18.5) {
        return { label: 'Underweight', color: 'info' };
    } else if (bmi < 25) {
        return { label: 'Normal', color: 'success' };
    } else if (bmi < 30) {
        return { label: 'Overweight', color: 'warning' };
    } else {
        return { label: 'Obese', color: 'error' };
    }
};

/**
 * Format activity level for display
 * @param {string} activityLevel - Activity level code
 * @returns {string} Formatted activity level
 */
export const formatActivityLevel = (activityLevel) => {
    const levels = {
        sedentary: 'Sedentary',
        lightly_active: 'Lightly Active',
        moderately_active: 'Moderately Active',
        very_active: 'Very Active',
        extremely_active: 'Extremely Active'
    };
    return levels[activityLevel] || activityLevel;
};

/**
 * Format main goal for display
 * @param {string} mainGoal - Main goal code
 * @returns {string} Formatted main goal
 */
export const formatMainGoal = (mainGoal) => {
    const goals = {
        gain_weight: 'Gain Weight',
        lose_weight: 'Lose Weight',
        maintain_weight: 'Maintain Weight',
        build_muscle: 'Build Muscle'
    };
    return goals[mainGoal] || mainGoal;
};

export default customersService;
