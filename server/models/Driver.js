import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default for security
  },
  alternatePhone: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  licenseExpiry: {
    type: Date,
    required: true
  },
  licenseType: {
    type: String,
    enum: ['Light Motor Vehicle', 'Heavy Motor Vehicle', 'Transport Vehicle'],
    required: true
  },
  experience: {
    type: Number, // in years
    required: true
  },
  profileImage: {
    type: String
  },
  documents: {
    aadharCard: String,
    panCard: String,
    licenseImage: String,
    policeVerification: String,
    medicalCertificate: String
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  kycStatus: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    address: String,
    lastUpdated: Date
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  languages: [String],
  specializations: [{
    type: String,
    enum: ['City Tours', 'Outstation', 'Airport Transfer', 'Local Trips']
  }],
  workingHours: {
    start: String, // e.g., "09:00"
    end: String,   // e.g., "22:00"
    daysOff: [String] // e.g., ["Sunday"]
  },
  availabilityReason: String,
  availabilityUpdatedAt: Date,
  pendingEarnings: {
    type: Number,
    default: 0
  },
  lastSettlementDate: Date,
  documentsUploadedAt: Date,
  lastActiveAt: Date,
  deviceInfo: {
    deviceId: String,
    deviceType: String, // "android", "ios"
    appVersion: String,
    lastSeen: Date
  },
  preferences: {
    maxRadius: { type: Number, default: 10 }, // km
    autoAcceptBookings: { type: Boolean, default: false },
    notifications: {
      bookingRequests: { type: Boolean, default: true },
      paymentUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

driverSchema.index({ email: 1, phone: 1, licenseNumber: 1 });
driverSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

export default mongoose.model('Driver', driverSchema);