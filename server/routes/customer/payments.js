import express from 'express';
import Customer from '../../models/Customer.js';
import CustomerBooking from '../../models/CustomerBooking.js';
import { authenticateCustomer } from '../../middleware/customerAuth.js';

const router = express.Router();

// @route   GET /api/customer/payments/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'upi',
        name: 'UPI',
        displayName: 'UPI (Google Pay, PhonePe, Paytm)',
        icon: 'upi-icon',
        isActive: true,
        processingFee: 0
      },
      {
        id: 'card',
        name: 'Card',
        displayName: 'Credit/Debit Card',
        icon: 'card-icon',
        isActive: true,
        processingFee: 2 // 2% processing fee
      },
      {
        id: 'wallet',
        name: 'Wallet',
        displayName: 'Tour & Travels Wallet',
        icon: 'wallet-icon',
        isActive: true,
        processingFee: 0
      },
      {
        id: 'netbanking',
        name: 'NetBanking',
        displayName: 'Net Banking',
        icon: 'netbanking-icon',
        isActive: true,
        processingFee: 0
      },
      {
        id: 'cash',
        name: 'Cash',
        displayName: 'Cash on Trip',
        icon: 'cash-icon',
        isActive: true,
        processingFee: 0
      }
    ];

    res.json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment methods'
    });
  }
});

// @route   GET /api/customer/payments/wallet
// @desc    Get wallet balance and transaction history
// @access  Private
router.get('/wallet', authenticateCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    
    // Mock wallet transactions - in production, maintain separate wallet transaction table
    const mockTransactions = [
      {
        id: 'TXN001',
        type: 'credit',
        amount: 500,
        description: 'Wallet top-up',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        id: 'TXN002',
        type: 'debit',
        amount: 250,
        description: 'Trip payment - #TT202412001',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        id: 'TXN003',
        type: 'credit',
        amount: 50,
        description: 'Referral bonus',
        date: new Date(),
        status: 'completed'
      }
    ];

    res.json({
      success: true,
      data: {
        balance: customer.paymentPreferences?.walletBalance || 0,
        loyaltyPoints: customer.paymentPreferences?.loyaltyPoints || 0,
        transactions: mockTransactions
      }
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet information'
    });
  }
});

// @route   POST /api/customer/payments/wallet/topup
// @desc    Add money to wallet
// @access  Private
router.post('/wallet/topup', authenticateCustomer, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum top-up amount is ₹10'
      });
    }

    if (amount > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum top-up amount is ₹10,000'
      });
    }

    // Mock payment processing
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, integrate with payment gateway (Razorpay, Stripe, etc.)
    const paymentResult = {
      id: paymentId,
      status: 'success',
      amount: amount,
      method: paymentMethod,
      timestamp: new Date()
    };

    // Update wallet balance
    const customer = await Customer.findById(req.customer.id);
    if (!customer.paymentPreferences) {
      customer.paymentPreferences = {};
    }
    
    customer.paymentPreferences.walletBalance = (customer.paymentPreferences.walletBalance || 0) + amount;
    await customer.save();

    res.json({
      success: true,
      message: 'Wallet topped up successfully',
      data: {
        paymentId,
        amount,
        newBalance: customer.paymentPreferences.walletBalance,
        transaction: paymentResult
      }
    });

  } catch (error) {
    console.error('Wallet topup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing wallet top-up'
    });
  }
});

// @route   POST /api/customer/payments/process
// @desc    Process payment for booking
// @access  Private
router.post('/process', authenticateCustomer, async (req, res) => {
  try {
    const { bookingId, paymentMethod, amount, cardDetails, upiId } = req.body;

    const booking = await CustomerBooking.findOne({
      _id: bookingId,
      customer: req.customer.id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    let paymentResult = { status: 'failed' };

    // Process payment based on method
    switch (paymentMethod) {
      case 'wallet':
        const customer = await Customer.findById(req.customer.id);
        const walletBalance = customer.paymentPreferences?.walletBalance || 0;
        
        if (walletBalance < amount) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient wallet balance'
          });
        }

        // Deduct from wallet
        customer.paymentPreferences.walletBalance = walletBalance - amount;
        await customer.save();

        paymentResult = {
          status: 'success',
          paymentId: `WALLET_${Date.now()}`,
          method: 'wallet'
        };
        break;

      case 'upi':
        // Mock UPI payment
        paymentResult = {
          status: 'success',
          paymentId: `UPI_${Date.now()}`,
          method: 'upi',
          upiId: upiId
        };
        break;

      case 'card':
        // Mock card payment
        paymentResult = {
          status: 'success',
          paymentId: `CARD_${Date.now()}`,
          method: 'card',
          lastFour: cardDetails?.number?.slice(-4)
        };
        break;

      case 'netbanking':
        // Mock net banking payment
        paymentResult = {
          status: 'success',
          paymentId: `NB_${Date.now()}`,
          method: 'netbanking'
        };
        break;

      case 'cash':
        paymentResult = {
          status: 'pending',
          paymentId: `CASH_${Date.now()}`,
          method: 'cash'
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method'
        });
    }

    // Update booking payment status
    booking.paymentStatus = paymentResult.status === 'success' ? 'completed' : 'pending';
    booking.paymentId = paymentResult.paymentId;
    
    if (booking.paymentStatus === 'completed') {
      booking.status = 'confirmed';
    }

    await booking.save();

    res.json({
      success: true,
      message: paymentResult.status === 'success' ? 'Payment processed successfully' : 'Payment initiated',
      data: {
        paymentId: paymentResult.paymentId,
        status: paymentResult.status,
        bookingStatus: booking.status
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment'
    });
  }
});

// @route   GET /api/customer/payments/history
// @desc    Get payment history
// @access  Private
router.get('/history', authenticateCustomer, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const payments = await CustomerBooking.find({
      customer: req.customer.id,
      paymentStatus: { $in: ['completed', 'failed', 'refunded'] }
    })
    .select('invoiceNumber fareBreakdown paymentMethod paymentStatus paymentId createdAt pickup destination')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

    const total = await CustomerBooking.countDocuments({
      customer: req.customer.id,
      paymentStatus: { $in: ['completed', 'failed', 'refunded'] }
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPayments: total
        }
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history'
    });
  }
});

// @route   GET /api/customer/payments/invoice/:bookingId
// @desc    Download/view invoice
// @access  Private
router.get('/invoice/:bookingId', authenticateCustomer, async (req, res) => {
  try {
    const booking = await CustomerBooking.findOne({
      _id: req.params.bookingId,
      customer: req.customer.id
    }).populate('customer', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Invoice not available for unpaid bookings'
      });
    }

    // Generate invoice data
    const invoice = {
      invoiceNumber: booking.invoiceNumber,
      invoiceDate: booking.createdAt,
      customer: {
        name: `${booking.customer.firstName} ${booking.customer.lastName}`,
        email: booking.customer.email,
        phone: booking.customer.phone
      },
      trip: {
        from: booking.pickup.address,
        to: booking.destination.address,
        date: booking.pickupDate,
        time: booking.pickupTime,
        vehicle: booking.vehicleCategory,
        passengers: booking.passengerCount
      },
      fareBreakdown: booking.fareBreakdown,
      payment: {
        method: booking.paymentMethod,
        id: booking.paymentId,
        status: booking.paymentStatus
      },
      companyDetails: {
        name: 'Tour & Travels',
        address: 'Your Company Address',
        phone: '+91-XXXXXXXXXX',
        email: 'support@tourtravels.com',
        gstin: 'XXXXXXXXXXXX'
      }
    };

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating invoice'
    });
  }
});

// @route   POST /api/customer/payments/refund
// @desc    Request refund for cancelled booking
// @access  Private
router.post('/refund', authenticateCustomer, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    const booking = await CustomerBooking.findOne({
      _id: bookingId,
      customer: req.customer.id,
      status: 'cancelled'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Cancelled booking not found'
      });
    }

    if (booking.paymentStatus === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Refund already processed'
      });
    }

    // Calculate refund amount
    const totalPaid = booking.fareBreakdown.totalFare;
    const cancellationCharges = booking.cancellationCharges || 0;
    const refundAmount = totalPaid - cancellationCharges;

    // Mock refund processing
    const refundId = `REFUND_${Date.now()}`;
    
    // Update booking
    booking.paymentStatus = 'refunded';
    booking.refundId = refundId;
    booking.refundAmount = refundAmount;
    booking.refundReason = reason;
    booking.refundProcessedAt = new Date();

    await booking.save();

    // If original payment was from wallet, credit back to wallet
    if (booking.paymentMethod === 'wallet') {
      const customer = await Customer.findById(req.customer.id);
      customer.paymentPreferences.walletBalance = (customer.paymentPreferences.walletBalance || 0) + refundAmount;
      await customer.save();
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId,
        refundAmount,
        originalAmount: totalPaid,
        cancellationCharges,
        refundMethod: booking.paymentMethod,
        processingTime: '3-5 business days'
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund'
    });
  }
});

export default router;