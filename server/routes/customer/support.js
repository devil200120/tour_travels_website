import express from 'express';
import mongoose from 'mongoose';
import { authenticateCustomer, optionalAuth } from '../../middleware/customerAuth.js';

const router = express.Router();

// Support Ticket Schema
const supportTicketSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer',
    required: true 
  },
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CustomerBooking'
  },
  category: {
    type: String,
    enum: [
      'booking_issue', 'payment_issue', 'driver_issue', 'vehicle_issue',
      'route_issue', 'cancellation', 'refund', 'app_issue', 'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  messages: [{
    sender: {
      type: String,
      enum: ['customer', 'support'],
      required: true
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    attachments: [String]
  }],
  assignedTo: String, // Support agent ID
  resolution: String,
  resolvedAt: Date,
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

// @route   GET /api/customer/support/categories
// @desc    Get support categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'booking_issue',
        name: 'Booking Issue',
        description: 'Problems with creating or modifying bookings',
        icon: 'booking-icon'
      },
      {
        id: 'payment_issue',
        name: 'Payment Issue',
        description: 'Payment failures, refunds, wallet issues',
        icon: 'payment-icon'
      },
      {
        id: 'driver_issue',
        name: 'Driver Issue',
        description: 'Issues with driver behavior or service',
        icon: 'driver-icon'
      },
      {
        id: 'vehicle_issue',
        name: 'Vehicle Issue',
        description: 'Problems with vehicle condition or cleanliness',
        icon: 'vehicle-icon'
      },
      {
        id: 'route_issue',
        name: 'Route Issue',
        description: 'Problems with pickup, drop, or route taken',
        icon: 'route-icon'
      },
      {
        id: 'cancellation',
        name: 'Cancellation',
        description: 'Trip cancellation related queries',
        icon: 'cancel-icon'
      },
      {
        id: 'refund',
        name: 'Refund',
        description: 'Refund status and processing queries',
        icon: 'refund-icon'
      },
      {
        id: 'app_issue',
        name: 'App Issue',
        description: 'Technical problems with the mobile app',
        icon: 'app-icon'
      },
      {
        id: 'other',
        name: 'Other',
        description: 'Any other queries or feedback',
        icon: 'other-icon'
      }
    ];

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get support categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching support categories'
    });
  }
});

// @route   GET /api/customer/support/faq
// @desc    Get frequently asked questions
// @access  Public
router.get('/faq', async (req, res) => {
  try {
    const { category } = req.query;

    // Mock FAQ data - in production, store in database
    const allFaqs = [
      {
        id: 1,
        category: 'booking_issue',
        question: 'How can I modify my booking?',
        answer: 'You can modify your booking up to 2 hours before the scheduled pickup time through the app or by contacting customer support.',
        helpful: 45,
        notHelpful: 3
      },
      {
        id: 2,
        category: 'booking_issue',
        question: 'Can I book a trip for someone else?',
        answer: 'Yes, you can book a trip for someone else. Just enter their details in the passenger information section during booking.',
        helpful: 32,
        notHelpful: 1
      },
      {
        id: 3,
        category: 'payment_issue',
        question: 'Why was my payment declined?',
        answer: 'Payment can be declined due to insufficient balance, network issues, or bank restrictions. Please try again or contact your bank.',
        helpful: 28,
        notHelpful: 2
      },
      {
        id: 4,
        category: 'payment_issue',
        question: 'How long does refund take?',
        answer: 'Refunds are processed within 3-5 business days. Wallet refunds are instant.',
        helpful: 56,
        notHelpful: 4
      },
      {
        id: 5,
        category: 'driver_issue',
        question: 'How to contact my assigned driver?',
        answer: 'Once a driver is assigned, you can call or message them directly through the app using the contact options in your active trip.',
        helpful: 42,
        notHelpful: 1
      },
      {
        id: 6,
        category: 'cancellation',
        question: 'What are the cancellation charges?',
        answer: 'Cancellation is free up to 1 hour before pickup. Within 1 hour: ₹50 charge. After driver arrival: ₹100 charge.',
        helpful: 67,
        notHelpful: 8
      }
    ];

    const faqs = category ? allFaqs.filter(faq => faq.category === category) : allFaqs;

    res.json({
      success: true,
      data: faqs
    });

  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching FAQ'
    });
  }
});

// @route   POST /api/customer/support/tickets
// @desc    Create support ticket
// @access  Private
router.post('/tickets', authenticateCustomer, async (req, res) => {
  try {
    const {
      category,
      subject,
      description,
      bookingId,
      priority = 'medium'
    } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, subject, and description are required'
      });
    }

    const ticket = new SupportTicket({
      customer: req.customer.id,
      booking: bookingId || undefined,
      category,
      subject,
      description,
      priority,
      messages: [{
        sender: 'customer',
        message: description
      }]
    });

    await ticket.save();

    // Auto-assign based on category (mock logic)
    const autoResponses = {
      booking_issue: 'Thank you for contacting us. Our booking specialist will review your issue and respond within 2 hours.',
      payment_issue: 'We have received your payment inquiry. Our finance team will investigate and respond within 4 hours.',
      driver_issue: 'We take driver service seriously. Your feedback has been forwarded to our quality team for immediate review.',
      cancellation: 'Your cancellation request is being processed. You will receive an update within 1 hour.',
      refund: 'Your refund request is under review. Processing typically takes 3-5 business days.',
      app_issue: 'Thank you for reporting the technical issue. Our development team will investigate and provide a resolution.',
      other: 'Thank you for contacting us. A support representative will respond to your query shortly.'
    };

    // Add auto-response
    if (autoResponses[category]) {
      ticket.messages.push({
        sender: 'support',
        message: autoResponses[category]
      });
      await ticket.save();
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticketId: ticket._id,
        status: ticket.status,
        estimatedResponse: '2-4 hours'
      }
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating support ticket'
    });
  }
});

// @route   GET /api/customer/support/tickets
// @desc    Get customer's support tickets
// @access  Private
router.get('/tickets', authenticateCustomer, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customer: req.customer.id };
    if (status) filter.status = status;

    const tickets = await SupportTicket.find(filter)
      .populate('booking', 'invoiceNumber pickup destination createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await SupportTicket.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTickets: total
        }
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets'
    });
  }
});

// @route   GET /api/customer/support/tickets/:id
// @desc    Get support ticket details
// @access  Private
router.get('/tickets/:id', authenticateCustomer, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      customer: req.customer.id
    }).populate('booking', 'invoiceNumber pickup destination createdAt');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket details'
    });
  }
});

// @route   POST /api/customer/support/tickets/:id/messages
// @desc    Add message to support ticket
// @access  Private
router.post('/tickets/:id/messages', authenticateCustomer, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      customer: req.customer.id
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add message to closed ticket'
      });
    }

    // Add customer message
    ticket.messages.push({
      sender: 'customer',
      message
    });

    // Reopen ticket if it was resolved
    if (ticket.status === 'resolved') {
      ticket.status = 'open';
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Message added successfully'
    });

  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding message'
    });
  }
});

// @route   PUT /api/customer/support/tickets/:id/rate
// @desc    Rate support ticket resolution
// @access  Private
router.put('/tickets/:id/rate', authenticateCustomer, async (req, res) => {
  try {
    const { score, feedback } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating score must be between 1 and 5'
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      customer: req.customer.id,
      status: 'resolved'
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Resolved ticket not found'
      });
    }

    if (ticket.rating?.ratedAt) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already rated'
      });
    }

    ticket.rating = {
      score,
      feedback,
      ratedAt: new Date()
    };

    ticket.status = 'closed';
    await ticket.save();

    res.json({
      success: true,
      message: 'Thank you for rating our support service'
    });

  } catch (error) {
    console.error('Rate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating ticket'
    });
  }
});

// @route   GET /api/customer/support/contact
// @desc    Get contact information
// @access  Public
router.get('/contact', async (req, res) => {
  try {
    const contactInfo = {
      customerCare: {
        phone: '+91-1234567890',
        email: 'support@tourtravels.com',
        hours: '24x7 Available'
      },
      emergency: {
        phone: '+91-9876543210',
        description: 'Emergency assistance during trips'
      },
      office: {
        address: 'Tour & Travels Pvt. Ltd., Your City, Your State - 123456',
        phone: '+91-1234567890',
        hours: 'Mon-Sat: 9:00 AM - 6:00 PM'
      },
      socialMedia: {
        facebook: 'https://facebook.com/tourtravels',
        twitter: 'https://twitter.com/tourtravels',
        instagram: 'https://instagram.com/tourtravels'
      }
    };

    res.json({
      success: true,
      data: contactInfo
    });

  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact information'
    });
  }
});

// @route   POST /api/customer/support/feedback
// @desc    Submit general feedback
// @access  Public (optional auth)
router.post('/feedback', optionalAuth, async (req, res) => {
  try {
    const { type, subject, message, rating } = req.body;

    if (!type || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, subject, and message are required'
      });
    }

    // Mock feedback storage
    const feedback = {
      id: Date.now(),
      customer: req.customer?.id || null,
      type, // 'suggestion', 'complaint', 'compliment', 'feature_request'
      subject,
      message,
      rating,
      timestamp: new Date(),
      status: 'received'
    };

    console.log('Feedback received:', feedback);

    res.json({
      success: true,
      message: 'Thank you for your feedback. We appreciate your input!',
      data: {
        feedbackId: feedback.id
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    });
  }
});

export default router;