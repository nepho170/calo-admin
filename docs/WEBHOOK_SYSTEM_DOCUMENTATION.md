# Webhook System Documentation

## Overview

The Calo Admin system now includes a robust webhook endpoint that can receive events from external services. This enables real-time integration with payment processors, delivery services, and other third-party systems.

## Webhook URL

### Production URL

```
https://us-central1-calo-like-app.cloudfunctions.net/webhook
```

### Local Development URL (when running emulator)

```
http://localhost:5001/calo-like-app/us-central1/webhook
```

## Supported HTTP Methods

### GET Request

- **Purpose**: Health check and webhook verification
- **Response**: Status confirmation or challenge response
- **Use Case**: When setting up webhooks, many services send a GET request to verify the endpoint

### POST Request

- **Purpose**: Receive actual webhook events
- **Content-Type**: `application/json`
- **Response**: Event confirmation with unique event ID

## Security Features

### Signature Verification

The webhook endpoint supports signature verification for enhanced security:

1. Set the `WEBHOOK_SECRET` environment variable in Firebase Functions
2. Include signature in request header: `X-Signature` or `X-Hub-Signature-256`
3. The endpoint will verify the HMAC-SHA256 signature

### CORS Support

The endpoint includes CORS support for cross-origin requests.

## Event Processing

### Supported Event Types

The webhook automatically processes these event types:

1. **Payment Events**

   - `payment.completed`
   - `payment.succeeded`

2. **Order Events**

   - `order.created`
   - `order.updated`

3. **User Events**

   - `user.created`
   - `user.updated`

4. **Subscription Events**
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`

### Event Storage

All webhook events are automatically stored in the `webhookEvents` Firestore collection with:

- Event type and data
- Request headers and metadata
- Processing status
- Timestamp

## Request Format

### Headers

```
Content-Type: application/json
X-Event-Type: event.type (optional)
X-Signature: sha256=<signature> (optional, for verification)
```

### Body Examples

#### Payment Webhook

```json
{
  "type": "payment.completed",
  "data": {
    "orderId": "order_123",
    "paymentId": "pay_456",
    "amount": 29.99,
    "currency": "USD",
    "status": "completed"
  }
}
```

#### Order Webhook

```json
{
  "type": "order.updated",
  "data": {
    "orderId": "order_123",
    "status": "out_for_delivery",
    "trackingNumber": "TRK123456",
    "estimatedDelivery": "2025-09-01T18:00:00Z"
  }
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "eventId": "webhook_event_id",
  "message": "Webhook received and processed"
}
```

### Error Response

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Setup Instructions

### 1. Deploy the Webhook Function

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy just the webhook function
firebase deploy --only functions:webhook
```

### 2. Configure Environment Variables (Optional)

For signature verification, set the webhook secret:

```bash
firebase functions:config:set webhook.secret="your-secret-key"
```

### 3. Test the Webhook

Use the provided test script:

```bash
./scripts/test-webhook.sh
```

## Integration Examples

### Setting up with Payment Processors

#### Stripe

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://us-central1-calo-like-app.cloudfunctions.net/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

#### PayPal

1. Go to PayPal Developer Dashboard → Webhooks
2. Add webhook URL: `https://us-central1-calo-like-app.cloudfunctions.net/webhook`
3. Select events: `PAYMENT.CAPTURE.COMPLETED`

### Setting up with Delivery Services

#### Example Delivery Service

1. Configure webhook URL in delivery service dashboard
2. Select events: `order.created`, `order.shipped`, `order.delivered`
3. The webhook will automatically update order statuses in Firestore

## Monitoring and Debugging

### View Webhook Events

Admins can view all webhook events in the Firestore console under the `webhookEvents` collection.

### Function Logs

```bash
# View all function logs
firebase functions:log

# View webhook-specific logs
firebase functions:log --only webhook
```

### Test Webhook Locally

1. Start Firebase emulator:

```bash
firebase emulators:start --only functions
```

2. Test with curl:

```bash
curl -X POST http://localhost:5001/calo-like-app/us-central1/webhook \
  -H "Content-Type: application/json" \
  -H "X-Event-Type: test.webhook" \
  -d '{"type": "test", "data": {"message": "test"}}'
```

## Security Considerations

1. **Use HTTPS**: Always use the HTTPS URL in production
2. **Signature Verification**: Configure webhook secrets for critical integrations
3. **Rate Limiting**: The function has a max instances limit of 5 to prevent abuse
4. **Input Validation**: All webhook data is logged and validated before processing

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check webhook signature if using signature verification
2. **500 Internal Error**: Check function logs for detailed error messages
3. **Timeout**: Large webhook payloads may timeout; consider async processing

### Debug Steps

1. Check Firebase Functions logs
2. Verify webhook URL is correct
3. Test with the provided test script
4. Check Firestore security rules for `webhookEvents` collection

## Extending the Webhook

To add support for new event types:

1. Add a new case in the `processWebhookEvent` function
2. Create a handler function (e.g., `handleNewEventWebhook`)
3. Update this documentation with the new event type

## Support

For webhook-related issues:

1. Check the function logs first
2. Use the test script to verify connectivity
3. Review the `webhookEvents` collection in Firestore for stored events
