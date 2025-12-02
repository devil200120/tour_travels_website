import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AddressSchema = new mongoose.Schema({
  label: { type: String, required: true }, // Home, Office, etc.
  address: { type: String, required: true },
  landmark: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  placeId: String, // Google Maps Place ID
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false }
});

const PaymentPreferenceSchema = new mongoose.Schema({
  preferredMethod: { 
    type: String, 
    enum: ['UPI', 'Card', 'Wallet', 'NetBanking'], 
    default: 'UPI' 
  },
  savedCards: [{
    cardId: String,
    lastFour: String,
    cardType: String,
    isDefault: Boolean
  }],
  walletBalance: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 }
});

const customerSchema = new mongoose.Schema({
  // Basic Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  password: { type: String, required: true },
  
  // Verification Status
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  phoneOTP: String,
  emailOTP: String,
  otpExpiry: Date,
  
  // Profile Details
  dateOfBirth: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  profileImage: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Addresses
  addresses: [AddressSchema],
  
  // Payment Preferences
  paymentPreferences: PaymentPreferenceSchema,
  
  // App Preferences
  preferences: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' },
    notifications: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  
  // Notification Preferences (detailed)
  notificationPreferences: {
    push: {
      enabled: { type: Boolean, default: true },
      booking: { type: Boolean, default: true },
      trip: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
      promotion: { type: Boolean, default: true },
      system: { type: Boolean, default: true }
    },
    email: {
      enabled: { type: Boolean, default: true },
      booking: { type: Boolean, default: true },
      trip: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
      promotion: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: false }
    },
    sms: {
      enabled: { type: Boolean, default: true },
      booking: { type: Boolean, default: true },
      trip: { type: Boolean, default: true },
      otp: { type: Boolean, default: true }
    }
  },
  
  // Social Login
  googleId: String,
  appleId: String,
  facebookId: String,
  
  // Account Status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'blocked'], 
    default: 'active' 
  },
  
  // Ratings & Reviews
  averageRating: { type: Number, default: 0 },
  totalRides: { type: Number, default: 0 },
  
  // Referral System
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  referralEarnings: { type: Number, default: 0 },
  
  // Device Information
  deviceInfo: {
    deviceId: String,
    deviceType: { type: String, enum: ['ios', 'android'] },
    fcmToken: String,
    appVersion: String
  },
  
  // Security
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Legacy fields for compatibility
  name: { type: String }, // Computed from firstName + lastName
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  loyaltyPoints: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastBookingDate: Date,
  registrationSource: {
    type: String,
    enum: ['Web', 'Mobile App', 'Admin Portal'],
    default: 'Mobile App'
  }
}, {
  timestamps: true
});

// Indexes (only for fields without unique: true)
customerSchema.index({ 'deviceInfo.fcmToken': 1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code and name field before saving
customerSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = `REF${this.phone.slice(-4)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  
  // Update legacy name field
  if (this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  
  next();
});

// Method to compare password
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
customerSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
customerSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, reset
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
customerSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

export default mongoose.model('Customer', customerSchema);