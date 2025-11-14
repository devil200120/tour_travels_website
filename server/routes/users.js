import express from 'express';
import { body, validationResult, query } from 'express-validator';
import AdminUser from '../models/AdminUser.js';
import Customer from '../models/Customer.js';
import { authenticateToken, authorizeRoles, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// ==================== ADMIN USER MANAGEMENT ====================

// Get all admin users
router.get('/admin', 
  authenticateToken,
  checkPermission('users', 'read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['Super Admin', 'Operations', 'Finance', 'Support']),
    query('search').optional().trim()
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
      const { role, search } = req.query;

      // Build query
      let query = {};
      if (role) query.role = role;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await AdminUser.find(query)
        .select('-password')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AdminUser.countDocuments(query);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get admin users error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Create new admin user
router.post('/admin',
  authenticateToken,
  authorizeRoles('Super Admin'),
  [
    body('name').trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['Super Admin', 'Operations', 'Finance', 'Support']),
    body('phone').isMobilePhone('en-IN'),
    body('permissions').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role, phone, permissions } = req.body;

      // Check if user already exists
      const existingUser = await AdminUser.findOne({ 
        $or: [{ email }, { phone }] 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User with this email or phone already exists' 
        });
      }

      // Define default permissions based on role
      let defaultPermissions = [];
      switch (role) {
        case 'Super Admin':
          defaultPermissions = [
            { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
            { module: 'bookings', actions: ['create', 'read', 'update', 'delete', 'approve'] },
            { module: 'drivers', actions: ['create', 'read', 'update', 'delete', 'approve'] },
            { module: 'vehicles', actions: ['create', 'read', 'update', 'delete'] },
            { module: 'packages', actions: ['create', 'read', 'update', 'delete'] },
            { module: 'payments', actions: ['read', 'update', 'approve'] },
            { module: 'reports', actions: ['read'] },
            { module: 'settings', actions: ['read', 'update'] }
          ];
          break;
        case 'Operations':
          defaultPermissions = [
            { module: 'bookings', actions: ['create', 'read', 'update'] },
            { module: 'drivers', actions: ['read', 'update'] },
            { module: 'vehicles', actions: ['read', 'update'] },
            { module: 'packages', actions: ['read', 'update'] },
            { module: 'reports', actions: ['read'] }
          ];
          break;
        case 'Finance':
          defaultPermissions = [
            { module: 'bookings', actions: ['read'] },
            { module: 'payments', actions: ['read', 'update'] },
            { module: 'reports', actions: ['read'] }
          ];
          break;
        case 'Support':
          defaultPermissions = [
            { module: 'bookings', actions: ['read', 'update'] },
            { module: 'users', actions: ['read'] },
            { module: 'drivers', actions: ['read'] }
          ];
          break;
      }

      const newUser = new AdminUser({
        name,
        email,
        password,
        role,
        phone,
        permissions: permissions || defaultPermissions,
        createdBy: req.user._id
      });

      await newUser.save();

      res.status(201).json({
        message: 'Admin user created successfully',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          isActive: newUser.isActive
        }
      });
    } catch (error) {
      console.error('Create admin user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update admin user
router.put('/admin/:id',
  authenticateToken,
  authorizeRoles('Super Admin'),
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('role').optional().isIn(['Super Admin', 'Operations', 'Finance', 'Support']),
    body('phone').optional().isMobilePhone('en-IN'),
    body('isActive').optional().isBoolean(),
    body('permissions').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      const user = await AdminUser.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      console.error('Update admin user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== CUSTOMER MANAGEMENT ====================

// Get all customers
router.get('/customers',
  authenticateToken,
  checkPermission('users', 'read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('isActive').optional().isBoolean(),
    query('isVerified').optional().isBoolean()
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
      const { search, isActive, isVerified } = req.query;

      // Build query
      let query = {};
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (isVerified !== undefined) query.isVerified = isVerified === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Customer.countDocuments(query);

      res.json({
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Create new customer
router.post('/customers',
  authenticateToken,
  checkPermission('users', 'create'),
  [
    body('name').trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().isLength({ min: 10 }),
    body('isVerified').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if customer already exists
      const existingCustomer = await Customer.findOne({
        $or: [
          { email: req.body.email },
          { phone: req.body.phone }
        ]
      });

      if (existingCustomer) {
        return res.status(409).json({ 
          message: 'Customer already exists with this email or phone' 
        });
      }

      // Split name into firstName and lastName
      const nameParts = req.body.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Format phone number to match validation pattern
      let formattedPhone = req.body.phone.replace(/\D/g, ''); // Remove non-digits
      if (formattedPhone.length === 10 && !formattedPhone.startsWith('91')) {
        formattedPhone = '+91' + formattedPhone; // Add country code for Indian numbers
      } else if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
        formattedPhone = '+' + formattedPhone;
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.slice(-10); // Take last 10 digits and add +91
      }

      const customerData = {
        firstName,
        lastName,
        email: req.body.email,
        phone: formattedPhone,
        password: '$2a$12$defaultHashForAdminCreatedCustomers', // Default hashed password for admin-created customers
        isPhoneVerified: req.body.isVerified || true,
        isEmailVerified: req.body.isVerified || true,
        registrationDate: new Date(),
        lastLoginDate: null,
        totalBookings: 0,
        totalSpent: 0,
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true
          },
          language: 'en',
          currency: 'INR'
        },
        addresses: [],
        paymentPreferences: {
          preferredMethod: 'UPI',
          savedCards: [],
          walletBalance: 0,
          loyaltyPoints: 0
        },
        emergencyContacts: [],
        documents: {
          aadhaar: { verified: false },
          pan: { verified: false },
          passport: { verified: false }
        },
        tripHistory: [],
        reviews: [],
        isActive: true
      };

      const customer = new Customer(customerData);
      await customer.save();

      // Remove password from response
      const customerResponse = customer.toObject();
      delete customerResponse.password;

      res.status(201).json({
        message: 'Customer created successfully',
        customer: customerResponse
      });
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get customer by ID
router.get('/customers/:id',
  authenticateToken,
  checkPermission('users', 'read'),
  async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update customer
router.put('/customers/:id',
  authenticateToken,
  checkPermission('users', 'update'),
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone('en-IN'),
    body('isActive').optional().isBoolean(),
    body('isVerified').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      const customer = await Customer.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.json({
        message: 'Customer updated successfully',
        customer
      });
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get customer statistics
router.get('/customers/:id/stats',
  authenticateToken,
  checkPermission('users', 'read'),
  async (req, res) => {
    try {
      const customerId = req.params.id;
      
      // Import Booking model here to avoid circular dependency
      const Booking = (await import('../models/Booking.js')).default;
      
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Get booking statistics
      const bookingStats = await Booking.aggregate([
        { $match: { customer: customer._id } },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalSpent: { $sum: '$pricing.totalAmount' },
            avgRating: { $avg: '$feedback.rating' },
            completedTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            cancelledTrips: {
              $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      const stats = bookingStats[0] || {
        totalBookings: 0,
        totalSpent: 0,
        avgRating: 0,
        completedTrips: 0,
        cancelledTrips: 0
      };

      res.json({
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          joinDate: customer.createdAt
        },
        statistics: stats
      });
    } catch (error) {
      console.error('Get customer stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;