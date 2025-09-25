import express from 'express';
import { query, validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Trip reports
router.get('/trips',
  authenticateToken,
  checkPermission('reports', 'read'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('status').optional().isIn(['Pending', 'Confirmed', 'Assigned', 'In Progress', 'Completed', 'Cancelled']),
    query('reportType').optional().isIn(['daily', 'weekly', 'monthly'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate, status, reportType = 'daily' } = req.query;

      // Build date filter
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      } else {
        // Default to current month
        const now = new Date();
        dateFilter.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
      }

      if (status) dateFilter.status = status;

      // Group by period
      let groupBy;
      switch (reportType) {
        case 'weekly':
          groupBy = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
          break;
        case 'monthly':
          groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        default: // daily
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const tripStats = await Booking.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: groupBy,
            totalTrips: { $sum: 1 },
            completedTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            cancelledTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
            },
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$pricing.totalAmount', 0] }
            },
            avgRating: { $avg: '$feedback.rating' },
            bookingTypes: {
              $push: '$bookingType'
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        reportType,
        dateRange: { startDate, endDate },
        data: tripStats
      });
    } catch (error) {
      console.error('Trip reports error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Revenue and settlement reports
router.get('/revenue',
  authenticateToken,
  checkPermission('reports', 'read'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate, groupBy = 'day' } = req.query;

      // Build date filter
      let dateFilter = {
        'payment.status': 'Paid',
        status: 'Completed'
      };
      
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Group by period
      let groupByField;
      switch (groupBy) {
        case 'week':
          groupByField = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
          break;
        case 'month':
          groupByField = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        default: // day
          groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const revenueStats = await Booking.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: groupByField,
            totalRevenue: { $sum: '$pricing.totalAmount' },
            totalBookings: { $sum: 1 },
            avgBookingValue: { $avg: '$pricing.totalAmount' },
            revenueByType: {
              $push: {
                type: '$bookingType',
                amount: '$pricing.totalAmount'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate payment method distribution
      const paymentMethods = await Booking.aggregate([
        { $match: dateFilter },
        { $unwind: '$payment.transactions' },
        {
          $group: {
            _id: '$payment.transactions.method',
            count: { $sum: 1 },
            amount: { $sum: '$payment.transactions.amount' }
          }
        }
      ]);

      res.json({
        groupBy,
        dateRange: { startDate, endDate },
        revenueStats,
        paymentMethods
      });
    } catch (error) {
      console.error('Revenue reports error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Customer behavior analytics
router.get('/customers',
  authenticateToken,
  checkPermission('reports', 'read'),
  async (req, res) => {
    try {
      // Customer demographics
      const customerStats = await Customer.aggregate([
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            verifiedCustomers: {
              $sum: { $cond: ['$isVerified', 1, 0] }
            },
            activeCustomers: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ]);

      // Top customers by booking value
      const topCustomers = await Booking.aggregate([
        { $match: { status: 'Completed' } },
        {
          $group: {
            _id: '$customer',
            totalSpent: { $sum: '$pricing.totalAmount' },
            totalBookings: { $sum: 1 },
            avgRating: { $avg: '$feedback.rating' }
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        {
          $project: {
            customer: { $arrayElemAt: ['$customerInfo', 0] },
            totalSpent: 1,
            totalBookings: 1,
            avgRating: 1
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]);

      // Booking preferences
      const bookingPreferences = await Booking.aggregate([
        {
          $group: {
            _id: {
              bookingType: '$bookingType',
              vehicleType: '$vehiclePreference'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.json({
        customerStats: customerStats[0] || {},
        topCustomers,
        bookingPreferences
      });
    } catch (error) {
      console.error('Customer analytics error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Driver performance reports
router.get('/drivers',
  authenticateToken,
  checkPermission('reports', 'read'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate } = req.query;

      // Build date filter
      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Top performing drivers
      const topDrivers = await Booking.aggregate([
        { $match: { ...dateFilter, assignedDriver: { $exists: true } } },
        {
          $group: {
            _id: '$assignedDriver',
            totalTrips: { $sum: 1 },
            completedTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            totalEarnings: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$pricing.totalAmount', 0] }
            },
            avgRating: { $avg: '$feedback.driverRating' },
            totalDistance: { $sum: '$tripDetails.totalDistance' }
          }
        },
        {
          $lookup: {
            from: 'drivers',
            localField: '_id',
            foreignField: '_id',
            as: 'driverInfo'
          }
        },
        {
          $project: {
            driver: { $arrayElemAt: ['$driverInfo', 0] },
            totalTrips: 1,
            completedTrips: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completedTrips', '$totalTrips'] },
                100
              ]
            },
            totalEarnings: 1,
            avgRating: 1,
            totalDistance: 1
          }
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: 10 }
      ]);

      // Driver availability stats
      const availabilityStats = await Driver.aggregate([
        {
          $group: {
            _id: null,
            totalDrivers: { $sum: 1 },
            activeDrivers: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            availableDrivers: {
              $sum: { $cond: ['$isAvailable', 1, 0] }
            },
            approvedDrivers: {
              $sum: { $cond: [{ $eq: ['$kycStatus', 'Approved'] }, 1, 0] }
            }
          }
        }
      ]);

      res.json({
        dateRange: { startDate, endDate },
        topDrivers,
        availabilityStats: availabilityStats[0] || {}
      });
    } catch (error) {
      console.error('Driver reports error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Vehicle utilization report
router.get('/vehicles',
  authenticateToken,
  checkPermission('reports', 'read'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate } = req.query;

      let dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Vehicle utilization
      const vehicleStats = await Booking.aggregate([
        { $match: { ...dateFilter, assignedVehicle: { $exists: true } } },
        {
          $group: {
            _id: '$assignedVehicle',
            totalTrips: { $sum: 1 },
            totalRevenue: { $sum: '$pricing.totalAmount' },
            totalDistance: { $sum: '$tripDetails.totalDistance' },
            avgRating: { $avg: '$feedback.vehicleRating' }
          }
        },
        {
          $lookup: {
            from: 'vehicles',
            localField: '_id',
            foreignField: '_id',
            as: 'vehicleInfo'
          }
        },
        {
          $project: {
            vehicle: { $arrayElemAt: ['$vehicleInfo', 0] },
            totalTrips: 1,
            totalRevenue: 1,
            totalDistance: 1,
            avgRating: 1,
            revenuePerTrip: { $divide: ['$totalRevenue', '$totalTrips'] }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      // Vehicle type distribution
      const typeDistribution = await Vehicle.aggregate([
        {
          $group: {
            _id: '$vehicleType',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            availableCount: {
              $sum: { $cond: ['$isAvailable', 1, 0] }
            }
          }
        }
      ]);

      res.json({
        dateRange: { startDate, endDate },
        vehicleStats,
        typeDistribution
      });
    } catch (error) {
      console.error('Vehicle reports error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;