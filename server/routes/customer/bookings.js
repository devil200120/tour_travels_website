import express from 'express';
import CustomerBooking from '../../models/CustomerBooking.js';
import VehicleCategory from '../../models/VehicleCategory.js';
import Package from '../../models/Package.js';
import { authenticateCustomer } from '../../middleware/customerAuth.js';
import { calculateDistance, calculateFare, validatePromoCode } from '../../services/bookingService.js';

const router = express.Router();

// @route   GET /api/customer/bookings/vehicle-categories
// @desc    Get available vehicle categories with pricing
// @access  Public
router.get('/vehicle-categories', async (req, res) => {
  try {
    const { city } = req.query;

    const categories = await VehicleCategory.find({
      isActive: true,
      ...(city && { availableCities: city })
    }).sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get vehicle categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle categories'
    });
  }
});

// @route   POST /api/customer/bookings/estimate-fare
// @desc    Get fare estimation for a trip
// @access  Public
router.post('/estimate-fare', async (req, res) => {
  try {
    const {
      pickup,
      destination,
      additionalStops = [],
      serviceType,
      vehicleCategory,
      pickupDate,
      pickupTime,
      returnDate,
      promoCode
    } = req.body;

    // Validate required fields
    if (!pickup || !destination || !serviceType || !vehicleCategory) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for fare estimation'
      });
    }

    // Get vehicle category details
    const vehicleCat = await VehicleCategory.findOne({ name: vehicleCategory });
    if (!vehicleCat) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle category not found'
      });
    }

    // Calculate distance and duration
    const { distance, duration } = await calculateDistance(pickup, destination, additionalStops);

    // Calculate base fare
    let fareBreakdown = calculateFare({
      distance,
      duration,
      vehicleCategory: vehicleCat,
      serviceType,
      pickupDate,
      pickupTime,
      returnDate
    });

    // Apply promo code if provided
    let promoDiscount = 0;
    if (promoCode) {
      const promoResult = await validatePromoCode(promoCode, fareBreakdown.totalFare);
      if (promoResult.isValid) {
        promoDiscount = promoResult.discount;
        fareBreakdown.promoDiscount = promoDiscount;
        fareBreakdown.totalFare -= promoDiscount;
      }
    }

    res.json({
      success: true,
      data: {
        estimatedDistance: distance,
        estimatedDuration: duration,
        fareBreakdown,
        vehicleDetails: {
          name: vehicleCat.displayName,
          seatingCapacity: vehicleCat.seatingCapacity,
          features: vehicleCat.features
        },
        promoApplied: promoDiscount > 0
      }
    });

  } catch (error) {
    console.error('Fare estimation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating fare estimate'
    });
  }
});

// @route   GET /api/customer/bookings/packages
// @desc    Get available package tours
// @access  Public
router.get('/packages', async (req, res) => {
  try {
    const { 
      city, 
      duration, 
      category, 
      priceRange, 
      page = 1, 
      limit = 10 
    } = req.query;

    const filter = { isActive: true };
    
    if (city) filter.cities = { $in: [city] };
    if (duration) filter.duration = duration;
    if (category) filter.category = category;
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filter.basePrice = { $gte: min, $lte: max };
    }

    const packages = await Package.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ featured: -1, popularity: -1 });

    const total = await Package.countDocuments(filter);

    res.json({
      success: true,
      data: {
        packages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPackages: total
        }
      }
    });

  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching packages'
    });
  }
});

// @route   GET /api/customer/bookings/packages/:id
// @desc    Get package details
// @access  Public
router.get('/packages/:id', async (req, res) => {
  try {
    const packageTour = await Package.findById(req.params.id);
    
    if (!packageTour) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      data: packageTour
    });

  } catch (error) {
    console.error('Get package details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching package details'
    });
  }
});

// @route   POST /api/customer/bookings/create
// @desc    Create a new booking
// @access  Private
router.post('/create', authenticateCustomer, async (req, res) => {
  try {
    const {
      bookingType,
      serviceType,
      pickup,
      destination,
      additionalStops,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      passengers,
      luggageCount,
      vehicleCategory,
      vehiclePreferences,
      packageId,
      customItinerary,
      paymentMethod,
      promoCode,
      loyaltyPointsUsed = 0,
      specialRequests,
      accessibilityNeeds
    } = req.body;

    // Validate required fields
    if (!bookingType || !pickup || !destination || !pickupDate || !pickupTime || !vehicleCategory || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields'
      });
    }

    // Get vehicle category for pricing
    const vehicleCat = await VehicleCategory.findOne({ name: vehicleCategory });
    if (!vehicleCat) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle category not found'
      });
    }

    // Calculate distance and fare
    const { distance, duration } = await calculateDistance(pickup, destination, additionalStops);
    
    const fareBreakdown = calculateFare({
      distance,
      duration,
      vehicleCategory: vehicleCat,
      serviceType,
      pickupDate,
      pickupTime,
      returnDate
    });

    // Apply promo code
    let promoDiscount = 0;
    if (promoCode) {
      const promoResult = await validatePromoCode(promoCode, fareBreakdown.totalFare);
      if (promoResult.isValid) {
        promoDiscount = promoResult.discount;
        fareBreakdown.promoDiscount = promoDiscount;
        fareBreakdown.totalFare -= promoDiscount;
      }
    }

    // Apply loyalty points (1 point = 1 rupee)
    if (loyaltyPointsUsed > 0) {
      fareBreakdown.totalFare -= loyaltyPointsUsed;
    }

    // Create booking
    const booking = new CustomerBooking({
      customer: req.customer.id,
      bookingType,
      serviceType,
      pickup,
      destination,
      additionalStops,
      pickupDate: new Date(pickupDate),
      pickupTime,
      returnDate: returnDate ? new Date(returnDate) : undefined,
      returnTime,
      passengers,
      passengerCount: passengers?.length || 1,
      luggageCount,
      vehicleCategory,
      vehiclePreferences,
      packageId,
      customItinerary,
      fareBreakdown,
      estimatedDistance: distance,
      estimatedDuration: duration,
      promoCode,
      promoDiscount,
      loyaltyPointsUsed,
      paymentMethod,
      specialRequests,
      accessibilityNeeds,
      status: 'pending'
    });

    await booking.save();

    // TODO: Process payment based on paymentMethod
    // For now, mark as completed for development
    booking.paymentStatus = 'completed';
    booking.status = 'confirmed';
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking._id,
        invoiceNumber: booking.invoiceNumber,
        estimatedFare: fareBreakdown.totalFare,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  }
});

// @route   GET /api/customer/bookings/my-bookings
// @desc    Get customer's booking history
// @access  Private
router.get('/my-bookings', authenticateCustomer, async (req, res) => {
  try {
    const { 
      status, 
      bookingType, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { customer: req.customer.id };
    
    if (status) filter.status = status;
    if (bookingType) filter.bookingType = bookingType;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bookings = await CustomerBooking.find(filter)
      .populate('packageId', 'name images duration')
      .populate('driver', 'firstName lastName phone rating')
      .populate('vehicle', 'vehicleNumber make model')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await CustomerBooking.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBookings: total
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
});

// @route   GET /api/customer/bookings/:id
// @desc    Get booking details
// @access  Private
router.get('/:id', authenticateCustomer, async (req, res) => {
  try {
    const booking = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    })
    .populate('packageId')
    .populate('driver', 'firstName lastName phone rating profileImage')
    .populate('vehicle', 'vehicleNumber make model year color')
    .populate('supportTickets');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking details'
    });
  }
});

// @route   PUT /api/customer/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', authenticateCustomer, async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const booking = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'driver_assigned'];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled at this stage'
      });
    }

    // Calculate cancellation charges
    const now = new Date();
    const pickupDateTime = new Date(`${booking.pickupDate.toDateString()} ${booking.pickupTime}`);
    const timeDiff = pickupDateTime - now;
    const hoursUntilPickup = timeDiff / (1000 * 60 * 60);

    let cancellationCharges = 0;
    if (hoursUntilPickup < 1) {
      cancellationCharges = 100; // After arrival/near pickup
    } else if (hoursUntilPickup < 2) {
      cancellationCharges = 50; // Within 2 hours
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledBy = 'customer';
    booking.cancellationTime = now;
    booking.cancellationCharges = cancellationCharges;

    await booking.save();

    // TODO: Process refund (total fare - cancellation charges)
    const refundAmount = booking.fareBreakdown.totalFare - cancellationCharges;

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        cancellationCharges,
        refundAmount,
        refundStatus: 'processing'
      }
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking'
    });
  }
});

// @route   POST /api/customer/bookings/:id/rate
// @desc    Rate and review a completed trip
// @access  Private
router.post('/:id/rate', authenticateCustomer, async (req, res) => {
  try {
    const {
      driverRating,
      vehicleRating,
      serviceRating,
      overallRating,
      feedback
    } = req.body;

    const booking = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id,
      status: 'completed'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Completed booking not found'
      });
    }

    if (booking.customerRating?.ratedAt) {
      return res.status(400).json({
        success: false,
        message: 'This trip has already been rated'
      });
    }

    // Update booking with rating
    booking.customerRating = {
      driverRating,
      vehicleRating,
      serviceRating,
      overallRating,
      feedback,
      ratedAt: new Date()
    };

    await booking.save();

    // TODO: Update driver's average rating

    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting rating'
    });
  }
});

export default router;