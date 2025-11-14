import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Package from '../models/Package.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Generate unique booking ID
const generateBookingId = async () => {
  const prefix = 'TT';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  let bookingId = `${prefix}${timestamp}${random}`;
  
  // Ensure uniqueness
  let exists = await Booking.findOne({ bookingId });
  while (exists) {
    const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    bookingId = `${prefix}${timestamp}${newRandom}`;
    exists = await Booking.findOne({ bookingId });
  }
  
  return bookingId;
};

// Get all bookings
router.get('/',
  authenticateToken,
  checkPermission('bookings', 'read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['Pending', 'Confirmed', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Refunded']),
    query('bookingType').optional().isIn(['Outstation Transfer', 'Package Tour', 'Local Trip', 'Airport Transfer']),
    query('search').optional().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
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
      const { status, bookingType, search, startDate, endDate } = req.query;

      // Build query
      let query = {};
      if (status) query.status = status;
      if (bookingType) query.bookingType = bookingType;
      if (startDate || endDate) {
        query['schedule.startDate'] = {};
        if (startDate) query['schedule.startDate'].$gte = new Date(startDate);
        if (endDate) query['schedule.startDate'].$lte = new Date(endDate);
      }
      if (search) {
        query.$or = [
          { bookingId: { $regex: search, $options: 'i' } },
          { 'pickup.address': { $regex: search, $options: 'i' } },
          { 'dropoff.address': { $regex: search, $options: 'i' } }
        ];
      }

      const bookings = await Booking.find(query)
        .populate('customer', 'name email phone')
        .populate('assignedDriver', 'name phone licenseNumber')
        .populate('assignedVehicle', 'vehicleNumber make model vehicleType')
        .populate('packageDetails.packageId', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Booking.countDocuments(query);

      res.json({
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get booking by ID
router.get('/:id',
  authenticateToken,
  checkPermission('bookings', 'read'),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate('customer')
        .populate('assignedDriver')
        .populate('assignedVehicle')
        .populate('packageDetails.packageId')
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json(booking);
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Create new booking
router.post('/',
  authenticateToken,
  checkPermission('bookings', 'create'),
  [
    body('customer').isMongoId(),
    body('bookingType').isIn(['Outstation Transfer', 'Package Tour', 'Local Trip', 'Airport Transfer']),
    body('tripType').isIn(['One-way', 'Round trip', 'Multi-city']),
    body('pickup.address').notEmpty(),
    body('dropoff.address').notEmpty(),
    body('schedule.startDate').isISO8601(),
    body('passengers.totalCount').isInt({ min: 1 }),
    body('pricing.totalAmount').isNumeric({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Generate unique booking ID
      const bookingId = await generateBookingId();

      const bookingData = {
        ...req.body,
        bookingId,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      };

      const booking = new Booking(bookingData);
      await booking.save();

      // Populate the booking for response
      await booking.populate('customer', 'name email phone');

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('new_booking', {
        booking: booking.toObject(),
        message: `New booking created: ${booking.bookingId}`
      });

      res.status(201).json({
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update booking
router.put('/:id',
  authenticateToken,
  checkPermission('bookings', 'update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        lastModifiedBy: req.user._id
      };

      const booking = await Booking.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('customer', 'name email phone')
       .populate('assignedDriver', 'name phone')
       .populate('assignedVehicle', 'vehicleNumber make model');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('booking_updated', {
        booking: booking.toObject(),
        message: `Booking ${booking.bookingId} updated`
      });

      res.json({
        message: 'Booking updated successfully',
        booking
      });
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Assign driver and vehicle
router.post('/:id/assign',
  authenticateToken,
  checkPermission('bookings', 'update'),
  [
    body('driverId').isMongoId(),
    body('vehicleId').isMongoId()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { driverId, vehicleId } = req.body;

      // Check if driver and vehicle are available
      const driver = await Driver.findById(driverId);
      const vehicle = await Vehicle.findById(vehicleId);

      if (!driver || !driver.isActive || !driver.isAvailable) {
        return res.status(400).json({ message: 'Driver not available' });
      }

      if (!vehicle || !vehicle.isActive || !vehicle.isAvailable) {
        return res.status(400).json({ message: 'Vehicle not available' });
      }

      if (vehicle.owner.toString() !== driverId) {
        return res.status(400).json({ message: 'Vehicle does not belong to this driver' });
      }

      const booking = await Booking.findByIdAndUpdate(
        id,
        {
          assignedDriver: driverId,
          assignedVehicle: vehicleId,
          status: 'Assigned',
          lastModifiedBy: req.user._id
        },
        { new: true }
      ).populate('customer', 'name email phone')
       .populate('assignedDriver', 'name phone')
       .populate('assignedVehicle', 'vehicleNumber make model');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Update driver and vehicle availability
      await Driver.findByIdAndUpdate(driverId, { isAvailable: false });
      await Vehicle.findByIdAndUpdate(vehicleId, { isAvailable: false });

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('booking_assigned', {
        booking: booking.toObject(),
        message: `Booking ${booking.bookingId} assigned to ${driver.name}`
      });

      res.json({
        message: 'Driver and vehicle assigned successfully',
        booking
      });
    } catch (error) {
      console.error('Assign booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Cancel booking
router.post('/:id/cancel',
  authenticateToken,
  checkPermission('bookings', 'update'),
  [
    body('reason').notEmpty().trim(),
    body('refundAmount').optional().isNumeric({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { reason, refundAmount } = req.body;

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (['Completed', 'Cancelled', 'Refunded'].includes(booking.status)) {
        return res.status(400).json({ message: 'Cannot cancel this booking' });
      }

      // Update booking status
      booking.status = 'Cancelled';
      booking.notes.adminNotes = `Cancelled by ${req.user.name}. Reason: ${reason}`;
      booking.lastModifiedBy = req.user._id;

      // If refund amount is specified
      if (refundAmount && refundAmount > 0) {
        booking.payment.status = 'Refunded';
        booking.payment.transactions.push({
          transactionId: `REF_${Date.now()}`,
          amount: -refundAmount,
          method: 'Refund',
          status: 'Success',
          timestamp: new Date()
        });
      }

      await booking.save();

      // Free up driver and vehicle if assigned
      if (booking.assignedDriver) {
        await Driver.findByIdAndUpdate(booking.assignedDriver, { isAvailable: true });
      }
      if (booking.assignedVehicle) {
        await Vehicle.findByIdAndUpdate(booking.assignedVehicle, { isAvailable: true });
      }

      // Emit real-time update
      const io = req.app.get('io');
      io.emit('booking_cancelled', {
        booking: booking.toObject(),
        message: `Booking ${booking.bookingId} cancelled`
      });

      res.json({
        message: 'Booking cancelled successfully',
        booking
      });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get booking dashboard statistics
router.get('/stats/dashboard',
  authenticateToken,
  checkPermission('bookings', 'read'),
  async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Today's bookings
      const todayBookings = await Booking.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      // This month's bookings
      const monthBookings = await Booking.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      // Status wise count
      const statusStats = await Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Revenue stats
      const revenueStats = await Booking.aggregate([
        {
          $match: {
            status: { $in: ['Completed', 'In Progress'] },
            'payment.status': 'Paid'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.totalAmount' },
            avgBookingValue: { $avg: '$pricing.totalAmount' }
          }
        }
      ]);

      // Booking type distribution
      const typeStats = await Booking.aggregate([
        {
          $group: {
            _id: '$bookingType',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        todayBookings,
        monthBookings,
        statusDistribution: statusStats,
        revenue: revenueStats[0] || { totalRevenue: 0, avgBookingValue: 0 },
        typeDistribution: typeStats
      });
    } catch (error) {
      console.error('Get booking stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Real-time trip tracking
router.get('/:id/tracking',
  authenticateToken,
  checkPermission('bookings', 'read'),
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate('assignedDriver', 'name phone currentLocation')
        .populate('assignedVehicle', 'vehicleNumber currentLocation')
        .select('bookingId status tripDetails pickup dropoff assignedDriver assignedVehicle');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.status !== 'In Progress') {
        return res.status(400).json({ message: 'Trip is not in progress' });
      }

      res.json({
        bookingId: booking.bookingId,
        status: booking.status,
        pickup: booking.pickup,
        dropoff: booking.dropoff,
        driver: booking.assignedDriver,
        vehicle: booking.assignedVehicle,
        tripDetails: booking.tripDetails
      });
    } catch (error) {
      console.error('Get tracking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;