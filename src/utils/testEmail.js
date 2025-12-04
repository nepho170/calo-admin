/**
 * Test Email Functionality
 * Run this in your browser console to test email notifications
 */

// Test function to send an email notification
async function testEmailNotification() {
    try {
        const testOrderData = {
            orderId: 'test-order-123',
            customerEmail: 'test@example.com', // Replace with your test email
            customerName: 'Test Customer',
            status: 'pending',
            date: '2025-07-25',
            notes: 'This is a test email notification'
        };

        // Import Firebase functions
        const { getFunctions, httpsCallable } = await import('firebase/functions');

        // Get the functions instance
        const functions = getFunctions();
        const sendOrderStatusEmail = httpsCallable(functions, 'sendOrderStatusEmail');

        console.log('Sending test email...', testOrderData);

        const result = await sendOrderStatusEmail(testOrderData);

        console.log('✅ Email sent successfully!', result.data);
        return result.data;

    } catch (error) {
        console.error('❌ Failed to send test email:', error);
        throw error;
    }
}

// Uncomment the line below to run the test
// testEmailNotification();

console.log('📧 Email test function loaded. Call testEmailNotification() to test.');
