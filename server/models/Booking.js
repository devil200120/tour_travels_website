import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['Outstation Transfer', 'Package Tour', 'Local Trip', 'Airport Transfer'],
    required: true
  },
  tripType: {
    type: String,
    enum: ['One-way', 'Round trip', 'Multi-city'],
    required: true
  },
  pickup: {
    address: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    landmark: String,
    contactPerson: String,
    contactPhone: String
  },
  dropoff: {
    address: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    landmark: String,
    contactPerson: String,
    contactPhone: String
  },
  intermediateStops: [{
    address: String,
    latitude: Number,
    longitude: Number,
    stopDuration: Number, // in minutes
    purpose: String
  }],
  schedule: {
    startDate: { type: Date, required: true },
    endDate: Date,
    startTime: String,
    endTime: String,
    duration: Number // in hours
  },
  passengers: {
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    totalCount: { type: Number, required: true }
  },
  vehiclePreference: {
    type: String,
    enum: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Bus', 'Tempo Traveller']
  },
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  rejectedBy: [{
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true
    },
    reason: {
      type: String,
      default: 'No reason provided'
    },
    rejectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  packageDetails: {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package'
    },
    customItinerary: [{
      day: Number,
      activities: [String],
      meals: [String],
      accommodation: String
    }],
    inclusions: [String],
    exclusions: [String]
  },
  pricing: {
    basePrice: { type: Number, required: true },
    extraCharges: [{
      type: String,
      amount: Number,
      description: String
    }],
    discounts: [{
      type: String,
      amount: Number,
      code: String
    }],
    taxes: [{
      type: String,
      amount: Number,
      percentage: Number
    }],
    totalAmount: { type: Number, required: true }
  },
  payment: {
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Refunded', 'Failed'],
      default: 'Pending'
    },
    method: String,
    advanceAmount: Number,
    balanceAmount: Number,
    transactions: [{
      transactionId: String,
      amount: Number,
      method: String,
      status: String,
      timestamp: Date,
      gatewayResponse: mongoose.Schema.Types.Mixed
    }]
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  tripDetails: {
    startTime: Date,
    endTime: Date,
    completedAt: Date,  // When the trip was actually completed
    actualStartLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    actualEndLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    totalDistance: Number,
    totalDuration: Number, // in minutes
    route: [{ // GPS tracking points
      latitude: Number,
      longitude: Number,
      timestamp: Date,
      speed: Number
    }]
  },
  specialRequests: [String],
  notes: {
    customerNotes: String,
    adminNotes: String,
    driverNotes: String
  },
  feedback: {
    rating: Number,
    review: String,
    driverRating: Number,
    vehicleRating: Number,
    serviceRating: Number,
    timestamp: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, {
  timestamps: true
});

// Generate booking ID before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingId = `TT${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

bookingSchema.index({ bookingId: 1, customer: 1 });
bookingSchema.index({ status: 1, 'schedule.startDate': 1 });
bookingSchema.index({ assignedDriver: 1, assignedVehicle: 1 });

export default mongoose.model('Booking', bookingSchema);