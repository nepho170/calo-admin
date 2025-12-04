/**
 * Skip Request Detection Utilities
 * Helper functions to identify and work with skip requests in order data
 */

import { SKIP_REQUEST_STATUS, SKIP_REQUEST_TYPES } from '../services/orderSynchronization';

/**
 * Check if an order has a pending skip request for a specific date
 * @param {Object} order - Order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean} Whether there's a pending skip request
 */
export const hasPendingSkipRequest = (order, date) => {
    const dailySelection = order.dailyMealSelection || order.dailySelection;
    if (!dailySelection) return false;

    return dailySelection.skipRequestStatus === SKIP_REQUEST_STATUS.PENDING &&
        dailySelection.adminActionRequired === true;
};

/**
 * Get skip request status for an order on a specific date
 * @param {Object} order - Order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Skip request details
 */
export const getSkipRequestStatus = (order, date) => {
    const dailySelection = order.dailyMealSelection || order.dailySelection;

    if (!dailySelection || !dailySelection.isSkipped) {
        return {
            hasSkipRequest: false,
            status: null,
            type: null,
            requestedBy: null,
            reason: null,
            adminActionRequired: false
        };
    }

    return {
        hasSkipRequest: true,
        status: dailySelection.skipRequestStatus || SKIP_REQUEST_STATUS.AUTO_APPLIED,
        type: dailySelection.skipRequestType || SKIP_REQUEST_TYPES.ADMIN_ACTION,
        requestedBy: dailySelection.skipRequestedBy || dailySelection.skipAppliedBy,
        reason: dailySelection.skipReason || 'No reason provided',
        adminActionRequired: dailySelection.adminActionRequired || false,
        requestedAt: dailySelection.skipRequestedAt || dailySelection.skipAppliedAt
    };
};

/**
 * Check if skip was requested by user vs admin action
 * @param {Object} order - Order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} 'user' | 'admin' | 'unknown'
 */
export const getSkipRequestSource = (order, date) => {
    const skipStatus = getSkipRequestStatus(order, date);

    if (!skipStatus.hasSkipRequest) return 'none';

    if (skipStatus.type === SKIP_REQUEST_TYPES.USER_REQUEST) {
        return 'user';
    }

    if (skipStatus.status === SKIP_REQUEST_STATUS.AUTO_APPLIED) {
        return 'admin';
    }

    return 'unknown';
};

/**
 * Get user-friendly skip reason for client app
 * @param {Object} order - Order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Formatted skip reason info
 */
export const getClientSkipReason = (order, date) => {
    const skipStatus = getSkipRequestStatus(order, date);

    if (!skipStatus.hasSkipRequest) {
        return {
            isSkipped: false,
            reason: null,
            source: null,
            canModify: true
        };
    }

    const source = getSkipRequestSource(order, date);

    // Map admin reasons to user-friendly messages
    const reasonMapping = {
        [SKIP_REQUEST_TYPES.HOLIDAY]: 'Service unavailable due to holiday',
        [SKIP_REQUEST_TYPES.WEATHER]: 'Delivery suspended due to weather conditions',
        [SKIP_REQUEST_TYPES.DELIVERY_ISSUES]: 'Delivery temporarily unavailable',
        [SKIP_REQUEST_TYPES.USER_REQUEST]: 'You requested to skip this day',
        [SKIP_REQUEST_TYPES.OTHER]: skipStatus.reason || 'Delivery unavailable'
    };

    return {
        isSkipped: true,
        reason: reasonMapping[skipStatus.type] || skipStatus.reason,
        source: source,
        status: skipStatus.status,
        canModify: source === 'user' && skipStatus.status === SKIP_REQUEST_STATUS.PENDING,
        requestedAt: skipStatus.requestedAt
    };
};

/**
 * Filter orders that need admin attention for skip requests
 * @param {Array} orders - Array of order objects
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Orders with pending skip requests
 */
export const getOrdersWithPendingSkipRequests = (orders, date) => {
    return orders.filter(order => hasPendingSkipRequest(order, date));
};

/**
 * Get skip request statistics for admin dashboard
 * @param {Array} orders - Array of order objects
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Skip request statistics
 */
export const getSkipRequestStats = (orders, date) => {
    const stats = {
        total: orders.length,
        skipped: 0,
        userRequested: 0,
        adminSkipped: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    };

    orders.forEach(order => {
        const skipStatus = getSkipRequestStatus(order, date);

        if (skipStatus.hasSkipRequest) {
            stats.skipped++;

            if (skipStatus.type === SKIP_REQUEST_TYPES.USER_REQUEST) {
                stats.userRequested++;
            } else {
                stats.adminSkipped++;
            }

            switch (skipStatus.status) {
                case SKIP_REQUEST_STATUS.PENDING:
                    stats.pending++;
                    break;
                case SKIP_REQUEST_STATUS.APPROVED:
                    stats.approved++;
                    break;
                case SKIP_REQUEST_STATUS.REJECTED:
                    stats.rejected++;
                    break;
            }
        }
    });

    return stats;
};
