import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all drivers
router.get('/',
  authenticateToken,
  checkPermission('drivers', 'read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('kycStatus').optional().isIn(['Pending', 'Under Review', 'Approved', 'Rejected']),
    query('isActive').optional().isBoolean(),
    query('isAvailable').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const { search, kycStatus, isActive, isAvailable } = req.query;

      // Build query
      let query = {};
      if (kycStatus) query.kycStatus = kycStatus;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { licenseNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const drivers = await Driver.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Driver.countDocuments(query);

      res.json({
        drivers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get drivers error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get driver by ID
router.get('/:id',
  authenticateToken,
  checkPermission('drivers', 'read'),
  async (req, res) => {
    try {
      const driver = await Driver.findById(req.params.id);
      
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Get driver's vehicles
      const vehicles = await Vehicle.find({ owner: driver._id });

      // Get recent bookings
      const recentBookings = await Booking.find({ assignedDriver: driver._id })
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        driver,
        vehicles,
        recentBookings
      });
    } catch (error) {
      console.error('Get driver error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Create new driver
router.post('/',
  authenticateToken,
  checkPermission('drivers', 'create'),
  [
    body('name').trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').isMobilePhone('en-IN'),
    body('dateOfBirth').isISO8601(),
    body('licenseNumber').notEmpty().trim(),
    body('licenseExpiry').isISO8601(),
    body('licenseType').isIn(['Light Motor Vehicle', 'Heavy Motor Vehicle', 'Transport Vehicle']),
    body('experience').isInt({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if driver already exists
      const existingDriver = await Driver.findOne({
        $or: [
          { email: req.body.email },
          { phone: req.body.phone },
          { licenseNumber: req.body.licenseNumber }
        ]
      });

      if (existingDriver) {
        return res.status(400).json({
          message: 'Driver with this email, phone, or license number already exists'
        });
      }

      const driver = new Driver(req.body);
      await driver.save();

      res.status(201).json({
        message: 'Driver created successfully',
        driver
      });
    } catch (error) {
      console.error('Create driver error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update driver
router.put('/:id',
  authenticateToken,
  checkPermission('drivers', 'update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const driver = await Driver.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      res.json({
        message: 'Driver updated successfully',
        driver
      });
    } catch (error) {
      console.error('Update driver error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update KYC status
router.put('/:id/kyc',
  authenticateToken,
  checkPermission('drivers', 'approve'),
  [
    body('kycStatus').isIn(['Pending', 'Under Review', 'Approved', 'Rejected']),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { kycStatus, notes } = req.body;

      const driver = await Driver.findByIdAndUpdate(
        id,
        { 
          kycStatus,
          ...(notes && { 'notes.kycNotes': notes })
        },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // If approved, make driver active
      if (kycStatus === 'Approved') {
        driver.isActive = true;
        await driver.save();
      }

      res.json({
        message: `Driver KYC status updated to ${kycStatus}`,
        driver
      });
    } catch (error) {
      console.error('Update KYC error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get driver performance report
router.get('/:id/performance',
  authenticateToken,
  checkPermission('drivers', 'read'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Build date filter
      let dateFilter = { assignedDriver: driver._id };
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Get performance statistics
      const stats = await Booking.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            completedTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            cancelledTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
            },
            totalEarnings: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$pricing.totalAmount', 0] }
            },
            avgRating: { $avg: '$feedback.driverRating' },
            totalDistance: { $sum: '$tripDetails.totalDistance' },
            totalDuration: { $sum: '$tripDetails.totalDuration' }
          }
        }
      ]);

      const performance = stats[0] || {
        totalTrips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        totalEarnings: 0,
        avgRating: 0,
        totalDistance: 0,
        totalDuration: 0
      };

      // Calculate completion rate
      performance.completionRate = performance.totalTrips > 0 
        ? ((performance.completedTrips / performance.totalTrips) * 100).toFixed(2)
        : 0;

      // Get recent feedback
      const recentFeedback = await Booking.find(dateFilter)
        .select('bookingId feedback.driverRating feedback.review customer')
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          joinDate: driver.joiningDate
        },
        performance,
        recentFeedback
      });
    } catch (error) {
      console.error('Get driver performance error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update driver location
router.put('/:id/location',
  authenticateToken,
  checkPermission('drivers', 'update'),
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('address').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { latitude, longitude, address } = req.body;

      const driver = await Driver.findByIdAndUpdate(
        id,
        {
          currentLocation: {
            latitude,
            longitude,
            address,
            lastUpdated: new Date()
          }
        },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Emit real-time location update
      const io = req.app.get('io');
      io.emit('driver_location_update', {
        driverId: driver._id,
        location: driver.currentLocation
      });

      res.json({
        message: 'Location updated successfully',
        location: driver.currentLocation
      });
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get available drivers near location
router.get('/available/nearby',
  authenticateToken,
  checkPermission('drivers', 'read'),
  [
    query('latitude').isFloat({ min: -90, max: 90 }),
    query('longitude').isFloat({ min: -180, max: 180 }),
    query('radius').optional().isInt({ min: 1, max: 100 }) // in km
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { latitude, longitude, radius = 10 } = req.query;

      const drivers = await Driver.find({
        isActive: true,
        isAvailable: true,
        kycStatus: 'Approved',
        'currentLocation.latitude': { $exists: true },
        'currentLocation.longitude': { $exists: true }
      });

      // Calculate distance and filter
      const nearbyDrivers = drivers.filter(driver => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        );
        return distance <= parseFloat(radius);
      }).map(driver => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        );
        return {
          ...driver.toObject(),
          distance: distance.toFixed(2)
        };
      }).sort((a, b) => a.distance - b.distance);

      res.json({
        drivers: nearbyDrivers,
        searchLocation: { latitude, longitude, radius }
      });
    } catch (error) {
      console.error('Get nearby drivers error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;