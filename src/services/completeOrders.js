/**
 * Unified Order Data Service
 * Provides consolidated view of order + meal selection data
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../configs/firebase';
import { getUserMealSelectionsByOrderIds } from './userMealSelections';

/**
 * Get complete order data with meal selections for a date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Complete order objects with meal selection data
 */
export const getCompleteOrdersForDate = async (date) => {
    // Get orders for the date
    const ordersQuery = query(
        collection(db, 'orders'),
        where('selectedDays', 'array-contains', getDayNameFromDate(date)),
        where('isActive', '==', true)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    // Get meal selections for these orders
    const orderIds = orders.map(order => order.id);
    const mealSelections = await getUserMealSelectionsByOrderIds(orderIds);

    // Combine the data
    return orders.map(order => {
        const mealSelection = mealSelections[order.id];
        const dailySelection = mealSelection?.dailySelections?.[date];

        return {
            ...order,
            // Order status for the date
            dailyStatus: order.dailyStatuses?.[date],
            // Meal selection for the date
            dailyMealSelection: dailySelection,
            // Combined preparation status
            preparationStatus: determinePreparationStatus(order, dailySelection, date),
            // Reference to full meal selection document
            userMealSelectionId: mealSelection?.id
        };
    });
};

/**
 * Determine preparation status from both order and meal data
 */
const determinePreparationStatus = (order, dailySelection, date) => {
    const orderStatus = order.dailyStatuses?.[date]?.status || 'pending';

    if (orderStatus === 'delivery_skipped') {
        return {
            status: 'skipped',
            source: 'order_status',
            message: 'Delivery skipped'
        };
    }

    if (dailySelection?.isSkipped) {
        return {
            status: 'skipped',
            source: 'meal_selection',
            message: 'Customer skipped this day'
        };
    }

    if (dailySelection?.meals && Object.keys(dailySelection.meals).length > 0) {
        return {
            status: 'user_selected',
            source: 'meal_selection',
            message: 'Customer selected meals'
        };
    }

    return {
        status: 'chef_selection_needed',
        source: 'meal_selection',
        message: 'Chef selection required'
    };
};

const getDayNameFromDate = (date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[new Date(date).getDay()];
};
