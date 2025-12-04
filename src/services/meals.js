import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../configs/firebase';

const COLLECTION_NAME = 'meals';

// ========== MEALS OPERATIONS ==========

export const mealsService = {
    // Get all active meals
    getAll: async () => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                orderBy('title')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all meals:', error);
            throw error;
        }
    },

    // Get all meals (including inactive) - for admin purposes
    getAllIncludingInactive: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all meals including inactive:', error);
            throw error;
        }
    },

    // Get meal by ID
    getById: async (mealId) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, mealId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting meal ${mealId}:`, error);
            throw error;
        }
    },

    // Get component names for a meal by ID
    getComponentNames: async (mealId) => {
        try {
            const meal = await mealsService.getById(mealId);
            if (!meal || !meal.components) {
                return {};
            }

            const componentMap = {};
            meal.components.forEach(component => {
                if (component.componentId && component.name) {
                    componentMap[component.componentId] = component.name;
                }
            });

            return componentMap;
        } catch (error) {
            console.error(`Error getting component names for meal ${mealId}:`, error);
            throw error;
        }
    },

    // Get multiple meals with their component names
    getMultipleWithComponents: async (mealIds) => {
        try {
            const meals = {};
            const componentMaps = {};

            for (const mealId of mealIds) {
                const meal = await mealsService.getById(mealId);
                // Only include active meals
                if (meal && meal.isActive !== false) {
                    meals[mealId] = meal;
                    componentMaps[mealId] = await mealsService.getComponentNames(mealId);
                }
            }

            return { meals, componentMaps };
        } catch (error) {
            console.error('Error getting multiple meals with components:', error);
            throw error;
        }
    },

    // Get active meals by IDs (useful for month templates)
    getActiveByIds: async (mealIds) => {
        try {
            const meals = [];

            for (const mealId of mealIds) {
                const meal = await mealsService.getById(mealId);
                // Only include active meals
                if (meal && meal.isActive !== false) {
                    meals.push(meal);
                }
            }

            return meals;
        } catch (error) {
            console.error('Error getting active meals by IDs:', error);
            throw error;
        }
    },

    // Get meals by type (breakfast, lunch, dinner, snack)
    getByType: async (type) => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('type', '==', type),
                where('isActive', '==', true),
                orderBy('title')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting meals by type:', error);
            throw error;
        }
    },

    // Get featured meals
    getFeatured: async () => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isFeatured', '==', true),
                where('isActive', '==', true),
                orderBy('title')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting featured meals:', error);
            throw error;
        }
    },

    // Search meals by title
    searchByTitle: async (searchTerm) => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                orderBy('title')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(meal =>
                    meal.title.toLowerCase().includes(searchTerm.toLowerCase())
                );
        } catch (error) {
            console.error('Error searching meals:', error);
            throw error;
        }
    },

    // Add new meal
    add: async (mealData, userId) => {
        try {
            const docData = {
                ...mealData,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: userId || 'admin'
            };

            const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
            return docRef.id;
        } catch (error) {
            console.error('Error adding meal:', error);
            throw error;
        }
    },

    // Update meal
    update: async (mealId, mealData) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, mealId);
            await updateDoc(docRef, {
                ...mealData,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error(`Error updating meal ${mealId}:`, error);
            throw error;
        }
    },

    // Soft delete meal (set isActive to false)
    delete: async (mealId) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, mealId);
            await updateDoc(docRef, {
                isActive: false,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error(`Error deleting meal ${mealId}:`, error);
            throw error;
        }
    },

    // Hard delete meal (permanently remove)
    hardDelete: async (mealId) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, mealId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error(`Error hard deleting meal ${mealId}:`, error);
            throw error;
        }
    },

    // Toggle featured status
    toggleFeatured: async (mealId, isFeatured) => {
        try {
            const docRef = doc(db, COLLECTION_NAME, mealId);
            await updateDoc(docRef, {
                isFeatured,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error(`Error toggling featured status for meal ${mealId}:`, error);
            throw error;
        }
    },

    // Get meals with pagination
    getPaginated: async (lastDoc = null, limitCount = 10) => {
        try {
            let q = query(
                collection(db, COLLECTION_NAME),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const querySnapshot = await getDocs(q);
            const meals = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                meals,
                lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
                hasMore: querySnapshot.docs.length === limitCount
            };
        } catch (error) {
            console.error('Error getting paginated meals:', error);
            throw error;
        }
    }
};

// ========== MEAL INGREDIENTS ARRAY OPERATIONS ==========

export const mealIngredientsService = {
    // Get all ingredients for a meal (from the meal document's ingredients array)
    getByMealId: async (mealId) => {
        try {
            const meal = await mealsService.getById(mealId);
            return meal?.ingredients || [];
        } catch (error) {
            console.error(`Error getting ingredients for meal ${mealId}:`, error);
            throw error;
        }
    },

    // Add ingredient to meal's ingredients array
    addToMeal: async (mealId, ingredientData) => {
        try {
            const meal = await mealsService.getById(mealId);
            if (!meal) {
                throw new Error('Meal not found');
            }

            const newIngredient = {
                ...ingredientData,
                ingredientId: `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const updatedIngredients = [...(meal.ingredients || []), newIngredient];

            const docRef = doc(db, COLLECTION_NAME, mealId);
            await updateDoc(docRef, {
                ingredients: updatedIngredients,
                updatedAt: serverTimestamp()
            });

            return newIngredient.ingredientId;
        } catch (error) {
            console.error(`Error adding ingredient to meal ${mealId}:`, error);
            throw error;
        }
    },

    // Update meal ingredient in the ingredients array
    updateIngredient: async (mealId, ingredientId, ingredientData) => {
        try {
            const meal = await mealsService.getById(mealId);
            if (!meal) {
                throw new Error('Meal not found');
            }

            const ingredients = meal.ingredients || [];
            const ingredientIndex = ingredients.findIndex(ing => ing.ingredientId === ingredientId);

            if (ingredientIndex === -1) {
                throw new Error('Ingredient not found');
            }

            ingredients[ingredientIndex] = {
                ...ingredientData,
                ingredientId: ingredients[ingredientIndex].ingredientId, // Preserve the original ingredientId
                createdAt: ingredients[ingredientIndex].createdAt, // Preserve original createdAt
                updatedAt: new Date().toISOString()
            };

            const docRef = doc(db, COLLECTION_NAME, mealId);
            await updateDoc(docRef, {
                ingredients: ingredients,
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error(`Error updating ingredient ${ingredientId} in meal ${mealId}:`, error);
            throw error;
        }
    },

    // Delete ingredient from meal's ingredients array
    deleteFromMeal: async (mealId, ingredientId) => {
        try {
            const meal = await mealsService.getById(mealId);
            if (!meal) {
                throw new Error('Meal not found');
            }

            const updatedIngredients = (meal.ingredients || []).filter(
                ing => ing.ingredientId !== ingredientId
            );

            const docRef = doc(db, COLLECTION_NAME, mealId);
            await updateDoc(docRef, {
                ingredients: updatedIngredients,
                updatedAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error(`Error deleting ingredient ${ingredientId} from meal ${mealId}:`, error);
            throw error;
        }
    },

    // Get single ingredient from meal's ingredients array
    getIngredient: async (mealId, ingredientId) => {
        try {
            const meal = await mealsService.getById(mealId);
            if (!meal) {
                return null;
            }

            const ingredient = (meal.ingredients || []).find(
                ing => ing.ingredientId === ingredientId
            );

            return ingredient || null;
        } catch (error) {
            console.error(`Error getting ingredient ${ingredientId} from meal ${mealId}:`, error);
            throw error;
        }
    }
};

// ========== VALIDATION HELPERS ==========

export const mealValidation = {
    // Validate meal data before saving
    validateMeal: (mealData) => {
        const errors = [];

        if (!mealData.title || mealData.title.trim().length < 3) {
            errors.push('Title must be at least 3 characters long');
        }

        if (!mealData.description || mealData.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters long');
        }

        if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealData.type)) {
            errors.push('Type must be breakfast, lunch, dinner, or snack');
        }

        if (!mealData.totalNutrition) {
            errors.push('Total nutrition is required');
        } else {
            const nutrition = mealData.totalNutrition;
            if (!nutrition.calories || nutrition.calories <= 0) {
                errors.push('Calories must be greater than 0');
            }
            if (!nutrition.protein || nutrition.protein < 0) {
                errors.push('Protein cannot be negative');
            }
            if (!nutrition.carbs || nutrition.carbs < 0) {
                errors.push('Carbs cannot be negative');
            }
            if (!nutrition.fat || nutrition.fat < 0) {
                errors.push('Fat cannot be negative');
            }
        }



        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Validate meal ingredient data
    validateIngredient: (ingredientData) => {
        const errors = [];

        if (!ingredientData.name || ingredientData.name.trim().length < 2) {
            errors.push('Ingredient name must be at least 2 characters long');
        }

        if (!ingredientData.quantity || ingredientData.quantity <= 0) {
            errors.push('Quantity must be greater than 0');
        }

        if (!ingredientData.unit || ingredientData.unit.trim().length < 1) {
            errors.push('Unit is required');
        }

        if (!ingredientData.nutrition) {
            errors.push('Nutrition information is required');
        } else {
            const nutrition = ingredientData.nutrition;
            if (nutrition.calories < 0) {
                errors.push('Calories cannot be negative');
            }
            if (nutrition.protein < 0) {
                errors.push('Protein cannot be negative');
            }
            if (nutrition.carbs < 0) {
                errors.push('Carbs cannot be negative');
            }
            if (nutrition.fat < 0) {
                errors.push('Fat cannot be negative');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
