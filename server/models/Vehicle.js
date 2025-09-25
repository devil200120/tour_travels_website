import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Bus', 'Tempo Traveller'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'],
    required: true
  },
  seatingCapacity: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  documents: {
    registrationCertificate: String,
    insurance: String,
    puc: String,
    permit: String,
    fitness: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date
  },
  puc: {
    certificateNumber: String,
    expiryDate: Date
  },
  permit: {
    permitNumber: String,
    expiryDate: Date,
    routes: [String]
  },
  fitness: {
    certificateNumber: String,
    expiryDate: Date
  },
  features: [String], // AC, Music System, GPS, etc.
  images: [String],
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
  maintenanceSchedule: [{
    type: {
      type: String,
      enum: ['Oil Change', 'Tire Rotation', 'General Service', 'Insurance Renewal', 'PUC Renewal']
    },
    dueDate: Date,
    lastDone: Date,
    cost: Number,
    notes: String
  }],
  totalKilometers: {
    type: Number,
    default: 0
  },
  fuelEfficiency: {
    type: Number // km per liter
  },
  dailyRate: {
    type: Number
  },
  perKmRate: {
    type: Number
  }
}, {
  timestamps: true
});

vehicleSchema.index({ vehicleNumber: 1, owner: 1 });
vehicleSchema.index({ vehicleType: 1, isAvailable: 1 });

export default mongoose.model('Vehicle', vehicleSchema);