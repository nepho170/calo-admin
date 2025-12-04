import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../configs/firebase';
import { getUserMealSelectionByOrderId } from './userMealSelections';
import {
    handleAdminDirectSkip,
    SKIP_REQUEST_TYPES,
    SKIP_REQUEST_STATUS
} from './orderSynchronization';

// Initialize Firebase Functions
const functions = getFunctions();
const sendOrderStatusEmail = httpsCallable(functions, 'sendOrderStatusEmail');

/**
 * Order Status Management Service
 * Handles daily order status updates for kitchen operations
 */

// Order statuses for daily preparation and delivery
export const ORDER_STATUSES = {
    PENDING: 'pending',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    DELIVERY_SKIPPED: 'delivery_skipped'
};

// Status display configurations
export const STATUS_CONFIG = {
    [ORDER_STATUSES.PENDING]: {
        label: 'Pending',
        color: 'default',
        icon: '⏳',
        description: 'Order received, waiting for delivery'
    },
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: {
        label: 'Out for Delivery',
        color: 'primary',
        icon: '🚚',
        description: 'Order is on the way to customer'
    },
    [ORDER_STATUSES.DELIVERED]: {
        label: 'Delivered',
        color: 'success',
        icon: '✅',
        description: 'Order successfully delivered to customer'
    },
    [ORDER_STATUSES.CANCELLED]: {
        label: 'Cancelled',
        color: 'error',
        icon: '❌',
        description: 'Order was cancelled'
    },
    [ORDER_STATUSES.DELIVERY_SKIPPED]: {
        label: 'Delivery Skipped',
        color: 'warning',
        icon: '⏭️',
        description: 'Delivery was skipped for this day'
    }
};

// Status workflow - defines which statuses can follow which
export const STATUS_WORKFLOW = {
    [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.CANCELLED, ORDER_STATUSES.DELIVERY_SKIPPED],
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
    [ORDER_STATUSES.DELIVERED]: [], // Final status
    [ORDER_STATUSES.CANCELLED]: [], // Final status
    [ORDER_STATUSES.DELIVERY_SKIPPED]: [] // Final status
};

/**
 * Ensure dailyStatuses field exists and create pending status if missing
 * @param {string} orderId - The order ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} The status object for the date
 */
export const ensureDailyStatusExists = async (orderId, date) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
            throw new Error('Order not found');
        }

        const orderData = orderDoc.data();
        const dailyStatuses = orderData.dailyStatuses || {};

        // Check if status for this date already exists
        if (dailyStatuses[date]) {
            return dailyStatuses[date];
        }

        // Create default pending status
        const defaultStatus = {
            status: ORDER_STATUSES.PENDING,
            updatedAt: serverTimestamp(),
            updatedBy: 'system',
            notes: 'Auto-created default status for legacy order',
            timestamp: new Date().toISOString()
        };

        // Update the order with the new status
        await updateDoc(orderRef, {
            [`dailyStatuses.${date}`]: defaultStatus,
            updatedAt: serverTimestamp()
        });

        console.log(`🔄 Auto-created pending status for order ${orderId} on ${date}`);
        return defaultStatus;

    } catch (error) {
        console.error('❌ Error ensuring daily status exists:', error);
        throw error;
    }
};

/**
 * Skip reasons for delivery skipped status
 */
export const SKIP_REASONS = {
    HOLIDAY: 'holiday',
    CUSTOMER_REQUEST: 'user_request',
    WEATHER: 'weather_conditions',
    DELIVERY_ISSUES: 'delivery_issues',
    OTHER: 'other'
};

export const SKIP_REASON_LABELS = {
    [SKIP_REASONS.HOLIDAY]: 'Public Holiday',
    [SKIP_REASONS.CUSTOMER_REQUEST]: 'User Request',
    [SKIP_REASONS.WEATHER]: 'Weather Conditions',
    [SKIP_REASONS.DELIVERY_ISSUES]: 'Delivery Issues',
    [SKIP_REASONS.OTHER]: 'Other Reason'
};

/**
 * Update order status for a specific date
 * @param {string} orderId - The order ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} newStatus - New status from ORDER_STATUSES
 * @param {string} adminUserId - ID of admin making the change
 * @param {string} notes - Optional notes about the status change
 * @param {boolean} sendEmail - Whether to send email notification to customer
 * @param {string} skipReason - Skip reason for delivery skipped status
 */
export const updateOrderDailyStatus = async (orderId, date, newStatus, adminUserId, notes = '', sendEmail = true, skipReason = '') => {
    try {
        console.log(`📝 Updating order ${orderId} status for ${date} to: ${newStatus}`);

        // Validate status
        if (!Object.values(ORDER_STATUSES).includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        const orderRef = doc(db, 'orders', orderId);

        // Get current order to check existing status
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) {
            throw new Error('Order not found');
        }

        const orderData = orderDoc.data();
        const currentDailyStatuses = orderData.dailyStatuses || {};

        // Ensure daily status exists for this date (auto-create if missing)
        let currentStatus = currentDailyStatuses[date]?.status;
        if (!currentStatus) {
            await ensureDailyStatusExists(orderId, date);
            currentStatus = ORDER_STATUSES.PENDING;
        }

        // Validate status transition
        const allowedNextStatuses = STATUS_WORKFLOW[currentStatus] || [];
        if (currentStatus !== newStatus && !allowedNextStatuses.includes(newStatus)) {
            throw new Error(`Cannot change status from ${currentStatus} to ${newStatus}`);
        }

        // Create status update object
        const statusUpdate = {
            status: newStatus,
            updatedAt: serverTimestamp(),
            updatedBy: adminUserId,
            notes: notes,
            timestamp: new Date().toISOString(),
            ...(newStatus === ORDER_STATUSES.DELIVERY_SKIPPED && skipReason && { skipReason })
        };

        // Update the order document
        await updateDoc(orderRef, {
            [`dailyStatuses.${date}`]: statusUpdate,
            updatedAt: serverTimestamp()
        });

        // Handle delivery skipped status - update userMealSelections
        if (newStatus === ORDER_STATUSES.DELIVERY_SKIPPED) {
            try {
                // Get the user meal selection for this order
                const userMealSelection = await getUserMealSelectionByOrderId(orderId);

                if (userMealSelection) {
                    // Use the new synchronization service for admin direct skip
                    const skipType = skipReason === 'User Request' ?
                        SKIP_REQUEST_TYPES.USER_REQUEST :
                        getSkipTypeFromReason(skipReason);

                    await handleAdminDirectSkip(
                        orderId,
                        userMealSelection.id,
                        date,
                        adminUserId,
                        skipType,
                        notes || skipReason
                    );
                } else {
                    // Fallback to old method if meal selection not found
                    await handleDeliverySkippedStatus(orderId, date);
                }
            } catch (skipError) {
                console.warn('⚠️ Failed to update meal selection for skipped delivery:', skipError.message);
                // Don't throw error - the status update should still succeed
            }
        }

        console.log(`✅ Successfully updated order ${orderId} status for ${date}`);

        // Send email notification if requested and not a system update
        if (sendEmail && adminUserId !== 'system') {
            try {
                await sendOrderStatusEmailNotification(orderId, orderData, newStatus, date, notes, skipReason);
            } catch (emailError) {
                console.warn('⚠️ Failed to send email notification:', emailError.message);
                // Don't throw error for email failures - the status update should still succeed
            }
        }

        return statusUpdate;

    } catch (error) {
        console.error('❌ Error updating order status:', error);
        throw error;
    }
};

/**
 * Get order status for a specific date
 * @param {Object} order - The order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {boolean} autoEnsure - Whether to auto-create status if missing (requires order.id)
 * @returns {string} Current status for the date
 */
export const getOrderStatusForDate = async (order, date, autoEnsure = false) => {
    if (!order) {
        console.warn('getOrderStatusForDate called with null order');
        return ORDER_STATUSES.PENDING;
    }

    const existingStatus = order.dailyStatuses?.[date]?.status;

    if (existingStatus) {
        return existingStatus;
    }

    // If auto-ensure is enabled and we have order ID, create the missing status
    if (autoEnsure && order.id) {
        try {
            await ensureDailyStatusExists(order.id, date);
            return ORDER_STATUSES.PENDING;
        } catch (error) {
            console.warn(`Failed to auto-create status for order ${order.id} on ${date}:`, error);
        }
    }

    return ORDER_STATUSES.PENDING;
};

/**
 * Get order status for a specific date (synchronous version)
 * @param {Object} order - The order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Current status for the date
 */
export const getOrderStatusForDateSync = (order, date) => {
    if (!order) {
        console.warn('getOrderStatusForDateSync called with null order');
        return ORDER_STATUSES.PENDING;
    }

    const rawStatus = order.dailyStatuses?.[date]?.status || ORDER_STATUSES.PENDING;

    // Handle legacy statuses that no longer exist
    if (rawStatus === 'in_preparation' || rawStatus === 'ready_for_pickup') {
        // Convert legacy statuses to pending for display purposes
        return ORDER_STATUSES.PENDING;
    }

    return rawStatus;
};

/**
 * Get order status history for a specific date
 * @param {Object} order - The order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Status history for the date
 */
export const getOrderStatusHistoryForDate = (order, date) => {
    if (!order) {
        console.warn('getOrderStatusHistoryForDate called with null order');
        return {
            status: ORDER_STATUSES.PENDING,
            updatedAt: new Date(),
            updatedBy: 'system',
            notes: 'Default status (null order)',
            timestamp: new Date().toISOString()
        };
    }
    return order.dailyStatuses?.[date] || {
        status: ORDER_STATUSES.PENDING,
        updatedAt: order.createdAt || new Date(),
        updatedBy: 'system',
        notes: 'Default status (dailyStatuses not found)',
        timestamp: order.createdAt?.toISOString() || new Date().toISOString()
    };
};

/**
 * Get allowed next statuses for an order on a specific date
 * @param {Object} order - The order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Array of allowed next statuses
 */
export const getAllowedNextStatuses = (order, date) => {
    const currentStatus = getOrderStatusForDateSync(order, date);

    // Handle legacy statuses that no longer exist
    let normalizedStatus = currentStatus;
    if (currentStatus === 'in_preparation' || currentStatus === 'ready_for_pickup') {
        // Convert legacy statuses to pending for workflow purposes
        normalizedStatus = ORDER_STATUSES.PENDING;
    }

    return STATUS_WORKFLOW[normalizedStatus] || [];
};

/**
 * Check if a status change is allowed
 * @param {Object} order - The order object
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} newStatus - Status to change to
 * @returns {boolean} Whether the status change is allowed
 */
export const isStatusChangeAllowed = (order, date, newStatus) => {
    const allowedStatuses = getAllowedNextStatuses(order, date);
    return allowedStatuses.includes(newStatus);
};

/**
 * Get orders grouped by status for a specific date
 * @param {Array} orders - Array of orders
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Orders grouped by status
 */
export const groupOrdersByStatus = (orders, date) => {
    const grouped = {};

    // Initialize all status groups
    Object.values(ORDER_STATUSES).forEach(status => {
        grouped[status] = [];
    });

    // Group orders by their status for the date
    orders.forEach(order => {
        const status = getOrderStatusForDateSync(order, date);

        // Handle legacy statuses that no longer exist
        let normalizedStatus = status;
        if (status === 'in_preparation' || status === 'ready_for_pickup') {
            // Convert legacy statuses to pending for display purposes
            normalizedStatus = ORDER_STATUSES.PENDING;
        }

        // Ensure the status group exists before pushing
        if (!grouped[normalizedStatus]) {
            grouped[normalizedStatus] = [];
        }

        grouped[normalizedStatus].push(order);
    });

    return grouped;
};

/**
 * Get status statistics for a date
 * @param {Array} orders - Array of orders
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Status counts and percentages
 */
export const getStatusStatistics = (orders, date) => {
    const grouped = groupOrdersByStatus(orders, date);
    const total = orders.length;

    const stats = {};
    Object.entries(grouped).forEach(([status, orderList]) => {
        stats[status] = {
            count: orderList.length,
            percentage: total > 0 ? Math.round((orderList.length / total) * 100) : 0
        };
    });

    return {
        total,
        byStatus: stats
    };
};

/**
 * Bulk ensure daily statuses exist for multiple orders and dates
 * @param {Array} orders - Array of order objects with id property
 * @param {Array} dates - Array of dates in YYYY-MM-DD format
 * @returns {Promise} Promise that resolves when all statuses are ensured
 */
export const bulkEnsureDailyStatuses = async (orders, dates) => {
    const promises = [];

    for (const order of orders) {
        for (const date of dates) {
            // Only create if it doesn't exist
            if (!order.dailyStatuses?.[date]) {
                promises.push(ensureDailyStatusExists(order.id, date));
            }
        }
    }

    if (promises.length > 0) {
        console.log(`🔄 Auto-creating ${promises.length} missing daily statuses...`);
        await Promise.all(promises);
        console.log(`✅ Successfully created ${promises.length} missing daily statuses`);
    }

    return promises.length;
};

/**
 * Handle delivery skipped status by updating user meal selection
 * @param {string} orderId - The order ID
 * @param {string} date - Date in YYYY-MM-DD format
 */
const handleDeliverySkippedStatus = async (orderId, date) => {
    try {
        console.log(`📝 Handling delivery skipped for order ${orderId} on ${date}`);

        // Get the user meal selection for this order
        const userMealSelection = await getUserMealSelectionByOrderId(orderId);

        if (!userMealSelection) {
            console.warn(`⚠️ No user meal selection found for order ${orderId}`);
            return;
        }

        // Update the daily selection to mark it as skipped
        const userMealSelectionRef = doc(db, 'userMealSelections', userMealSelection.id);
        const updatePath = `dailySelections.${date}.isSkipped`;

        await updateDoc(userMealSelectionRef, {
            [updatePath]: true,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ Successfully marked ${date} as skipped for order ${orderId}`);

    } catch (error) {
        console.error('❌ Error handling delivery skipped status:', error);
        throw error;
    }
};

/**
 * Send email notification for order status update
 * @param {string} orderId - The order ID
 * @param {Object} orderData - The order data object
 * @param {string} newStatus - New status
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} notes - Optional notes
 * @param {string} skipReason - Skip reason for delivery skipped status
 */
const sendOrderStatusEmailNotification = async (orderId, orderData, newStatus, date, notes, skipReason) => {
    try {
        console.log(`📧 Sending email notification for order ${orderId} status: ${newStatus}`);

        // Get customer information from the order
        const customerId = orderData.customerId;
        if (!customerId) {
            console.warn('⚠️ No customerId found in order data');
            return;
        }

        // For now, we'll rely on the Firebase Function trigger to handle email sending
        // The function will automatically detect the status change and send the email
        console.log(`📧 Email notification will be sent automatically via Firebase Function`);

        // Optional: You can also call the function directly if needed
        /*
        const result = await sendOrderStatusEmail({
            orderId,
            customerId,
            status: newStatus,
            date,
            notes,
            skipReason
        });
        console.log('📧 Email sent successfully:', result.data);
        */

    } catch (error) {
        console.error('❌ Error sending email notification:', error);
        throw error;
    }
};

/**
 * Utility function to migrate legacy statuses in existing orders
 * This can be used to clean up orders that still have old statuses
 * @param {string} orderId - The order ID to migrate
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>} Whether migration was successful
 */
export const migrateLegacyStatus = async (orderId, date) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
            console.warn('Order not found for migration:', orderId);
            return false;
        }

        const orderData = orderDoc.data();
        const dailyStatuses = orderData.dailyStatuses || {};
        const statusForDate = dailyStatuses[date];

        if (!statusForDate) {
            return false; // No status to migrate
        }

        const currentStatus = statusForDate.status;
        let newStatus = null;

        // Map legacy statuses to new ones
        if (currentStatus === 'in_preparation') {
            newStatus = ORDER_STATUSES.PENDING;
        } else if (currentStatus === 'ready_for_pickup') {
            newStatus = ORDER_STATUSES.OUT_FOR_DELIVERY;
        }

        if (newStatus) {
            // Update the status
            const updateData = {
                [`dailyStatuses.${date}.status`]: newStatus,
                [`dailyStatuses.${date}.updatedAt`]: serverTimestamp(),
                [`dailyStatuses.${date}.updatedBy`]: 'system_migration',
                [`dailyStatuses.${date}.notes`]: `Migrated from legacy status: ${currentStatus}`
            };

            await updateDoc(orderRef, updateData);
            console.log(`✅ Migrated order ${orderId} from ${currentStatus} to ${newStatus}`);
            return true;
        }

        return false; // No migration needed
    } catch (error) {
        console.error('Error migrating legacy status:', error);
        return false;
    }
};

/**
 * Get skip type from reason string
 * @param {string} reason - Skip reason
 * @returns {string} Skip type
 */
const getSkipTypeFromReason = (reason) => {
    if (!reason) return SKIP_REQUEST_TYPES.OTHER;

    const reasonLower = reason.toLowerCase();

    if (reasonLower.includes('holiday')) return SKIP_REQUEST_TYPES.HOLIDAY;
    if (reasonLower.includes('weather')) return SKIP_REQUEST_TYPES.WEATHER;
    if (reasonLower.includes('delivery')) return SKIP_REQUEST_TYPES.DELIVERY_ISSUES;
    if (reasonLower.includes('user') || reasonLower.includes('customer')) return SKIP_REQUEST_TYPES.USER_REQUEST;

    return SKIP_REQUEST_TYPES.OTHER;
};
