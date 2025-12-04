import {
    getStartupHealthCheck,
    getExpiredUserMealSelections,
    deactivateExpiredMealSelections
} from './userMealSelections.js';

/**
 * Startup Service
 * Handles application startup checks and initialization tasks
 */

/**
 * Application startup configuration
 */
const STARTUP_CONFIG = {
    // Auto-deactivate expired meal selections
    autoDeactivateExpired: true,

    // Show warnings for expiring subscriptions (days ahead)
    expirationWarningDays: 7,

    // Maximum number of expired selections to auto-deactivate per startup
    maxAutoDeactivate: 50,

    // Log startup checks to console
    enableLogging: true,

    // Enhanced error tracking
    enableDetailedErrorLogging: true,

    // Validate data before processing
    enableDataValidation: true
};

/**
 * Run comprehensive startup checks
 * @param {Object} options - Configuration options for startup checks
 * @returns {Promise<Object>} Startup check results
 */
export const runStartupChecks = async (options = {}) => {
    const config = { ...STARTUP_CONFIG, ...options };

    try {
        if (config.enableLogging) {
            console.log('🚀 Running application startup checks...');
        }

        // 1. Run health check to get overall status
        const healthCheck = await getStartupHealthCheck();

        // 2. Handle expired meal selections
        let deactivationResults = null;
        if (config.autoDeactivateExpired && healthCheck.expired.count > 0) {
            const expiredIds = healthCheck.expired.selections
                .slice(0, config.maxAutoDeactivate)
                .map(selection => selection.id);

            if (config.enableLogging) {
                console.log(`🔄 Auto-deactivating ${expiredIds.length} expired meal selections...`);
            }

            const deactivatedCount = await deactivateExpiredMealSelections(expiredIds);
            deactivationResults = {
                attempted: expiredIds.length,
                successful: deactivatedCount,
                failed: expiredIds.length - deactivatedCount,
                failureDetails: deactivatedCount < expiredIds.length ?
                    `${expiredIds.length - deactivatedCount} operations failed - check logs for details` : null
            };

            if (config.enableLogging) {
                console.log(`✅ Deactivation completed: ${deactivatedCount}/${expiredIds.length} successful`);
            }
        }

        // 3. Generate startup summary
        const startupSummary = {
            timestamp: new Date().toISOString(),
            status: 'completed',
            healthCheck,
            deactivationResults,
            alerts: generateStartupAlerts(healthCheck),
            recommendations: healthCheck.recommendations
        };

        if (config.enableLogging) {
            console.log('✅ Startup checks completed successfully');
            logStartupSummary(startupSummary);
        }

        return startupSummary;

    } catch (error) {
        console.error('❌ Startup checks failed:', error);

        return {
            timestamp: new Date().toISOString(),
            status: 'failed',
            error: error.message,
            alerts: [{
                type: 'error',
                title: 'Startup Check Failed',
                message: 'Application startup checks encountered an error. Some features may not work properly.',
                urgent: true
            }]
        };
    }
};

/**
 * Generate user-friendly alerts for startup issues
 * @param {Object} healthCheck - Health check results
 * @returns {Array} Array of alert objects
 */
const generateStartupAlerts = (healthCheck) => {
    const alerts = [];

    // Critical alert for expired selections
    if (healthCheck.expired.count > 0) {
        alerts.push({
            type: 'warning',
            title: 'Expired Orders Detected',
            message: `Found ${healthCheck.expired.count} expired meal selections that need attention.`,
            details: healthCheck.expired.selections.map(selection => ({
                orderId: selection.orderId,
                packageTitle: selection.packageTitle,
                daysExpired: selection.daysExpired,
                userId: selection.userId
            })),
            urgent: healthCheck.expired.count > 10
        });
    }

    // Info alert for expiring soon
    if (healthCheck.expiringSoon.count > 0) {
        alerts.push({
            type: 'info',
            title: 'Orders Expiring Soon',
            message: `${healthCheck.expiringSoon.count} orders will expire within the next 7 days.`,
            details: healthCheck.expiringSoon.selections.map(selection => ({
                orderId: selection.orderId,
                packageTitle: selection.packageTitle,
                daysUntilExpiry: selection.daysUntilExpiry,
                userId: selection.userId
            })),
            urgent: false
        });
    }

    // Success message when everything is clean
    if (healthCheck.expired.count === 0 && healthCheck.expiringSoon.count === 0) {
        alerts.push({
            type: 'success',
            title: 'All Orders Active',
            message: `All ${healthCheck.total.activeSelections} meal selections are active and current.`,
            urgent: false
        });
    }

    return alerts;
};

/**
 * Log startup summary to console in a formatted way
 * @param {Object} summary - Startup summary object
 */
const logStartupSummary = (summary) => {
    console.log('\n📊 Startup Check Summary');
    console.log('========================');
    console.log(`Status: ${summary.status}`);
    console.log(`Timestamp: ${summary.timestamp}`);

    if (summary.healthCheck) {
        console.log(`\n📈 Health Check Results:`);
        console.log(`   • Active Selections: ${summary.healthCheck.total.activeSelections}`);
        console.log(`   • Expired: ${summary.healthCheck.expired.count}`);
        console.log(`   • Expiring Soon: ${summary.healthCheck.expiringSoon.count}`);
    }

    if (summary.deactivationResults) {
        console.log(`\n🔄 Deactivation Results:`);
        console.log(`   • Attempted: ${summary.deactivationResults.attempted}`);
        console.log(`   • Successful: ${summary.deactivationResults.successful}`);
        console.log(`   • Failed: ${summary.deactivationResults.failed}`);
    }

    if (summary.alerts && summary.alerts.length > 0) {
        console.log(`\n🚨 Alerts:`);
        summary.alerts.forEach((alert, index) => {
            const urgentFlag = alert.urgent ? ' [URGENT]' : '';
            console.log(`   ${index + 1}. ${alert.type.toUpperCase()}${urgentFlag}: ${alert.title}`);
            console.log(`      ${alert.message}`);
        });
    }

    console.log('\n========================\n');
};

/**
 * Quick check for expired orders only (lightweight version)
 * @returns {Promise<Object>} Simple expired orders check result
 */
export const quickExpiredOrdersCheck = async () => {
    try {
        const expiredSelections = await getExpiredUserMealSelections();

        return {
            hasExpired: expiredSelections.length > 0,
            count: expiredSelections.length,
            expired: expiredSelections.map(selection => ({
                id: selection.id,
                orderId: selection.orderId,
                packageTitle: selection.packageTitle,
                daysExpired: selection.daysExpired,
                userId: selection.userId
            }))
        };
    } catch (error) {
        console.error('❌ Quick expired orders check failed:', error);
        return {
            hasExpired: false,
            count: 0,
            expired: [],
            error: error.message
        };
    }
};

/**
 * Get startup configuration
 * @returns {Object} Current startup configuration
 */
export const getStartupConfig = () => ({ ...STARTUP_CONFIG });

/**
 * Update startup configuration
 * @param {Object} newConfig - New configuration options
 */
export const updateStartupConfig = (newConfig) => {
    Object.assign(STARTUP_CONFIG, newConfig);
};
