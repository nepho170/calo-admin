
/**
 * Order Status Migration Utilities
 * Utilities for handling legacy orders and missing dailyStatuses fields
 */

import {
    bulkEnsureDailyStatuses,
    ORDER_STATUSES
} from '../services/orderStatus';
import { getTodayTomorrowLocalDates } from './dateUtils';

/**
 * Initialize daily statuses for orders on specific dates
 * This is useful for migrating legacy orders or ensuring consistency
 * @param {Array} orders - Array of order objects
 * @param {Array} dates - Array of dates to ensure statuses for
 * @returns {Promise<Object>} Migration results
 */
export const migrateOrderStatuses = async (orders, dates) => {


    const results = {
        totalOrders: orders.length,
        totalDates: dates.length,
        statusesCreated: 0,
        ordersAffected: 0,
        errors: []
    };

    try {
        // Filter orders that actually need migration
        const ordersNeedingMigration = orders.filter(order => {
            return dates.some(date => !order.dailyStatuses?.[date]);
        });

        results.ordersAffected = ordersNeedingMigration.length;

        if (ordersNeedingMigration.length === 0) {
            console.log('✅ No orders need status migration');
            return results;
        }

        // Bulk ensure daily statuses
        results.statusesCreated = await bulkEnsureDailyStatuses(ordersNeedingMigration, dates);


    } catch (error) {
        console.error('❌ Error during status migration:', error);
        results.errors.push(error.message);
    }

    return results;
};

/**
 * Check which orders are missing daily statuses for given dates
 * @param {Array} orders - Array of order objects
 * @param {Array} dates - Array of dates to check
 * @returns {Object} Analysis of missing statuses
 */
export const analyzeOrderStatuses = (orders, dates) => {
    const analysis = {
        totalOrders: orders.length,
        totalDates: dates.length,
        ordersWithMissingStatuses: [],
        missingStatusCount: 0,
        completeOrders: 0
    };

    orders.forEach(order => {
        const missingDates = dates.filter(date => !order.dailyStatuses?.[date]);

        if (missingDates.length > 0) {
            analysis.ordersWithMissingStatuses.push({
                orderId: order.id,
                customerName: order.customerName || 'Unknown',
                missingDates: missingDates,
                missingCount: missingDates.length
            });
            analysis.missingStatusCount += missingDates.length;
        } else {
            analysis.completeOrders++;
        }
    });



    return analysis;
};

/**
 * Migrate statuses for current operational dates (today and tomorrow)
 * @param {Array} orders - Array of order objects
 * @returns {Promise<Object>} Migration results
 */
export const migrateCurrentOperationalStatuses = async (orders) => {
    const { today, tomorrow } = getTodayTomorrowLocalDates();
    return await migrateOrderStatuses(orders, [today, tomorrow]);
};
