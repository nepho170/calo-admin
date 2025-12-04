/**
 * Email Template Configuration
 * Customize email templates and settings here
 */

export const EMAIL_TEMPLATES = {
    // Company branding
    company: {
        name: "Biz Recipe",
        primaryColor: "#FF6B35",
        secondaryColor: "#2C3E50",
        logoUrl: "", // Add your logo URL here
        supportEmail: "support@Biz Recipe.com",
        website: "https://Biz Recipe.com"
    },

    // Status-specific configurations
    statusConfigs: {
        pending: {
            subject: "Order Confirmed - Preparing for Delivery",
            icon: "⏳",
            color: "#FFA726",
            message: "Your order has been confirmed and we're preparing your fresh, healthy meals for delivery!"
        },
        out_for_delivery: {
            subject: "Your Order Is On The Way!",
            icon: "🚚",
            color: "#1976D2",
            message: "Your order is now on its way to you! Please be available to receive your delivery."
        },
        delivered: {
            subject: "Order Delivered Successfully",
            icon: "✅",
            color: "#4CAF50",
            message: "Your order has been successfully delivered! We hope you enjoy your healthy, delicious meals."
        },
        cancelled: {
            subject: "Order Cancelled",
            icon: "❌",
            color: "#F44336",
            message: "Your order has been cancelled. If this was unexpected, please contact our support team immediately."
        }
    },

    // Email footer content
    footer: {
        unsubscribeText: "You received this email because you have an active order with Biz Recipe.",
        supportText: "If you have any questions, please contact our support team.",
        companyAddress: "riz Recipe • Abu Dhabi, UAE"
    },

    // Additional message content for specific statuses
    additionalMessages: {
        delivered: "Don't forget to leave us a review and let us know how we did!",
        cancelled: "If you need to place a new order, you can do so through our website or app."
    }
};

// Email template styles
export const EMAIL_STYLES = {
    body: {
        fontFamily: "Arial, sans-serif",
        margin: "0",
        padding: "20px",
        backgroundColor: "#f5f5f5"
    },
    container: {
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "white",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    },
    button: {
        display: "inline-block",
        padding: "12px 24px",
        textDecoration: "none",
        borderRadius: "6px",
        color: "white",
        fontWeight: "bold"
    }
};
