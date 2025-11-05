import mongoose from 'mongoose';

const PassengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] }
});

const LocationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  landmark: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  placeId: String
});

const FareBreakdownSchema = new mongoose.Schema({
  baseFare: { type: Number, required: true },
  distanceCharges: { type: Number, default: 0 },
  timeCharges: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  tolls: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  promoDiscount: { type: Number, default: 0 },
  totalFare: { type: Number, required: true }
});

const customerBookingSchema = new mongoose.Schema({
  // Customer Information
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  
  // Booking Type
  bookingType: { 
    type: String, 
    enum: ['outstation', 'package_tour'], 
    required: true 
  },
  
  // Service Type for Outstation
  serviceType: { 
    type: String, 
    enum: ['one_way', 'round_trip', 'multi_city'],
    required: function() { return this.bookingType === 'outstation'; }
  },
  
  // Trip Details
  pickup: LocationSchema,
  destination: LocationSchema,
  additionalStops: [LocationSchema], // For multi-city trips
  
  // Date & Time
  pickupDate: { type: Date, required: true },
  pickupTime: { type: String, required: true },
  returnDate: { type: Date }, // For round trips
  returnTime: { type: String }, // For round trips
  
  // Passengers & Luggage
  passengers: [PassengerSchema],
  passengerCount: { type: Number, required: true },
  luggageCount: { type: Number, default: 0 },
  
  // Vehicle Information
  vehicleCategory: {
    type: String,
    enum: ['Sedan', 'SUV', 'Luxury', 'Mini', 'Tempo Traveller', 'Bus'],
    required: true
  },
  vehiclePreferences: {
    acRequired: { type: Boolean, default: true },
    fuelType: { type: String, enum: ['Petrol', 'Diesel', 'CNG', 'Electric'] }
  },
  
  // Package Tour Specific (if bookingType is package_tour)
  packageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Package'
  },
  customItinerary: [{
    day: Number,
    location: String,
    activities: [String],
    accommodation: String,
    meals: [String]
  }],
  
  // Pricing
  fareBreakdown: FareBreakdownSchema,
  estimatedDistance: { type: Number }, // in KMs
  estimatedDuration: { type: Number }, // in minutes
  
  // Promo & Discounts
  promoCode: String,
  promoDiscount: { type: Number, default: 0 },
  loyaltyPointsUsed: { type: Number, default: 0 },
  
  // Payment
  paymentMethod: { 
    type: String, 
    enum: ['UPI', 'Card', 'Wallet', 'NetBanking', 'Cash'],
    required: true
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentId: String,
  
  // Booking Status
  status: { 
    type: String, 
    enum: [
      'pending', 'confirmed', 'driver_assigned', 'driver_arrived', 
      'trip_started', 'in_progress', 'completed', 'cancelled', 'no_show'
    ], 
    default: 'pending' 
  },
  
  // Driver Assignment
  driver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Driver' 
  },
  vehicle: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle' 
  },
  
  // Real-time Tracking
  currentLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  },
  estimatedArrival: Date,
  actualStartTime: Date,
  actualEndTime: Date,
  
  // Trip Details
  actualDistance: Number,
  actualDuration: Number,
  route: [{
    latitude: Number,
    longitude: Number,
    timestamp: Date
  }],
  
  // Ratings & Feedback
  customerRating: {
    driverRating: { type: Number, min: 1, max: 5 },
    vehicleRating: { type: Number, min: 1, max: 5 },
    serviceRating: { type: Number, min: 1, max: 5 },
    overallRating: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedAt: Date
  },
  
  // Special Requirements
  specialRequests: String,
  accessibilityNeeds: String,
  
  // Communication
  messages: [{
    sender: { type: String, enum: ['customer', 'driver', 'support'] },
    message: String,
    timestamp: { type: Date, default: Date.now },
    messageType: { type: String, enum: ['text', 'location', 'image'], default: 'text' }
  }],
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: { type: String, enum: ['customer', 'driver', 'admin'] },
  cancellationTime: Date,
  cancellationCharges: { type: Number, default: 0 },
  
  // Invoice
  invoiceNumber: { type: String, unique: true },
  invoiceGenerated: { type: Boolean, default: false },
  
  // Support
  supportTickets: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SupportTicket' 
  }],
  
}, {
  timestamps: true
});

// Indexes
customerBookingSchema.index({ customer: 1, createdAt: -1 });
customerBookingSchema.index({ status: 1 });
customerBookingSchema.index({ driver: 1 });
customerBookingSchema.index({ pickupDate: 1 });
customerBookingSchema.index({ invoiceNumber: 1 });

// Pre-save middleware to generate invoice number
customerBookingSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.invoiceNumber = `TT${year}${month}${random}`;
  }
  next();
});

// Method to calculate estimated fare
customerBookingSchema.methods.calculateEstimatedFare = function(baseFareRates) {
  const distance = this.estimatedDistance || 0;
  const duration = this.estimatedDuration || 0;
  
  let baseFare = baseFareRates[this.vehicleCategory]?.basePrice || 0;
  let distanceCharges = distance * (baseFareRates[this.vehicleCategory]?.perKm || 0);
  let timeCharges = (duration / 60) * (baseFareRates[this.vehicleCategory]?.perHour || 0);
  let taxes = (baseFare + distanceCharges + timeCharges) * 0.18; // 18% GST
  
  let totalFare = baseFare + distanceCharges + timeCharges + taxes - this.promoDiscount;
  
  this.fareBreakdown = {
    baseFare,
    distanceCharges,
    timeCharges,
    taxes,
    discount: this.promoDiscount,
    totalFare
  };
  
  return totalFare;
};

export default mongoose.model('CustomerBooking', customerBookingSchema);