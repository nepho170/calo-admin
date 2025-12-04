import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    Timestamp,
    orderBy,
    runTransaction
} from 'firebase/firestore';
import { db } from '../configs/firebase';
import { getUAEDate, toUAEDate } from '../utils/dateUtils';

/**
 * User Meal Selections Service
 * Handles user meal selections for order preparation
 */

/**
 * Get user meal selection by orderId
 * @param {string} orderId - Order ID
 * @returns {Promise<Object|null>} User meal selection document
 */
export const getUserMealSelectionByOrderId = async (orderId) => {
    try {
        const q = query(
            collection(db, 'userMealSelections'),
            where('orderId', '==', orderId)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error fetching user meal selection:', error);
        throw error;
    }
};

/**
 * Update meal selections for a specific date
 * @param {string} userMealSelectionId - User meal selection document ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Object} meals - Meals object with meal types as keys
 * @returns {Promise<void>}
 */
export const updateMealSelectionsForDate = async (userMealSelectionId, date, meals) => {
    try {
        const docRef = doc(db, 'userMealSelections', userMealSelectionId);
        const updatePath = `dailySelections.${date}.meals`;

        await updateDoc(docRef, {
            [updatePath]: meals,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating meal selections:', error);
        throw error;
    }
};

/**
 * Update meal selections for today's date
 * @param {string} userMealSelectionId - User meal selection document ID
 * @param {Object} meals - Meals object with meal types as keys
 * @returns {Promise<void>}
 */
export const updateMealSelectionsForToday = async (userMealSelectionId, meals) => {
    try {
        // Use UAE timezone for consistency with expiration checks
        const todayUAE = getUAEDate();
        const year = todayUAE.getFullYear();
        const month = String(todayUAE.getMonth() + 1).padStart(2, '0');
        const day = String(todayUAE.getDate()).padStart(2, '0');
        const todayDate = `${year}-${month}-${day}`;

        const docRef = doc(db, 'userMealSelections', userMealSelectionId);
        const updatePath = `dailySelections.${todayDate}.meals`;

        // Use UAE timezone for consistent timestamps
        const uaeTimestamp = Timestamp.fromDate(todayUAE);

        await updateDoc(docRef, {
            [updatePath]: meals,
            updatedAt: uaeTimestamp
        });

        console.log('✅ Updated meal selections for today (UAE):', todayDate);
    } catch (error) {
        console.error('❌ Error updating meal selections for today:', error);
        throw error;
    }
};

/**
 * Get multiple user meal selections by order IDs
 * @param {Array<string>} orderIds - Array of order IDs
 * @returns {Promise<Object>} Map of orderId to user meal selection
 */
export const getUserMealSelectionsByOrderIds = async (orderIds) => {
    try {
        console.log('🔍 Fetching meal selections for order IDs:', orderIds);

        if (orderIds.length === 0) {
            console.log('ℹ️ No order IDs provided');
            return {};
        }

        // Firestore 'in' queries are limited to 10 items, so we need to batch them
        const batchSize = 10;
        const batches = [];

        for (let i = 0; i < orderIds.length; i += batchSize) {
            const batch = orderIds.slice(i, i + batchSize);
            console.log(`📦 Creating batch ${Math.floor(i / batchSize) + 1} with order IDs:`, batch);
            const q = query(
                collection(db, 'userMealSelections'),
                where('orderId', 'in', batch)
            );
            batches.push(getDocs(q));
        }

        console.log(`🚀 Executing ${batches.length} batch queries...`);
        const results = await Promise.all(batches);
        const userMealSelections = {};

        results.forEach((querySnapshot, batchIndex) => {
            console.log(`📊 Batch ${batchIndex + 1} returned ${querySnapshot.docs.length} documents`);
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                console.log('🍽️ Found meal selection:', {
                    id: doc.id,
                    orderId: data.orderId,
                    userId: data.userId,
                    dailySelectionsKeys: Object.keys(data.dailySelections || {})
                });
                userMealSelections[data.orderId] = {
                    id: doc.id,
                    ...data
                };
            });
        });

        console.log('✅ Total meal selections found:', Object.keys(userMealSelections).length);
        return userMealSelections;
    } catch (error) {
        console.error('❌ Error fetching user meal selections by order IDs:', error);
        throw error;
    }
};

/**
 * Get all expired user meal selections
 * @param {Date} currentDate - Current date to compare against (defaults to UAE current time)
 * @returns {Promise<Array>} Array of expired meal selection documents
 */
export const getExpiredUserMealSelections = async (currentDate = null) => {
    try {
        console.log('🔍 Checking for expired user meal selections...');

        // Use UAE timezone for current date if not provided
        const uaeCurrentDate = currentDate ? toUAEDate(currentDate) : getUAEDate();
        console.log(`📅 Using UAE current date: ${uaeCurrentDate.toISOString()}`);

        // Convert UAE date to Firestore Timestamp for comparison
        const currentTimestamp = Timestamp.fromDate(uaeCurrentDate);

        // Query for meal selections where subscription end date is before current date
        const q = query(
            collection(db, 'userMealSelections'),
            where('subscriptionEndDate', '<', currentTimestamp),
            where('isActive', '==', true),
            orderBy('subscriptionEndDate', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const expiredSelections = [];

        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const subscriptionEndDate = data.subscriptionEndDate?.toDate();
            const daysExpired = Math.floor((uaeCurrentDate - subscriptionEndDate) / (1000 * 60 * 60 * 24));

            expiredSelections.push({
                id: doc.id,
                ...data,
                daysExpired,
                subscriptionEndDate: subscriptionEndDate
            });
        });

        console.log(`📊 Found ${expiredSelections.length} expired meal selections`);
        return expiredSelections;
    } catch (error) {
        console.error('❌ Error fetching expired user meal selections:', error);
        throw error;
    }
};

/**
 * Get user meal selections expiring soon (within specified days)
 * @param {number} daysAhead - Number of days to look ahead for expiring subscriptions
 * @param {Date} currentDate - Current date to compare against (defaults to UAE current time)
 * @returns {Promise<Array>} Array of soon-to-expire meal selection documents
 */
export const getExpiringSoonUserMealSelections = async (daysAhead = 7, currentDate = null) => {
    try {
        console.log(`🔍 Checking for meal selections expiring within ${daysAhead} days...`);

        // Use UAE timezone for current date if not provided
        const uaeCurrentDate = currentDate ? toUAEDate(currentDate) : getUAEDate();
        console.log(`📅 Using UAE current date: ${uaeCurrentDate.toISOString()}`);

        const currentTimestamp = Timestamp.fromDate(uaeCurrentDate);
        const futureDate = new Date(uaeCurrentDate);
        futureDate.setDate(futureDate.getDate() + daysAhead);
        const futureTimestamp = Timestamp.fromDate(futureDate);

        // Query for meal selections expiring between now and future date
        const q = query(
            collection(db, 'userMealSelections'),
            where('subscriptionEndDate', '>=', currentTimestamp),
            where('subscriptionEndDate', '<=', futureTimestamp),
            where('isActive', '==', true),
            orderBy('subscriptionEndDate', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const expiringSoon = [];

        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const subscriptionEndDate = data.subscriptionEndDate?.toDate();
            const daysUntilExpiry = Math.ceil((subscriptionEndDate - uaeCurrentDate) / (1000 * 60 * 60 * 24));

            expiringSoon.push({
                id: doc.id,
                ...data,
                daysUntilExpiry,
                subscriptionEndDate: subscriptionEndDate
            });
        });

        console.log(`📊 Found ${expiringSoon.length} meal selections expiring soon`);
        return expiringSoon;
    } catch (error) {
        console.error('❌ Error fetching expiring soon user meal selections:', error);
        throw error;
    }
};

/**
 * Mark expired meal selections as inactive and update corresponding orders
 * @param {Array<string>} mealSelectionIds - Array of meal selection document IDs to deactivate
 * @returns {Promise<number>} Number of successfully deactivated selections
 */
export const deactivateExpiredMealSelections = async (mealSelectionIds) => {
    try {
        console.log(`🔄 Deactivating ${mealSelectionIds.length} expired meal selections...`);

        // Use UAE timezone for consistent timestamps
        const uaeNow = getUAEDate();
        const uaeTimestamp = Timestamp.fromDate(uaeNow);
        console.log(`📅 Using UAE timestamp: ${uaeNow.toISOString()}`);

        const updatePromises = mealSelectionIds.map(async (id) => {
            try {
                // Use transaction to ensure atomic updates
                return await runTransaction(db, async (transaction) => {
                    // First, get the meal selection to find the corresponding order
                    const mealSelectionRef = doc(db, 'userMealSelections', id);
                    const mealSelectionDoc = await transaction.get(mealSelectionRef);

                    if (!mealSelectionDoc.exists()) {
                        console.warn(`❌ Meal selection ${id} not found`);
                        return false;
                    }

                    const mealSelectionData = mealSelectionDoc.data();
                    const orderId = mealSelectionData.orderId;

                    // Update the meal selection with UAE timestamp
                    transaction.update(mealSelectionRef, {
                        isActive: false,
                        deactivatedAt: uaeTimestamp,
                        deactivatedReason: 'Subscription expired',
                        updatedAt: uaeTimestamp
                    });

                    // Update the corresponding order if orderId exists
                    if (orderId) {
                        const orderRef = doc(db, 'orders', orderId);
                        transaction.update(orderRef, {
                            isActive: false,
                            deactivatedAt: uaeTimestamp,
                            reasonOfInactivation: 'expired',
                            updatedAt: uaeTimestamp
                        });
                        console.log(`✅ Transaction completed for order ${orderId} and meal selection ${id}`);
                    }

                    return true;
                });
            } catch (error) {
                console.error(`❌ Failed to deactivate meal selection ${id}:`, error);
                return false;
            }
        });

        const results = await Promise.all(updatePromises);
        const successCount = results.filter(Boolean).length;

        console.log(`✅ Successfully deactivated ${successCount}/${mealSelectionIds.length} meal selections and their orders`);
        return successCount;
    } catch (error) {
        console.error('❌ Error deactivating expired meal selections:', error);
        throw error;
    }
};

/**
 * Get startup health check for orders and meal selections
 * @returns {Promise<Object>} Comprehensive health check report
 */
export const getStartupHealthCheck = async () => {
    try {
        console.log('🏥 Running startup health check...');

        // Use UAE timezone for consistent date operations
        const uaeCurrentDate = getUAEDate();
        console.log(`📅 Health check using UAE date: ${uaeCurrentDate.toISOString()}`);

        // Run all checks in parallel
        const [
            expiredSelections,
            expiringSoon,
            allActiveSelections
        ] = await Promise.all([
            getExpiredUserMealSelections(uaeCurrentDate),
            getExpiringSoonUserMealSelections(7, uaeCurrentDate),
            // Get count of all active selections
            getDocs(query(
                collection(db, 'userMealSelections'),
                where('isActive', '==', true)
            ))
        ]);

        const healthCheck = {
            timestamp: uaeCurrentDate.toISOString(),
            expired: {
                count: expiredSelections.length,
                selections: expiredSelections
            },
            expiringSoon: {
                count: expiringSoon.length,
                selections: expiringSoon
            },
            total: {
                activeSelections: allActiveSelections.size
            },
            recommendations: []
        };

        // Add recommendations based on findings
        if (expiredSelections.length > 0) {
            healthCheck.recommendations.push({
                type: 'warning',
                message: `${expiredSelections.length} meal selections have expired and should be deactivated`,
                action: 'deactivate_expired'
            });
        }

        if (expiringSoon.length > 0) {
            healthCheck.recommendations.push({
                type: 'info',
                message: `${expiringSoon.length} orders will expire within the next 7 days`,
                action: 'review_expiring'
            });
        }

        console.log('✅ Startup health check completed');
        return healthCheck;
    } catch (error) {
        console.error('❌ Error running startup health check:', error);
        throw error;
    }
};

/**
 * Validate meal selection data before processing
 * @param {Object} mealSelection - Meal selection document data
 * @returns {Object} Validation result with isValid flag and normalized dates
 */
const validateMealSelectionData = (mealSelection) => {
    const result = {
        isValid: false,
        startDate: null,
        endDate: null,
        errors: []
    };

    // Check for required fields
    if (!mealSelection.orderId) {
        result.errors.push('Missing orderId');
    }

    // Handle subscription date fields (support both old and new field names)
    let startDate = mealSelection.subscriptionStartDate || mealSelection.weekStartDate;
    let endDate = mealSelection.subscriptionEndDate || mealSelection.weekEndDate;

    // Normalize date formats
    if (startDate?.toDate) {
        startDate = startDate.toDate();
    } else if (startDate && typeof startDate === 'string') {
        startDate = new Date(startDate);
    }

    if (endDate?.toDate) {
        endDate = endDate.toDate();
    } else if (endDate && typeof endDate === 'string') {
        endDate = new Date(endDate);
    }

    // Validate dates
    if (!startDate || isNaN(startDate.getTime())) {
        result.errors.push('Invalid or missing subscription start date');
    } else {
        result.startDate = startDate;
    }

    if (!endDate || isNaN(endDate.getTime())) {
        result.errors.push('Invalid or missing subscription end date');
    } else {
        result.endDate = endDate;
    }

    // Check date logic
    if (result.startDate && result.endDate && result.startDate >= result.endDate) {
        result.errors.push('Start date must be before end date');
    }

    result.isValid = result.errors.length === 0;
    return result;
};
