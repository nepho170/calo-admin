/**
 * Utility to bulk update all meal package pricing based on their macro plans
 * Run this in the browser console or as a standalone script if needed
 */

// This function can be used to update all meal packages pricing
// based on their associated macro plans
export const bulkUpdateMealPackagePricing = async () => {
    try {
        console.log('Starting bulk update of meal package pricing...');

        // Import services (use dynamic import if running in browser)
        const { macroPlansService } = await import('../src/services/macroPlans.js');
        const { mealPackagesService } = await import('../src/services/mealPackages.js');

        // Get all active macro plans
        const macroPlans = await macroPlansService.getActive();
        console.log(`Found ${macroPlans.length} active macro plans`);

        let totalPackagesUpdated = 0;

        // For each macro plan, update its associated meal packages
        for (const macroPlan of macroPlans) {
            if (macroPlan.mealTypePricing) {
                console.log(`Updating packages for macro plan: ${macroPlan.title}`);

                try {
                    await mealPackagesService.updatePricingFromMacroPlan(macroPlan.id, macroPlan);

                    // Count how many packages were updated
                    const packages = await mealPackagesService.getByMacroPlan(macroPlan.id);
                    totalPackagesUpdated += packages.length;

                } catch (error) {
                    console.error(`Error updating packages for macro plan ${macroPlan.title}:`, error);
                }
            } else {
                console.log(`Macro plan ${macroPlan.title} has no meal type pricing configured`);
            }
        }

        console.log(`✅ Bulk update completed! Updated pricing for ${totalPackagesUpdated} meal packages`);
        return { success: true, packagesUpdated: totalPackagesUpdated };

    } catch (error) {
        console.error('❌ Error during bulk update:', error);
        return { success: false, error: error.message };
    }
};

// Function to update pricing for a specific macro plan
export const updatePricingForMacroPlan = async (macroPlanId) => {
    try {
        console.log(`Updating pricing for macro plan: ${macroPlanId}`);

        const { macroPlansService } = await import('../src/services/macroPlans.js');
        const { mealPackagesService } = await import('../src/services/mealPackages.js');

        // Get the macro plan
        const macroPlan = await macroPlansService.getById(macroPlanId);
        if (!macroPlan) {
            throw new Error(`Macro plan ${macroPlanId} not found`);
        }

        if (!macroPlan.mealTypePricing) {
            console.log('Macro plan has no meal type pricing configured');
            return { success: true, message: 'No pricing to update' };
        }

        // Update the packages
        await mealPackagesService.updatePricingFromMacroPlan(macroPlanId, macroPlan);

        // Count updated packages
        const packages = await mealPackagesService.getByMacroPlan(macroPlanId);

        console.log(`✅ Updated pricing for ${packages.length} meal packages`);
        return { success: true, packagesUpdated: packages.length };

    } catch (error) {
        console.error('❌ Error updating pricing:', error);
        return { success: false, error: error.message };
    }
};

// Console helper functions (for browser console usage)
if (typeof window !== 'undefined') {
    window.updateAllMealPackagePricing = bulkUpdateMealPackagePricing;
    window.updateMacroPlanPricing = updatePricingForMacroPlan;

    console.log('🔧 Pricing update utilities loaded!');
    console.log('Use these functions in the browser console:');
    console.log('- updateAllMealPackagePricing() - Update all meal packages');
    console.log('- updateMacroPlanPricing(macroPlanId) - Update specific macro plan packages');
}
