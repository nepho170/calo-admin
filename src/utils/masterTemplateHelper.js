import { masterMonthTemplatesService } from '../services/masterMonthTemplates';
import { monthOverridesService } from '../services/monthOverrides';

/**
 * Utility functions for the simplified Master Month Template system
 */

/**
 * Get meal options for a specific date using the master template + overrides
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} macroPlanId - The macro plan ID
 * @returns {Object} Meal options for the date or null
 */
export const getMealOptionsForDate = async (date, macroPlanId) => {
    try {
        // First check if there's an override for this specific date
        const override = await monthOverridesService.getByDateAndMacroPlan(date, macroPlanId);
        if (override && override.isActive) {
            return {
                source: 'override',
                reason: override.reason,
                mealOptions: override.customMealOptions,
                override: override
            };
        }

        // Get the default master template for this macro plan
        const masterTemplate = await masterMonthTemplatesService.getDefaultByMacroPlan(macroPlanId);
        if (!masterTemplate) {
            return null;
        }

        // Calculate which day of the month template to use
        const dayOfMonth = new Date(date).getDate();
        const templateDay = dayOfMonth <= 31 ? dayOfMonth : ((dayOfMonth - 1) % 31) + 1;
        const dayKey = `day${templateDay}`;

        const dayData = masterTemplate.masterDays[dayKey];
        if (!dayData) {
            return null;
        }

        return {
            source: 'template',
            templateId: masterTemplate.id,
            templateName: masterTemplate.templateName,
            dayLabel: dayData.dayLabel,
            mealOptions: dayData.mealOptions,
            dayNumber: templateDay
        };

    } catch (error) {
        console.error('Error getting meal options for date:', error);
        return null;
    }
};

/**
 * Get meal options for a date range (useful for weekly/monthly views)
 * @param {string} startDate - Start date in YYYY-MM-DD format  
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} macroPlanId - The macro plan ID
 * @returns {Object} Object with date as key and meal options as value
 */
export const getMealOptionsForDateRange = async (startDate, endDate, macroPlanId) => {
    try {
        const result = {};
        const currentDate = new Date(startDate);
        const end = new Date(endDate);

        // Get all overrides for this date range upfront
        const overrides = await monthOverridesService.getByDateRange(startDate, endDate, macroPlanId);
        const overridesMap = {};
        overrides.forEach(override => {
            if (override.isActive) {
                overridesMap[override.date] = override;
            }
        });

        // Get the master template once
        const masterTemplate = await masterMonthTemplatesService.getDefaultByMacroPlan(macroPlanId);

        while (currentDate <= end) {
            const dateString = currentDate.toISOString().split('T')[0];

            // Check for override first
            if (overridesMap[dateString]) {
                const override = overridesMap[dateString];
                result[dateString] = {
                    source: 'override',
                    reason: override.reason,
                    mealOptions: override.customMealOptions,
                    override: override
                };
            } else if (masterTemplate) {
                // Use master template
                const dayOfMonth = currentDate.getDate();
                const templateDay = dayOfMonth <= 31 ? dayOfMonth : ((dayOfMonth - 1) % 31) + 1;
                const dayKey = `day${templateDay}`;

                const dayData = masterTemplate.masterDays[dayKey];
                if (dayData) {
                    result[dateString] = {
                        source: 'template',
                        templateId: masterTemplate.id,
                        templateName: masterTemplate.templateName,
                        dayLabel: dayData.dayLabel,
                        mealOptions: dayData.mealOptions,
                        dayNumber: templateDay
                    };
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return result;

    } catch (error) {
        console.error('Error getting meal options for date range:', error);
        return {};
    }
};

/**
 * Get the current month's meal plan
 * @param {string} macroPlanId - The macro plan ID
 * @param {number} year - Year (default: current year)
 * @param {number} month - Month 1-12 (default: current month)
 * @returns {Object} Complete month meal plan
 */
export const getCurrentMonthMealPlan = async (macroPlanId, year = null, month = null) => {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() + 1);

    // Get first and last day of the month
    const firstDay = new Date(targetYear, targetMonth - 1, 1);
    const lastDay = new Date(targetYear, targetMonth, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    return await getMealOptionsForDateRange(startDate, endDate, macroPlanId);
};

/**
 * Check if a specific date has an override
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} macroPlanId - The macro plan ID
 * @returns {boolean} True if date has an active override
 */
export const hasOverrideForDate = async (date, macroPlanId) => {
    try {
        return await monthOverridesService.hasOverride(date, macroPlanId);
    } catch (error) {
        console.error('Error checking override for date:', error);
        return false;
    }
};

/**
 * Get upcoming special dates (next 30 days)
 * @param {string} macroPlanId - The macro plan ID (optional)
 * @returns {Array} Array of upcoming override dates
 */
export const getUpcomingSpecialDates = async (macroPlanId = null) => {
    try {
        return await monthOverridesService.getUpcoming(macroPlanId);
    } catch (error) {
        console.error('Error getting upcoming special dates:', error);
        return [];
    }
};

/**
 * Helper to format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Helper to get day number from date for master template
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {number} Day number (1-31) for master template
 */
export const getDayNumberForTemplate = (dateString) => {
    const dayOfMonth = new Date(dateString).getDate();
    return dayOfMonth <= 31 ? dayOfMonth : ((dayOfMonth - 1) % 31) + 1;
};
