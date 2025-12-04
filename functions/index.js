/**
 * Firebase Functions for riz Recipe Admin
 * Email notifications and order status updates
 */

const { onCall, onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const nodemailer = require("nodemailer");
const logger = require("firebase-functions/logger");
const crypto = require("crypto");

// Set global options
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

// Get email configuration from Firebase config or environment
const getEmailConfig = () => {
    // In Firebase Functions v2, we need to use environment variables
    return {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    };
};

// Order status configurations for emails
const STATUS_EMAIL_CONFIG = {
    pending: {
        subject: "Order Confirmed - Preparing for Delivery",
        icon: "⏳",
        color: "#FFA726"
    },
    out_for_delivery: {
        subject: "Your Order Is On The Way!",
        icon: "🚚",
        color: "#1976D2"
    },
    delivered: {
        subject: "Order Delivered Successfully",
        icon: "✅",
        color: "#4CAF50"
    },
    cancelled: {
        subject: "Order Cancelled",
        icon: "❌",
        color: "#F44336"
    },
    delivery_skipped: {
        subject: "Delivery Skipped",
        icon: "⏭️",
        color: "#FF9800"
    }
};

/**
 * Send order status update email
 */
exports.sendOrderStatusEmail = onCall(
    {
        secrets: ["EMAIL_USER", "EMAIL_PASSWORD"],
        memory: "256MiB",
        timeoutSeconds: 60
    },
    async (request) => {
        try {
            const { orderId, customerEmail, customerName, status, date, notes, skipReason } = request.data;

            // Validate required fields
            if (!orderId || !customerEmail || !status || !date) {
                throw new Error("Missing required fields");
            }

            // Get status configuration
            const statusConfig = STATUS_EMAIL_CONFIG[status];
            if (!statusConfig) {
                throw new Error(`Invalid status: ${status}`);
            }

            // Get email configuration
            const emailConfig = getEmailConfig();
            if (!emailConfig.auth.user || !emailConfig.auth.pass) {
                throw new Error('Email configuration not set. Please set EMAIL_USER and EMAIL_PASSWORD secrets.');
            }

            // Create email transporter
            const transporter = nodemailer.createTransport(emailConfig);

            // Generate email content
            const emailHtml = generateOrderStatusEmailHTML({
                customerName: customerName || "Valued Customer",
                orderId,
                status,
                statusConfig,
                date,
                notes,
                skipReason
            });

            // Send email
            const mailOptions = {
                from: `"riz Recipe Admin" <${emailConfig.auth.user}>`,
                to: customerEmail,
                subject: statusConfig.subject,
                html: emailHtml
            };

            const result = await transporter.sendMail(mailOptions);

            logger.info("Email sent successfully", {
                orderId,
                customerEmail,
                status,
                messageId: result.messageId
            });

            return { success: true, messageId: result.messageId };

        } catch (error) {
            logger.error("Failed to send order status email", { error: error.message });
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
);

/**
 * Automatically send email when order status is updated
 */
exports.onOrderStatusUpdate = onDocumentUpdated(
    {
        document: "orders/{orderId}",
        secrets: ["EMAIL_USER", "EMAIL_PASSWORD"],
        memory: "256MiB",
        timeoutSeconds: 60
    },
    async (event) => {
        try {
            const beforeData = event.data.before.data();
            const afterData = event.data.after.data();
            const orderId = event.params.orderId;

            // Check if dailyStatuses field was updated
            const beforeStatuses = beforeData.dailyStatuses || {};
            const afterStatuses = afterData.dailyStatuses || {};

            // Find which date status was updated
            for (const [date, statusData] of Object.entries(afterStatuses)) {
                const beforeStatus = beforeStatuses[date]?.status;
                const afterStatus = statusData?.status;

                // If status changed and was updated by admin (not system)
                if (beforeStatus !== afterStatus && statusData?.updatedBy !== 'system') {
                    logger.info("Order status changed", {
                        orderId,
                        date,
                        fromStatus: beforeStatus,
                        toStatus: afterStatus,
                        updatedBy: statusData.updatedBy
                    });

                    // Get customer information
                    const customerId = afterData.customerId;
                    if (!customerId) {
                        logger.warn("No customerId found for order", { orderId });
                        continue;
                    }

                    // Get customer email from Firebase Auth
                    let customerEmail, customerName;
                    try {
                        const userRecord = await auth.getUser(customerId);
                        customerEmail = userRecord.email;
                        customerName = userRecord.displayName;
                    } catch (authError) {
                        logger.warn("Could not get customer info from Auth", {
                            customerId,
                            error: authError.message
                        });

                        // Try to get from users collection as fallback
                        try {
                            const userDoc = await db.collection('users').doc(customerId).get();
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                customerEmail = userData.email;
                                customerName = userData.name || userData.displayName;
                            }
                        } catch (dbError) {
                            logger.warn("Could not get customer info from database", {
                                customerId,
                                error: dbError.message
                            });
                        }
                    }

                    if (!customerEmail) {
                        logger.warn("No email found for customer", { customerId, orderId });
                        continue;
                    }

                    // Send email notification directly
                    try {
                        // Get email configuration
                        const emailConfig = getEmailConfig();
                        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
                            logger.warn("Email configuration not set, skipping notification");
                            continue;
                        }

                        // Create email transporter
                        const transporter = nodemailer.createTransport(emailConfig);

                        // Generate email content
                        const statusConfig = STATUS_EMAIL_CONFIG[afterStatus];
                        const emailHtml = generateOrderStatusEmailHTML({
                            customerName: customerName || "Valued Customer",
                            orderId,
                            status: afterStatus,
                            statusConfig,
                            date,
                            notes: statusData.notes || "",
                            skipReason: statusData.skipReason || ""
                        });

                        // Send email
                        const mailOptions = {
                            from: `"riz Recipe Admin" <${emailConfig.auth.user}>`,
                            to: customerEmail,
                            subject: statusConfig.subject,
                            html: emailHtml
                        };

                        const result = await transporter.sendMail(mailOptions);

                        logger.info("Automatic status update email sent successfully", {
                            orderId,
                            customerEmail,
                            status: afterStatus,
                            messageId: result.messageId
                        });

                    } catch (emailError) {
                        logger.error("Failed to send automatic status update email", {
                            orderId,
                            customerEmail,
                            error: emailError.message
                        });
                    }
                }
            }

        } catch (error) {
            logger.error("Error in order status update trigger", {
                orderId: event.params.orderId,
                error: error.message
            });
        }
    }
);

/**
 * Scheduled function to clean up old daily statuses
 * Runs daily at 2 AM UTC to remove dailyStatuses older than 7 days from the order collection
 */
exports.cleanupOldDailyStatuses = onSchedule({
    schedule: "0 2 * * *", // Daily at 2 AM UTC
    timeZone: "UTC",
    memory: "256MiB",
    timeoutSeconds: 540, // 9 minutes
    retryConfig: {
        retryCount: 3,
        maxRetrySeconds: 300
    }
}, async (event) => {
    logger.info("🧹 Starting cleanup of old daily statuses...");

    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

        logger.info(`Removing daily statuses older than ${cutoffDate}`);

        // Get all orders
        const ordersRef = db.collection('orders');
        const ordersSnapshot = await ordersRef.get();

        let totalProcessed = 0;
        let totalCleaned = 0;
        const batchSize = 500; // Firestore batch limit
        let currentBatch = db.batch();
        let batchCount = 0;

        for (const orderDoc of ordersSnapshot.docs) {
            totalProcessed++;
            const orderData = orderDoc.data();
            const dailyStatuses = orderData.dailyStatuses || {};

            let hasOldStatuses = false;
            const updatedDailyStatuses = {};

            // Filter out old daily statuses
            Object.keys(dailyStatuses).forEach(dateKey => {
                if (dateKey >= cutoffDate) {
                    // Keep statuses from last 7 days
                    updatedDailyStatuses[dateKey] = dailyStatuses[dateKey];
                } else {
                    // Mark for removal
                    hasOldStatuses = true;
                    logger.info(`Removing old daily status for order ${orderDoc.id} on ${dateKey}`);
                }
            });

            // Only update if there are old statuses to remove
            if (hasOldStatuses) {
                totalCleaned++;

                // Add to batch
                currentBatch.update(orderDoc.ref, {
                    dailyStatuses: updatedDailyStatuses,
                    updatedAt: new Date(),
                    lastCleanup: new Date()
                });

                batchCount++;

                // Commit batch when it reaches the limit
                if (batchCount >= batchSize) {
                    await currentBatch.commit();
                    logger.info(`Committed batch of ${batchCount} updates`);

                    // Start new batch
                    currentBatch = db.batch();
                    batchCount = 0;
                }
            }
        }

        // Commit remaining batch
        if (batchCount > 0) {
            await currentBatch.commit();
            logger.info(`Committed final batch of ${batchCount} updates`);
        }

        logger.info(`✅ Cleanup completed successfully!`);
        logger.info(`📊 Processed ${totalProcessed} orders, cleaned ${totalCleaned} orders`);
        logger.info(`🗑️ Removed daily statuses older than ${cutoffDate}`);

        return {
            success: true,
            processedOrders: totalProcessed,
            cleanedOrders: totalCleaned,
            cutoffDate: cutoffDate,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error("❌ Error during daily status cleanup:", error);
        throw error;
    }
});

/**
 * Generate HTML email template for order status updates
 */
function generateOrderStatusEmailHTML({ customerName, orderId, status, statusConfig, date, notes, skipReason }) {
    const orderIdShort = orderId.slice(-8);
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: ${statusConfig.color}; color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .status-icon { font-size: 48px; margin-bottom: 10px; }
            .content { padding: 30px 20px; }
            .order-info { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .order-info h3 { margin: 0 0 15px 0; color: #333; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; }
            .notes { background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196F3; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .cta-button { display: inline-block; background-color: ${statusConfig.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="status-icon">${statusConfig.icon}</div>
                <h1>${statusConfig.subject}</h1>
            </div>
            
            <div class="content">
                <p>Dear ${customerName},</p>
                
                <p>We wanted to update you on your order status:</p>
                
                <div class="order-info">
                    <h3>Order Details</h3>
                    <div class="info-row">
                        <span class="info-label">Order ID:</span>
                        <span class="info-value">#${orderIdShort}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Delivery Date:</span>
                        <span class="info-value">${formattedDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value" style="color: ${statusConfig.color}; font-weight: bold;">
                            ${statusConfig.icon} ${statusConfig.subject}
                        </span>
                    </div>
                </div>
                
                ${notes ? `
                <div class="notes">
                    <strong>Additional Notes:</strong><br>
                    ${notes}
                </div>
                ` : ''}
                
                ${status === 'delivery_skipped' && skipReason ? `
                <div class="notes" style="background-color: #fff3e0; border-left-color: #ff9800;">
                    <strong>Skip Reason:</strong><br>
                    ${skipReason}
                </div>
                ` : ''}
                
                ${getStatusMessage(status, skipReason)}
                
                <p>Thank you for choosing Riz Recipe</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from riz Recipe Admin System</p>
                <p>If you have any questions, please contact our support team</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Get status-specific message for email
 */
function getStatusMessage(status, skipReason) {
    const messages = {
        pending: "<p>Your order has been confirmed and we're preparing your fresh, healthy meals for delivery!</p>",
        out_for_delivery: "<p>Your order is now on its way to you! Please be available to receive your delivery.</p>",
        delivered: "<p>Your order has been successfully delivered! We hope you enjoy your healthy, delicious meals.</p><p>Don't forget to leave us a review and let us know how we did!</p>",
        cancelled: "<p>Your order has been cancelled. If this was unexpected, please contact our support team immediately.</p>",
        delivery_skipped: skipReason
            ? `<p>Your delivery for this day has been skipped due to: <strong>${skipReason}</strong>. If this was not expected, please contact our support team.</p>`
            : "<p>Your delivery for this day has been skipped as requested or due to holidays. If this was not requested by you or not due to a holiday, please contact our support team.</p>"
    };

    return messages[status] || "<p>Your order status has been updated.</p>";
}

/**
 * Scheduled function to clean up old daily statuses
 * Runs daily at 2 AM UTC to remove dailyStatuses older than 7 days from the order collection
 */
exports.cleanupOldDailyStatuses = onSchedule({
    schedule: "0 2 * * *", // Daily at 2 AM UTC
    timeZone: "UTC",
    memory: "256MiB",
    timeoutSeconds: 540, // 9 minutes
    retryConfig: {
        retryCount: 3,
        maxRetrySeconds: 300
    }
}, async (event) => {
    logger.info("🧹 Starting cleanup of old daily statuses...");

    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

        logger.info(`Removing daily statuses older than ${cutoffDate}`);

        // Get all orders
        const ordersRef = db.collection('orders');
        const ordersSnapshot = await ordersRef.get();

        let totalProcessed = 0;
        let totalCleaned = 0;
        const batchSize = 500; // Firestore batch limit
        let currentBatch = db.batch();
        let batchCount = 0;

        for (const orderDoc of ordersSnapshot.docs) {
            totalProcessed++;
            const orderData = orderDoc.data();
            const dailyStatuses = orderData.dailyStatuses || {};

            let hasOldStatuses = false;
            const updatedDailyStatuses = {};

            // Filter out old daily statuses
            Object.keys(dailyStatuses).forEach(dateKey => {
                if (dateKey >= cutoffDate) {
                    // Keep statuses from last 7 days
                    updatedDailyStatuses[dateKey] = dailyStatuses[dateKey];
                } else {
                    // Mark for removal
                    hasOldStatuses = true;
                    logger.info(`Removing old daily status for order ${orderDoc.id} on ${dateKey}`);
                }
            });

            // Only update if there are old statuses to remove
            if (hasOldStatuses) {
                totalCleaned++;

                // Add to batch
                currentBatch.update(orderDoc.ref, {
                    dailyStatuses: updatedDailyStatuses,
                    updatedAt: new Date(),
                    lastCleanup: new Date()
                });

                batchCount++;

                // Commit batch when it reaches the limit
                if (batchCount >= batchSize) {
                    await currentBatch.commit();
                    logger.info(`Committed batch of ${batchCount} updates`);

                    // Start new batch
                    currentBatch = db.batch();
                    batchCount = 0;
                }
            }
        }

        // Commit remaining batch
        if (batchCount > 0) {
            await currentBatch.commit();
            logger.info(`Committed final batch of ${batchCount} updates`);
        }

        logger.info(`✅ Cleanup completed successfully!`);
        logger.info(`📊 Processed ${totalProcessed} orders, cleaned ${totalCleaned} orders`);
        logger.info(`🗑️ Removed daily statuses older than ${cutoffDate}`);

        return {
            success: true,
            processedOrders: totalProcessed,
            cleanedOrders: totalCleaned,
            cutoffDate: cutoffDate,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error("❌ Error during daily status cleanup:", error);
        throw error;
    }
});

/**
 * Manual trigger for cleanup (for testing or emergency cleanup)
 * Can be called via HTTP request or Firebase console
 */
exports.triggerDailyStatusCleanup = onCall({
    enforceAppCheck: false // Set to true in production for security
}, async (request) => {
    logger.info("🔧 Manual cleanup trigger called");

    try {
        // Run the same cleanup logic
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

        logger.info(`Manual cleanup: removing daily statuses older than ${cutoffDate}`);

        const ordersRef = db.collection('orders');
        const ordersSnapshot = await ordersRef.get();

        let totalProcessed = 0;
        let totalCleaned = 0;
        const batchSize = 500;
        let currentBatch = db.batch();
        let batchCount = 0;

        for (const orderDoc of ordersSnapshot.docs) {
            totalProcessed++;
            const orderData = orderDoc.data();
            const dailyStatuses = orderData.dailyStatuses || {};

            let hasOldStatuses = false;
            const updatedDailyStatuses = {};

            Object.keys(dailyStatuses).forEach(dateKey => {
                if (dateKey >= cutoffDate) {
                    updatedDailyStatuses[dateKey] = dailyStatuses[dateKey];
                } else {
                    hasOldStatuses = true;
                }
            });

            if (hasOldStatuses) {
                totalCleaned++;

                currentBatch.update(orderDoc.ref, {
                    dailyStatuses: updatedDailyStatuses,
                    updatedAt: new Date(),
                    lastManualCleanup: new Date()
                });

                batchCount++;

                if (batchCount >= batchSize) {
                    await currentBatch.commit();
                    currentBatch = db.batch();
                    batchCount = 0;
                }
            }
        }

        if (batchCount > 0) {
            await currentBatch.commit();
        }

        logger.info(`✅ Manual cleanup completed: ${totalCleaned}/${totalProcessed} orders cleaned`);

        return {
            success: true,
            processedOrders: totalProcessed,
            cleanedOrders: totalCleaned,
            cutoffDate: cutoffDate,
            timestamp: new Date().toISOString(),
            triggerType: 'manual'
        };

    } catch (error) {
        logger.error("❌ Error during manual cleanup:", error);
        throw error;
    }
});

// ========================================
// WEBHOOK ENDPOINT
// ========================================

/**
 * Generic webhook endpoint to receive events from external services
 * URL: https://us-central1-calo-like-app.cloudfunctions.net/webhook
 */
exports.webhook = onRequest({
    cors: true,
    maxInstances: 5
}, async (req, res) => {
    try {
        logger.info("🔔 Webhook received", {
            method: req.method,
            headers: req.headers,
            body: req.body,
            query: req.query,
            timestamp: new Date().toISOString()
        });

        // Get the webhook signature for verification (if provided)
        const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
        const webhookSecret = process.env.WEBHOOK_SECRET;

        // Verify webhook signature if secret is configured
        if (webhookSecret && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            const providedSignature = signature.replace(/^sha256=/, '');

            if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))) {
                logger.warn("❌ Webhook signature verification failed");
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        // Handle different HTTP methods
        switch (req.method) {
            case 'GET':
                // Handle webhook verification/challenge (common for setup)
                const challenge = req.query.challenge || req.query['hub.challenge'];
                if (challenge) {
                    logger.info("✅ Webhook challenge verified");
                    return res.status(200).send(challenge);
                }
                return res.status(200).json({
                    message: 'Webhook endpoint is active',
                    timestamp: new Date().toISOString()
                });

            case 'POST':
                // Handle actual webhook events
                const eventType = req.headers['x-event-type'] || req.body.type || 'unknown';

                logger.info(`📨 Processing webhook event: ${eventType}`);

                // Store webhook event in Firestore for processing
                const webhookDoc = await db.collection('webhookEvents').add({
                    eventType: eventType,
                    headers: req.headers,
                    body: req.body,
                    query: req.query,
                    processed: false,
                    receivedAt: new Date(),
                    source: req.headers['user-agent'] || 'unknown'
                });

                logger.info(`💾 Webhook event stored with ID: ${webhookDoc.id}`);

                // Process specific webhook types
                await processWebhookEvent(eventType, req.body, req.headers);

                return res.status(200).json({
                    success: true,
                    eventId: webhookDoc.id,
                    message: 'Webhook received and processed'
                });

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        logger.error("❌ Webhook processing error:", error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Process specific webhook events based on type
 */
async function processWebhookEvent(eventType, body, headers) {
    try {
        switch (eventType.toLowerCase()) {
            case 'payment.completed':
            case 'payment.succeeded':
                await handlePaymentWebhook(body);
                break;

            case 'order.created':
            case 'order.updated':
                await handleOrderWebhook(body);
                break;

            case 'user.created':
            case 'user.updated':
                await handleUserWebhook(body);
                break;

            case 'subscription.created':
            case 'subscription.updated':
            case 'subscription.cancelled':
                await handleSubscriptionWebhook(body);
                break;

            default:
                logger.info(`ℹ️ Unhandled webhook event type: ${eventType}`);
        }
    } catch (error) {
        logger.error(`❌ Error processing webhook event ${eventType}:`, error);
        throw error;
    }
}

/**
 * Handle payment-related webhooks
 */
async function handlePaymentWebhook(data) {
    logger.info("💳 Processing payment webhook", data);

    // Example: Update order status when payment is completed
    if (data.orderId) {
        await db.collection('orders').doc(data.orderId).update({
            paymentStatus: 'completed',
            paymentProcessedAt: new Date(),
            updatedAt: new Date()
        });

        logger.info(`✅ Payment completed for order: ${data.orderId}`);
    }
}

/**
 * Handle order-related webhooks
 */
async function handleOrderWebhook(data) {
    logger.info("📦 Processing order webhook", data);

    // Example: Sync external order updates
    if (data.orderId && data.status) {
        await db.collection('orders').doc(data.orderId).update({
            externalStatus: data.status,
            lastExternalUpdate: new Date(),
            updatedAt: new Date()
        });

        logger.info(`✅ Order status updated: ${data.orderId} -> ${data.status}`);
    }
}

/**
 * Handle user-related webhooks
 */
async function handleUserWebhook(data) {
    logger.info("👤 Processing user webhook", data);

    // Example: Sync user data from external service
    if (data.userId) {
        const userRef = db.collection('users').doc(data.userId);
        await userRef.update({
            externalData: data,
            lastExternalSync: new Date(),
            updatedAt: new Date()
        });

        logger.info(`✅ User data synced: ${data.userId}`);
    }
}

/**
 * Handle subscription-related webhooks
 */
async function handleSubscriptionWebhook(data) {
    logger.info("🔄 Processing subscription webhook", data);

    // Example: Update user subscription status
    if (data.userId && data.status) {
        await db.collection('users').doc(data.userId).update({
            subscriptionStatus: data.status,
            subscriptionUpdatedAt: new Date(),
            updatedAt: new Date()
        });

        logger.info(`✅ Subscription updated: ${data.userId} -> ${data.status}`);
    }
}
