import {
    collection,
    query,
    orderBy,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
    documentId
} from 'firebase/firestore';
import { db } from '../configs/firebase';

import {
    getTodayLocalDate,
    getTomorrowLocalDate,
    getTodayDayName as getTodayDayNameUtil,
    getTomorrowDayName as getTomorrowDayNameUtil
} from '../utils/dateUtils';

/**
 * Customer Orders Service
 * Handles all customer order operations for the admin panel
 */

/**
 * Get all customer orders
 * @returns {Promise<Array>} Array of customer orders
 */
export const getAllCustomerOrders = async () => {
    try {
        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        throw error;
    }
};

/**
 * Get customer orders by status
 * @param {string} status - Order status (pending, confirmed, preparing, delivered, cancelled)
 * @returns {Promise<Array>} Array of customer orders with specified status
 */
export const getCustomerOrdersByStatus = async (status) => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching customer orders by status:', error);
        throw error;
    }
};

/**
 * Get customer orders by customer ID
 * @param {string} customerId - Customer ID
 * @returns {Promise<Array>} Array of customer orders for the customer
 */
export const getCustomerOrdersByCustomerId = async (customerId) => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('customerId', '==', customerId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching customer orders by customer ID:', error);
        throw error;
    }
};

/**
 * Update customer order status
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status (pending, confirmed, preparing, delivered, cancelled)
 * @returns {Promise<void>}
 */
export const updateCustomerOrderStatus = async (orderId, newStatus) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: newStatus,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating customer order status:', error);
        throw error;
    }
};

/**
 * Delete customer order
 * @param {string} orderId - Order ID
 * @returns {Promise<void>}
 */
export const deleteCustomerOrder = async (orderId) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await deleteDoc(orderRef);
    } catch (error) {
        console.error('Error deleting customer order:', error);
        throw error;
    }
};

/**
 * Get customer order details by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Customer order object
 */
export const getCustomerOrderById = async (orderId) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
            throw new Error('Order not found');
        }

        return {
            id: orderDoc.id,
            ...orderDoc.data()
        };
    } catch (error) {
        console.error('Error fetching customer order:', error);
        throw error;
    }
};

/**
 * Calculate order statistics for dashboard
 * @returns {Promise<Object>} Order statistics
 */
export const getOrderStatistics = async () => {
    try {
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const orders = ordersSnapshot.docs.map(doc => doc.data());

        const stats = {
            total: orders.length,
            pending: orders.filter(order => order.status === 'pending').length,
            confirmed: orders.filter(order => order.status === 'confirmed').length,
            preparing: orders.filter(order => order.status === 'preparing').length,
            delivered: orders.filter(order => order.status === 'delivered').length,
            cancelled: orders.filter(order => order.status === 'cancelled').length,
            totalRevenue: orders
                .filter(order => order.status !== 'cancelled')
                .reduce((sum, order) => sum + (order.totalPrice || 0), 0)
        };

        return stats;
    } catch (error) {
        console.error('Error calculating order statistics:', error);
        throw error;
    }
};

/**
 * Get tomorrow's date in YYYY-MM-DD format
 * @returns {string} Tomorrow's date
 */
const getTomorrowDate = () => {
    return getTomorrowLocalDate();
};

/**
 * Get tomorrow's day name (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
 * @returns {string} Tomorrow's day name
 */
const getTomorrowDayName = () => {
    return getTomorrowDayNameUtil();
};

/**
 * Determine order status for meal preparation
 * @param {Object} order - Order object
 * @param {Object} dailySelection - Daily selection for tomorrow
 * @returns {Object} Status information
 */
const determineOrderStatus = (order, dailySelection) => {
    const tomorrowDate = getTomorrowDate();

    if (!dailySelection) {
        return {
            status: 'chef_selection_needed',
            reason: 'user_never_viewed',
            message: 'User never viewed this day - chef selection required'
        };
    }

    // Check if user has marked this day as skipped
    if (dailySelection.isSkipped === true) {
        return {
            status: 'user_skipped',
            reason: 'user_marked_skipped',
            message: 'User has skipped this day - admin action needed',
            requiresAdminAction: true,
            priority: 'high'
        };
    }

    const hasMeals = dailySelection.meals && Object.values(dailySelection.meals).some(meals =>
        meals && Array.isArray(meals) && meals.length > 0
    );

    if (hasMeals) {
        return {
            status: 'user_selected',
            reason: 'has_meals',
            message: 'User selected meals - use as provided'
        };
    }

    if (dailySelection.chefSelectionNote) {
        return {
            status: 'chef_selection_needed',
            reason: 'day_was_locked',
            message: 'User viewed locked day - chef selection required',
            note: dailySelection.chefSelectionNote
        };
    }

    return {
        status: 'chef_selection_needed',
        reason: 'unknown',
        message: 'Chef selection required'
    };
};

/**
 * Get orders that need meal preparation for tomorrow's delivery
 * @returns {Promise<Array>} Array of orders with preparation status
 */
export const getTomorrowOrdersForPreparation = async () => {
    try {
        const tomorrowDate = getTomorrowDate();
        const tomorrowDayName = getTomorrowDayName();
        const tomorrowDateObj = new Date(tomorrowDate); // Create Date object from local date


        // Step 1: Get all user meal selections (this contains the subscription periods)
        const userMealSelectionsQuery = query(
            collection(db, 'userMealSelections'),
            where('isActive', '==', true)
        );
        const userMealSelectionsSnapshot = await getDocs(userMealSelectionsQuery);
        const allUserMealSelections = userMealSelectionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('📦 Found', allUserMealSelections.length, 'active user meal selections');



        // Step 2: Filter meal selections for those active tomorrow
        const activeTomorrow = allUserMealSelections.filter(mealSelection => {
            // Check if tomorrow falls within subscription period (from userMealSelections)
            // Support both old field names (weekStartDate/weekEndDate) and new field names (subscriptionStartDate/subscriptionEndDate)
            let weekStartDate = mealSelection.weekStartDate || mealSelection.subscriptionStartDate;
            let weekEndDate = mealSelection.weekEndDate || mealSelection.subscriptionEndDate;

            // Handle different date formats
            if (weekStartDate?.toDate) {
                weekStartDate = weekStartDate.toDate();
            } else if (weekStartDate) {
                weekStartDate = new Date(weekStartDate);
            }

            if (weekEndDate?.toDate) {
                weekEndDate = weekEndDate.toDate();
            } else if (weekEndDate) {
                weekEndDate = new Date(weekEndDate);
            }


            if (!weekStartDate || !weekEndDate) {
                console.log('❌ Missing subscription dates for meal selection:', {
                    id: mealSelection.id,
                    weekStartDate: mealSelection.weekStartDate,
                    weekEndDate: mealSelection.weekEndDate,
                    subscriptionStartDate: mealSelection.subscriptionStartDate,
                    subscriptionEndDate: mealSelection.subscriptionEndDate
                });
                return false;
            }

            const withinDateRange = tomorrowDateObj >= weekStartDate && tomorrowDateObj <= weekEndDate;
            // console.log('📅 Date range check:', {
            //     mealSelectionId: mealSelection.id,
            //     withinDateRange
            // });

            return withinDateRange;
        });


        if (activeTomorrow.length === 0) {
            // console.log('ℹ️ No active meal selections for tomorrow');
            return [];
        }

        // Step 3: Get the corresponding orders
        const orderIds = activeTomorrow.map(ms => ms.orderId).filter(Boolean);


        if (orderIds.length === 0) {
            // console.log('ℹ️ No order IDs found in meal selections');
            return [];
        }

        // Batch fetch orders (handle Firestore 10-item limit)
        const batchSize = 10;
        const orderBatches = [];

        for (let i = 0; i < orderIds.length; i += batchSize) {
            const batch = orderIds.slice(i, i + batchSize);


            // Use documentId() instead of __name__ for querying by document ID
            const ordersQuery = query(
                collection(db, 'orders'),
                where(documentId(), 'in', batch)
            );
            orderBatches.push(getDocs(ordersQuery));
        }

        const orderResults = await Promise.all(orderBatches);
        const allOrders = [];

        orderResults.forEach(querySnapshot => {
            querySnapshot.docs.forEach(doc => {
                allOrders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        });

        console.log('📦 Found', allOrders.length, 'orders');

        // Log inactive orders for debugging
        const inactiveOrders = allOrders.filter(order => order.isActive === false);
        if (inactiveOrders.length > 0) {
            console.log('⚠️ Found', inactiveOrders.length, 'inactive orders (will be excluded)');
        }

        // Step 4: Filter orders by selected delivery days and ensure orders are active
        const tomorrowOrders = allOrders.filter(order => {
            const selectedDays = order.selectedDays || [];
            const dayMatch = selectedDays.includes(tomorrowDayName);
            const isOrderActive = order.isActive !== false;

            return dayMatch && isOrderActive;
        });

        console.log('✅ Orders with tomorrow delivery:', tomorrowOrders.length);

        if (tomorrowOrders.length === 0) {
            console.log('ℹ️ No orders scheduled for tomorrow delivery');
            return [];
        }

        // Step 5: Combine orders with their meal selections and determine status
        const preparationOrders = await Promise.all(tomorrowOrders.map(async (order) => {
            const mealSelection = activeTomorrow.find(ms => ms.orderId === order.id);
            const dailySelection = mealSelection?.dailySelections?.[tomorrowDate];
            const orderStatus = determineOrderStatus(order, dailySelection);

            // console.log('📊 Order preparation status:', {
            //     orderId: order.id,
            //     hasMealSelection: !!mealSelection,
            //     hasDailySelection: !!dailySelection,
            //     status: orderStatus.status,
            //     reason: orderStatus.reason,
            //     selectedPackage: order.selectedPackage
            // });

            // Get macroPlanId from the selected package
            let macroPlanId = order.selectedPackage?.macroPlanId;

            // If macroPlanId is not directly in selectedPackage, fetch the package details
            if (!macroPlanId && order.selectedPackage?.id) {
                try {
                    console.log('🔍 Fetching package details for:', order.selectedPackage.id);
                    const packageDoc = await getDoc(doc(db, 'mealPackages', order.selectedPackage.id));
                    if (packageDoc.exists()) {
                        const packageData = packageDoc.data();
                        macroPlanId = packageData.macroPlanId;
                        console.log('✅ Found macroPlanId from package:', macroPlanId);
                    }
                } catch (error) {
                    console.error('❌ Error fetching package details:', error);
                }
            }

            return {
                ...order,
                tomorrowDate,
                tomorrowDayName,
                macroPlanId, // Add the macroPlanId to the order
                dailySelection,
                userMealSelectionId: mealSelection?.id,
                preparationStatus: orderStatus,
                packageRequirements: {
                    includedMealTypes: order.selectedPackage?.includedMealTypes || [],
                    mealQuantities: order.selectedPackage?.mealQuantities || mealSelection?.mealQuantities || {}
                }
            };
        }));

        console.log('🎯 Final preparation orders:', preparationOrders.length);
        return preparationOrders;
    } catch (error) {
        console.error('❌ Error fetching tomorrow\'s orders for preparation:', error);
        throw error;
    }
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
const getTodayDate = () => {
    return getTodayLocalDate();
};

/**
 * Get today's day name (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
 * @returns {string} Today's day name
 */
const getTodayDayName = () => {
    return getTodayDayNameUtil();
};

/**
 * Get orders that need meal preparation for today's delivery
 * @returns {Promise<Array>} Array of orders with preparation status
 */
export const getTodayOrdersForPreparation = async () => {
    try {
        const todayDate = getTodayDate();
        const todayDayName = getTodayDayName();
        const todayDateObj = new Date(todayDate); // Create Date object from local date

        console.log('🔍 DEBUG: Today details:', {
            todayDate,
            todayDayName,
            todayDateObj: todayDateObj.toISOString()
        });

        // Step 1: Get all active user meal selections (this contains the subscription periods)
        console.log('📦 Fetching all active user meal selections for today...');
        const userMealSelectionsQuery = query(
            collection(db, 'userMealSelections'),
            where('isActive', '==', true)
        );
        const userMealSelectionsSnapshot = await getDocs(userMealSelectionsQuery);
        const allUserMealSelections = userMealSelectionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('📦 Found', allUserMealSelections.length, 'active user meal selections');

        // Step 2: Filter meal selections for those active today
        const activeToday = allUserMealSelections.filter(mealSelection => {
            // Check if today falls within subscription period (from userMealSelections)
            // Support both old field names (weekStartDate/weekEndDate) and new field names (subscriptionStartDate/subscriptionEndDate)
            let weekStartDate = mealSelection.weekStartDate || mealSelection.subscriptionStartDate;
            let weekEndDate = mealSelection.weekEndDate || mealSelection.subscriptionEndDate;

            // Handle different date formats
            if (weekStartDate?.toDate) {
                weekStartDate = weekStartDate.toDate();
            } else if (weekStartDate) {
                weekStartDate = new Date(weekStartDate);
            }

            if (weekEndDate?.toDate) {
                weekEndDate = weekEndDate.toDate();
            } else if (weekEndDate) {
                weekEndDate = new Date(weekEndDate);
            }

            // console.log('📅 Meal selection dates (today):', {
            //     mealSelectionId: mealSelection.id,
            //     orderId: mealSelection.orderId,
            //     weekStartDate: weekStartDate?.toISOString(),
            //     weekEndDate: weekEndDate?.toISOString(),
            //     todayDate: todayDate,
            //     todayDateObj: todayDateObj.toISOString()
            // });

            if (!weekStartDate || !weekEndDate) {
                console.log('❌ Missing subscription dates for meal selection:', {
                    id: mealSelection.id,
                    weekStartDate: mealSelection.weekStartDate,
                    weekEndDate: mealSelection.weekEndDate,
                    subscriptionStartDate: mealSelection.subscriptionStartDate,
                    subscriptionEndDate: mealSelection.subscriptionEndDate
                });
                return false;
            }

            const withinDateRange = todayDateObj >= weekStartDate && todayDateObj <= weekEndDate;
            // console.log('📅 Date range check (today):', {
            //     mealSelectionId: mealSelection.id,
            //     withinDateRange,
            //     todayDateObjISO: todayDateObj.toISOString(),
            //     weekStartDateISO: weekStartDate.toISOString(),
            //     weekEndDateISO: weekEndDate.toISOString(),
            //     comparison: `${todayDateObj.toISOString()} >= ${weekStartDate.toISOString()} && ${todayDateObj.toISOString()} <= ${weekEndDate.toISOString()}`
            // });

            return withinDateRange;
        });

        // console.log('✅ Active meal selections for today:', activeToday.length);

        if (activeToday.length === 0) {
            console.log('ℹ️ No active meal selections for today');
            return [];
        }

        // Step 3: Get all orders and filter by the order IDs we found
        console.log('📦 Fetching all orders for today...');
        const ordersQuery = collection(db, 'orders');
        const ordersSnapshot = await getDocs(ordersQuery);
        const allOrders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('📦 Found', allOrders.length, 'total orders');

        // Log inactive orders for debugging
        const inactiveOrders = allOrders.filter(order => order.isActive === false);
        if (inactiveOrders.length > 0) {
            console.log('⚠️ Found', inactiveOrders.length, 'inactive orders (will be excluded)');
        }

        // Filter orders by the IDs from active meal selections and ensure orders are also active
        const orderIds = activeToday.map(ms => ms.orderId).filter(Boolean);
        console.log('🔍 Looking for orders with IDs (today):', orderIds);

        const relevantOrders = allOrders.filter(order =>
            orderIds.includes(order.id) && order.isActive !== false
        );
        console.log('📦 Found', relevantOrders.length, 'relevant active orders for today');

        // Step 4: Filter orders by selected delivery days
        const todayOrders = relevantOrders.filter(order => {
            const selectedDays = order.selectedDays || [];
            const dayMatch = selectedDays.includes(todayDayName);

            // console.log('🗓️ Day matching for order (today):', {
            //     orderId: order.id,
            //     selectedDays,
            //     todayDayName,
            //     dayMatch
            // });

            return dayMatch;
        });

        console.log('✅ Orders with today delivery:', todayOrders.length);

        if (todayOrders.length === 0) {
            console.log('ℹ️ No orders scheduled for today delivery');
            return [];
        }

        // Step 5: Combine orders with their meal selections and determine status
        const preparationOrders = await Promise.all(todayOrders.map(async (order) => {
            const mealSelection = activeToday.find(ms => ms.orderId === order.id);
            const dailySelection = mealSelection?.dailySelections?.[todayDate];
            const orderStatus = determineOrderStatus(order, dailySelection);

            // console.log('📊 Order preparation status (today):', {
            //     orderId: order.id,
            //     hasMealSelection: !!mealSelection,
            //     hasDailySelection: !!dailySelection,
            //     dailySelectionHasMeals: dailySelection?.meals ? Object.keys(dailySelection.meals).length : 0,
            //     status: orderStatus.status,
            //     reason: orderStatus.reason,
            //     selectedPackage: order.selectedPackage
            // });

            // Get macroPlanId from the selected package
            let macroPlanId = order.selectedPackage?.macroPlanId;

            // If macroPlanId is not directly in selectedPackage, fetch the package details
            if (!macroPlanId && order.selectedPackage?.id) {
                try {
                    console.log('🔍 Fetching package details for today:', order.selectedPackage.id);
                    const packageDoc = await getDoc(doc(db, 'mealPackages', order.selectedPackage.id));
                    if (packageDoc.exists()) {
                        const packageData = packageDoc.data();
                        macroPlanId = packageData.macroPlanId;
                        console.log('✅ Found macroPlanId from package for today:', macroPlanId);
                    }
                } catch (error) {
                    console.error('❌ Error fetching package details for today:', error);
                }
            }

            return {
                ...order,
                todayDate,
                todayDayName,
                macroPlanId, // Add the macroPlanId to the order
                dailySelection,
                userMealSelectionId: mealSelection?.id,
                preparationStatus: orderStatus,
                packageRequirements: {
                    includedMealTypes: order.selectedPackage?.includedMealTypes || [],
                    mealQuantities: order.selectedPackage?.mealQuantities || mealSelection?.mealQuantities || {}
                }
            };
        }));

        console.log('🎯 Final preparation orders for today:', preparationOrders.length);
        return preparationOrders;
    } catch (error) {
        console.error('❌ Error fetching today\'s orders for preparation:', error);
        throw error;
    }
};
