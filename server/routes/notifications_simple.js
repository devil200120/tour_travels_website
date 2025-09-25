import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get notification templates
router.get('/templates',
  authenticateToken,
  checkPermission('notifications', 'read'),
  async (req, res) => {
    try {
      const templates = [
        {
          id: 1,
          name: 'Booking Confirmation',
          type: 'booking',
          channels: ['SMS', 'Email'],
          template: {
            sms: 'Your booking {bookingId} has been confirmed. Driver: {driverName}',
            email: {
              subject: 'Booking Confirmation - {bookingId}',
              body: 'Dear {customerName}, Your booking has been confirmed...'
            }
          }
        }
      ];
      
      res.json({ templates });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Send notification
router.post('/send',
  authenticateToken,
  checkPermission('notifications', 'create'),
  [
    body('type').isIn(['booking', 'trip', 'payment']),
    body('recipients').isArray().notEmpty(),
    body('message').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, recipients, message } = req.body;

      res.json({
        message: 'Notification sent successfully',
        sent: recipients.length
      });
    } catch (error) {
      console.error('Send notification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;