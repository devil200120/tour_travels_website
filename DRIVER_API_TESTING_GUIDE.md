# Driver API Testing Guide

## 📖 Overview
This guide walks you through testing the enhanced Tour Travels Driver API with OTP-based authentication, secure password reset, and comprehensive driver management features.

## 🚀 Quick Start

### 1. Import Collection
1. Import `Driver_APIs_Complete.postman_collection.json` into Postman
2. Collection includes pre-configured variables and test scripts
3. Environment variables will auto-populate during testing

### 2. Setup Base URL
- Default: `http://localhost:5000/api/driver`
- Update `base_url` variable if your server runs on different port

## 🔐 Authentication Flow Testing

### Step 1: Driver Registration
```
POST /auth/signup
```
**Key Changes:**
- ✅ No immediate token provided
- ✅ Returns `pendingApproval: true`
- ✅ KYC status set to "Pending"
- ✅ Requires admin approval before login

**Expected Response:**
```json
{
  "success": true,
  "message": "Driver registration successful. Please wait for admin approval.",
  "driver": { /* driver details */ },
  "kycStatus": "Pending",
  "pendingApproval": true,
  "nextSteps": {
    "message": "Please wait for admin to verify your KYC documents",
    "estimatedTime": "24-48 hours"
  }
}
```

### Step 2: OTP-Based Login

#### 2a. Request Login OTP
```
POST /auth/login/request-otp
```
**Features:**
- ✅ Rate limiting (1/minute, 5/day)
- ✅ Works with email OR phone
- ✅ KYC status validation
- ✅ Account status checks

**Test Body:**
```json
{
  "email": "rajesh.driver@example.com",
  "phone": "+919876543210"
}
```

#### 2b. Verify OTP & Login
```
POST /auth/login/verify-otp
```
**Features:**
- ✅ 6-digit OTP validation
- ✅ Max 3 attempts per OTP
- ✅ 5-minute expiry
- ✅ JWT token generation

**Test Body:**
```json
{
  "email": "rajesh.driver@example.com",
  "otp": "123456"
}
```

### Step 3: Password Reset Flow

#### 3a. Request Reset OTP
```
POST /auth/forgot-password/request-otp
```
**Features:**
- ✅ 10-minute expiry for reset
- ✅ Dual SMS/Email delivery
- ✅ Security messaging
- ✅ Rate limiting

#### 3b. Verify Reset OTP
```
POST /auth/forgot-password/verify-otp
```
**Returns:** 15-minute reset token

#### 3c. Set New Password
```
POST /auth/reset-password
```
**Features:**
- ✅ Password confirmation
- ✅ Minimum 6 characters
- ✅ Token validation
- ✅ Secure password hashing

## 📊 Testing Scenarios

### Scenario 1: New Driver Registration
1. **Register** → Should get `pendingApproval: true`
2. **Try OTP Login** → Should get KYC pending error
3. **Admin Approves KYC** → Driver can now login
4. **OTP Login** → Should work successfully

### Scenario 2: OTP Rate Limiting
1. **Request OTP** → Success
2. **Request Again Immediately** → Rate limited (429)
3. **Wait 60 seconds** → Should work again
4. **Request 6 times in day** → Daily limit exceeded

### Scenario 3: OTP Verification Attempts
1. **Request OTP** → Get valid OTP
2. **Try wrong OTP 3 times** → OTP invalidated
3. **Try correct OTP** → Should fail (too many attempts)
4. **Request new OTP** → Should work

### Scenario 4: Password Reset Flow
1. **Request Reset OTP** → Success
2. **Verify Reset OTP** → Get reset token
3. **Reset Password** → Success
4. **Login with new password** → Success (legacy login)
5. **Use OTP Login** → Should also work

## 🧪 Test Scripts

### Automated Test Collection
The Postman collection includes automated tests that:

- ✅ Validate response structure
- ✅ Extract and store tokens/OTPs
- ✅ Check security headers
- ✅ Verify rate limiting
- ✅ Test error scenarios

### Key Test Variables
```javascript
// Auto-populated by test scripts
pm.collectionVariables.set('login_otp', response.otp);
pm.collectionVariables.set('driver_token', response.token);
pm.collectionVariables.set('reset_token', response.resetToken);
```

## 🔍 Debugging Tips

### Console Logging (Development Mode)
In development, OTPs are logged to server console:
```
📱 SMS to +919876543210:
Hi Rajesh Kumar Singh, your Tour & Travels login OTP is: 123456
This OTP will expire in 5 minutes.
```

### Common Issues
1. **KYC Not Approved** → Contact admin to approve driver
2. **Rate Limited** → Wait for rate limit window to reset
3. **OTP Expired** → Request new OTP
4. **Invalid Format** → Ensure 6-digit numeric OTP

### Error Codes
- `403` - KYC not approved / Account deactivated
- `429` - Rate limit exceeded
- `401` - Invalid credentials/OTP
- `400` - Invalid input format

## 🔒 Security Features

### Implemented Security Measures
- ✅ OTP-based authentication
- ✅ Rate limiting on OTP requests
- ✅ Maximum attempt limits
- ✅ Secure token storage
- ✅ Password hashing (bcrypt)
- ✅ JWT token expiry
- ✅ HTTPS enforcement (production)

### Rate Limits
- **OTP Requests:** 1/minute, 5/day per email/phone
- **API Requests:** 100/15 minutes per IP
- **OTP Attempts:** 3 per OTP before invalidation

## 📱 Mobile App Integration

### Recommended Flow
1. **Registration** → Guide user about KYC approval wait
2. **Login** → Use OTP-based flow by default
3. **Auto-detect OTP** → From SMS if possible
4. **Graceful Errors** → Show helpful messages for each error type

### Example Implementation
```javascript
// Request OTP
const otpResponse = await fetch('/auth/login/request-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: driverPhone })
});

// Handle KYC pending
if (otpResponse.status === 403) {
  const error = await otpResponse.json();
  if (error.kycStatus === 'Pending') {
    showKYCPendingScreen(error.nextSteps);
    return;
  }
}
```

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-secret-key
SMS_API_KEY=your-sms-service-key
EMAIL_API_KEY=your-email-service-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### SMS/Email Integration
Replace mock services in `otpService.js` with real providers:
- **SMS:** Twilio, AWS SNS, MessageBird
- **Email:** AWS SES, SendGrid, Mailgun

## 📈 Monitoring & Analytics

### Key Metrics to Track
- OTP request success rate
- Login conversion rate
- Password reset frequency
- Rate limit violations
- KYC approval time

### Suggested Alerts
- High OTP failure rate (>10%)
- Unusual request patterns
- Service downtime
- Daily active driver count

## 🤝 Support

### For Testing Issues
1. Check server console for OTP values (development)
2. Verify driver KYC approval status
3. Check rate limiting status
4. Review error response messages

### For Production Issues
1. Check SMS/Email service status
2. Monitor rate limiting metrics
3. Verify JWT secret configuration
4. Check database connectivity

---

**Last Updated:** November 2024  
**API Version:** 4.0.0  
**Collection Version:** Driver_APIs_Complete.postman_collection.json v4.0