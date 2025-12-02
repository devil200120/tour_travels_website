import express from 'express';
import mongoose from 'mongoose';
import Customer from '../../models/Customer.js';
import Driver from '../../models/Driver.js';
import { authenticateCustomer } from '../../middleware/customerAuth.js';

const router = express.Router();

// Saved Location Schema (inline)
const savedLocationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { 
    type: String, 
    enum: ['home', 'work', 'other'], 
    default: 'other' 
  },
  label: { type: String, required: true },
  address: { type: String, required: true },
  landmark: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  placeId: String,
  useCount: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

savedLocationSchema.index({ customer: 1, type: 1 });

const SavedLocation = mongoose.models.SavedLocation || mongoose.model('SavedLocation', savedLocationSchema);

// Favorite Driver Schema (inline)
const favoriteDriverSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  tripsCompleted: { type: Number, default: 0 },
  lastTripDate: Date,
  note: String
}, { timestamps: true });

favoriteDriverSchema.index({ customer: 1, driver: 1 }, { unique: true });

const FavoriteDriver = mongoose.models.FavoriteDriver || mongoose.model('FavoriteDriver', favoriteDriverSchema);

// =========================
// SAVED LOCATIONS ROUTES
// =========================

// @route   GET /api/customer/favorites/locations
// @desc    Get all saved locations
// @access  Private
router.get('/locations', authenticateCustomer, async (req, res) => {
  try {
    const locations = await SavedLocation.find({ customer: req.customer.id })
      .sort({ type: 1, useCount: -1 });

    // Separate by type for easy access
    const organized = {
      home: locations.find(l => l.type === 'home') || null,
      work: locations.find(l => l.type === 'work') || null,
      other: locations.filter(l => l.type === 'other'),
      recentlyUsed: locations.sort((a, b) => b.useCount - a.useCount).slice(0, 5)
    };

    res.json({
      success: true,
      data: {
        all: locations,
        organized
      }
    });

  } catch (error) {
    console.error('Get saved locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved locations'
    });
  }
});

// @route   POST /api/customer/favorites/locations
// @desc    Add a saved location
// @access  Private
router.post('/locations', authenticateCustomer, async (req, res) => {
  try {
    const { type, label, address, landmark, latitude, longitude, placeId } = req.body;

    if (!label || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Label, address, latitude, and longitude are required'
      });
    }

    // Check if home/work already exists
    if (type === 'home' || type === 'work') {
      const existing = await SavedLocation.findOne({
        customer: req.customer.id,
        type
      });

      if (existing) {
        // Update existing
        existing.label = label;
        existing.address = address;
        existing.landmark = landmark;
        existing.latitude = latitude;
        existing.longitude = longitude;
        existing.placeId = placeId;
        await existing.save();

        return res.json({
          success: true,
          message: `${type.charAt(0).toUpperCase() + type.slice(1)} location updated`,
          data: existing
        });
      }
    }

    // Check limit for 'other' type (max 10)
    if (type === 'other') {
      const count = await SavedLocation.countDocuments({
        customer: req.customer.id,
        type: 'other'
      });

      if (count >= 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 custom locations allowed. Please delete some to add new ones.'
        });
      }
    }

    const location = new SavedLocation({
      customer: req.customer.id,
      type: type || 'other',
      label,
      address,
      landmark,
      latitude,
      longitude,
      placeId
    });

    await location.save();

    res.status(201).json({
      success: true,
      message: 'Location saved successfully',
      data: location
    });

  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving location'
    });
  }
});

// @route   PUT /api/customer/favorites/locations/:id
// @desc    Update a saved location
// @access  Private
router.put('/locations/:id', authenticateCustomer, async (req, res) => {
  try {
    const { label, address, landmark, latitude, longitude, placeId } = req.body;

    const location = await SavedLocation.findOne({
      _id: req.params.id,
      customer: req.customer.id
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    if (label) location.label = label;
    if (address) location.address = address;
    if (landmark !== undefined) location.landmark = landmark;
    if (latitude !== undefined) location.latitude = latitude;
    if (longitude !== undefined) location.longitude = longitude;
    if (placeId) location.placeId = placeId;

    await location.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location'
    });
  }
});

// @route   DELETE /api/customer/favorites/locations/:id
// @desc    Delete a saved location
// @access  Private
router.delete('/locations/:id', authenticateCustomer, async (req, res) => {
  try {
    const location = await SavedLocation.findOneAndDelete({
      _id: req.params.id,
      customer: req.customer.id
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });

  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting location'
    });
  }
});

// @route   POST /api/customer/favorites/locations/:id/use
// @desc    Increment use count (call when location is used for booking)
// @access  Private
router.post('/locations/:id/use', authenticateCustomer, async (req, res) => {
  try {
    const location = await SavedLocation.findOneAndUpdate(
      { _id: req.params.id, customer: req.customer.id },
      { $inc: { useCount: 1 } },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: location
    });

  } catch (error) {
    console.error('Update location use count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location'
    });
  }
});

// =========================
// FAVORITE DRIVERS ROUTES
// =========================

// @route   GET /api/customer/favorites/drivers
// @desc    Get favorite drivers
// @access  Private
router.get('/drivers', authenticateCustomer, async (req, res) => {
  try {
    const favorites = await FavoriteDriver.find({ customer: req.customer.id })
      .populate('driver', 'firstName lastName phone rating profileImage vehicleType totalTrips')
      .sort({ tripsCompleted: -1 });

    res.json({
      success: true,
      data: favorites
    });

  } catch (error) {
    console.error('Get favorite drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite drivers'
    });
  }
});

// @route   POST /api/customer/favorites/drivers
// @desc    Add driver to favorites
// @access  Private
router.post('/drivers', authenticateCustomer, async (req, res) => {
  try {
    const { driverId, note } = req.body;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }

    // Check if driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check if already favorited
    const existing = await FavoriteDriver.findOne({
      customer: req.customer.id,
      driver: driverId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Driver already in favorites'
      });
    }

    // Check limit (max 10 favorite drivers)
    const count = await FavoriteDriver.countDocuments({ customer: req.customer.id });
    if (count >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 favorite drivers allowed'
      });
    }

    const favorite = new FavoriteDriver({
      customer: req.customer.id,
      driver: driverId,
      note
    });

    await favorite.save();

    res.status(201).json({
      success: true,
      message: 'Driver added to favorites',
      data: favorite
    });

  } catch (error) {
    console.error('Add favorite driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding favorite driver'
    });
  }
});

// @route   DELETE /api/customer/favorites/drivers/:driverId
// @desc    Remove driver from favorites
// @access  Private
router.delete('/drivers/:driverId', authenticateCustomer, async (req, res) => {
  try {
    const favorite = await FavoriteDriver.findOneAndDelete({
      customer: req.customer.id,
      driver: req.params.driverId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing favorite driver'
    });
  }
});

// @route   POST /api/customer/favorites/drivers/:driverId/request
// @desc    Request specific driver for booking
// @access  Private
router.post('/drivers/:driverId/request', authenticateCustomer, async (req, res) => {
  try {
    const { bookingId } = req.body;

    const driver = await Driver.findById(req.params.driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.isAvailable || driver.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Driver is currently not available'
      });
    }

    // In production, this would:
    // 1. Send notification to specific driver
    // 2. Update booking with preferred driver
    // 3. Handle driver acceptance/rejection

    res.json({
      success: true,
      message: 'Request sent to driver',
      data: {
        driverName: `${driver.firstName} ${driver.lastName}`,
        estimatedResponse: '2-5 minutes',
        note: 'Driver will be notified and can accept or decline'
      }
    });

  } catch (error) {
    console.error('Request favorite driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting driver'
    });
  }
});

// =========================
// RECENT TRIPS (for quick rebook)
// =========================

// @route   GET /api/customer/favorites/recent-routes
// @desc    Get recent routes for quick rebooking
// @access  Private
router.get('/recent-routes', authenticateCustomer, async (req, res) => {
  try {
    const CustomerBooking = mongoose.model('CustomerBooking');
    
    const recentBookings = await CustomerBooking.find({
      customer: req.customer.id,
      status: 'completed'
    })
    .select('pickup destination vehicleCategory fareBreakdown estimatedDistance createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    // Group by unique routes
    const routeMap = new Map();
    
    for (const booking of recentBookings) {
      const routeKey = `${booking.pickup.address}-${booking.destination.address}`;
      
      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          pickup: booking.pickup,
          destination: booking.destination,
          lastTripDate: booking.createdAt,
          tripCount: 1,
          lastFare: booking.fareBreakdown.totalFare,
          lastVehicle: booking.vehicleCategory,
          estimatedDistance: booking.estimatedDistance
        });
      } else {
        const existing = routeMap.get(routeKey);
        existing.tripCount += 1;
      }
    }

    const recentRoutes = Array.from(routeMap.values()).slice(0, 5);

    res.json({
      success: true,
      data: recentRoutes
    });

  } catch (error) {
    console.error('Get recent routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent routes'
    });
  }
});

export default router;
