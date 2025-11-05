import mongoose from 'mongoose';

const vehicleCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    enum: ['Sedan', 'SUV', 'Luxury', 'Mini', 'Tempo Traveller', 'Bus']
  },
  
  displayName: { type: String, required: true },
  description: String,
  image: String,
  
  // Capacity
  seatingCapacity: { type: Number, required: true },
  luggageCapacity: { type: Number, required: true },
  
  // Features
  features: [{
    name: String,
    icon: String,
    included: { type: Boolean, default: true }
  }],
  
  // Pricing Structure
  pricing: {
    // Base fare for booking
    basePrice: { type: Number, required: true },
    
    // Per kilometer charges
    perKm: { type: Number, required: true },
    
    // Per hour charges (for time-based bookings)
    perHour: { type: Number, required: true },
    
    // Outstation pricing (different rates for different distances)
    outstationRates: {
      '0-100km': {
        perKm: Number,
        driverAllowance: Number,
        minimumFare: Number
      },
      '100-300km': {
        perKm: Number,
        driverAllowance: Number,
        minimumFare: Number
      },
      '300km+': {
        perKm: Number,
        driverAllowance: Number,
        minimumFare: Number
      }
    },
    
    // Round trip discounts
    roundTripDiscount: { type: Number, default: 10 }, // percentage
    
    // Multi-city pricing
    multiCityMultiplier: { type: Number, default: 1.2 },
    
    // Night charges (10 PM to 6 AM)
    nightChargeMultiplier: { type: Number, default: 1.25 },
    
    // Peak hour charges
    peakHourMultiplier: { type: Number, default: 1.15 },
    
    // Airport/Railway station charges
    airportSurcharge: { type: Number, default: 0 },
    railwaySurcharge: { type: Number, default: 0 },
    
    // Cancellation charges
    cancellationCharges: {
      'before_1_hour': { type: Number, default: 0 },
      'before_30_min': { type: Number, default: 50 },
      'after_arrival': { type: Number, default: 100 }
    }
  },
  
  // Availability
  isActive: { type: Boolean, default: true },
  availableCities: [String],
  
  // Terms & Conditions
  termsAndConditions: [String],
  inclusions: [String],
  exclusions: [String],
  
  // Sort order for display
  sortOrder: { type: Number, default: 0 }
  
}, {
  timestamps: true
});

// Index for efficient queries
vehicleCategorySchema.index({ name: 1 });
vehicleCategorySchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.model('VehicleCategory', vehicleCategorySchema);