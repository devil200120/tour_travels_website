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

// Get driver dashboard stats
router.get('/:id/dashboard',
  authenticateToken,
  checkPermission('drivers', 'read'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const driver = await Driver.findById(id);
      
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Today's stats
      const todayBookings = await Booking.find({
        assignedDriver: driver._id,
        createdAt: { $gte: today, $lt: tomorrow }
      });

      const todayStats = {
        totalTrips: todayBookings.length,
        completedTrips: todayBookings.filter(b => b.status === 'Completed').length,
        ongoingTrips: todayBookings.filter(b => b.status === 'In Progress').length,
        totalEarnings: todayBookings
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0),
        totalDistance: todayBookings
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.tripDetails?.totalDistance || 0), 0),
        totalDuration: todayBookings
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.tripDetails?.totalDuration || 0), 0)
      };

      // Weekly stats
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      
      const weeklyBookings = await Booking.find({
        assignedDriver: driver._id,
        createdAt: { $gte: weekStart }
      });

      const weeklyStats = {
        totalTrips: weeklyBookings.length,
        completedTrips: weeklyBookings.filter(b => b.status === 'Completed').length,
        totalEarnings: weeklyBookings
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0),
        totalDistance: weeklyBookings
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.tripDetails?.totalDistance || 0), 0)
      };

      // Monthly stats
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const monthlyBookings = await Booking.find({
        assignedDriver: driver._id,
        createdAt: { $gte: monthStart }
      });

      const monthlyStats = {
        totalTrips: monthlyBookings.length,
        completedTrips: monthlyBookings.filter(b => b.status === 'Completed').length,
        totalEarnings: monthlyBookings
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0),
        totalDistance: monthlyBookings
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.tripDetails?.totalDistance || 0), 0)
      };

      res.json({
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          rating: driver.rating,
          kycStatus: driver.kycStatus,
          isActive: driver.isActive,
          isAvailable: driver.isAvailable
        },
        today: todayStats,
        weekly: weeklyStats,
        monthly: monthlyStats
      });
    } catch (error) {
      console.error('Get driver dashboard error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get driver's assigned orders
router.get('/:id/orders',
  authenticateToken,
  checkPermission('drivers', 'read'),
  [
    query('status').optional().isIn(['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, page = 1, limit = 10 } = req.query;
      
      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      let query = { assignedDriver: driver._id };
      if (status) query.status = status;

      const skip = (page - 1) * limit;
      
      const orders = await Booking.find(query)
        .populate('customer', 'name email phone')
        .populate('vehicle', 'vehicleNumber brand model')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Booking.countDocuments(query);

      res.json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get driver orders error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Auto-assign orders to available drivers
router.post('/auto-assign',
  authenticateToken,
  checkPermission('drivers', 'update'),
  [
    body('bookingId').isMongoId(),
    body('preferredDriverId').optional().isMongoId(),
    body('maxRadius').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bookingId, preferredDriverId, maxRadius = 10 } = req.body;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.assignedDriver) {
        return res.status(400).json({ message: 'Booking already assigned' });
      }

      let assignedDriver = null;

      // Try preferred driver first
      if (preferredDriverId) {
        const preferredDriver = await Driver.findById(preferredDriverId);
        if (preferredDriver && preferredDriver.isActive && preferredDriver.isAvailable && preferredDriver.kycStatus === 'Approved') {
          assignedDriver = preferredDriver;
        }
      }

      // If no preferred driver or not available, find nearby drivers
      if (!assignedDriver && booking.pickupLocation?.coordinates) {
        const [longitude, latitude] = booking.pickupLocation.coordinates;
        
        const nearbyDrivers = await Driver.find({
          isActive: true,
          isAvailable: true,
          kycStatus: 'Approved',
          'currentLocation.latitude': { $exists: true },
          'currentLocation.longitude': { $exists: true }
        }).sort({ 'rating.average': -1 });

        // Find closest available driver within radius
        for (const driver of nearbyDrivers) {
          const distance = calculateDistance(
            latitude,
            longitude,
            driver.currentLocation.latitude,
            driver.currentLocation.longitude
          );
          
          if (distance <= maxRadius) {
            assignedDriver = driver;
            break;
          }
        }
      }

      if (!assignedDriver) {
        return res.status(404).json({ message: 'No available drivers found' });
      }

      // Assign the driver
      booking.assignedDriver = assignedDriver._id;
      booking.status = 'Confirmed';
      booking.assignedAt = new Date();
      await booking.save();

      // Update driver availability
      assignedDriver.isAvailable = false;
      await assignedDriver.save();

      // Emit real-time notification
      const io = req.app.get('io');
      io.emit('booking_assigned', {
        bookingId: booking._id,
        driverId: assignedDriver._id,
        customerName: booking.customer?.name
      });

      res.json({
        message: 'Driver assigned successfully',
        booking,
        assignedDriver: {
          id: assignedDriver._id,
          name: assignedDriver.name,
          phone: assignedDriver.phone,
          rating: assignedDriver.rating
        }
      });
    } catch (error) {
      console.error('Auto-assign driver error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update driver earnings and settlement
router.put('/:id/earnings',
  authenticateToken,
  checkPermission('drivers', 'update'),
  [
    body('amount').isFloat({ min: 0 }),
    body('type').isIn(['add', 'deduct', 'settle']),
    body('description').notEmpty().trim(),
    body('bookingId').optional().isMongoId()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { amount, type, description, bookingId } = req.body;

      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      let newTotalEarnings = driver.totalEarnings || 0;
      
      switch (type) {
        case 'add':
          newTotalEarnings += amount;
          break;
        case 'deduct':
          newTotalEarnings -= amount;
          break;
        case 'settle':
          newTotalEarnings = 0; // Reset earnings after settlement
          break;
      }

      driver.totalEarnings = Math.max(0, newTotalEarnings);
      await driver.save();

      // Create earnings record (you might want to create a separate EarningsHistory model)
      const earningsRecord = {
        driverId: driver._id,
        amount,
        type,
        description,
        bookingId,
        previousBalance: driver.totalEarnings,
        newBalance: newTotalEarnings,
        createdAt: new Date(),
        createdBy: req.user._id
      };

      res.json({
        message: `Earnings ${type} successful`,
        driver: {
          id: driver._id,
          name: driver.name,
          totalEarnings: driver.totalEarnings
        },
        transaction: earningsRecord
      });
    } catch (error) {
      console.error('Update driver earnings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update driver profile/settings
router.put('/:id/profile',
  authenticateToken,
  checkPermission('drivers', 'update'),
  [
    body('personalInfo.name').optional().trim().isLength({ min: 2 }),
    body('personalInfo.phone').optional().isMobilePhone('en-IN'),
    body('personalInfo.alternatePhone').optional().isMobilePhone('en-IN'),
    body('personalInfo.address').optional().isObject(),
    body('preferences.languages').optional().isArray(),
    body('preferences.specializations').optional().isArray(),
    body('preferences.workingHours').optional().isObject(),
    body('bankDetails').optional().isObject(),
    body('emergencyContact').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Flatten the update data
      let flatUpdate = {};
      
      if (updateData.personalInfo) {
        if (updateData.personalInfo.name) flatUpdate.name = updateData.personalInfo.name;
        if (updateData.personalInfo.phone) flatUpdate.phone = updateData.personalInfo.phone;
        if (updateData.personalInfo.alternatePhone) flatUpdate.alternatePhone = updateData.personalInfo.alternatePhone;
        if (updateData.personalInfo.address) flatUpdate.address = updateData.personalInfo.address;
      }

      if (updateData.preferences) {
        if (updateData.preferences.languages) flatUpdate.languages = updateData.preferences.languages;
        if (updateData.preferences.specializations) flatUpdate.specializations = updateData.preferences.specializations;
        if (updateData.preferences.workingHours) flatUpdate.workingHours = updateData.preferences.workingHours;
      }

      if (updateData.bankDetails) flatUpdate.bankDetails = updateData.bankDetails;
      if (updateData.emergencyContact) flatUpdate.emergencyContact = updateData.emergencyContact;

      const driver = await Driver.findByIdAndUpdate(
        id,
        flatUpdate,
        { new: true, runValidators: true }
      );

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      res.json({
        message: 'Driver profile updated successfully',
        driver
      });
    } catch (error) {
      console.error('Update driver profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get driver's earnings history
router.get('/:id/earnings/history',
  authenticateToken,
  checkPermission('drivers', 'read'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isIn(['add', 'deduct', 'settle']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate, type, page = 1, limit = 20 } = req.query;

      const driver = await Driver.findById(id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Build date filter for completed bookings
      let dateFilter = { assignedDriver: driver._id, status: 'Completed' };
      if (startDate || endDate) {
        dateFilter.completedAt = {};
        if (startDate) dateFilter.completedAt.$gte = new Date(startDate);
        if (endDate) dateFilter.completedAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const earningsHistory = await Booking.find(dateFilter)
        .populate('customer', 'name email')
        .select('bookingId customer pricing.totalAmount pricing.driverEarnings completedAt tripDetails.totalDistance')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Booking.countDocuments(dateFilter);

      // Calculate summary
      const summary = await Booking.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$pricing.driverEarnings' },
            totalTrips: { $sum: 1 },
            totalDistance: { $sum: '$tripDetails.totalDistance' },
            avgEarningsPerTrip: { $avg: '$pricing.driverEarnings' }
          }
        }
      ]);

      res.json({
        summary: summary[0] || {
          totalEarnings: 0,
          totalTrips: 0,
          totalDistance: 0,
          avgEarningsPerTrip: 0
        },
        earningsHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get driver earnings history error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Toggle driver availability
router.put('/:id/availability',
  authenticateToken,
  checkPermission('drivers', 'update'),
  [
    body('isAvailable').isBoolean(),
    body('reason').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { isAvailable, reason } = req.body;

      const driver = await Driver.findByIdAndUpdate(
        id,
        { 
          isAvailable,
          ...(reason && { 'availabilityReason': reason }),
          'availabilityUpdatedAt': new Date()
        },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Emit real-time status update
      const io = req.app.get('io');
      io.emit('driver_availability_update', {
        driverId: driver._id,
        isAvailable: driver.isAvailable,
        timestamp: new Date()
      });

      res.json({
        message: `Driver availability ${isAvailable ? 'enabled' : 'disabled'}`,
        driver: {
          id: driver._id,
          name: driver.name,
          isAvailable: driver.isAvailable,
          availabilityUpdatedAt: driver.availabilityUpdatedAt
        }
      });
    } catch (error) {
      console.error('Toggle driver availability error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get drivers statistics for admin dashboard
router.get('/stats/overview',
  authenticateToken,
  checkPermission('drivers', 'read'),
  async (req, res) => {
    try {
      const totalDrivers = await Driver.countDocuments();
      const activeDrivers = await Driver.countDocuments({ isActive: true });
      const availableDrivers = await Driver.countDocuments({ isActive: true, isAvailable: true });
      const approvedDrivers = await Driver.countDocuments({ kycStatus: 'Approved' });
      const pendingKyc = await Driver.countDocuments({ kycStatus: 'Pending' });

      // Today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const todayRegistrations = await Driver.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      });

      // Top performers this month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const topPerformers = await Booking.aggregate([
        {
          $match: {
            status: 'Completed',
            completedAt: { $gte: monthStart },
            assignedDriver: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$assignedDriver',
            totalTrips: { $sum: 1 },
            totalEarnings: { $sum: '$pricing.driverEarnings' },
            totalDistance: { $sum: '$tripDetails.totalDistance' },
            avgRating: { $avg: '$feedback.driverRating' }
          }
        },
        {
          $lookup: {
            from: 'drivers',
            localField: '_id',
            foreignField: '_id',
            as: 'driver'
          }
        },
        {
          $unwind: '$driver'
        },
        {
          $project: {
            driverId: '$_id',
            name: '$driver.name',
            phone: '$driver.phone',
            totalTrips: 1,
            totalEarnings: 1,
            totalDistance: 1,
            avgRating: 1
          }
        },
        {
          $sort: { totalTrips: -1 }
        },
        {
          $limit: 5
        }
      ]);

      res.json({
        overview: {
          totalDrivers,
          activeDrivers,
          availableDrivers,
          approvedDrivers,
          pendingKyc,
          todayRegistrations
        },
        topPerformers
      });
    } catch (error) {
      console.error('Get drivers stats error:', error);
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