import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Adventure', 'Pilgrimage', 'Beach', 'Hill Station', 'Heritage', 'Wildlife', 'Cultural', 'Business'],
    required: true
  },
  destinations: [{
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    stayDuration: Number // in days
  }],
  duration: {
    days: { type: Number, required: true },
    nights: { type: Number, required: true }
  },
  itinerary: [{
    day: { type: Number, required: true },
    title: String,
    description: String,
    activities: [String],
    meals: [{
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
    }],
    accommodation: {
      type: String,
      category: String,
      location: String
    },
    transportation: String
  }],
  pricing: {
    basePrice: { type: Number, required: true },
    pricePerPerson: { type: Number, required: true },
    childPrice: Number,
    infantPrice: Number,
    seasonalPricing: [{
      season: String,
      startDate: Date,
      endDate: Date,
      multiplier: Number // 1.0 = normal, 1.2 = 20% increase
    }],
    groupDiscounts: [{
      minPeople: Number,
      maxPeople: Number,
      discountPercentage: Number
    }]
  },
  inclusions: [String],
  exclusions: [String],
  highlights: [String],
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],
  vehicleOptions: [{
    vehicleType: String,
    capacity: Number,
    additionalCost: Number
  }],
  accommodationOptions: [{
    type: String,
    category: String,
    additionalCost: Number
  }],
  availability: {
    isActive: { type: Boolean, default: true },
    blackoutDates: [Date],
    advanceBookingDays: { type: Number, default: 3 },
    maxBookingDays: { type: Number, default: 365 }
  },
  bookingPolicy: {
    cancellationPolicy: String,
    refundPolicy: String,
    paymentTerms: String,
    termsAndConditions: String
  },
  requirements: {
    minimumAge: Number,
    maximumAge: Number,
    fitnessLevel: String,
    documentsRequired: [String],
    medicalClearance: Boolean
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  tags: [String],
  seoData: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
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

packageSchema.index({ category: 1, 'availability.isActive': 1 });
packageSchema.index({ 'destinations.city': 1, 'destinations.state': 1 });
packageSchema.index({ tags: 1, 'rating.average': 1 });

export default mongoose.model('Package', packageSchema);