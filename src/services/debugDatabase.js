import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../configs/firebase';

/**
 * Debug function to check database collections and sample data
 */
export const debugDatabaseCollections = async () => {
    const collections = ['orders', 'customerOrders', 'userMealSelections'];
    const results = {};

    for (const collectionName of collections) {
        try {
            console.log(`🔍 Checking collection: ${collectionName}`);
            const q = query(collection(db, collectionName), limit(5));
            const snapshot = await getDocs(q);

            results[collectionName] = {
                exists: !snapshot.empty,
                count: snapshot.size,
                sampleDocs: snapshot.docs.map(doc => ({
                    id: doc.id,
                    data: doc.data()
                }))
            };

            console.log(`📊 Collection ${collectionName}:`, {
                exists: !snapshot.empty,
                count: snapshot.size,
                sampleIds: snapshot.docs.map(doc => doc.id)
            });

        } catch (error) {
            console.error(`❌ Error checking collection ${collectionName}:`, error);
            results[collectionName] = {
                exists: false,
                error: error.message
            };
        }
    }

    return results;
};

/**
 * Debug function to check for specific order ID
 */
export const debugSpecificOrder = async (orderId = "D5XVSQBuFjsYcxyesTeZ") => {
    const collections = ['orders', 'customerOrders'];

    for (const collectionName of collections) {
        try {
            console.log(`🔍 Looking for order ${orderId} in ${collectionName}`);
            const q = query(
                collection(db, collectionName),
                // Can't use where with ID, so we'll get all and filter
            );
            const snapshot = await getDocs(q);

            const foundOrder = snapshot.docs.find(doc => doc.id === orderId);
            if (foundOrder) {
                console.log(`✅ Found order ${orderId} in ${collectionName}:`, foundOrder.data());
                return { found: true, collection: collectionName, data: foundOrder.data() };
            }
        } catch (error) {
            console.error(`❌ Error searching in ${collectionName}:`, error);
        }
    }

    console.log(`❌ Order ${orderId} not found in any collection`);
    return { found: false };
};
