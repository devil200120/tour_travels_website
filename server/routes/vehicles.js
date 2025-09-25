import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all vehicles
router.get('/',
  authenticateToken,
  checkPermission('vehicles', 'read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('vehicleType').optional().isIn(['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Bus', 'Tempo Traveller']),
    query('isActive').optional().isBoolean(),
    query('isAvailable').optional().isBoolean()
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
      const { search, vehicleType, isActive, isAvailable } = req.query;

      // Build query
      let query = {};
      if (vehicleType) query.vehicleType = vehicleType;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
      if (search) {
        query.$or = [
          { vehicleNumber: { $regex: search, $options: 'i' } },
          { make: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } }
        ];
      }

      const vehicles = await Vehicle.find(query)
        .populate('owner', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Vehicle.countDocuments(query);

      res.json({
        vehicles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Create new vehicle
router.post('/',
  authenticateToken,
  checkPermission('vehicles', 'create'),
  [
    body('vehicleNumber').notEmpty().trim().toUpperCase(),
    body('make').notEmpty().trim(),
    body('model').notEmpty().trim(),
    body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
    body('vehicleType').isIn(['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Bus', 'Tempo Traveller']),
    body('fuelType').isIn(['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']),
    body('seatingCapacity').isInt({ min: 1, max: 50 }),
    body('owner').isMongoId()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if vehicle number already exists
      const existingVehicle = await Vehicle.findOne({ vehicleNumber: req.body.vehicleNumber });
      if (existingVehicle) {
        return res.status(400).json({ message: 'Vehicle with this number already exists' });
      }

      // Check if owner exists
      const owner = await Driver.findById(req.body.owner);
      if (!owner) {
        return res.status(400).json({ message: 'Driver not found' });
      }

      const vehicle = new Vehicle(req.body);
      await vehicle.save();
      await vehicle.populate('owner', 'name email phone');

      res.status(201).json({
        message: 'Vehicle created successfully',
        vehicle
      });
    } catch (error) {
      console.error('Create vehicle error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update vehicle
router.put('/:id',
  authenticateToken,
  checkPermission('vehicles', 'update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vehicle = await Vehicle.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('owner', 'name email phone');

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      res.json({
        message: 'Vehicle updated successfully',
        vehicle
      });
    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;