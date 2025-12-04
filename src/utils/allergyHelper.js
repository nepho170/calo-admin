import { allergiesService } from '../services/allergies';

// Cache for allergy data to avoid repeated API calls
let allergiesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all allergies and cache them for performance
 */
export const getAllergiesCache = async () => {
    const now = Date.now();

    // Return cached data if it's still fresh
    if (allergiesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        return allergiesCache;
    }

    try {
        console.log('🔄 Fetching allergies data...');
        allergiesCache = await allergiesService.getAll();
        cacheTimestamp = now;
        console.log(`✅ Cached ${allergiesCache.length} allergies`);
        return allergiesCache;
    } catch (error) {
        console.error('❌ Error fetching allergies:', error);
        // Return empty array if fetch fails but keep any existing cache
        return allergiesCache || [];
    }
};

/**
 * Convert allergy IDs to names
 * @param {string[]} allergyIds - Array of allergy IDs
 * @returns {string[]} Array of allergy names
 */
export const getAllergyNames = async (allergyIds) => {
    if (!allergyIds || allergyIds.length === 0) {
        return [];
    }

    try {
        const allergies = await getAllergiesCache();
        const allergyMap = new Map(allergies.map(allergy => [allergy.id, allergy.name]));

        return allergyIds.map(id => allergyMap.get(id) || `Unknown (${id})`);
    } catch (error) {
        console.error('❌ Error getting allergy names:', error);
        // Fallback to showing IDs if name lookup fails
        return allergyIds;
    }
};

/**
 * Get formatted customer name from order data
 * @param {object} order - Order object
 * @returns {object} Object with formatted name and customerId
 */
export const getCustomerDisplayInfo = (order) => {
    const customerId = order.customerId || 'Unknown';
    let displayName = customerId;

    // Try to get name from address field
    if (order.address?.firstName || order.address?.lastName) {
        const firstName = order.address.firstName || '';
        const lastName = order.address.lastName || '';
        displayName = `${firstName} ${lastName}`.trim();
    }
    // Fallback to customerName if available
    else if (order.customerName) {
        displayName = order.customerName;
    }

    return {
        displayName,
        customerId,
        hasRealName: displayName !== customerId
    };
};

/**
 * Clear the allergies cache (useful for testing or when data changes)
 */
export const clearAllergiesCache = () => {
    allergiesCache = null;
    cacheTimestamp = null;
    console.log('🗑️ Allergies cache cleared');
};

/**
 * Check if an allergy is removable from a meal
 * @param {string} allergyId - The allergy ID to check
 * @param {object} meal - The meal object
 * @returns {boolean} True if the allergy is removable
 */
export const isAllergyRemovable = (allergyId, meal) => {
    if (!meal || !meal.removableAllergies) {
        return false;
    }
    return meal.removableAllergies.includes(allergyId);
};

/**
 * Get allergies categorized by removable/non-removable status
 * @param {object} meal - The meal object
 * @returns {object} Object with removable and nonRemovable arrays
 */
export const categorizeAllergies = async (meal) => {
    if (!meal || !meal.allergies || meal.allergies.length === 0) {
        return { removable: [], nonRemovable: [] };
    }

    try {
        const allergies = await getAllergiesCache();
        const allergyMap = new Map(allergies.map(allergy => [allergy.id, allergy]));

        const removableIds = meal.removableAllergies || [];

        const removable = [];
        const nonRemovable = [];

        meal.allergies.forEach(allergyId => {
            const allergyData = allergyMap.get(allergyId);
            const allergyInfo = {
                id: allergyId,
                name: allergyData?.name || `Unknown (${allergyId})`,
                icon: allergyData?.icon || '⚠️'
            };

            if (removableIds.includes(allergyId)) {
                removable.push(allergyInfo);
            } else {
                nonRemovable.push(allergyInfo);
            }
        });

        return { removable, nonRemovable };
    } catch (error) {
        console.error('❌ Error categorizing allergies:', error);
        return { removable: [], nonRemovable: [] };
    }
};

/**
 * Validate removable allergies (ensure they exist in the main allergies list)
 * @param {string[]} allergies - Main allergies array
 * @param {string[]} removableAllergies - Removable allergies array
 * @returns {string[]} Cleaned removable allergies array
 */
export const validateRemovableAllergies = (allergies = [], removableAllergies = []) => {
    return removableAllergies.filter(removableId => allergies.includes(removableId));
};
