import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
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
    required: true
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
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  preferences: {
    preferredVehicleType: [String],
    languages: [String],
    paymentMethods: [String]
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastBookingDate: {
    type: Date
  },
  registrationSource: {
    type: String,
    enum: ['Web', 'Mobile App', 'Admin Portal'],
    default: 'Web'
  }
}, {
  timestamps: true
});

customerSchema.index({ email: 1, phone: 1 });

export default mongoose.model('Customer', customerSchema);