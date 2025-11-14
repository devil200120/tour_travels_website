# Postman Testing Collection - Driver Authentication

## Collection Overview
This document provides detailed testing scenarios for the Driver Authentication API using Postman.

## Environment Setup

### Environment Variables
Create a new environment in Postman with these variables:

```json
{
  "base_url": "http://localhost:5000",
  "driver_auth_base": "{{base_url}}/api/driver/auth",
  "test_email": "testdriver@example.com",
  "test_phone": "+919876543210",
  "test_password": "securepass123",
  "auth_token": "",
  "driver_id": "",
  "reset_token": "",
  "test_otp": "123456"
}
```

---

## Test Collection Structure

### 1. Driver Registration with Documents

#### Test 1.1: Successful Registration
```http
POST {{driver_auth_base}}/signup
Content-Type: multipart/form-data

Form Data:
- name: John Driver
- email: {{test_email}}
- phone: {{test_phone}}
- password: {{test_password}}
- licenseNumber: DL123456789
- dateOfBirth: 1990-01-15
- licenseExpiry: 2027-01-15
- licenseType: LMV
- aadharCard: [File Upload]
- panCard: [File Upload]
- licenseImage: [File Upload]

Expected Response (201):
{
  "success": true,
  "message": "Driver registration successful. Your KYC is pending verification.",
  "driver": {
    "id": "{{$randomUUID}}",
    "kycStatus": "pending",
    "isActive": false
  }
}

Test Script:
pm.test("Registration successful", function () {
    pm.response.to.have.status(201);
    pm.expect(pm.response.json().success).to.be.true;
    pm.environment.set("driver_id", pm.response.json().driver.id);
});
```

#### Test 1.2: Missing Required Documents
```http
POST {{driver_auth_base}}/signup
Content-Type: multipart/form-data

Form Data:
- name: John Driver
- email: new.driver@example.com
- phone: +919876543211
- password: {{test_password}}
- licenseNumber: DL123456789
- dateOfBirth: 1990-01-15
- licenseExpiry: 2027-01-15
- licenseType: LMV
// Missing: aadharCard, panCard, licenseImage

Expected Response (400):
{
  "success": false,
  "message": "Missing required documents",
  "errors": [
    "aadharCard is required",
    "panCard is required", 
    "licenseImage is required"
  ]
}

Test Script:
pm.test("Missing documents validation", function () {
    pm.response.to.have.status(400);
    pm.expect(pm.response.json().success).to.be.false;
    pm.expect(pm.response.json().errors).to.include("aadharCard is required");
});
```

#### Test 1.3: Duplicate Email/Phone
```http
POST {{driver_auth_base}}/signup
Content-Type: multipart/form-data

Form Data:
- email: {{test_email}} // Same as Test 1.1
- phone: {{test_phone}} // Same as Test 1.1
// ... other fields

Expected Response (400):
{
  "success": false,
  "message": "Email or phone already registered",
  "errors": ["Email already exists"]
}
```

### 2. OTP Login Flow

#### Test 2.1: Request OTP with Email
```http
POST {{driver_auth_base}}/login/request-otp
Content-Type: application/json

{
  "email": "{{test_email}}"
}

Expected Response (200):
{
  "success": true,
  "message": "OTP sent successfully",
  "otpSent": true,
  "expiresIn": "5 minutes"
}

Test Script:
pm.test("OTP request successful", function () {
    pm.response.to.have.status(200);
    pm.expect(pm.response.json().otpSent).to.be.true;
});
```

#### Test 2.2: Request OTP with Phone
```http
POST {{driver_auth_base}}/login/request-otp
Content-Type: application/json

{
  "phone": "{{test_phone}}"
}

Expected Response (200):
{
  "success": true,
  "message": "OTP sent successfully",
  "otpSent": true,
  "expiresIn": "5 minutes"
}
```

#### Test 2.3: Verify OTP and Login
```http
POST {{driver_auth_base}}/login/verify-otp
Content-Type: application/json

{
  "email": "{{test_email}}",
  "otp": "{{test_otp}}"
}

Expected Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": "{{driver_id}}",
    "kycStatus": "approved",
    "isActive": true
  }
}

Test Script:
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    pm.expect(pm.response.json().token).to.not.be.empty;
    pm.environment.set("auth_token", pm.response.json().token);
});
```

#### Test 2.4: Invalid OTP
```http
POST {{driver_auth_base}}/login/verify-otp
Content-Type: application/json

{
  "email": "{{test_email}}",
  "otp": "000000"
}

Expected Response (400):
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

### 3. Password Reset Flow

#### Test 3.1: Request Password Reset OTP
```http
POST {{driver_auth_base}}/forgot-password/request-otp
Content-Type: application/json

{
  "email": "{{test_email}}"
}

Expected Response (200):
{
  "success": true,
  "message": "Password reset OTP sent successfully",
  "otpSent": true,
  "expiresIn": "5 minutes"
}
```

#### Test 3.2: Verify Reset OTP
```http
POST {{driver_auth_base}}/forgot-password/verify-otp
Content-Type: application/json

{
  "email": "{{test_email}}",
  "otp": "{{test_otp}}"
}

Expected Response (200):
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15 minutes"
}

Test Script:
pm.test("Reset OTP verified", function () {
    pm.response.to.have.status(200);
    pm.environment.set("reset_token", pm.response.json().resetToken);
});
```

#### Test 3.3: Reset Password
```http
POST {{driver_auth_base}}/reset-password
Content-Type: application/json

{
  "resetToken": "{{reset_token}}",
  "newPassword": "newSecurePass123",
  "confirmPassword": "newSecurePass123"
}

Expected Response (200):
{
  "success": true,
  "message": "Password reset successful"
}
```

#### Test 3.4: Invalid Reset Token
```http
POST {{driver_auth_base}}/reset-password
Content-Type: application/json

{
  "resetToken": "invalid.token.here",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}

Expected Response (400):
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

### 4. Document Management

#### Test 4.1: Upload Additional Documents
```http
POST {{driver_auth_base}}/upload-documents
Content-Type: multipart/form-data
Authorization: Bearer {{auth_token}}

Form Data:
- profileImage: [File Upload]
- policeVerification: [File Upload]
- medicalCertificate: [File Upload]

Expected Response (200):
{
  "success": true,
  "message": "Documents uploaded successfully",
  "documentsUploaded": {
    "profileImage": true,
    "policeVerification": true,
    "medicalCertificate": true
  }
}
```

#### Test 4.2: Check Document Status
```http
GET {{driver_auth_base}}/documents-status/{{driver_id}}
Authorization: Bearer {{auth_token}}

Expected Response (200):
{
  "success": true,
  "documentsStatus": {
    "aadharCard": {
      "uploaded": true,
      "verified": true,
      "filename": "aadhar_1699875000000.jpg"
    },
    "panCard": {
      "uploaded": true,
      "verified": true
    },
    "licenseImage": {
      "uploaded": true,
      "verified": true
    }
  },
  "kycStatus": "approved"
}
```

### 5. Error Handling Tests

#### Test 5.1: Rate Limiting
```http
POST {{driver_auth_base}}/login/request-otp
Content-Type: application/json

{
  "email": "{{test_email}}"
}

// Call this endpoint multiple times quickly

Expected Response (429):
{
  "success": false,
  "message": "Too many requests. Try again after 1 minute.",
  "statusCode": 429
}
```

#### Test 5.2: Unauthorized Access
```http
GET {{driver_auth_base}}/documents-status/{{driver_id}}
// Missing Authorization header

Expected Response (401):
{
  "success": false,
  "message": "Access token required",
  "statusCode": 401
}
```

#### Test 5.3: File Size Validation
```http
POST {{driver_auth_base}}/signup
Content-Type: multipart/form-data

Form Data:
// ... other fields
- aadharCard: [Large file > 10MB]

Expected Response (400):
{
  "success": false,
  "message": "File size exceeds limit",
  "errors": ["aadharCard file size must be less than 10MB"]
}
```

---

## Pre-request Scripts

### Authentication Header Setup
```javascript
// For endpoints requiring authentication
if (pm.environment.get("auth_token")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("auth_token")
    });
}
```

### Dynamic Test Data Generation
```javascript
// Generate random test data
pm.environment.set("random_email", "driver" + Date.now() + "@example.com");
pm.environment.set("random_phone", "+91" + Math.floor(Math.random() * 9000000000 + 1000000000));
```

---

## Test Scripts

### Global Test Setup
```javascript
// Common assertions
pm.test("Response time is less than 5000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});

pm.test("Response has required headers", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});

// Error response validation
if (pm.response.code >= 400) {
    pm.test("Error response has proper structure", function () {
        const response = pm.response.json();
        pm.expect(response).to.have.property("success", false);
        pm.expect(response).to.have.property("message");
        pm.expect(response).to.have.property("statusCode");
    });
}
```

### Success Response Validation
```javascript
// For successful registration
if (pm.response.code === 201) {
    pm.test("Driver registration response validation", function () {
        const response = pm.response.json();
        pm.expect(response.success).to.be.true;
        pm.expect(response.driver).to.have.property("id");
        pm.expect(response.driver).to.have.property("kycStatus", "pending");
        pm.expect(response.driver).to.have.property("isActive", false);
    });
}
```

---

## Collection Variables

### File Upload Setup
```javascript
// For file upload tests, create test files:
// 1. Create small test images (< 1MB) for successful uploads
// 2. Create large files (> 10MB) for size validation tests
// 3. Create invalid file types (.txt, .exe) for format validation
```

---

## Environment Configuration

### Development Environment
```json
{
  "base_url": "http://localhost:5000",
  "environment": "development"
}
```

### Staging Environment
```json
{
  "base_url": "https://staging-api.tourtravels.com",
  "environment": "staging"
}
```

### Production Environment
```json
{
  "base_url": "https://api.tourtravels.com",
  "environment": "production"
}
```

---

## Test Execution Order

1. **Setup Tests** - Clean environment, generate test data
2. **Registration Tests** - Test signup with various scenarios
3. **Authentication Tests** - OTP login flow
4. **Password Reset Tests** - Complete reset flow
5. **Document Management Tests** - Upload and status checking
6. **Error Handling Tests** - Validation and edge cases
7. **Cleanup Tests** - Remove test data

---

## Automated Testing

### Newman CLI Commands
```bash
# Run complete collection
newman run Driver_Authentication_Collection.json -e Development.json

# Run with HTML report
newman run Driver_Authentication_Collection.json -e Development.json -r html

# Run specific folder
newman run Driver_Authentication_Collection.json -e Development.json --folder "Registration Tests"
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    newman run postman/Driver_Auth_Collection.json \
      -e postman/environments/staging.json \
      -r cli,junit \
      --reporter-junit-export results.xml
```

This comprehensive testing guide covers all aspects of the Driver Authentication API and provides a solid foundation for quality assurance and continuous integration.