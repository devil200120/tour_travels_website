import express from 'express';
import mongoose from 'mongoose';
import { authenticateCustomer } from '../../middleware/customerAuth.js';

const router = express.Router();

// Promotion Schema (inline for simplicity - can move to models later)
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
  maxDiscount: { type: Number }, // For percentage discounts
  minBookingAmount: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  usageLimit: { type: Number }, // Total uses allowed
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  applicableVehicles: [String], // Empty means all
  applicableServiceTypes: [String], // 'one_way', 'round_trip', etc.
  isActive: { type: Boolean, default: true },
  isFirstTimeOnly: { type: Boolean, default: false },
  termsAndConditions: [String],
  imageUrl: String,
  bannerUrl: String
}, { timestamps: true });

const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);

// User Promo Usage Schema
const promoUsageSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  promotion: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerBooking' },
  usedAt: { type: Date, default: Date.now },
  discountApplied: { type: Number, required: true }
}, { timestamps: true });

const PromoUsage = mongoose.models.PromoUsage || mongoose.model('PromoUsage', promoUsageSchema);

// @route   GET /api/customer/promotions
// @desc    Get all active promotions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
    const promotions = await Promotion.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: { $exists: false } },
        { usageLimit: null },
        { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
      ]
    })
    .select('-usageCount -usageLimit')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: promotions
    });

  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotions'
    });
  }
});

// @route   GET /api/customer/promotions/featured
// @desc    Get featured/banner promotions for home screen
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const now = new Date();
    
    const promotions = await Promotion.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      bannerUrl: { $exists: true, $ne: null }
    })
    .select('code title description bannerUrl discountType discountValue maxDiscount')
    .limit(5)
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: promotions
    });

  } catch (error) {
    console.error('Get featured promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured promotions'
    });
  }
});

// @route   POST /api/customer/promotions/validate
// @desc    Validate a promo code
// @access  Private
router.post('/validate', authenticateCustomer, async (req, res) => {
  try {
    const { 
      code, 
      bookingAmount, 
      vehicleCategory, 
      serviceType 
    } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required'
      });
    }

    const promotion = await Promotion.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }

    const now = new Date();

    // Check validity period
    if (now < promotion.validFrom || now > promotion.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Promo code has expired or not yet active'
      });
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Promo code usage limit exceeded'
      });
    }

    // Check per-user limit
    const userUsageCount = await PromoUsage.countDocuments({
      customer: req.customer.id,
      promotion: promotion._id
    });

    if (userUsageCount >= promotion.perUserLimit) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this promo code'
      });
    }

    // Check first-time user restriction
    if (promotion.isFirstTimeOnly) {
      const existingBookings = await mongoose.model('CustomerBooking').countDocuments({
        customer: req.customer.id,
        status: { $in: ['completed'] }
      });

      if (existingBookings > 0) {
        return res.status(400).json({
          success: false,
          message: 'This promo code is for first-time users only'
        });
      }
    }

    // Check minimum booking amount
    if (bookingAmount && bookingAmount < promotion.minBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount of ₹${promotion.minBookingAmount} required`
      });
    }

    // Check applicable vehicle category
    if (vehicleCategory && 
        promotion.applicableVehicles.length > 0 && 
        !promotion.applicableVehicles.includes(vehicleCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Promo code not applicable for selected vehicle'
      });
    }

    // Check applicable service type
    if (serviceType && 
        promotion.applicableServiceTypes.length > 0 && 
        !promotion.applicableServiceTypes.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: 'Promo code not applicable for selected service type'
      });
    }

    // Calculate discount
    let discount = 0;
    if (promotion.discountType === 'percentage') {
      discount = (bookingAmount * promotion.discountValue) / 100;
      if (promotion.maxDiscount && discount > promotion.maxDiscount) {
        discount = promotion.maxDiscount;
      }
    } else {
      discount = promotion.discountValue;
    }

    res.json({
      success: true,
      message: 'Promo code applied successfully',
      data: {
        code: promotion.code,
        title: promotion.title,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        discount: Math.round(discount),
        maxDiscount: promotion.maxDiscount,
        termsAndConditions: promotion.termsAndConditions
      }
    });

  } catch (error) {
    console.error('Validate promo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating promo code'
    });
  }
});

// @route   GET /api/customer/promotions/my-coupons
// @desc    Get customer's available/used coupons
// @access  Private
router.get('/my-coupons', authenticateCustomer, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const now = new Date();

    // Get all active promotions
    const activePromotions = await Promotion.find({
      isActive: true,
      validUntil: { $gte: now }
    });

    // Get user's usage
    const userUsages = await PromoUsage.find({ 
      customer: req.customer.id 
    }).populate('promotion');

    const usedPromoIds = userUsages.map(u => u.promotion._id.toString());

    const coupons = {
      available: [],
      used: [],
      expired: []
    };

    for (const promo of activePromotions) {
      const userUsageCount = userUsages.filter(
        u => u.promotion._id.toString() === promo._id.toString()
      ).length;

      if (userUsageCount >= promo.perUserLimit) {
        coupons.used.push({
          ...promo.toObject(),
          usedCount: userUsageCount
        });
      } else {
        coupons.available.push(promo);
      }
    }

    // Get expired promotions that user used
    const expiredUsages = userUsages.filter(
      u => u.promotion.validUntil < now
    );
    coupons.expired = expiredUsages.map(u => u.promotion);

    let result = coupons;
    if (status === 'available') {
      result = coupons.available;
    } else if (status === 'used') {
      result = coupons.used;
    } else if (status === 'expired') {
      result = coupons.expired;
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get my coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupons'
    });
  }
});

// @route   GET /api/customer/promotions/referral
// @desc    Get customer's referral info
// @access  Private
router.get('/referral', authenticateCustomer, async (req, res) => {
  try {
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findById(req.customer.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Count successful referrals (referredBy can be ObjectId or referralCode string)
    const referralCount = await Customer.countDocuments({
      $or: [
        { referredBy: customer._id },
        { referredByCode: customer.referralCode }
      ]
    });

    // Calculate referral earnings (mock - in production, track actual earnings)
    const referralEarnings = customer.referralEarnings || (referralCount * 100); // ₹100 per referral

    res.json({
      success: true,
      data: {
        referralCode: customer.referralCode,
        referralLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/register?ref=${customer.referralCode}`,
        totalReferrals: referralCount,
        totalEarnings: referralEarnings,
        pendingEarnings: 0,
        rewardPerReferral: 100,
        termsAndConditions: [
          'Refer a friend and earn ₹100 when they complete their first trip',
          'Your friend gets ₹50 off on their first booking',
          'Maximum 20 referrals per month',
          'Referral bonus credited within 24 hours of trip completion'
        ]
      }
    });

  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching referral information'
    });
  }
});

export default router;
