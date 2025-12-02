import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Promotion Schema
const promotionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  title: { type: String, required: true },
  description: String,
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true 
  },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number },
  minBookingAmount: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  usageLimit: { type: Number },
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  applicableVehicles: [String],
  applicableServiceTypes: [String],
  isActive: { type: Boolean, default: true },
  isFirstTimeOnly: { type: Boolean, default: false },
  termsAndConditions: [String],
  imageUrl: String,
  bannerUrl: String
}, { timestamps: true });

const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);

const samplePromotions = [
  {
    code: 'WELCOME50',
    title: 'Welcome Offer - 50% Off',
    description: 'Get 50% off on your first ride! Maximum discount ₹200.',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 200,
    minBookingAmount: 200,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    usageLimit: 1000,
    perUserLimit: 1,
    isActive: true,
    isFirstTimeOnly: true,
    termsAndConditions: [
      'Valid for first-time users only',
      'Maximum discount of ₹200',
      'Minimum booking amount ₹200',
      'Valid on all vehicle types'
    ],
    bannerUrl: 'https://example.com/banners/welcome50.jpg'
  },
  {
    code: 'FLAT100',
    title: 'Flat ₹100 Off',
    description: 'Get flat ₹100 off on rides above ₹500',
    discountType: 'fixed',
    discountValue: 100,
    minBookingAmount: 500,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    usageLimit: 500,
    perUserLimit: 2,
    isActive: true,
    isFirstTimeOnly: false,
    termsAndConditions: [
      'Minimum booking amount ₹500',
      'Can be used 2 times per user',
      'Valid on all vehicle types'
    ],
    bannerUrl: 'https://example.com/banners/flat100.jpg'
  },
  {
    code: 'WEEKEND20',
    title: 'Weekend Special - 20% Off',
    description: 'Enjoy 20% off on weekend rides!',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 300,
    minBookingAmount: 300,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    perUserLimit: 5,
    isActive: true,
    isFirstTimeOnly: false,
    termsAndConditions: [
      'Valid on weekends only (Saturday & Sunday)',
      'Maximum discount ₹300',
      'Minimum booking amount ₹300'
    ]
  },
  {
    code: 'SUV150',
    title: 'SUV Special - ₹150 Off',
    description: 'Get ₹150 off on SUV bookings',
    discountType: 'fixed',
    discountValue: 150,
    minBookingAmount: 800,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    perUserLimit: 3,
    applicableVehicles: ['SUV'],
    isActive: true,
    isFirstTimeOnly: false,
    termsAndConditions: [
      'Valid only for SUV bookings',
      'Minimum booking amount ₹800',
      'Can be used 3 times per user'
    ]
  },
  {
    code: 'ROUNDTRIP25',
    title: 'Round Trip - 25% Off',
    description: 'Get 25% off on round trip bookings!',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 500,
    minBookingAmount: 1000,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    perUserLimit: 2,
    applicableServiceTypes: ['round_trip'],
    isActive: true,
    isFirstTimeOnly: false,
    termsAndConditions: [
      'Valid only for round trip bookings',
      'Maximum discount ₹500',
      'Minimum booking amount ₹1000'
    ],
    bannerUrl: 'https://example.com/banners/roundtrip25.jpg'
  },
  {
    code: 'NEWYEAR2025',
    title: 'New Year Special - 30% Off',
    description: 'Celebrate New Year with 30% off on all rides!',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 400,
    minBookingAmount: 400,
    validFrom: new Date(),
    validUntil: new Date('2025-01-31'),
    usageLimit: 2000,
    perUserLimit: 3,
    isActive: true,
    isFirstTimeOnly: false,
    termsAndConditions: [
      'Valid till 31st January 2025',
      'Maximum discount ₹400',
      'Minimum booking amount ₹400',
      'Can be used 3 times per user'
    ],
    bannerUrl: 'https://example.com/banners/newyear2025.jpg'
  }
];

async function seedPromotions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_travels');
    console.log('MongoDB connected');

    // Clear existing promotions
    await Promotion.deleteMany({});
    console.log('Cleared existing promotions');

    // Insert sample promotions
    const result = await Promotion.insertMany(samplePromotions);
    console.log(`✅ Inserted ${result.length} promotions:`);
    
    result.forEach(promo => {
      console.log(`   - ${promo.code}: ${promo.title}`);
    });

    await mongoose.disconnect();
    console.log('\nDatabase disconnected. Promotions seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding promotions:', error);
    process.exit(1);
  }
}

seedPromotions();
