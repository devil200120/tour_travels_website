# Customer API Documentation

## Base URL
```
http://localhost:5000/api/customer
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication APIs (`/api/customer/auth`)

### Register Customer
```
POST /auth/register
```
**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "password123",
  "referralCode": "REFXXXX" // optional
}
```

### Verify OTP
```
POST /auth/verify-otp
```
**Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### Login
```
POST /auth/login
```
**Body:**
```json
{
  "phone": "+919876543210",
  "password": "password123"
}
```

### Social Login
```
POST /auth/social-login
```
**Body:**
```json
{
  "provider": "google", // google, apple, facebook
  "token": "provider_access_token",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

### Resend OTP
```
POST /auth/resend-otp
```
**Body:**
```json
{
  "phone": "+919876543210"
}
```

### Forgot Password
```
POST /auth/forgot-password
```
**Body:**
```json
{
  "phone": "+919876543210"
}
```

### Reset Password
```
POST /auth/reset-password
```
**Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

---

## 2. Profile APIs (`/api/customer/profile`)

### Get Profile
```
GET /profile
Authorization: Bearer <token>
```

### Update Profile
```
PUT /profile
Authorization: Bearer <token>
```
**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "Male",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+919876543211",
    "relationship": "Spouse"
  }
}
```

### Upload Profile Image
```
POST /profile/upload-image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Form Data:**
- `image`: File

### Get Addresses
```
GET /profile/addresses
Authorization: Bearer <token>
```

### Add Address
```
POST /profile/addresses
Authorization: Bearer <token>
```
**Body:**
```json
{
  "label": "Home",
  "address": "123 Main Street, City",
  "landmark": "Near Park",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "isDefault": true
}
```

### Update Address
```
PUT /profile/addresses/:id
Authorization: Bearer <token>
```

### Delete Address
```
DELETE /profile/addresses/:id
Authorization: Bearer <token>
```

### Change Password
```
PUT /profile/change-password
Authorization: Bearer <token>
```
**Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Update Phone
```
PUT /profile/phone
Authorization: Bearer <token>
```
**Body:**
```json
{
  "newPhone": "+919876543211"
}
```

---

## 3. Bookings APIs (`/api/customer/bookings`)

### Get Vehicle Categories
```
GET /bookings/vehicle-categories?city=Delhi
```

### Estimate Fare
```
POST /bookings/estimate-fare
```
**Body:**
```json
{
  "pickup": {
    "address": "Delhi Airport",
    "latitude": 28.5562,
    "longitude": 77.1000
  },
  "destination": {
    "address": "Agra Taj Mahal",
    "latitude": 27.1751,
    "longitude": 78.0421
  },
  "additionalStops": [],
  "serviceType": "one_way",
  "vehicleCategory": "Sedan",
  "pickupDate": "2024-12-25",
  "pickupTime": "10:00",
  "promoCode": "FIRST50"
}
```

### Get Packages
```
GET /bookings/packages?city=Delhi&duration=3&category=adventure&page=1&limit=10
```

### Get Package Details
```
GET /bookings/packages/:id
```

### Create Booking
```
POST /bookings/create
Authorization: Bearer <token>
```
**Body:**
```json
{
  "bookingType": "outstation",
  "serviceType": "one_way",
  "pickup": {
    "address": "Delhi Airport",
    "latitude": 28.5562,
    "longitude": 77.1000
  },
  "destination": {
    "address": "Agra Taj Mahal",
    "latitude": 27.1751,
    "longitude": 78.0421
  },
  "pickupDate": "2024-12-25",
  "pickupTime": "10:00",
  "passengers": [
    { "name": "John Doe", "age": 30, "gender": "Male" }
  ],
  "luggageCount": 2,
  "vehicleCategory": "Sedan",
  "paymentMethod": "UPI",
  "promoCode": "FIRST50",
  "specialRequests": "Need extra water bottles"
}
```

### Get My Bookings
```
GET /bookings/my-bookings?status=completed&page=1&limit=10&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

### Get Booking Details
```
GET /bookings/:id
Authorization: Bearer <token>
```

### Cancel Booking
```
PUT /bookings/:id/cancel
Authorization: Bearer <token>
```
**Body:**
```json
{
  "cancellationReason": "Change of plans"
}
```

### Rate Booking
```
POST /bookings/:id/rate
Authorization: Bearer <token>
```
**Body:**
```json
{
  "driverRating": 5,
  "vehicleRating": 4,
  "serviceRating": 5,
  "overallRating": 5,
  "feedback": "Great service!"
}
```

---

## 4. Payments APIs (`/api/customer/payments`)

### Get Payment Methods
```
GET /payments/methods
```

### Get Wallet
```
GET /payments/wallet
Authorization: Bearer <token>
```

### Top-up Wallet
```
POST /payments/wallet/topup
Authorization: Bearer <token>
```
**Body:**
```json
{
  "amount": 500,
  "paymentMethod": "upi"
}
```

### Process Payment
```
POST /payments/process
Authorization: Bearer <token>
```
**Body:**
```json
{
  "bookingId": "booking_id",
  "paymentMethod": "wallet",
  "amount": 2500
}
```

### Get Payment History
```
GET /payments/history?page=1&limit=10
Authorization: Bearer <token>
```

### Get Invoice
```
GET /payments/invoice/:bookingId
Authorization: Bearer <token>
```

### Request Refund
```
POST /payments/refund
Authorization: Bearer <token>
```
**Body:**
```json
{
  "bookingId": "booking_id",
  "reason": "Trip cancelled by driver"
}
```

---

## 5. Trips APIs (`/api/customer/trips`)

### Get Active Trips
```
GET /trips/active
Authorization: Bearer <token>
```

### Track Trip
```
GET /trips/:id/track
Authorization: Bearer <token>
```

### Send SOS Alert
```
POST /trips/:id/sos
Authorization: Bearer <token>
```
**Body:**
```json
{
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "message": "Need help"
}
```

### Send Message to Driver
```
POST /trips/:id/messages
Authorization: Bearer <token>
```
**Body:**
```json
{
  "message": "I'm at gate 2",
  "messageType": "text"
}
```

### Get Trip Messages
```
GET /trips/:id/messages
Authorization: Bearer <token>
```

### Get ETA
```
GET /trips/:id/eta
Authorization: Bearer <token>
```

### Share Location
```
POST /trips/:id/share-location
Authorization: Bearer <token>
```
**Body:**
```json
{
  "contacts": ["+919876543210", "+919876543211"]
}
```

---

## 6. Support APIs (`/api/customer/support`)

### Get Support Categories
```
GET /support/categories
```

### Get FAQ
```
GET /support/faq?category=payment_issue
```

### Create Support Ticket
```
POST /support/tickets
Authorization: Bearer <token>
```
**Body:**
```json
{
  "category": "payment_issue",
  "subject": "Payment not reflected",
  "description": "I paid for my trip but it shows pending",
  "bookingId": "booking_id",
  "priority": "high"
}
```

### Get My Tickets
```
GET /support/tickets?status=open&page=1&limit=10
Authorization: Bearer <token>
```

### Get Ticket Details
```
GET /support/tickets/:id
Authorization: Bearer <token>
```

### Add Message to Ticket
```
POST /support/tickets/:id/messages
Authorization: Bearer <token>
```
**Body:**
```json
{
  "message": "Any update on this?"
}
```

### Rate Ticket Resolution
```
PUT /support/tickets/:id/rate
Authorization: Bearer <token>
```
**Body:**
```json
{
  "score": 5,
  "feedback": "Quick resolution!"
}
```

### Get Contact Information
```
GET /support/contact
```

### Submit General Feedback
```
POST /support/feedback
```
**Body:**
```json
{
  "type": "suggestion",
  "subject": "App improvement",
  "message": "Add dark mode",
  "rating": 4
}
```

---

## 7. Promotions APIs (`/api/customer/promotions`)

### Get All Promotions
```
GET /promotions
```

### Get Featured Promotions
```
GET /promotions/featured
```

### Validate Promo Code
```
POST /promotions/validate
Authorization: Bearer <token>
```
**Body:**
```json
{
  "code": "FIRST50",
  "bookingAmount": 2500,
  "vehicleCategory": "Sedan",
  "serviceType": "one_way"
}
```

### Get My Coupons
```
GET /promotions/my-coupons?status=available
Authorization: Bearer <token>
```
Status options: `all`, `available`, `used`, `expired`

### Get Referral Info
```
GET /promotions/referral
Authorization: Bearer <token>
```

---

## 8. Favorites APIs (`/api/customer/favorites`)

### Get Saved Locations
```
GET /favorites/locations
Authorization: Bearer <token>
```

### Add Saved Location
```
POST /favorites/locations
Authorization: Bearer <token>
```
**Body:**
```json
{
  "type": "home",
  "label": "Home",
  "address": "123 Main Street, City",
  "landmark": "Near Park",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "placeId": "ChIJxxxxxxx"
}
```

### Update Saved Location
```
PUT /favorites/locations/:id
Authorization: Bearer <token>
```

### Delete Saved Location
```
DELETE /favorites/locations/:id
Authorization: Bearer <token>
```

### Get Favorite Drivers
```
GET /favorites/drivers
Authorization: Bearer <token>
```

### Add Favorite Driver
```
POST /favorites/drivers
Authorization: Bearer <token>
```
**Body:**
```json
{
  "driverId": "driver_object_id",
  "note": "Friendly driver"
}
```

### Remove Favorite Driver
```
DELETE /favorites/drivers/:driverId
Authorization: Bearer <token>
```

### Request Favorite Driver
```
POST /favorites/drivers/:driverId/request
Authorization: Bearer <token>
```
**Body:**
```json
{
  "bookingId": "booking_object_id"
}
```

### Get Recent Routes
```
GET /favorites/recent-routes
Authorization: Bearer <token>
```

---

## 9. Notifications APIs (`/api/customer/notifications`)

### Get Notifications
```
GET /notifications?page=1&limit=20&type=booking&unreadOnly=false
Authorization: Bearer <token>
```

### Get Unread Count
```
GET /notifications/unread-count
Authorization: Bearer <token>
```

### Mark as Read
```
PUT /notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read
```
PUT /notifications/read-all
Authorization: Bearer <token>
```

### Delete Notification
```
DELETE /notifications/:id
Authorization: Bearer <token>
```

### Clear All Notifications
```
DELETE /notifications/clear-all?readOnly=false
Authorization: Bearer <token>
```

### Get Notification Settings
```
GET /notifications/settings
Authorization: Bearer <token>
```

### Update Notification Settings
```
PUT /notifications/settings
Authorization: Bearer <token>
```
**Body:**
```json
{
  "push": {
    "enabled": true,
    "booking": true,
    "trip": true,
    "payment": true,
    "promotion": false,
    "system": true
  },
  "email": {
    "enabled": true,
    "booking": true,
    "promotion": false
  },
  "sms": {
    "enabled": true,
    "booking": true,
    "otp": true
  }
}
```

### Register FCM Token
```
POST /notifications/register-token
Authorization: Bearer <token>
```
**Body:**
```json
{
  "fcmToken": "firebase_cloud_messaging_token",
  "deviceType": "android",
  "deviceId": "unique_device_id"
}
```

---

## 10. Search APIs (`/api/customer/search`)

### Search Places
```
GET /search/places?query=Delhi+Airport&latitude=28.6139&longitude=77.2090
```

### Get Place Details
```
GET /search/places/:placeId
```

### Geocode Address
```
GET /search/geocode?address=Delhi+Airport
```

### Reverse Geocode
```
GET /search/reverse-geocode?latitude=28.6139&longitude=77.2090
```

### Get Popular Destinations
```
GET /search/popular-destinations?city=Delhi&limit=10
```

### Search Packages
```
GET /search/packages?query=goa&destination=Goa&minDuration=2&maxDuration=5&minPrice=5000&maxPrice=20000&sortBy=popularity
```

### Search Vehicles
```
GET /search/vehicles?seatingCapacity=4&priceRange=1000-5000
```

### Get Suggestions
```
GET /search/suggestions?type=all
```
Type options: `all`, `recentSearches`, `popularSearches`, `trendingDestinations`, `featuredPackages`

### Get Nearby Places
```
GET /search/nearby?latitude=28.6139&longitude=77.2090&type=tourist_attraction&radius=5000
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50
    }
  }
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Booking Statuses

| Status | Description |
|--------|-------------|
| pending | Booking created, awaiting confirmation |
| confirmed | Booking confirmed, awaiting driver assignment |
| driver_assigned | Driver has been assigned |
| driver_arrived | Driver has arrived at pickup location |
| trip_started | Trip has started |
| in_progress | Trip is in progress |
| completed | Trip completed |
| cancelled | Booking cancelled |
| no_show | Customer did not show up |

---

## Payment Statuses

| Status | Description |
|--------|-------------|
| pending | Payment not yet processed |
| completed | Payment successful |
| failed | Payment failed |
| refunded | Payment refunded |

---

## Vehicle Categories

- Mini
- Sedan
- SUV
- Luxury
- Tempo Traveller
- Bus

---

## Service Types

- one_way
- round_trip
- multi_city
