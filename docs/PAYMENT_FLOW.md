# Payment Flow - GuestyPay Integration

## Overview

**Guesty manages all payments** - we don't use Stripe or any external payment processor. Guesty has their own payment system called **GuestyPay** that handles:

- Credit card tokenization
- Payment processing
- PCI compliance
- Refunds
- Payment schedules

## The Flow

### 1. Create Quote
```javascript
POST /api/reservations/quotes
{
  "listingId": "...",
  "checkInDateLocalized": "2025-11-01",
  "checkOutDateLocalized": "2025-11-08",
  "adults": 2,
  "currency": "USD"
}
```

### 2. Tokenize Payment (GuestyPay SDK)
Use Guesty's JavaScript SDK to collect and tokenize credit card:

```javascript
import { GuestyPayTokenization } from '@guestyorg/tokenization-js';

// Initialize SDK
const tokenization = new GuestyPayTokenization({
  listingId: 'your-listing-id',
  paymentProviderId: 'your-payment-provider-id'
});

// Tokenize card
const token = await tokenization.tokenize({
  card: {
    number: '4242424242424242',
    exp_month: '12',
    exp_year: '2025',
    cvc: '123'
  },
  billing_details: {
    name: 'John Doe',
    address: {
      line1: '123 Main St',
      city: 'San Francisco',
      postal_code: '94102',
      country: 'US'
    }
  }
});
```

### 3. Create Reservation with Token
```javascript
POST /api/reservations/quotes/{quoteId}/instant
{
  "ratePlanId": "...",
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "ccToken": "pm_...",  // Token from GuestyPay SDK
  "policy": {
    "agreedToTerms": true
  }
}
```

### 4. Confirmation
Returns reservation with confirmation code:
```json
{
  "_id": "reservation_id",
  "status": "confirmed",
  "confirmationCode": "ABC123",
  "platform": "direct"
}
```

## GuestyPay SDK

**Recommended**: Use Guesty's official SDK (PCI-compliant, secure)

- **GitHub**: https://github.com/guestyorg/tokenization-js/wiki
- **NPM**: `npm install @guestyorg/tokenization-js`

### Features
- ✅ PCI-compliant
- ✅ Multiple payment methods
- ✅ 3D Secure support
- ✅ Handles all payment validation
- ✅ Returns secure token

## Payment Provider ID

Get the payment provider ID for your listing:

```javascript
GET /api/listings/{listingId}/payment-provider
```

This tells you which payment processor (Stripe, Braintree, etc.) is configured in Guesty for this property.

## Important Notes

1. **No Stripe Integration Needed** - Guesty handles everything
2. **Use GuestyPay SDK** - Don't build custom payment forms
3. **Token Per Reservation** - Generate new token for each booking
4. **PCI Compliance** - SDK handles all security
5. **Payment Schedule** - Guesty manages when to charge (deposit, balance, etc.)

## Booking Types

### Instant Booking
- Immediate confirmation
- Payment token required
- Status: "confirmed"

```
POST /api/reservations/quotes/{quoteId}/instant
```

### Inquiry
- Requires host approval
- Payment token optional
- Status: "reserved"

```
POST /api/reservations/quotes/{quoteId}/inquiry
```

## Next Steps

1. Install GuestyPay SDK
2. Get payment provider ID
3. Integrate SDK into payment page
4. Test tokenization
5. Create instant booking

## Resources

- [GuestyPay Docs](https://booking-api-docs.guesty.com/docs/tokenizing-payment-methods)
- [SDK Wiki](https://github.com/guestyorg/tokenization-js/wiki)
- [NPM Package](https://www.npmjs.com/package/@guestyorg/tokenization-js)
