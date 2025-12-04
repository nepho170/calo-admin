# Email Notification System - Quick Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd functions
npm install
cd ..
```

### 2. Configure Email Settings

You have two options for email configuration:

#### Option A: Using Firebase Functions Config (Recommended)

```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

#### Option B: Using Environment Variables

1. Copy `functions/.env.example` to `functions/.env`
2. Fill in your email credentials

### 3. Deploy the System

```bash
# Quick deployment using our script
npm run deploy:email

# Or manually
firebase deploy --only functions
```

### 4. Test the System

1. Open the riz Recipe Admin Dashboard
2. Click "Test Email Notifications" in the Admin Tools section
3. Enter your email address and send a test notification

## 📧 Email Provider Setup

### Gmail (Recommended)

1. Enable 2-Factor Authentication in your Google Account
2. Go to Google Account Settings > Security > App Passwords
3. Generate an app password for "Mail"
4. Use this app password (not your regular password) in the configuration

### Other Providers

Modify the email configuration in `functions/index.js`:

```javascript
const emailConfig = {
  service: "outlook", // or 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};
```

## 🧪 Testing

### Test from Dashboard

- Use the built-in Email Test Panel in the Dashboard
- Enter your email and test different order statuses

### Test Order Status Updates

1. Go to Order Preparation or Today's Orders page
2. Update an order status
3. Make sure "Send email notification" is checked
4. Check the customer's email

### Check Function Logs

```bash
npm run functions:logs
# or
firebase functions:log
```

## 📱 How It Works

### Automatic Emails

- **Trigger**: When an admin updates any order status
- **Condition**: Only when updated by admin (not system)
- **Content**: Status-specific email with order details

### Email Features

- ✅ Beautiful HTML templates
- ✅ Status-specific colors and icons
- ✅ Order details (ID, date, status)
- ✅ Admin notes included
- ✅ Mobile-responsive design

### Admin Controls

- ✅ Checkbox to enable/disable email notifications
- ✅ Custom notes field for each status update
- ✅ Quick status actions with automatic emails
- ✅ Test panel for validation

## 🔧 Troubleshooting

### Emails Not Sending

1. Check Firebase Functions logs: `npm run functions:logs`
2. Verify email configuration: `firebase functions:config:get`
3. Test email credentials manually
4. Check spam/junk folders

### Function Deployment Issues

1. Ensure Node.js version 18 or higher
2. Check Firebase project permissions
3. Verify Firebase CLI is logged in: `firebase login`

### Customer Not Receiving Emails

1. Verify customer email exists in Firebase Auth
2. Check email provider isn't blocking messages
3. Test with a known good email address

## 📋 Commands Reference

```bash
# Development
npm run dev                    # Start local development
npm run functions:emulate      # Test functions locally

# Deployment
npm run deploy:email          # Full email system deployment
npm run deploy:functions      # Deploy functions only

# Monitoring
npm run functions:logs        # View function logs
firebase functions:config:get # View configuration
```

## 🎯 Next Steps

1. **Customize Email Templates**: Edit `src/configs/emailTemplates.js`
2. **Add More Status Types**: Extend `ORDER_STATUSES` in orderStatus.js
3. **Customer Preferences**: Add email preference settings
4. **Analytics**: Track email delivery and open rates

## 📚 Full Documentation

See `docs/EMAIL_NOTIFICATION_IMPLEMENTATION.md` for complete technical documentation.
