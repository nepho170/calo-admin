/**
 * AUTOMATIC CALORIE RANGE CALCULATION UTILITIES
 * For automatically calculating min/max calories for meal packages and macro plans
 */

import { mealsService } from '../services/meals';
import { masterMonthTemplatesService } from '../services/masterMonthTemplates';
import { macroPlansService } from '../services/macroPlans';

// ========== MEAL PACKAGE CALORIE CALCULATIONS ==========

/**
 * Calculate calorie range for a meal package using macro plan stored info
 * @param {string} macroPlanId - The macro plan ID
 * @param {Array} includedMealTypes - Array of meal types ["breakfast", "lunch", "dinner", "snack"]
 * @param {Object} mealTypeCounts - Optional: number of each meal type selected (e.g. { breakfast: 1, lunch: 1, dinner: 1, snack: 0 })
 * @returns {Object} { min: number, max: number, details: Array }
 */
export const calculateMealPackageCalorieRange = async (macroPlanId, includedMealTypes, mealTypeCounts = {}) => {
    try {
        const macroPlan = await macroPlansService.getById(macroPlanId);
        if (!macroPlan || !macroPlan.mealTypeCalories) {
            throw new Error('Macro plan or mealTypeCalories not found');
        }
        let min = 0;
        let max = 0;
        const details = [];
        for (const mealType of includedMealTypes) {
            const count = mealTypeCounts[mealType] || 1;
            const calRange = macroPlan.mealTypeCalories[mealType] || { min: 0, max: 0 };
            min += calRange.min * count;
            max += calRange.max * count;
            details.push({ mealType, count, min: calRange.min, max: calRange.max });
        }
        return { min, max, details };
    } catch (error) {
        console.error('Error calculating meal package calorie range:', error);
        throw error;
    }
};

/**
 * Calculate calories for a single day
 * @param {Object} mealOptions - Day's meal options { breakfast: [], lunch: [], dinner: [], snack: [] }
 * @param {Array} includedMealTypes - Which meal types to include in calculation (e.g., ["breakfast", "lunch", "dinner", "snack"])
 * @returns {Object} { totalCalories: number, mealDetails: Array }
 */
const calculateDayCalories = async (mealOptions, includedMealTypes) => {
    let totalCalories = 0;
    const mealDetails = [];

    console.log(`Calculating day calories for meal types: ${includedMealTypes.join(', ')}`);

    for (const mealType of includedMealTypes) {
        const mealIds = mealOptions[mealType] || [];

        console.log(`  ${mealType}: ${mealIds.length} options available`);

        if (mealIds.length > 0) {
            // Take the first meal option for consistent calculation
            // This ensures predictable min/max ranges
            const mealId = mealIds[0];

            try {
                const meal = await mealsService.getById(mealId);

                if (meal && meal.totalNutrition && meal.totalNutrition.calories) {
                    const mealCalories = meal.totalNutrition.calories;
                    totalCalories += mealCalories;

                    console.log(`    Selected: "${meal.title}" (${mealCalories} cal)`);

                    mealDetails.push({
                        type: mealType,
                        mealId: meal.id,
                        title: meal.title,
                        calories: mealCalories,
                        availableOptions: mealIds.length
                    });
                } else {
                    console.warn(`Meal ${mealId} has no calorie data`);
                }
            } catch (error) {
                console.warn(`Could not fetch meal ${mealId}:`, error);
            }
        } else {
            console.log(`    No ${mealType} options available for this day`);
        }
    }

    console.log(`  Total day calories: ${totalCalories}`);

    return {
        totalCalories,
        mealDetails
    };
};

// ========== MACRO PLAN CALORIE CALCULATIONS ==========

/**
 * Calculate automatic calorie range for a macro plan based on all its meal packages
 * @param {string} macroPlanId - The macro plan ID
 * @returns {Object} { min: number, max: number, packages: Array }
 */
export const calculateMacroPlanCalorieRange = async (macroPlanId) => {
    try {
        // This would require getting all meal packages for this macro plan
        // For now, return a placeholder - you'd need to implement mealPackagesService.getByMacroPlan()
        console.log(`Calculating macro plan calorie range for ${macroPlanId}`);

        // You would implement this by:
        // 1. Get all meal packages for this macro plan
        // 2. Calculate calorie range for each package
        // 3. Return overall min/max across all packages

        return {
            min: 1200,
            max: 3000,
            packages: []
        };
    } catch (error) {
        console.error('Error calculating macro plan calorie range:', error);
        throw error;
    }
};

// ========== WEEKLY MENU CALCULATIONS ==========

/**
 * Calculate weekly nutrition summary for a macro plan
 * @param {string} macroPlanId - The macro plan ID
 * @param {Array} includedMealTypes - Which meal types to include
 * @param {number} numberOfDays - How many days to calculate (3, 5, 7, etc.)
 * @returns {Object} Weekly nutrition summary
 */
export const calculateWeeklyNutritionSummary = async (macroPlanId, includedMealTypes, numberOfDays = 7) => {
    try {
        const templates = await masterMonthTemplatesService.getByMacroPlan(macroPlanId);

        if (!templates || templates.length === 0) {
            throw new Error(`No master month template found for macro plan ${macroPlanId}`);
        }

        const template = templates.find(t => t.isDefault) || templates[0];
        const weeklyData = [];

        // Calculate for specified number of days
        for (let dayNum = 1; dayNum <= numberOfDays; dayNum++) {
            const dayKey = `day${dayNum}`;
            const dayData = template.masterDays[dayKey];

            if (dayData && dayData.mealOptions) {
                const dayNutrition = await calculateDayNutrition(dayData.mealOptions, includedMealTypes);
                weeklyData.push({
                    day: dayNum,
                    label: dayData.dayLabel,
                    ...dayNutrition
                });
            }
        }

        // Calculate weekly averages
        const totalDays = weeklyData.length;
        const weeklyTotals = weeklyData.reduce((totals, day) => ({
            calories: totals.calories + day.calories,
            protein: totals.protein + day.protein,
            carbs: totals.carbs + day.carbs,
            fat: totals.fat + day.fat
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        return {
            weeklyData,
            averages: {
                calories: Math.round(weeklyTotals.calories / totalDays),
                protein: Math.round(weeklyTotals.protein / totalDays),
                carbs: Math.round(weeklyTotals.carbs / totalDays),
                fat: Math.round(weeklyTotals.fat / totalDays)
            },
            totals: weeklyTotals
        };

    } catch (error) {
        console.error('Error calculating weekly nutrition summary:', error);
        throw error;
    }
};

/**
 * Calculate complete nutrition for a single day
 * @param {Object} mealOptions - Day's meal options
 * @param {Array} includedMealTypes - Which meal types to include
 * @returns {Object} Complete nutrition data
 */
const calculateDayNutrition = async (mealOptions, includedMealTypes) => {
    let nutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
    };

    const mealDetails = [];

    for (const mealType of includedMealTypes) {
        const mealIds = mealOptions[mealType] || [];

        if (mealIds.length > 0) {
            const mealId = mealIds[0]; // Take first option

            try {
                const meal = await mealsService.getById(mealId);

                if (meal && meal.totalNutrition) {
                    const mealNutrition = meal.totalNutrition;

                    nutrition.calories += mealNutrition.calories || 0;
                    nutrition.protein += mealNutrition.protein || 0;
                    nutrition.carbs += mealNutrition.carbs || 0;
                    nutrition.fat += mealNutrition.fat || 0;
                    nutrition.fiber += mealNutrition.fiber || 0;
                    nutrition.sugar += mealNutrition.sugar || 0;
                    nutrition.sodium += mealNutrition.sodium || 0;

                    mealDetails.push({
                        type: mealType,
                        meal: meal
                    });
                }
            } catch (error) {
                console.warn(`Could not fetch meal ${mealId}:`, error);
            }
        }
    }

    return {
        ...nutrition,
        mealDetails
    };
};

// ========== EXPORT DEFAULT CALCULATION FUNCTIONS ==========

export const calorieCalculator = {
    calculateMealPackageCalorieRange,
    calculateMacroPlanCalorieRange,
    calculateWeeklyNutritionSummary
};

export default calorieCalculator;

// ========== EXAMPLE CALCULATIONS ==========

/**
 * Example calculation demonstrations
 */
export const exampleCalculations = {

    // Example 1: Complete Daily Package (all 4 meal types)
    completeDailyPackage: {
        macroPlanId: "high_protein_plan",
        includedMealTypes: ["breakfast", "lunch", "dinner", "snack"],
        expectedResult: "Sum of all 4 meal types per day",
        sampleDay: {
            breakfast: "Protein Smoothie (380 cal)",
            lunch: "Grilled Chicken Salad (520 cal)",
            dinner: "Salmon with Quinoa (720 cal)",
            snack: "Greek Yogurt with Nuts (280 cal)",
            total: "1900 calories"
        }
    },

    // Example 2: Main Meals Only (3 meal types)
    mainMealsOnly: {
        macroPlanId: "balanced_nutrition_plan",
        includedMealTypes: ["breakfast", "lunch", "dinner"],
        expectedResult: "Sum of 3 main meals per day",
        sampleDay: {
            breakfast: "Oatmeal with Berries (350 cal)",
            lunch: "Turkey Wrap (480 cal)",
            dinner: "Pasta with Vegetables (650 cal)",
            snack: "Not included",
            total: "1480 calories"
        }
    },

    // Example 3: Lunch & Dinner Only (2 meal types)
    lunchDinnerOnly: {
        macroPlanId: "keto_friendly_plan",
        includedMealTypes: ["lunch", "dinner"],
        expectedResult: "Sum of lunch and dinner only",
        sampleDay: {
            breakfast: "Not included",
            lunch: "Keto Chicken Bowl (580 cal)",
            dinner: "Steak with Vegetables (720 cal)",
            snack: "Not included",
            total: "1300 calories"
        }
    },

    // Example 4: Snacks Only Package (1 meal type)
    snacksOnly: {
        macroPlanId: "high_protein_plan",
        includedMealTypes: ["snack"],
        expectedResult: "Just snack calories",
        sampleDay: {
            breakfast: "Not included",
            lunch: "Not included",
            dinner: "Not included",
            snack: "Protein Bar (250 cal)",
            total: "250 calories"
        }
    }
};

/**
 * Test function to demonstrate calculations
 */
export const demonstrateCalculations = async (macroPlanId, includedMealTypes) => {
    console.log('\n🎯 CALORIE CALCULATION DEMONSTRATION');
    console.log('=====================================');
    console.log(`Macro Plan: ${macroPlanId}`);
    console.log(`Package includes: ${includedMealTypes.join(', ')}`);
    console.log('');

    console.log('How it works:');
    console.log('1. Get master month template for the macro plan');
    console.log('2. For each day (1-31), sum calories from included meal types');
    console.log('3. Take FIRST meal option for each meal type (consistent results)');
    console.log('4. Calculate min/max across all days');
    console.log('');

    if (includedMealTypes.includes('snack')) {
        console.log('✅ SNACKS INCLUDED in calculation');
    } else {
        console.log('❌ Snacks NOT included in calculation');
    }

    console.log('');
    console.log('Sample calculation for one day:');

    if (includedMealTypes.includes('breakfast')) {
        console.log('  Breakfast: First breakfast option = XXX calories');
    }
    if (includedMealTypes.includes('lunch')) {
        console.log('  Lunch: First lunch option = XXX calories');
    }
    if (includedMealTypes.includes('dinner')) {
        console.log('  Dinner: First dinner option = XXX calories');
    }
    if (includedMealTypes.includes('snack')) {
        console.log('  Snack: First snack option = XXX calories');
    }

    console.log('  ----------------------------------------');
    console.log('  TOTAL DAY = Sum of all included meal types');
    console.log('');
    console.log('Repeat for all 31 days → Find min/max → Display range');
    console.log('');

    try {
        const result = await calculateMealPackageCalorieRange(macroPlanId, includedMealTypes);
        console.log('🎉 FINAL RESULT:');
        console.log(`   Range: ${result.min} - ${result.max} calories`);
        console.log(`   Average: ${result.average} calories`);
        console.log(`   Based on: ${result.calculatedFromDays} valid days`);
        console.log('');

        return result;
    } catch (error) {
        console.error('❌ Calculation failed:', error.message);
        throw error;
    }
};
