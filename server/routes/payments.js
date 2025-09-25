import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Booking from '../models/Booking.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get payment dashboard
router.get('/dashboard',
  authenticateToken,
  checkPermission('payments', 'read'),
  async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Today's revenue
      const todayRevenue = await Booking.aggregate([
        {
          $match: {
            'payment.status': 'Paid',
            'payment.transactions.timestamp': { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.totalAmount' }
          }
        }
      ]);

      // This month's revenue
      const monthRevenue = await Booking.aggregate([
        {
          $match: {
            'payment.status': 'Paid',
            'payment.transactions.timestamp': { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.totalAmount' }
          }
        }
      ]);

      // Payment status distribution
      const paymentStatusStats = await Booking.aggregate([
        {
          $group: {
            _id: '$payment.status',
            count: { $sum: 1 },
            amount: { $sum: '$pricing.totalAmount' }
          }
        }
      ]);

      // Pending settlements
      const pendingSettlements = await Booking.find({
        status: 'Completed',
        'payment.status': 'Paid'
      }).populate('assignedDriver', 'name email phone')
       .populate('assignedVehicle', 'vehicleNumber')
       .select('bookingId pricing.totalAmount assignedDriver assignedVehicle createdAt');

      res.json({
        todayRevenue: todayRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        paymentStatusStats,
        pendingSettlements
      });
    } catch (error) {
      console.error('Get payment dashboard error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Process payment
router.post('/process',
  authenticateToken,
  checkPermission('payments', 'update'),
  [
    body('bookingId').isMongoId(),
    body('amount').isNumeric({ min: 0 }),
    body('method').isIn(['Cash', 'Card', 'UPI', 'Net Banking', 'Wallet']),
    body('transactionId').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bookingId, amount, method, transactionId } = req.body;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Add transaction
      booking.payment.transactions.push({
        transactionId: transactionId || `TXN_${Date.now()}`,
        amount,
        method,
        status: 'Success',
        timestamp: new Date()
      });

      // Calculate total paid amount
      const totalPaid = booking.payment.transactions
        .filter(t => t.status === 'Success')
        .reduce((sum, t) => sum + t.amount, 0);

      // Update payment status
      if (totalPaid >= booking.pricing.totalAmount) {
        booking.payment.status = 'Paid';
        booking.payment.balanceAmount = 0;
      } else {
        booking.payment.status = 'Partial';
        booking.payment.balanceAmount = booking.pricing.totalAmount - totalPaid;
      }

      await booking.save();

      res.json({
        message: 'Payment processed successfully',
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          totalAmount: booking.pricing.totalAmount,
          paidAmount: totalPaid,
          balanceAmount: booking.payment.balanceAmount,
          paymentStatus: booking.payment.status
        }
      });
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get payment transactions
router.get('/transactions',
  authenticateToken,
  checkPermission('payments', 'read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('method').optional().isIn(['Cash', 'Card', 'UPI', 'Net Banking', 'Wallet']),
    query('status').optional().isIn(['Pending', 'Success', 'Failed', 'Refunded']),
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
      const { method, status, startDate, endDate } = req.query;

      // Build aggregation pipeline
      let matchStage = {};
      let transactionFilter = {};

      if (method) transactionFilter['payment.transactions.method'] = method;
      if (status) transactionFilter['payment.transactions.status'] = status;
      if (startDate || endDate) {
        transactionFilter['payment.transactions.timestamp'] = {};
        if (startDate) transactionFilter['payment.transactions.timestamp'].$gte = new Date(startDate);
        if (endDate) transactionFilter['payment.transactions.timestamp'].$lte = new Date(endDate);
      }

      const transactions = await Booking.aggregate([
        { $match: matchStage },
        { $unwind: '$payment.transactions' },
        { $match: transactionFilter },
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        {
          $project: {
            bookingId: 1,
            customer: { $arrayElemAt: ['$customerInfo.name', 0] },
            customerEmail: { $arrayElemAt: ['$customerInfo.email', 0] },
            totalAmount: '$pricing.totalAmount',
            transaction: '$payment.transactions',
            createdAt: 1
          }
        },
        { $sort: { 'transaction.timestamp': -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      const total = await Booking.aggregate([
        { $match: matchStage },
        { $unwind: '$payment.transactions' },
        { $match: transactionFilter },
        { $count: 'total' }
      ]);

      res.json({
        transactions,
        pagination: {
          page,
          limit,
          total: total[0]?.total || 0,
          pages: Math.ceil((total[0]?.total || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Process driver settlement
router.post('/settle-driver',
  authenticateToken,
  checkPermission('payments', 'approve'),
  [
    body('driverId').isMongoId(),
    body('amount').isNumeric({ min: 0 }),
    body('settlementDate').isISO8601(),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { driverId, amount, settlementDate, notes } = req.body;

      // Get completed trips for the driver
      const completedTrips = await Booking.find({
        assignedDriver: driverId,
        status: 'Completed',
        'payment.status': 'Paid'
      });

      // Calculate commission (assuming 20% for the company)
      const totalEarnings = completedTrips.reduce((sum, trip) => sum + trip.pricing.totalAmount, 0);
      const companyCommission = totalEarnings * 0.20;
      const driverShare = totalEarnings - companyCommission;

      // Create settlement record (you might want to create a separate Settlement model)
      const settlement = {
        driverId,
        amount,
        settlementDate: new Date(settlementDate),
        totalEarnings,
        companyCommission,
        driverShare,
        notes,
        processedBy: req.user._id,
        processedAt: new Date()
      };

      // Update driver's total earnings
      const Driver = (await import('../models/Driver.js')).default;
      await Driver.findByIdAndUpdate(driverId, {
        $inc: { totalEarnings: amount }
      });

      res.json({
        message: 'Driver settlement processed successfully',
        settlement
      });
    } catch (error) {
      console.error('Driver settlement error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;