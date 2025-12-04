# Startup Check System Documentation

## Overview

The Startup Check System automatically monitors and manages expired orders when admin users log into the application. It examines the `userMealSelections` collection to identify expired subscriptions and provides comprehensive reporting and management tools.

## Features

### 🔍 Automatic Detection

- **Expired Orders**: Detects meal selections where `subscriptionEndDate` is before current date
- **Expiring Soon**: Identifies subscriptions expiring within configurable timeframe (default: 7 days)
- **Active Monitoring**: Continuous health checks of subscription status

### 🚨 Smart Alerts

- **Urgent Notifications**: Red alerts for expired orders requiring immediate attention
- **Warning Alerts**: Yellow alerts for orders expiring soon
- **Success Status**: Green confirmation when all orders are current
- **Expandable Details**: Click to view specific order information

### 🔄 Automated Management

- **Auto-Deactivation**: Automatically marks expired meal selections as inactive
- **Order Synchronization**: Updates both `userMealSelections` and `orders` collections when deactivating
- **Reason Tracking**: Sets `reasonOfInactivation` field to "expired" for automatically deactivated orders
- **Batch Processing**: Handles large numbers of expired orders efficiently
- **Safety Limits**: Configurable maximum auto-deactivation count per startup

### 📊 Comprehensive Reporting

- **Health Check Dashboard**: Overall system status and metrics
- **Detailed Analytics**: Days expired/remaining, user impact analysis
- **Startup Summary**: Complete log of actions taken during startup

## System Components

### Services

#### `userMealSelections.js`

```javascript
// Get expired meal selections
getExpiredUserMealSelections(currentDate);

// Get selections expiring soon
getExpiringSoonUserMealSelections(daysAhead, currentDate);

// Deactivate expired selections
deactivateExpiredMealSelections(mealSelectionIds);

// Comprehensive health check
getStartupHealthCheck();
```

#### `startup.js`

```javascript
// Run complete startup checks
runStartupChecks(options);

// Quick expired orders check
quickExpiredOrdersCheck();

// Configuration management
getStartupConfig();
updateStartupConfig(newConfig);
```

### React Components

#### `AuthContext.jsx`

- Manages user authentication
- Triggers startup checks on login
- Provides startup status to components

#### `StartupAlerts.jsx`

- Displays startup alerts to users
- Expandable detail views
- Manual refresh capability

#### `Layout.jsx`

- Shows startup status in navigation bar
- Color-coded notification badges
- Tooltip status indicators

## Data Structure

### UserMealSelections Collection

```javascript
{
  id: "doc_id",
  orderId: "order_123",
  userId: "user_456",
  packageTitle: "Complete Daily Nutrition",
  subscriptionStartDate: Timestamp,
  subscriptionEndDate: Timestamp,
  isActive: true,
  deactivatedAt: Timestamp, // Added when deactivated
  deactivatedReason: "Subscription expired", // Reason for deactivation
  // ... other fields
}
```

### Orders Collection

```javascript
{
  id: "order_123",
  customerId: "user_456",
  isActive: true,
  reasonOfInactivation: "", // "" for active, "expired" or "cancelled" when inactive
  deactivatedAt: Timestamp, // Added when deactivated automatically
  cancelledAt: Timestamp, // Added when cancelled manually
  cancelledBy: "admin", // Who cancelled the order
  // ... other fields
}
```

### Startup Check Results

```javascript
{
  timestamp: "2025-07-28T...",
  status: "completed",
  healthCheck: {
    expired: { count: 5, selections: [...] },
    expiringSoon: { count: 3, selections: [...] },
    total: { activeSelections: 150 }
  },
  deactivationResults: {
    attempted: 5,
    successful: 5,
    failed: 0
  },
  alerts: [
    {
      type: "warning",
      title: "Expired Orders Detected",
      message: "Found 5 expired meal selections...",
      urgent: false,
      details: [...]
    }
  ]
}
```

## Configuration

### Default Settings

```javascript
const STARTUP_CONFIG = {
  autoDeactivateExpired: true, // Auto-deactivate expired selections
  expirationWarningDays: 7, // Days ahead to warn about expiration
  maxAutoDeactivate: 50, // Max auto-deactivations per startup
  enableLogging: true, // Console logging
};
```

### Customization

```javascript
// Update configuration
updateStartupConfig({
  autoDeactivateExpired: false, // Disable auto-deactivation
  expirationWarningDays: 14, // Extend warning period
  maxAutoDeactivate: 100, // Increase safety limit
});
```

## Usage Examples

### Basic Integration

```jsx
import { useAuth } from "./contexts/AuthContext";

function MyComponent() {
  const { startupChecks } = useAuth();

  if (startupChecks.loading) {
    return <div>Running startup checks...</div>;
  }

  if (startupChecks.alerts.length > 0) {
    return <StartupAlerts />;
  }

  return <div>All systems operational</div>;
}
```

### Manual Health Check

```javascript
import { getStartupHealthCheck } from "./services/userMealSelections";

async function checkSystemHealth() {
  const healthCheck = await getStartupHealthCheck();
  console.log("System Status:", healthCheck);
}
```

### Custom Startup Flow

```javascript
import { runStartupChecks } from "./services/startup";

async function customStartup() {
  const results = await runStartupChecks({
    autoDeactivateExpired: false, // Manual review required
    expirationWarningDays: 14, // Extended warning period
    enableLogging: true,
  });

  // Handle results...
}
```

## Testing

### Running Tests

```bash
# Test the startup check system
node test/test-startup-checks.js

# Test status auto-creation
node test/test-status-autocreation.js
```

### Test Coverage

- Expired order detection
- Expiring soon detection
- Health check functionality
- Auto-deactivation process
- Alert generation
- Error handling

## Inactivation Behavior

### Automatic Expiration (Startup Check)

When a subscription expires and is detected during startup checks:

```javascript
// userMealSelections collection
{
  isActive: false,
  deactivatedAt: Timestamp.now(),
  deactivatedReason: "Subscription expired",
  updatedAt: Timestamp.now()
}

// orders collection
{
  isActive: false,
  deactivatedAt: Timestamp.now(),
  reasonOfInactivation: "expired",
  updatedAt: Timestamp.now()
}
```

### Manual Cancellation (Admin Action)

When an admin manually cancels an order:

```javascript
// orders collection
{
  isActive: false,
  cancelledAt: new Date(),
  cancelledBy: "admin",
  reasonOfInactivation: "cancelled"
}

// userMealSelections collection
{
  isActive: false,
  cancelledAt: new Date(),
  cancelledBy: "admin"
}
```

### Status Display

The UI automatically displays different statuses based on the reason:

- **Active**: Green badge for active orders
- **Expired**: Yellow/warning badge for expired orders
- **Cancelled**: Red/error badge for cancelled orders
- **Inactive**: Default badge for other inactive states

## Best Practices

### Performance

- **Batch Queries**: System uses batched Firestore queries for efficiency
- **Parallel Processing**: Multiple checks run simultaneously
- **Caching**: Results cached during session to avoid repeated queries

### Safety

- **Configurable Limits**: Maximum auto-deactivation count prevents accidents
- **Validation**: All dates and statuses validated before processing
- **Error Handling**: Graceful degradation on failures

### User Experience

- **Non-Blocking**: Startup checks don't prevent app usage
- **Progressive Disclosure**: Summary first, details on demand
- **Clear Messaging**: User-friendly alert descriptions

### Monitoring

- **Comprehensive Logging**: All operations logged for debugging
- **Error Reporting**: Failed operations clearly identified
- **Success Metrics**: Track successful auto-deactivations

## Troubleshooting

### Common Issues

1. **No Expired Orders Detected**

   - Verify Firestore security rules allow admin access
   - Check date field formats in userMealSelections collection
   - Ensure isActive field exists and is properly set

2. **Auto-Deactivation Not Working**

   - Check autoDeactivateExpired configuration
   - Verify maxAutoDeactivate limit not exceeded
   - Review console logs for error messages

3. **Alerts Not Displaying**
   - Ensure AuthProvider wraps your app
   - Check StartupAlerts component is rendered
   - Verify user is authenticated

### Debug Mode

```javascript
// Enable debug logging
updateStartupConfig({ enableLogging: true });

// Manual health check with full details
const healthCheck = await getStartupHealthCheck();
console.log("Debug Health Check:", JSON.stringify(healthCheck, null, 2));
```

## Future Enhancements

### Planned Features

- **Email Notifications**: Alert customers about expired subscriptions
- **Automated Renewal**: Integration with payment systems
- **Analytics Dashboard**: Historical trends and patterns
- **Bulk Operations**: Mass renewal/extension tools

### Integration Points

- **Payment Systems**: Automatic renewal handling
- **Customer Portal**: Self-service subscription management
- **Reporting Tools**: Business intelligence integration
- **Admin Dashboard**: Enhanced management interface

## Security Considerations

### Data Access

- Only authenticated admin users can access startup checks
- Firestore security rules enforce proper permissions
- Sensitive customer data handled according to privacy policies

### Audit Trail

- All auto-deactivations logged with timestamps
- User attribution for manual actions
- Complete history of system operations

---

_This documentation covers the complete startup check system for monitoring and managing expired orders in the riz Recipe admin application._
