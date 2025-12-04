import { masterMonthTemplatesService } from '../services/masterMonthTemplates';
import { monthOverridesService } from '../services/monthOverrides';
import { mealsService } from '../services/meals';

/**
 * Get meal options for a specific date using the master template + overrides
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} macroPlanId - The macro plan ID
 * @returns {Object} Meal options for the date or null
 */
export const getMealOptionsForDate = async (date, macroPlanId) => {
    try {
        console.log(`🗓️ Getting meal options for date: ${date}, macro plan: ${macroPlanId}`);

        // Validate inputs
        if (!date) {
            console.error('❌ Date is required');
            return null;
        }
        if (!macroPlanId) {
            console.error('❌ Macro plan ID is required');
            return null;
        }

        // First check if there's an override for this specific date
        const override = await monthOverridesService.getByDateAndMacroPlan(date, macroPlanId);
        if (override && override.isActive) {
            console.log('📅 Using override for date:', override.reason);
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
            console.log('❌ No master template found for macro plan:', macroPlanId);
            return null;
        }

        console.log('📋 Found master template:', masterTemplate.templateName);

        // Calculate which day of the month template to use
        const dayOfMonth = new Date(date).getDate();
        const templateDay = dayOfMonth <= 31 ? dayOfMonth : ((dayOfMonth - 1) % 31) + 1;
        const dayKey = `day${templateDay}`;

        console.log(`📅 Using template day ${templateDay} for date ${date}`);

        const dayData = masterTemplate.masterDays[dayKey];
        if (!dayData) {
            console.log(`❌ No day data found for ${dayKey}`);
            return null;
        }

        console.log('✅ Found day data:', {
            dayLabel: dayData.dayLabel,
            mealTypes: Object.keys(dayData.mealOptions),
            totalMeals: Object.values(dayData.mealOptions).flat().length
        });

        return {
            source: 'template',
            templateId: masterTemplate.id,
            templateName: masterTemplate.templateName,
            dayLabel: dayData.dayLabel,
            mealOptions: dayData.mealOptions,
            dayNumber: templateDay
        };

    } catch (error) {
        console.error('❌ Error getting meal options for date:', error);
        return null;
    }
};

/**
 * Get available meals for chef selection from ALL macro plans and templates
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} mealType - The meal type (breakfast, lunch, dinner, snack)
 * @returns {Array} Array of meal objects available for selection from all plans
 */
export const getAvailableMealsForChefSelection = async (date, mealType) => {
    try {
        console.log(`🧑‍🍳 Getting available meals for chef selection from ALL plans:`, {
            date,
            mealType
        });

        // Get all master templates from all macro plans
        const allTemplates = await masterMonthTemplatesService.getAll();
        if (!allTemplates || allTemplates.length === 0) {
            console.log('❌ No master templates found');
            return [];
        }

        console.log(`📋 Found ${allTemplates.length} master templates across all macro plans`);

        // Calculate which day of the month template to use
        const dayOfMonth = new Date(date).getDate();
        const templateDay = dayOfMonth <= 31 ? dayOfMonth : ((dayOfMonth - 1) % 31) + 1;
        const dayKey = `day${templateDay}`;

        console.log(`📅 Using template day ${templateDay} for date ${date}`);

        // Collect all meal IDs from all templates for this meal type
        const allMealIds = new Set(); // Use Set to avoid duplicates

        for (const template of allTemplates) {
            if (!template.isActive) continue; // Skip inactive templates

            // Check for overrides first
            try {
                const override = await monthOverridesService.getByDateAndMacroPlan(date, template.macroPlanId);
                if (override && override.isActive) {
                    console.log(`📅 Using override for macro plan ${template.macroPlanId}:`, override.reason);
                    const overrideMealIds = override.customMealOptions[mealType] || [];
                    overrideMealIds.forEach(id => allMealIds.add(id));
                    continue;
                }
            } catch (error) {
                console.warn(`⚠️ Error checking override for macro plan ${template.macroPlanId}:`, error.message);
            }

            // Use regular template
            const dayData = template.masterDays?.[dayKey];
            if (dayData && dayData.mealOptions && dayData.mealOptions[mealType]) {
                const mealIds = dayData.mealOptions[mealType];
                mealIds.forEach(id => allMealIds.add(id));
                console.log(`📋 Added ${mealIds.length} ${mealType} meals from template: ${template.templateName} (${template.macroPlanId})`);
            }
        }

        console.log(`� Total unique ${mealType} meal IDs collected: ${allMealIds.size}`);

        if (allMealIds.size === 0) {
            console.log(`❌ No ${mealType} options found across all templates for this day`);
            return [];
        }

        // Fetch the actual meal objects
        const meals = [];
        for (const mealId of allMealIds) {
            try {
                const meal = await mealsService.getById(mealId);
                if (meal && meal.isActive) {
                    meals.push({
                        ...meal,
                        // Add source info for debugging
                        _sourceInfo: `Available across multiple plans`
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Could not fetch meal ${mealId}:`, error.message);
            }
        }

        console.log(`✅ Successfully fetched ${meals.length} meals from ${allMealIds.size} unique IDs across all macro plans`);

        // Return all meals without filtering - chefs can select from the full catalog
        return meals;

    } catch (error) {
        console.error('❌ Error getting available meals for chef selection:', error);
        return [];
    }
};

/**
 * Filter meals by user allergies
 * @param {Array} meals - Array of meal objects
 * @param {Array} allergies - Array of allergy strings
 * @returns {Array} Filtered meals that don't contain user allergies
 */
const filterMealsByAllergies = (meals, allergies) => {
    if (!allergies || allergies.length === 0) return meals;

    return meals.filter((meal) => {
        // Check in rawIngredients if available
        if (meal.rawIngredients) {
            const ingredients = meal.rawIngredients.toLowerCase();
            const hasAllergy = allergies.some((allergy) =>
                ingredients.includes(allergy.toLowerCase())
            );
            if (hasAllergy) return false;
        }

        // Check in ingredients array if available
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
            const mealIngredients = meal.ingredients.map((ing) => ing.toLowerCase());
            const hasAllergy = allergies.some((allergy) =>
                mealIngredients.some((ingredient) =>
                    ingredient.includes(allergy.toLowerCase())
                )
            );
            if (hasAllergy) return false;
        }

        // Check in allergies field if available
        if (meal.allergies && Array.isArray(meal.allergies)) {
            const hasAllergy = allergies.some((allergy) =>
                meal.allergies.some((mealAllergy) =>
                    mealAllergy.toLowerCase().includes(allergy.toLowerCase())
                )
            );
            if (hasAllergy) return false;
        }

        return true;
    });
};

/**
 * Get all available meals for chef selection for all meal types in a package from ALL macro plans
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} mealTypes - Array of meal types needed
 * @returns {Object} Object with meal type as key and available meals as value
 */
export const getAvailableMealsForPackage = async (date, mealTypes) => {
    try {
        console.log(`📦 Getting available meals for package from ALL plans:`, {
            date,
            mealTypes
        });

        const availableMeals = {};

        for (const mealType of mealTypes) {
            availableMeals[mealType] = await getAvailableMealsForChefSelection(
                date,
                mealType
            );
        }

        const totalMeals = Object.values(availableMeals).flat().length;
        console.log(`✅ Found ${totalMeals} total meals across ${mealTypes.length} meal types from all macro plans`);

        return availableMeals;

    } catch (error) {
        console.error('❌ Error getting available meals for package:', error);
        return {};
    }
};
