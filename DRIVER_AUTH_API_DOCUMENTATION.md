# Driver Authentication API Documentation

## Overview
This documentation covers the complete driver authentication system for the Tour & Travels application, including OTP-based login, document upload, and KYC verification processes.

## Base URL
```
http://localhost:5000/api/driver/auth
```

## Authentication Flow
The driver authentication system follows a secure multi-step process:

1. **Registration** → Document Upload → KYC Pending Status
2. **OTP Login** → Token Generation → Access Control
3. **Password Reset** → OTP Verification → Secure Reset

---

## 1. Driver Registration with Document Upload

### Endpoint
```http
POST /signup
```

### Content Type
```
multipart/form-data
```

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Driver's full name |
| `email` | String | Email address (unique) |
| `phone` | String | Phone number (unique) |
| `password` | String | Minimum 6 characters |
| `licenseNumber` | String | Valid license number |
| `dateOfBirth` | Date | ISO format (YYYY-MM-DD) |
| `licenseExpiry` | Date | ISO format (YYYY-MM-DD) |
| `licenseType` | String | Type of license (e.g., "LMV", "HMV") |

### Required Documents (Files)
| Field | Type | Description |
|-------|------|-------------|
| `aadharCard` | File | Aadhar Card (JPEG/PNG/PDF, max 10MB) |
| `panCard` | File | PAN Card (JPEG/PNG/PDF, max 10MB) |
| `licenseImage` | File | Driving License (JPEG/PNG/PDF, max 10MB) |

### Optional Fields
| Field | Type | Description |
|-------|------|-------------|
| `alternatePhone` | String | Secondary phone number |
| `experience` | String | Driving experience |
| `languages` | String | Known languages |
| `specializations` | String | Special skills |
| `address` | JSON String | Complete address object |
| `emergencyContact` | JSON String | Emergency contact details |
| `bankDetails` | JSON String | Bank account information |

### Optional Documents (Files)
| Field | Type | Description |
|-------|------|-------------|
| `profileImage` | File | Profile photo (JPEG/PNG, max 5MB) |
| `policeVerification` | File | Police verification certificate |
| `medicalCertificate` | File | Medical fitness certificate |

### Address Object Structure
```json
{
  "street": "123 Main Street",
  "landmark": "Near City Mall",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "country": "India"
}
```

### Emergency Contact Structure
```json
{
  "name": "John Doe",
  "relationship": "Father",
  "phone": "+919876543210",
  "email": "john.doe@example.com"
}
```

### Bank Details Structure
```json
{
  "accountHolderName": "Driver Name",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "bankName": "State Bank of India",
  "branchName": "Main Branch"
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Driver registration successful. Your KYC is pending verification.",
  "driver": {
    "id": "674b1234567890abcdef1234",
    "name": "Driver Name",
    "email": "driver@example.com",
    "phone": "+919876543210",
    "kycStatus": "pending",
    "isActive": false,
    "documentsUploaded": {
      "aadharCard": true,
      "panCard": true,
      "licenseImage": true,
      "profileImage": false,
      "policeVerification": false,
      "medicalCertificate": false
    },
    "createdAt": "2024-11-13T10:30:00.000Z"
  }
}
```

### Error Responses

#### Missing Required Documents (400)
```json
{
  "success": false,
  "message": "Missing required documents",
  "errors": [
    "aadharCard is required",
    "panCard is required",
    "licenseImage is required"
  ]
}
```

#### Email/Phone Already Exists (400)
```json
{
  "success": false,
  "message": "Email or phone already registered",
  "errors": ["Email already exists", "Phone number already registered"]
}
```

---

## 2. OTP-Based Login System

### 2.1 Request OTP for Login

#### Endpoint
```http
POST /login/request-otp
```

#### Content Type
```
application/json
```

#### Request Body (Email OR Phone)
```json
{
  "email": "driver@example.com"
}
```
OR
```json
{
  "phone": "+919876543210"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otpSent": true,
  "expiresIn": "5 minutes"
}
```

#### Error Response - User Not Found (404)
```json
{
  "success": false,
  "message": "No driver found with this email/phone"
}
```

### 2.2 Verify OTP and Login

#### Endpoint
```http
POST /login/verify-otp
```

#### Content Type
```
application/json
```

#### Request Body
```json
{
  "email": "driver@example.com",
  "otp": "123456"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": "674b1234567890abcdef1234",
    "name": "Driver Name",
    "email": "driver@example.com",
    "phone": "+919876543210",
    "kycStatus": "approved",
    "isActive": true,
    "documentsUploaded": {
      "aadharCard": true,
      "panCard": true,
      "licenseImage": true
    }
  }
}
```

#### Error Response - Invalid OTP (400)
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## 3. Password Reset System

### 3.1 Request Password Reset OTP

#### Endpoint
```http
POST /forgot-password/request-otp
```

#### Content Type
```
application/json
```

#### Request Body
```json
{
  "email": "driver@example.com"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Password reset OTP sent successfully",
  "otpSent": true,
  "expiresIn": "5 minutes"
}
```

### 3.2 Verify Password Reset OTP

#### Endpoint
```http
POST /forgot-password/verify-otp
```

#### Content Type
```
application/json
```

#### Request Body
```json
{
  "email": "driver@example.com",
  "otp": "123456"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15 minutes"
}
```

### 3.3 Reset Password

#### Endpoint
```http
POST /reset-password
```

#### Content Type
```
application/json
```

#### Request Body
```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## 4. Document Management

### 4.1 Upload Additional Documents

#### Endpoint
```http
POST /upload-documents
```

#### Content Type
```
multipart/form-data
```

#### Headers
```
Authorization: Bearer {token}
```

#### Form Fields
| Field | Type | Description |
|-------|------|-------------|
| `profileImage` | File | Profile photo (optional) |
| `policeVerification` | File | Police verification (optional) |
| `medicalCertificate` | File | Medical certificate (optional) |

#### Success Response (200)
```json
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

### 4.2 Check Document Status

#### Endpoint
```http
GET /documents-status/{driverId}
```

#### Headers
```
Authorization: Bearer {token}
```

#### Success Response (200)
```json
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
      "verified": true,
      "filename": "pan_1699875000000.jpg"
    },
    "licenseImage": {
      "uploaded": true,
      "verified": true,
      "filename": "license_1699875000000.jpg"
    },
    "profileImage": {
      "uploaded": false,
      "verified": false
    }
  },
  "kycStatus": "approved",
  "overallProgress": "100%"
}
```

---

## Error Handling

### Common Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "statusCode": 400
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created (Registration successful) |
| `400` | Bad Request (Validation errors) |
| `401` | Unauthorized (Invalid token) |
| `404` | Not Found (User/Resource not found) |
| `409` | Conflict (Duplicate email/phone) |
| `429` | Too Many Requests (Rate limited) |
| `500` | Internal Server Error |

---

## Rate Limiting

### OTP Requests
- **1 request per minute** per email/phone
- **5 requests per day** per email/phone

### File Upload Limits
- **Maximum file size**: 10MB per file
- **Supported formats**: JPEG, PNG, PDF
- **Total upload limit**: 50MB per registration

---

## Security Features

1. **JWT Tokens**: 24-hour expiration for login tokens
2. **Reset Tokens**: 15-minute expiration for password reset
3. **OTP Expiration**: 5-minute validity
4. **Rate Limiting**: Prevents spam and abuse
5. **File Validation**: Type and size restrictions
6. **Secure Storage**: Documents stored in driver-specific folders

---

## Integration Examples

### cURL Example - Driver Registration
```bash
curl -X POST \
  'http://localhost:5000/api/driver/auth/signup' \
  -H 'Content-Type: multipart/form-data' \
  -F 'name=John Driver' \
  -F 'email=john.driver@example.com' \
  -F 'phone=+919876543210' \
  -F 'password=securepass123' \
  -F 'licenseNumber=DL123456789' \
  -F 'dateOfBirth=1990-01-15' \
  -F 'licenseExpiry=2027-01-15' \
  -F 'licenseType=LMV' \
  -F 'aadharCard=@/path/to/aadhar.jpg' \
  -F 'panCard=@/path/to/pan.jpg' \
  -F 'licenseImage=@/path/to/license.jpg'
```

### JavaScript Example - OTP Login
```javascript
// Request OTP
const requestOTP = async () => {
  const response = await fetch('http://localhost:5000/api/driver/auth/login/request-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'driver@example.com'
    })
  });
  return response.json();
};

// Verify OTP
const verifyOTP = async (otp) => {
  const response = await fetch('http://localhost:5000/api/driver/auth/login/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'driver@example.com',
      otp: otp
    })
  });
  return response.json();
};
```

---

## Testing Checklist

- [ ] Driver registration with all required documents
- [ ] Email/phone uniqueness validation
- [ ] File upload validation (type, size)
- [ ] OTP generation and verification
- [ ] Password reset flow
- [ ] Token authentication
- [ ] Document status checking
- [ ] Rate limiting functionality
- [ ] Error handling scenarios
- [ ] KYC status progression

---

## Support

For technical support or questions about the API:
- **Documentation Updates**: Check this file for latest changes
- **API Issues**: Verify endpoint URLs and request format
- **File Upload Problems**: Check file size and format requirements
- **Authentication Issues**: Verify token format and expiration