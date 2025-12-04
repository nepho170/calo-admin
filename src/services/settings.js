import { db } from "../configs/firebase";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";

const SETTINGS_COLLECTION = "appSettings";

/**
 * Get all app settings
 */
export const getAppSettings = async () => {
    try {
        const settingsRef = collection(db, SETTINGS_COLLECTION);
        const snapshot = await getDocs(settingsRef);

        const settings = {};
        snapshot.forEach((doc) => {
            settings[doc.id] = doc.data();
        });

        return settings;
    } catch (error) {
        console.error("Error fetching app settings:", error);
        throw error;
    }
};

/**
 * Get a specific setting by key
 */
export const getSetting = async (key) => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, key);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error fetching setting ${key}:`, error);
        throw error;
    }
};

/**
 * Update or create a setting
 */
export const updateSetting = async (key, data) => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, key);
        const settingData = {
            ...data,
            updatedAt: serverTimestamp(),
        };

        await setDoc(docRef, settingData, { merge: true });
        return settingData;
    } catch (error) {
        console.error(`Error updating setting ${key}:`, error);
        throw error;
    }
};

/**
 * Update multiple settings at once
 */
export const updateMultipleSettings = async (settingsObject) => {
    try {
        const promises = Object.entries(settingsObject).map(([key, data]) =>
            updateSetting(key, data)
        );

        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error("Error updating multiple settings:", error);
        throw error;
    }
};

/**
 * Initialize default settings if they don't exist
 */
export const initializeDefaultSettings = async () => {
    try {
        const defaultSettings = {
            termsAndConditions: {
                title: "Terms and Conditions",
                content: "Please enter your terms and conditions here...",
                enabled: true,
                version: "1.0",
            },
            aboutUs: {
                title: "About Us",
                content: "Please enter information about your company here...",
                enabled: true,
            },
            privacyPolicy: {
                title: "Privacy Policy",
                content: "Please enter your privacy policy here...",
                enabled: true,
                version: "1.0",
            },
            contactInfo: {
                title: "Contact Information",
                email: "contact@example.com",
                phone: "+1 (555) 123-4567",
                whatsapp: "+1 (555) 123-4567",
                address: "123 Main Street, City, State 12345",
                enabled: true,
            },
            socialMedia: {
                title: "Social Media Links",
                facebook: "",
                instagram: "",
                twitter: "",
                linkedin: "",
                tiktok: "",
                enabled: true,
            },
            faq: {
                title: "Frequently Asked Questions",
                enabled: true,
                items: [
                    {
                        id: "1",
                        question: "How do I place an order?",
                        answer: "You can place an order through our mobile app by selecting your meals and choosing your delivery preferences.",
                        category: "Orders",
                        order: 0,
                        createdAt: new Date().toISOString(),
                    },
                    {
                        id: "2",
                        question: "What payment methods do you accept?",
                        answer: "We accept all major credit cards, debit cards, and digital payment methods.",
                        category: "Payment",
                        order: 1,
                        createdAt: new Date().toISOString(),
                    },
                    {
                        id: "3",
                        question: "Can I modify my dietary preferences?",
                        answer: "Yes, you can update your dietary preferences anytime in your profile settings.",
                        category: "Diet",
                        order: 2,
                        createdAt: new Date().toISOString(),
                    },
                ],
            },
            promocodes: {
                title: "Promocodes Management",
                enabled: true,
                codes: [],
            },
        };

        // Check if settings already exist and only create missing ones
        const existingSettings = await getAppSettings();

        const promises = Object.entries(defaultSettings).map(async ([key, data]) => {
            if (!existingSettings[key]) {
                await updateSetting(key, data);
            }
        });

        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error("Error initializing default settings:", error);
        throw error;
    }
};

/**
 * Get public settings (for client app consumption)
 */
export const getPublicSettings = async () => {
    try {
        const allSettings = await getAppSettings();

        // Filter only enabled settings and remove sensitive data
        const publicSettings = {};

        Object.entries(allSettings).forEach(([key, setting]) => {
            if (setting.enabled) {
                publicSettings[key] = {
                    ...setting,
                    // Remove timestamps and other admin-only fields
                    updatedAt: undefined,
                };
            }
        });

        return publicSettings;
    } catch (error) {
        console.error("Error fetching public settings:", error);
        throw error;
    }
};

/**
 * FAQ-specific functions
 */

/**
 * Get all FAQs
 */
export const getFAQs = async () => {
    try {
        const setting = await getSetting("faq");
        return setting?.items || [];
    } catch (error) {
        console.error("Error fetching FAQs:", error);
        throw error;
    }
};

/**
 * Add a new FAQ item
 */
export const addFAQ = async (question, answer, category = "General") => {
    try {
        const currentFAQ = await getSetting("faq");
        const items = currentFAQ?.items || [];

        const newFAQ = {
            id: Date.now().toString(), // Simple ID generation
            question: question.trim(),
            answer: answer.trim(),
            category: category.trim(),
            order: items.length,
            createdAt: new Date().toISOString(),
        };

        const updatedItems = [...items, newFAQ];

        await updateSetting("faq", {
            title: "Frequently Asked Questions",
            enabled: currentFAQ?.enabled || true,
            items: updatedItems,
        });

        return newFAQ;
    } catch (error) {
        console.error("Error adding FAQ:", error);
        throw error;
    }
};

/**
 * Update an existing FAQ item
 */
export const updateFAQ = async (faqId, updates) => {
    try {
        const currentFAQ = await getSetting("faq");
        const items = currentFAQ?.items || [];

        const updatedItems = items.map((item) =>
            item.id === faqId
                ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                : item
        );

        await updateSetting("faq", {
            ...currentFAQ,
            items: updatedItems,
        });

        return updatedItems.find((item) => item.id === faqId);
    } catch (error) {
        console.error("Error updating FAQ:", error);
        throw error;
    }
};

/**
 * Delete an FAQ item
 */
export const deleteFAQ = async (faqId) => {
    try {
        const currentFAQ = await getSetting("faq");
        const items = currentFAQ?.items || [];

        const updatedItems = items.filter((item) => item.id !== faqId);

        await updateSetting("faq", {
            ...currentFAQ,
            items: updatedItems,
        });

        return true;
    } catch (error) {
        console.error("Error deleting FAQ:", error);
        throw error;
    }
};

/**
 * Reorder FAQ items
 */
export const reorderFAQs = async (reorderedItems) => {
    try {
        const currentFAQ = await getSetting("faq");

        // Update order property based on new positions
        const updatedItems = reorderedItems.map((item, index) => ({
            ...item,
            order: index,
            updatedAt: new Date().toISOString(),
        }));

        await updateSetting("faq", {
            ...currentFAQ,
            items: updatedItems,
        });

        return updatedItems;
    } catch (error) {
        console.error("Error reordering FAQs:", error);
        throw error;
    }
};

/**
 * Promocodes-specific functions
 */

/**
 * Get all promocodes
 */
export const getPromocodes = async () => {
    try {
        const setting = await getSetting("promocodes");
        return setting?.codes || [];
    } catch (error) {
        console.error("Error fetching promocodes:", error);
        throw error;
    }
};

/**
 * Add a new promocode
 */
export const addPromocode = async (promocode) => {
    try {
        const currentPromocodes = await getSetting("promocodes");
        const codes = currentPromocodes?.codes || [];

        const newPromocode = {
            id: Date.now().toString(),
            name: promocode.name,
            code: promocode.code.toUpperCase(),
            discountType: promocode.discountType, // "percentage" or "fixed"
            discountValue: parseFloat(promocode.discountValue),
            isActive: promocode.isActive !== undefined ? promocode.isActive : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedCodes = [...codes, newPromocode];

        await updateSetting("promocodes", {
            title: "Promocodes Management",
            enabled: true,
            codes: updatedCodes,
        });

        return newPromocode;
    } catch (error) {
        console.error("Error adding promocode:", error);
        throw error;
    }
};

/**
 * Update an existing promocode
 */
export const updatePromocode = async (promocodeId, updates) => {
    try {
        const currentPromocodes = await getSetting("promocodes");
        const codes = currentPromocodes?.codes || [];

        const updatedCodes = codes.map((code) =>
            code.id === promocodeId
                ? {
                    ...code,
                    ...updates,
                    code: updates.code ? updates.code.toUpperCase() : code.code,
                    discountValue: updates.discountValue ? parseFloat(updates.discountValue) : code.discountValue,
                    updatedAt: new Date().toISOString(),
                }
                : code
        );

        await updateSetting("promocodes", {
            ...currentPromocodes,
            codes: updatedCodes,
        });

        return updatedCodes.find((code) => code.id === promocodeId);
    } catch (error) {
        console.error("Error updating promocode:", error);
        throw error;
    }
};

/**
 * Delete a promocode
 */
export const deletePromocode = async (promocodeId) => {
    try {
        const currentPromocodes = await getSetting("promocodes");
        const codes = currentPromocodes?.codes || [];

        const updatedCodes = codes.filter((code) => code.id !== promocodeId);

        await updateSetting("promocodes", {
            ...currentPromocodes,
            codes: updatedCodes,
        });

        return true;
    } catch (error) {
        console.error("Error deleting promocode:", error);
        throw error;
    }
};

/**
 * Toggle promocode active status
 */
export const togglePromocodeStatus = async (promocodeId) => {
    try {
        const currentPromocodes = await getSetting("promocodes");
        const codes = currentPromocodes?.codes || [];

        const updatedCodes = codes.map((code) =>
            code.id === promocodeId
                ? {
                    ...code,
                    isActive: !code.isActive,
                    updatedAt: new Date().toISOString(),
                }
                : code
        );

        await updateSetting("promocodes", {
            ...currentPromocodes,
            codes: updatedCodes,
        });

        return updatedCodes.find((code) => code.id === promocodeId);
    } catch (error) {
        console.error("Error toggling promocode status:", error);
        throw error;
    }
};
