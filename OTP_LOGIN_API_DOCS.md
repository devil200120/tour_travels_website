# Driver OTP-Based Login API Documentation

## Overview
The Driver authentication system now supports OTP (One-Time Password) based login for enhanced security. This replaces the traditional password-based login while maintaining backward compatibility.

## Authentication Flow

### 1. Request OTP
**Endpoint:** `POST /api/driver/auth/login/request-otp`

**Request Body:**
```json
{
  "email": "driver@example.com",    // Optional
  "phone": "+919876543210"          // Optional (at least one required)
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456",                  // Only in development mode
  "expiresIn": "5 minutes",
  "phone": "+919876543210",
  "email": "driver@example.com",
  "driverId": "64a1b2c3d4e5f6789..."
}
```

**Error Responses:**
- `400` - Missing email/phone or invalid input
- `403` - Account deactivated or KYC issues
- `404` - Driver not found  
- `429` - Rate limit exceeded
- `500` - Server error

### 2. Verify OTP and Login
**Endpoint:** `POST /api/driver/auth/login/verify-otp`

**Request Body:**
```json
{
  "email": "driver@example.com",    // Optional  
  "phone": "+919876543210",         // Optional (at least one required)
  "otp": "123456"                   // Required
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": "64a1b2c3d4e5f6789...",
    "name": "John Doe",
    "email": "driver@example.com",
    "phone": "+919876543210",
    "kycStatus": "Approved",
    "isActive": true,
    "isAvailable": true,
    "currentLocation": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "address": "Bangalore, Karnataka"
    },
    "rating": {
      "average": 4.5,
      "count": 120
    },
    "totalTrips": 150,
    "totalEarnings": 25000
  }
}
```

**Error Responses:**
- `400` - Missing/invalid OTP, expired OTP, or no OTP request found
- `401` - Invalid OTP
- `404` - Driver not found
- `429` - Too many failed attempts
- `500` - Server error

## Rate Limiting

### OTP Request Limits:
- **Per minute:** 1 request per email/phone
- **Per day:** 5 requests per email/phone
- **Reset:** 24 hours from first request

### OTP Verification Limits:
- **Per OTP:** Maximum 3 attempts
- **Lockout:** OTP becomes invalid after 3 failed attempts

## Security Features

1. **OTP Expiry:** 5 minutes from generation
2. **Attempt Limiting:** Max 3 verification attempts per OTP
3. **Rate Limiting:** Prevents spam requests
4. **Secure Storage:** OTP stored with encryption flags
5. **Auto Cleanup:** Expired OTPs are automatically cleared

## KYC Status Handling

The OTP login respects driver KYC status:

- **Pending:** Login blocked with helpful message
- **Under Review:** Login blocked with status update
- **Rejected:** Login blocked with support contact
- **Approved:** Login allowed

## Backward Compatibility

### Legacy Password Login
**Endpoint:** `POST /api/driver/auth/login` (deprecated)

The traditional password-based login is still supported but:
- Shows deprecation warning
- Recommends using OTP-based login
- Will be phased out in future versions

## Development vs Production

### Development Mode:
- OTP is included in response for testing
- Console logging shows OTP details
- Mock SMS/Email services

### Production Mode:
- OTP is NOT included in response
- Real SMS/Email service integration required
- Enhanced security logging

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Account deactivated |
| `AUTH_003` | KYC pending |
| `AUTH_004` | KYC rejected |
| `AUTH_005` | KYC under review |
| `OTP_001` | OTP expired |
| `OTP_002` | Invalid OTP format |
| `OTP_003` | Too many attempts |
| `RATE_001` | Rate limit exceeded |

## Testing

### Using Postman:
1. Import the driver authentication collection
2. Use OTP endpoints for testing
3. Check console for OTP in development mode

### Using Test Script:
```bash
cd server
node testOTPLogin.js
```

## Integration Notes

### Frontend Integration:
1. Replace password login with 2-step OTP flow
2. Handle rate limiting messages
3. Show appropriate KYC status messages
4. Implement retry mechanisms

### Mobile App Integration:
1. Auto-detect OTP from SMS
2. Implement retry logic
3. Handle network failures gracefully
4. Cache driver data after successful login

## Production Deployment

### Required Environment Variables:
```env
NODE_ENV=production
JWT_SECRET=your-strong-secret-key
SMS_SERVICE_API_KEY=your-sms-api-key
EMAIL_SERVICE_API_KEY=your-email-api-key
```

### SMS Service Integration:
- Replace mock SMS service with real provider (Twilio, AWS SNS, etc.)
- Configure SMS templates
- Set up delivery notifications

### Email Service Integration:
- Replace mock email service with real provider (AWS SES, SendGrid, etc.)
- Configure HTML email templates  
- Set up bounce handling

## Monitoring

### Key Metrics:
- OTP request rate
- OTP success rate
- Login failure rate
- Rate limit triggers

### Alerts:
- High OTP failure rate
- Unusual request patterns
- Service downtime

## Security Considerations

1. **PII Protection:** Never log OTP values in production
2. **Transport Security:** Always use HTTPS
3. **Storage Security:** OTP fields marked as non-selectable
4. **Audit Logging:** Track all authentication attempts
5. **Monitoring:** Watch for abuse patterns