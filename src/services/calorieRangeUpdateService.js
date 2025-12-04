/**
 * CALORIE RANGE UPDATE SERVICE
 * Service for automatically updating calorie ranges across the system
 */

import { mealPackagesService } from '../services/mealPackages';
import { macroPlansService } from '../services/macroPlans';
import { calculateMealPackageCalorieRange } from '../utils/calorieCalculator';

// ========== BATCH UPDATE FUNCTIONS ==========

/**
 * Update calorie ranges for all meal packages that have auto-calculation enabled
 * @returns {Object} Results of the update operation
 */
export const updateAllAutoCalculatedPackages = async () => {
    try {
        console.log('Starting batch update of auto-calculated meal packages...');

        // Get all meal packages
        const allPackages = await mealPackagesService.getAll();

        // Filter packages that have auto-calculation enabled
        const autoPackages = allPackages.filter(pkg => pkg.isAutoCalculated);

        console.log(`Found ${autoPackages.length} packages with auto-calculation enabled`);

        const results = {
            success: [],
            errors: [],
            totalProcessed: autoPackages.length
        };

        // Update each package
        for (const pkg of autoPackages) {
            try {
                console.log(`Updating package: ${pkg.title}`);

                // Calculate new calorie range
                const calculatedRange = await calculateMealPackageCalorieRange(
                    pkg.macroPlanId,
                    pkg.includedMealTypes
                );

                // Update the package with new calorie range
                const updatedData = {
                    ...pkg,
                    calorieRange: {
                        min: calculatedRange.min,
                        max: calculatedRange.max
                    },
                    lastAutoCalculated: new Date().toISOString()
                };

                await mealPackagesService.update(pkg.id, updatedData);

                results.success.push({
                    id: pkg.id,
                    title: pkg.title,
                    oldRange: pkg.calorieRange,
                    newRange: calculatedRange,
                    change: {
                        minDiff: calculatedRange.min - (pkg.calorieRange?.min || 0),
                        maxDiff: calculatedRange.max - (pkg.calorieRange?.max || 0)
                    }
                });

            } catch (error) {
                console.error(`Error updating package ${pkg.title}:`, error);
                results.errors.push({
                    id: pkg.id,
                    title: pkg.title,
                    error: error.message
                });
            }
        }

        console.log('Batch update completed:', results);
        return results;

    } catch (error) {
        console.error('Error in batch update:', error);
        throw error;
    }
};

/**
 * Update calorie ranges for a specific macro plan's packages
 * @param {string} macroPlanId - The macro plan ID
 * @returns {Object} Results of the update operation
 */
export const updateMacroPlanPackages = async (macroPlanId) => {
    try {
        console.log(`Updating packages for macro plan: ${macroPlanId}`);

        // Get all packages for this macro plan
        const packages = await mealPackagesService.getByMacroPlan(macroPlanId);
        const autoPackages = packages.filter(pkg => pkg.isAutoCalculated);

        const results = {
            success: [],
            errors: [],
            totalProcessed: autoPackages.length
        };

        for (const pkg of autoPackages) {
            try {
                const calculatedRange = await calculateMealPackageCalorieRange(
                    pkg.macroPlanId,
                    pkg.includedMealTypes
                );

                const updatedData = {
                    ...pkg,
                    calorieRange: {
                        min: calculatedRange.min,
                        max: calculatedRange.max
                    },
                    lastAutoCalculated: new Date().toISOString()
                };

                await mealPackagesService.update(pkg.id, updatedData);

                results.success.push({
                    id: pkg.id,
                    title: pkg.title,
                    newRange: calculatedRange
                });

            } catch (error) {
                console.error(`Error updating package ${pkg.title}:`, error);
                results.errors.push({
                    id: pkg.id,
                    title: pkg.title,
                    error: error.message
                });
            }
        }

        return results;

    } catch (error) {
        console.error('Error updating macro plan packages:', error);
        throw error;
    }
};

/**
 * Recalculate macro plan calorie ranges based on its packages
 * @param {string} macroPlanId - The macro plan ID
 * @returns {Object} Updated calorie range for the macro plan
 */
export const updateMacroPlanCalorieRange = async (macroPlanId) => {
    try {
        console.log(`Recalculating macro plan calorie range: ${macroPlanId}`);

        // Get all packages for this macro plan
        const packages = await mealPackagesService.getByMacroPlan(macroPlanId);

        if (packages.length === 0) {
            throw new Error('No packages found for this macro plan');
        }

        // Find min and max across all packages
        let globalMin = Infinity;
        let globalMax = 0;

        packages.forEach(pkg => {
            if (pkg.calorieRange) {
                globalMin = Math.min(globalMin, pkg.calorieRange.min);
                globalMax = Math.max(globalMax, pkg.calorieRange.max);
            }
        });

        // Update the macro plan
        const macroPlan = await macroPlansService.getById(macroPlanId);
        const updatedPlan = {
            ...macroPlan,
            calorieRanges: {
                min: globalMin === Infinity ? 1200 : globalMin,
                max: globalMax === 0 ? 3000 : globalMax
            },
            lastUpdated: new Date().toISOString()
        };

        await macroPlansService.update(macroPlanId, updatedPlan);

        return updatedPlan.calorieRanges;

    } catch (error) {
        console.error('Error updating macro plan calorie range:', error);
        throw error;
    }
};

// ========== VALIDATION AND MONITORING ==========

/**
 * Validate that all auto-calculated packages have reasonable calorie ranges
 * @returns {Object} Validation results
 */
export const validateAutoCalculatedRanges = async () => {
    try {
        const allPackages = await mealPackagesService.getAll();
        const autoPackages = allPackages.filter(pkg => pkg.isAutoCalculated);

        const issues = [];
        const valid = [];

        for (const pkg of autoPackages) {
            const range = pkg.calorieRange;

            // Check for reasonable ranges
            if (!range || range.min <= 0 || range.max <= 0) {
                issues.push({
                    package: pkg.title,
                    issue: 'Invalid calorie range (zero or negative values)',
                    range
                });
            } else if (range.min >= range.max) {
                issues.push({
                    package: pkg.title,
                    issue: 'Minimum calories >= maximum calories',
                    range
                });
            } else if (range.min < 800 || range.max > 4000) {
                issues.push({
                    package: pkg.title,
                    issue: 'Calorie range outside normal bounds (800-4000)',
                    range
                });
            } else if ((range.max - range.min) > 2000) {
                issues.push({
                    package: pkg.title,
                    issue: 'Very large calorie range (>2000 calorie difference)',
                    range
                });
            } else {
                valid.push({
                    package: pkg.title,
                    range
                });
            }
        }

        return {
            totalChecked: autoPackages.length,
            valid: valid.length,
            issues: issues.length,
            validPackages: valid,
            problemPackages: issues
        };

    } catch (error) {
        console.error('Error validating auto-calculated ranges:', error);
        throw error;
    }
};

// ========== EXPORT SERVICE ==========

export const calorieRangeUpdateService = {
    updateAllAutoCalculatedPackages,
    updateMacroPlanPackages,
    updateMacroPlanCalorieRange,
    validateAutoCalculatedRanges
};

export default calorieRangeUpdateService;
