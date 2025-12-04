/**
 * Data Consistency Validation Utilities
 * Ensures data integrity between orders and userMealSelections
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../configs/firebase';

/**
 * Validate consistency between orders and meal selections
 * @param {Array} dates - Dates to check consistency for
 * @returns {Object} Consistency report
 */
export const validateDataConsistency = async (dates) => {
    const inconsistencies = [];

    for (const date of dates) {
        // Get all orders with delivery_skipped status for date
        const ordersQuery = query(
            collection(db, 'orders'),
            where(`dailyStatuses.${date}.status`, '==', 'delivery_skipped')
        );
        const ordersSnapshot = await getDocs(ordersQuery);

        for (const orderDoc of ordersSnapshot.docs) {
            const order = { id: orderDoc.id, ...orderDoc.data() };

            // Check if corresponding meal selection has isSkipped = true
            const mealSelectionQuery = query(
                collection(db, 'userMealSelections'),
                where('orderId', '==', order.id)
            );
            const mealSelectionSnapshot = await getDocs(mealSelectionQuery);

            if (!mealSelectionSnapshot.empty) {
                const mealSelection = mealSelectionSnapshot.docs[0].data();
                const dailySelection = mealSelection.dailySelections?.[date];

                if (!dailySelection?.isSkipped) {
                    inconsistencies.push({
                        orderId: order.id,
                        date,
                        issue: 'Order marked as delivery_skipped but meal selection not marked as skipped',
                        orderStatus: order.dailyStatuses[date].status,
                        mealSelectionSkipped: dailySelection?.isSkipped || false
                    });
                }
            }
        }
    }

    return {
        totalChecked: dates.length,
        inconsistenciesFound: inconsistencies.length,
        inconsistencies
    };
};

/**
 * Fix data inconsistencies
 * @param {Array} inconsistencies - Array of inconsistency objects
 */
export const fixDataInconsistencies = async (inconsistencies) => {
    // Implementation to fix found inconsistencies
    for (const inconsistency of inconsistencies) {
        // Sync the skipped status based on order status
        if (inconsistency.orderStatus === 'delivery_skipped') {
            await syncSkippedStatus(inconsistency.orderId, inconsistency.date, true);
        }
    }
};
