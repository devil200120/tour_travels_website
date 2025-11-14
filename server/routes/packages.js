import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Package from '../models/Package.js';
import { authenticateToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Get all packages
router.get('/',
  authenticateToken,
  checkPermission('packages', 'read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('category').optional().isIn(['Adventure', 'Pilgrimage', 'Beach', 'Hill Station', 'Heritage', 'Wildlife', 'Cultural', 'Business']),
    query('isActive').optional().isBoolean()
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
      const { search, category, isActive } = req.query;

      // Build query
      let query = {};
      if (category) query.category = category;
      if (isActive !== undefined) query['availability.isActive'] = isActive === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'destinations.city': { $regex: search, $options: 'i' } }
        ];
      }

      const packages = await Package.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Package.countDocuments(query);

      res.json({
        packages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get packages error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Create new package
router.post('/',
  authenticateToken,
  checkPermission('packages', 'create'),
  [
    body('name').trim().isLength({ min: 2 }),
    body('description').notEmpty().trim(),
    body('shortDescription').notEmpty().trim(),
    body('category').isIn(['Adventure', 'Pilgrimage', 'Beach', 'Hill Station', 'Heritage', 'Wildlife', 'Cultural', 'Business']),
    body('duration.days').isInt({ min: 1 }),
    body('duration.nights').isInt({ min: 0 }),
    body('pricing.basePrice').isNumeric({ min: 0 }),
    body('pricing.pricePerPerson').isNumeric({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const packageData = {
        ...req.body,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      };

      const newPackage = new Package(packageData);
      await newPackage.save();

      res.status(201).json({
        message: 'Package created successfully',
        package: newPackage
      });
    } catch (error) {
      console.error('Create package error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update package
router.put('/:id',
  authenticateToken,
  checkPermission('packages', 'update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        lastModifiedBy: req.user._id
      };

      const updatedPackage = await Package.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedPackage) {
        return res.status(404).json({ message: 'Package not found' });
      }

      res.json({
        message: 'Package updated successfully',
        package: updatedPackage
      });
    } catch (error) {
      console.error('Update package error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete package
router.delete('/:id',
  authenticateToken,
  checkPermission('packages', 'delete'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const deletedPackage = await Package.findByIdAndDelete(id);

      if (!deletedPackage) {
        return res.status(404).json({ message: 'Package not found' });
      }

      res.json({
        message: 'Package deleted successfully'
      });
    } catch (error) {
      console.error('Delete package error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get single package
router.get('/:id',
  authenticateToken,
  checkPermission('packages', 'read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const packageData = await Package.findById(id)
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email');

      if (!packageData) {
        return res.status(404).json({ message: 'Package not found' });
      }

      res.json({
        package: packageData
      });
    } catch (error) {
      console.error('Get package error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get package pricing for specific dates
router.post('/:id/pricing',
  authenticateToken,
  checkPermission('packages', 'read'),
  [
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('passengers').isInt({ min: 1 }),
    body('vehicleType').optional().isIn(['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Bus', 'Tempo Traveller'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { startDate, endDate, passengers, vehicleType } = req.body;

      const packageData = await Package.findById(id);
      if (!packageData) {
        return res.status(404).json({ message: 'Package not found' });
      }

      // Calculate base pricing
      let basePrice = packageData.pricing.pricePerPerson * passengers;

      // Apply seasonal pricing if applicable
      const bookingDate = new Date(startDate);
      const seasonalPricing = packageData.pricing.seasonalPricing.find(sp => 
        bookingDate >= new Date(sp.startDate) && bookingDate <= new Date(sp.endDate)
      );

      if (seasonalPricing) {
        basePrice *= seasonalPricing.multiplier;
      }

      // Apply group discounts
      const groupDiscount = packageData.pricing.groupDiscounts.find(gd =>
        passengers >= gd.minPeople && passengers <= gd.maxPeople
      );

      let discountAmount = 0;
      if (groupDiscount) {
        discountAmount = (basePrice * groupDiscount.discountPercentage) / 100;
      }

      // Vehicle type additional cost
      let vehicleAdditionalCost = 0;
      if (vehicleType) {
        const vehicleOption = packageData.vehicleOptions.find(vo => vo.vehicleType === vehicleType);
        if (vehicleOption) {
          vehicleAdditionalCost = vehicleOption.additionalCost;
        }
      }

      const finalPrice = basePrice - discountAmount + vehicleAdditionalCost;

      res.json({
        basePrice,
        seasonalMultiplier: seasonalPricing?.multiplier || 1,
        groupDiscount: discountAmount,
        vehicleAdditionalCost,
        totalPrice: finalPrice,
        priceBreakdown: {
          basePrice,
          seasonalAdjustment: seasonalPricing ? (basePrice * (seasonalPricing.multiplier - 1)) : 0,
          groupDiscount: -discountAmount,
          vehicleCost: vehicleAdditionalCost
        }
      });
    } catch (error) {
      console.error('Calculate pricing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;