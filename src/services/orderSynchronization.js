/**
 * Order Synchronization Service
 * Ensures data consistency between orders and userMealSelections
 * Handles user skip requests and admin actions
 */

import { doc, updateDoc, serverTimestamp, runTransaction, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../configs/firebase';

// Skip request types
export const SKIP_REQUEST_TYPES = {
    USER_REQUEST: 'user_request',
    ADMIN_ACTION: 'admin_action',
    HOLIDAY: 'holiday',
    WEATHER: 'weather_conditions',
    DELIVERY_ISSUES: 'delivery_issues',
    OTHER: 'other'
};

export const SKIP_REQUEST_STATUS = {
    PENDING: 'pending',           // User requested, waiting for admin action
    APPROVED: 'approved',         // Admin approved the skip request
    REJECTED: 'rejected',         // Admin rejected the skip request (rare)
    AUTO_APPLIED: 'auto_applied'  // Admin directly skipped (no user request)
};

/**
 * Atomic update for both status and meal selection
 * @param {string} orderId - Order ID
 * @param {string} userMealSelectionId - UserMealSelection ID  
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} statusUpdate - Status update object
 * @param {Object} mealSelectionUpdate - Meal selection update object
 */
export const atomicOrderUpdate = async (orderId, userMealSelectionId, date, statusUpdate, mealSelectionUpdate) => {
    return await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const mealSelectionRef = doc(db, 'userMealSelections', userMealSelectionId);

        // Update order status
        if (statusUpdate) {
            transaction.update(orderRef, {
                [`dailyStatuses.${date}`]: statusUpdate,
                updatedAt: serverTimestamp()
            });
        }

        // Update meal selection
        if (mealSelectionUpdate) {
            transaction.update(mealSelectionRef, {
                [`dailySelections.${date}`]: mealSelectionUpdate,
                updatedAt: serverTimestamp()
            });
        }
    });
};

/**
 * Sync skipped status between collections
 * @param {string} orderId - Order ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {boolean} isSkipped - Whether the day is skipped
 */
export const syncSkippedStatus = async (orderId, date, isSkipped) => {
    // Implementation for keeping isSkipped in sync
    // when delivery_skipped status is set
    try {
        console.log(`🔄 Syncing skip status for order ${orderId} on ${date}: ${isSkipped}`);

        // This function is now handled by the atomic operations above
        // But can be used for manual sync if needed

        return { success: true };
    } catch (error) {
        console.error('❌ Error syncing skip status:', error);
        throw error;
    }
};

/**
 * Handle user skip request (called from client app)
 * @param {string} orderId - Order ID
 * @param {string} userMealSelectionId - UserMealSelection ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} userId - User ID making the request
 * @param {string} reason - Reason for skipping (optional)
 */
export const handleUserSkipRequest = async (orderId, userMealSelectionId, date, userId, reason = '') => {
    try {
        console.log(`📝 Processing user skip request for order ${orderId} on ${date}`);

        const mealSelectionRef = doc(db, 'userMealSelections', userMealSelectionId);

        // Create skip request object
        const skipRequest = {
            isSkipped: true,
            skipRequestType: SKIP_REQUEST_TYPES.USER_REQUEST,
            skipRequestStatus: SKIP_REQUEST_STATUS.PENDING,
            skipRequestedBy: userId,
            skipRequestedAt: serverTimestamp(),
            skipReason: reason || 'User requested to skip this day',
            adminActionRequired: true,
            adminNotified: false
        };

        // Update meal selection with skip request
        await updateDoc(mealSelectionRef, {
            [`dailySelections.${date}`]: skipRequest,
            updatedAt: serverTimestamp()
        });

        console.log(`✅ User skip request processed for order ${orderId} on ${date}`);

        // TODO: Add notification to admin queue
        await notifyAdminOfSkipRequest(orderId, date, userId, reason);

        return {
            success: true,
            message: 'Skip request submitted. Admin will review and update order status.',
            skipRequestStatus: SKIP_REQUEST_STATUS.PENDING
        };

    } catch (error) {
        console.error('❌ Error processing user skip request:', error);
        throw error;
    }
};

/**
 * Handle admin action on user skip request
 * @param {string} orderId - Order ID
 * @param {string} userMealSelectionId - UserMealSelection ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} adminUserId - Admin user ID
 * @param {string} action - 'approve' or 'reject'
 * @param {string} adminNotes - Admin notes
 */
export const handleAdminSkipAction = async (orderId, userMealSelectionId, date, adminUserId, action, adminNotes = '') => {
    try {
        console.log(`📝 Admin ${action}ing skip request for order ${orderId} on ${date}`);

        return await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, 'orders', orderId);
            const mealSelectionRef = doc(db, 'userMealSelections', userMealSelectionId);

            if (action === 'approve') {
                // Update order status to delivery_skipped
                const statusUpdate = {
                    status: 'delivery_skipped',
                    updatedAt: serverTimestamp(),
                    updatedBy: adminUserId,
                    notes: `Approved user skip request. ${adminNotes}`,
                    timestamp: new Date().toISOString(),
                    skipReason: 'User Request',
                    skipRequestApprovedAt: serverTimestamp()
                };

                transaction.update(orderRef, {
                    [`dailyStatuses.${date}`]: statusUpdate,
                    updatedAt: serverTimestamp()
                });

                // Update meal selection with approval
                transaction.update(mealSelectionRef, {
                    [`dailySelections.${date}.skipRequestStatus`]: SKIP_REQUEST_STATUS.APPROVED,
                    [`dailySelections.${date}.skipApprovedBy`]: adminUserId,
                    [`dailySelections.${date}.skipApprovedAt`]: serverTimestamp(),
                    [`dailySelections.${date}.adminActionRequired`]: false,
                    [`dailySelections.${date}.adminNotes`]: adminNotes,
                    updatedAt: serverTimestamp()
                });

                console.log(`✅ Skip request approved for order ${orderId} on ${date}`);
                return { action: 'approved', orderStatusUpdated: true };

            } else if (action === 'reject') {
                // Reject the skip request, keep order active
                transaction.update(mealSelectionRef, {
                    [`dailySelections.${date}.isSkipped`]: false,
                    [`dailySelections.${date}.skipRequestStatus`]: SKIP_REQUEST_STATUS.REJECTED,
                    [`dailySelections.${date}.skipRejectedBy`]: adminUserId,
                    [`dailySelections.${date}.skipRejectedAt`]: serverTimestamp(),
                    [`dailySelections.${date}.adminActionRequired`]: false,
                    [`dailySelections.${date}.adminNotes`]: adminNotes,
                    [`dailySelections.${date}.rejectionReason`]: adminNotes,
                    updatedAt: serverTimestamp()
                });

                console.log(`✅ Skip request rejected for order ${orderId} on ${date}`);
                return { action: 'rejected', orderStatusUpdated: false };
            }
        });

    } catch (error) {
        console.error('❌ Error handling admin skip action:', error);
        throw error;
    }
};

/**
 * Handle admin direct skip (without user request)
 * @param {string} orderId - Order ID
 * @param {string} userMealSelectionId - UserMealSelection ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} adminUserId - Admin user ID
 * @param {string} skipType - Type of skip (holiday, weather, etc.)
 * @param {string} reason - Reason for skipping
 */
export const handleAdminDirectSkip = async (orderId, userMealSelectionId, date, adminUserId, skipType, reason) => {
    try {
        console.log(`📝 Admin directly skipping order ${orderId} on ${date} - Type: ${skipType}`);

        return await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, 'orders', orderId);
            const mealSelectionRef = doc(db, 'userMealSelections', userMealSelectionId);

            // Update order status
            const statusUpdate = {
                status: 'delivery_skipped',
                updatedAt: serverTimestamp(),
                updatedBy: adminUserId,
                notes: reason,
                timestamp: new Date().toISOString(),
                skipReason: skipType === SKIP_REQUEST_TYPES.USER_REQUEST ? 'User Request' : getSkipReasonLabel(skipType)
            };

            transaction.update(orderRef, {
                [`dailyStatuses.${date}`]: statusUpdate,
                updatedAt: serverTimestamp()
            });

            // Update meal selection
            const mealSelectionUpdate = {
                isSkipped: true,
                skipRequestType: skipType,
                skipRequestStatus: SKIP_REQUEST_STATUS.AUTO_APPLIED,
                skipAppliedBy: adminUserId,
                skipAppliedAt: serverTimestamp(),
                skipReason: reason,
                adminActionRequired: false
            };

            transaction.update(mealSelectionRef, {
                [`dailySelections.${date}`]: mealSelectionUpdate,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ Admin direct skip applied for order ${orderId} on ${date}`);
            return { success: true, orderStatusUpdated: true };
        });

    } catch (error) {
        console.error('❌ Error handling admin direct skip:', error);
        throw error;
    }
};

/**
 * Get pending skip requests for admin review
 * @returns {Array} Array of pending skip requests
 */
export const getPendingSkipRequests = async () => {
    try {
        const pendingRequests = [];

        // This would need to be implemented with a proper query
        // For now, we'll return the structure expected

        return pendingRequests;
    } catch (error) {
        console.error('❌ Error fetching pending skip requests:', error);
        throw error;
    }
};

/**
 * Get skip request details for a specific order and date
 * @param {string} orderId - Order ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Skip request details
 */
export const getSkipRequestDetails = async (orderId, date) => {
    try {
        // Get order data
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
            throw new Error('Order not found');
        }

        const orderData = orderDoc.data();
        const orderStatus = orderData.dailyStatuses?.[date];

        // Get meal selection data
        const mealSelectionQuery = query(
            collection(db, 'userMealSelections'),
            where('orderId', '==', orderId)
        );
        const mealSelectionSnapshot = await getDocs(mealSelectionQuery);

        if (mealSelectionSnapshot.empty) {
            throw new Error('Meal selection not found');
        }

        const mealSelectionData = mealSelectionSnapshot.docs[0].data();
        const dailySelection = mealSelectionData.dailySelections?.[date];

        return {
            orderId,
            date,
            orderStatus: orderStatus?.status || 'pending',
            skipRequest: {
                isSkipped: dailySelection?.isSkipped || false,
                skipRequestType: dailySelection?.skipRequestType,
                skipRequestStatus: dailySelection?.skipRequestStatus,
                skipRequestedBy: dailySelection?.skipRequestedBy,
                skipRequestedAt: dailySelection?.skipRequestedAt,
                skipReason: dailySelection?.skipReason,
                adminActionRequired: dailySelection?.adminActionRequired || false,
                adminNotes: dailySelection?.adminNotes
            }
        };

    } catch (error) {
        console.error('❌ Error getting skip request details:', error);
        throw error;
    }
};

/**
 * Notify admin of skip request (placeholder for notification system)
 * @param {string} orderId - Order ID
 * @param {string} date - Date
 * @param {string} userId - User ID
 * @param {string} reason - Reason for skip
 */
const notifyAdminOfSkipRequest = async (orderId, date, userId, reason) => {
    try {
        // This could integrate with:
        // - Email notifications
        // - Admin dashboard notifications
        // - Push notifications
        // - Slack/Discord webhooks

        console.log(`🔔 Admin notification: User ${userId} requested to skip order ${orderId} on ${date}`);
        console.log(`📝 Reason: ${reason}`);

        // For now, just log it. In production, implement actual notification

    } catch (error) {
        console.error('❌ Error notifying admin of skip request:', error);
    }
};

/**
 * Get skip reason label
 * @param {string} skipType - Skip type
 * @returns {string} Human readable label
 */
const getSkipReasonLabel = (skipType) => {
    const labels = {
        [SKIP_REQUEST_TYPES.USER_REQUEST]: 'User Request',
        [SKIP_REQUEST_TYPES.ADMIN_ACTION]: 'Admin Action',
        [SKIP_REQUEST_TYPES.HOLIDAY]: 'Holiday',
        [SKIP_REQUEST_TYPES.WEATHER]: 'Weather Conditions',
        [SKIP_REQUEST_TYPES.DELIVERY_ISSUES]: 'Delivery Issues',
        [SKIP_REQUEST_TYPES.OTHER]: 'Other'
    };

    return labels[skipType] || 'Unknown';
};
