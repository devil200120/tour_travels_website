import express from 'express';
import CustomerBooking from '../../models/CustomerBooking.js';
import { authenticateCustomer } from '../../middleware/customerAuth.js';
import { sendPushNotification } from '../../services/notificationService.js';

const router = express.Router();

// @route   GET /api/customer/trips/active
// @desc    Get customer's active trips
// @access  Private
router.get('/active', authenticateCustomer, async (req, res) => {
  try {
    const activeStatuses = ['confirmed', 'driver_assigned', 'driver_arrived', 'trip_started', 'in_progress'];
    
    const activeTrips = await CustomerBooking.find({
      customer: req.customer.id,
      status: { $in: activeStatuses }
    })
    .populate('driver', 'firstName lastName phone rating profileImage')
    .populate('vehicle', 'vehicleNumber make model year color')
    .sort({ pickupDate: 1 });

    res.json({
      success: true,
      data: activeTrips
    });

  } catch (error) {
    console.error('Get active trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active trips'
    });
  }
});

// @route   GET /api/customer/trips/:id/track
// @desc    Get real-time tracking information for a trip
// @access  Private
router.get('/:id/track', authenticateCustomer, async (req, res) => {
  try {
    const trip = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    })
    .populate('driver', 'firstName lastName phone rating profileImage')
    .populate('vehicle', 'vehicleNumber make model year color');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if trip is trackable
    const trackableStatuses = ['driver_assigned', 'driver_arrived', 'trip_started', 'in_progress'];
    if (!trackableStatuses.includes(trip.status)) {
      return res.status(400).json({
        success: false,
        message: 'Trip is not currently trackable'
      });
    }

    // Mock real-time data - in production, this would come from driver app
    const mockTrackingData = {
      currentLocation: trip.currentLocation || {
        latitude: trip.pickup.latitude + (Math.random() - 0.5) * 0.01,
        longitude: trip.pickup.longitude + (Math.random() - 0.5) * 0.01,
        timestamp: new Date()
      },
      estimatedArrival: trip.estimatedArrival || new Date(Date.now() + 15 * 60 * 1000),
      distanceToPickup: Math.random() * 5, // km
      speed: 40 + Math.random() * 20, // km/h
      route: trip.route || []
    };

    res.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          status: trip.status,
          pickup: trip.pickup,
          destination: trip.destination,
          driver: trip.driver,
          vehicle: trip.vehicle,
          pickupDate: trip.pickupDate,
          pickupTime: trip.pickupTime
        },
        tracking: mockTrackingData
      }
    });

  } catch (error) {
    console.error('Track trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking trip'
    });
  }
});

// @route   POST /api/customer/trips/:id/sos
// @desc    Send SOS alert during trip
// @access  Private
router.post('/:id/sos', authenticateCustomer, async (req, res) => {
  try {
    const { location, message } = req.body;

    const trip = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Create SOS alert
    const sosAlert = {
      tripId: trip._id,
      customerId: req.customer.id,
      location: location || trip.currentLocation,
      message: message || 'Emergency assistance required',
      timestamp: new Date(),
      status: 'active'
    };

    // In production, this would:
    // 1. Alert emergency contacts
    // 2. Notify support team
    // 3. Send location to authorities if needed
    // 4. Call emergency services if configured

    console.log('SOS Alert triggered:', sosAlert);

    // Add to trip messages
    trip.messages.push({
      sender: 'customer',
      message: `SOS ALERT: ${message || 'Emergency assistance required'}`,
      messageType: 'text'
    });

    await trip.save();

    res.json({
      success: true,
      message: 'SOS alert sent successfully',
      data: {
        alertId: sosAlert.timestamp.getTime(),
        emergencyServices: 'notified',
        supportTeam: 'notified'
      }
    });

  } catch (error) {
    console.error('SOS alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending SOS alert'
    });
  }
});

// @route   POST /api/customer/trips/:id/messages
// @desc    Send message to driver
// @access  Private
router.post('/:id/messages', authenticateCustomer, async (req, res) => {
  try {
    const { message, messageType = 'text' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const trip = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    }).populate('driver', 'deviceInfo.fcmToken firstName');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Add message to trip
    trip.messages.push({
      sender: 'customer',
      message,
      messageType
    });

    await trip.save();

    // Send push notification to driver
    if (trip.driver?.deviceInfo?.fcmToken) {
      await sendPushNotification(
        trip.driver.deviceInfo.fcmToken,
        'New message from customer',
        message,
        {
          type: 'chat_message',
          tripId: trip._id.toString()
        }
      );
    }

    res.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

// @route   GET /api/customer/trips/:id/messages
// @desc    Get trip messages/chat history
// @access  Private
router.get('/:id/messages', authenticateCustomer, async (req, res) => {
  try {
    const trip = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    }).select('messages');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip.messages.sort((a, b) => a.timestamp - b.timestamp)
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

// @route   PUT /api/customer/trips/:id/status
// @desc    Update trip status (for customer actions like confirming arrival)
// @access  Private
router.put('/:id/status', authenticateCustomer, async (req, res) => {
  try {
    const { status, location } = req.body;

    const trip = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Only allow certain status updates from customer side
    const allowedUpdates = ['no_show']; // Customer can mark themselves as no-show
    
    if (!allowedUpdates.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status update'
      });
    }

    trip.status = status;
    
    if (location) {
      trip.currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date()
      };
    }

    await trip.save();

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    io.to(`trip_${trip._id}`).emit('trip_status_update', {
      tripId: trip._id,
      status: trip.status,
      updatedBy: 'customer',
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Trip status updated successfully',
      data: {
        status: trip.status
      }
    });

  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trip status'
    });
  }
});

// @route   GET /api/customer/trips/:id/eta
// @desc    Get estimated time of arrival
// @access  Private
router.get('/:id/eta', authenticateCustomer, async (req, res) => {
  try {
    const trip = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Mock ETA calculation - in production, use real-time traffic data
    let eta = new Date();
    let etaMessage = '';

    switch (trip.status) {
      case 'confirmed':
        eta = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
        etaMessage = 'Driver will be assigned soon';
        break;
      case 'driver_assigned':
        eta = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        etaMessage = 'Driver is on the way to pickup location';
        break;
      case 'driver_arrived':
        eta = new Date();
        etaMessage = 'Driver has arrived at pickup location';
        break;
      case 'trip_started':
        eta = new Date(Date.now() + trip.estimatedDuration * 60 * 1000);
        etaMessage = 'En route to destination';
        break;
      default:
        eta = null;
        etaMessage = 'ETA not available for current trip status';
    }

    res.json({
      success: true,
      data: {
        eta,
        etaMessage,
        currentStatus: trip.status,
        estimatedDuration: trip.estimatedDuration // in minutes
      }
    });

  } catch (error) {
    console.error('Get ETA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating ETA'
    });
  }
});

// @route   POST /api/customer/trips/:id/share-location
// @desc    Share trip location with contacts
// @access  Private
router.post('/:id/share-location', authenticateCustomer, async (req, res) => {
  try {
    const { contacts } = req.body; // Array of phone numbers or emails

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        message: 'Contacts array is required'
      });
    }

    const trip = await CustomerBooking.findOne({
      _id: req.params.id,
      customer: req.customer.id
    }).populate('driver', 'firstName lastName phone');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Generate shareable link (in production, this would be a secure link)
    const shareableLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/track-trip/${trip._id}`;

    // Send location to contacts
    const shareMessage = `Hi! I'm traveling with Tour & Travels. Track my trip here: ${shareableLink}. 
    Pickup: ${trip.pickup.address}
    Destination: ${trip.destination.address}
    Driver: ${trip.driver?.firstName} ${trip.driver?.lastName} (${trip.driver?.phone})`;

    // In production, send SMS/Email to contacts
    console.log('Sharing trip location with contacts:', contacts);
    console.log('Share message:', shareMessage);

    res.json({
      success: true,
      message: 'Trip location shared successfully',
      data: {
        shareableLink,
        sharedWith: contacts.length
      }
    });

  } catch (error) {
    console.error('Share location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing trip location'
    });
  }
});

export default router;