import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// In a real application, you would have a Settings model
// For now, we'll simulate with in-memory storage
let systemSettings = {
  cities: [
    { id: 1, name: 'Mumbai', state: 'Maharashtra', isActive: true },
    { id: 2, name: 'Delhi', state: 'Delhi', isActive: true },
    { id: 3, name: 'Bangalore', state: 'Karnataka', isActive: true },
    { id: 4, name: 'Chennai', state: 'Tamil Nadu', isActive: true }
  ],
  routes: [
    { id: 1, from: 'Mumbai', to: 'Pune', distance: 150, estimatedTime: 180, isActive: true },
    { id: 2, from: 'Delhi', to: 'Agra', distance: 200, estimatedTime: 240, isActive: true }
  ],
  packageCategories: [
    { id: 1, name: 'Adventure', description: 'Adventure tours and activities', isActive: true },
    { id: 2, name: 'Pilgrimage', description: 'Religious and spiritual tours', isActive: true },
    { id: 3, name: 'Beach', description: 'Beach and coastal destinations', isActive: true }
  ],
  pricing: {
    baseFare: {
      sedan: 10,
      suv: 15,
      hatchback: 8,
      luxury: 25
    },
    perKmRate: {
      sedan: 12,
      suv: 18,
      hatchback: 10,
      luxury: 30
    },
    nightCharges: 1.5, // multiplier
    tollCharges: true,
    parkingCharges: true
  },
  general: {
    companyName: 'Tour & Travels Admin',
    supportEmail: 'support@tourtravels.com',
    supportPhone: '+91-9876543210',
    gstNumber: '27AABCU9603R1ZX',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    languages: ['English', 'Hindi', 'Marathi', 'Tamil']
  }
};

// Get all settings
router.get('/',
  authenticateToken,
  checkPermission('settings', 'read'),
  async (req, res) => {
    try {
      res.json(systemSettings);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update general settings
router.put('/general',
  authenticateToken,
  checkPermission('settings', 'update'),
  [
    body('companyName').optional().trim(),
    body('supportEmail').optional().isEmail(),
    body('supportPhone').optional().trim(),
    body('currency').optional().isIn(['INR', 'USD', 'EUR']),
    body('timezone').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      systemSettings.general = {
        ...systemSettings.general,
        ...req.body
      };

      res.json({
        message: 'General settings updated successfully',
        settings: systemSettings.general
      });
    } catch (error) {
      console.error('Update general settings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get cities
router.get('/cities',
  authenticateToken,
  checkPermission('settings', 'read'),
  async (req, res) => {
    try {
      res.json(systemSettings.cities);
    } catch (error) {
      console.error('Get cities error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Add city
router.post('/cities',
  authenticateToken,
  checkPermission('settings', 'update'),
  [
    body('name').notEmpty().trim(),
    body('state').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, state } = req.body;
      const newCity = {
        id: Date.now(),
        name,
        state,
        isActive: true,
        createdAt: new Date()
      };

      systemSettings.cities.push(newCity);

      res.status(201).json({
        message: 'City added successfully',
        city: newCity
      });
    } catch (error) {
      console.error('Add city error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update pricing settings
router.put('/pricing',
  authenticateToken,
  checkPermission('settings', 'update'),
  [
    body('baseFare').optional().isObject(),
    body('perKmRate').optional().isObject(),
    body('nightCharges').optional().isNumeric(),
    body('tollCharges').optional().isBoolean(),
    body('parkingCharges').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      systemSettings.pricing = {
        ...systemSettings.pricing,
        ...req.body
      };

      res.json({
        message: 'Pricing settings updated successfully',
        pricing: systemSettings.pricing
      });
    } catch (error) {
      console.error('Update pricing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get routes
router.get('/routes',
  authenticateToken,
  checkPermission('settings', 'read'),
  async (req, res) => {
    try {
      res.json(systemSettings.routes);
    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Add route
router.post('/routes',
  authenticateToken,
  checkPermission('settings', 'update'),
  [
    body('from').notEmpty().trim(),
    body('to').notEmpty().trim(),
    body('distance').isNumeric({ min: 1 }),
    body('estimatedTime').isNumeric({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { from, to, distance, estimatedTime } = req.body;
      const newRoute = {
        id: Date.now(),
        from,
        to,
        distance: parseFloat(distance),
        estimatedTime: parseInt(estimatedTime),
        isActive: true,
        createdAt: new Date()
      };

      systemSettings.routes.push(newRoute);

      res.status(201).json({
        message: 'Route added successfully',
        route: newRoute
      });
    } catch (error) {
      console.error('Add route error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get package categories
router.get('/package-categories',
  authenticateToken,
  checkPermission('settings', 'read'),
  async (req, res) => {
    try {
      res.json(systemSettings.packageCategories);
    } catch (error) {
      console.error('Get package categories error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Add package category
router.post('/package-categories',
  authenticateToken,
  checkPermission('settings', 'update'),
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;
      const newCategory = {
        id: Date.now(),
        name,
        description,
        isActive: true,
        createdAt: new Date()
      };

      systemSettings.packageCategories.push(newCategory);

      res.status(201).json({
        message: 'Package category added successfully',
        category: newCategory
      });
    } catch (error) {
      console.error('Add package category error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;