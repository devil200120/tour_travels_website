import express from 'express';
import mongoose from 'mongoose';
import { authenticateCustomer } from '../../middleware/customerAuth.js';

const router = express.Router();

// Notification Schema (inline)
const notificationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { 
    type: String, 
    enum: [
      'booking', 'trip', 'payment', 'promotion', 'system', 
      'driver', 'support', 'referral', 'loyalty'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed, // Additional data (bookingId, etc.)
  imageUrl: String,
  actionUrl: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high'], 
    default: 'normal' 
  },
  expiresAt: Date
}, { timestamps: true });

notificationSchema.index({ customer: 1, createdAt: -1 });
notificationSchema.index({ customer: 1, isRead: 1 });

const Notification = mongoose.models.CustomerNotification || mongoose.model('CustomerNotification', notificationSchema);

// @route   GET /api/customer/notifications
// @desc    Get customer notifications
// @access  Private
router.get('/', authenticateCustomer, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      unreadOnly = false 
    } = req.query;

    const filter = { 
      customer: req.customer.id,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    if (type) filter.type = type;
    if (unreadOnly === 'true') filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      customer: req.customer.id,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// @route   GET /api/customer/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', authenticateCustomer, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      customer: req.customer.id,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
});

// @route   PUT /api/customer/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateCustomer, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, customer: req.customer.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

// @route   PUT /api/customer/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticateCustomer, async (req, res) => {
  try {
    await Notification.updateMany(
      { customer: req.customer.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read'
    });
  }
});

// @route   DELETE /api/customer/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', authenticateCustomer, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      customer: req.customer.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
});

// @route   DELETE /api/customer/notifications/clear-all
// @desc    Clear all notifications
// @access  Private
router.delete('/clear-all', authenticateCustomer, async (req, res) => {
  try {
    const { readOnly = false } = req.query;

    const filter = { customer: req.customer.id };
    if (readOnly === 'true') {
      filter.isRead = true;
    }

    await Notification.deleteMany(filter);

    res.json({
      success: true,
      message: 'Notifications cleared'
    });

  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications'
    });
  }
});

// @route   GET /api/customer/notifications/settings
// @desc    Get notification preferences
// @access  Private
router.get('/settings', authenticateCustomer, async (req, res) => {
  try {
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findById(req.customer.id);

    // Default settings if not set
    const defaultSettings = {
      push: {
        enabled: true,
        booking: true,
        trip: true,
        payment: true,
        promotion: true,
        system: true
      },
      email: {
        enabled: true,
        booking: true,
        trip: true,
        payment: true,
        promotion: false,
        newsletter: false
      },
      sms: {
        enabled: true,
        booking: true,
        trip: true,
        otp: true
      }
    };

    const settings = customer.notificationPreferences || defaultSettings;

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification settings'
    });
  }
});

// @route   PUT /api/customer/notifications/settings
// @desc    Update notification preferences
// @access  Private
router.put('/settings', authenticateCustomer, async (req, res) => {
  try {
    const { push, email, sms } = req.body;
    const Customer = mongoose.model('Customer');

    const customer = await Customer.findById(req.customer.id);
    
    if (!customer.notificationPreferences) {
      customer.notificationPreferences = {};
    }

    if (push) customer.notificationPreferences.push = push;
    if (email) customer.notificationPreferences.email = email;
    if (sms) customer.notificationPreferences.sms = sms;

    await customer.save();

    res.json({
      success: true,
      message: 'Notification settings updated',
      data: customer.notificationPreferences
    });

  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings'
    });
  }
});

// @route   POST /api/customer/notifications/register-token
// @desc    Register FCM token for push notifications
// @access  Private
router.post('/register-token', authenticateCustomer, async (req, res) => {
  try {
    const { fcmToken, deviceType, deviceId } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const Customer = mongoose.model('Customer');
    const customer = await Customer.findById(req.customer.id);

    if (!customer.deviceInfo) {
      customer.deviceInfo = {};
    }

    customer.deviceInfo.fcmToken = fcmToken;
    customer.deviceInfo.deviceType = deviceType || 'unknown';
    customer.deviceInfo.deviceId = deviceId;
    customer.deviceInfo.lastActive = new Date();

    await customer.save();

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });

  } catch (error) {
    console.error('Register FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering FCM token'
    });
  }
});

// Helper function to create notification (for use in other routes)
export const createNotification = async (customerId, notificationData) => {
  try {
    const notification = new Notification({
      customer: customerId,
      ...notificationData
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

export default router;
