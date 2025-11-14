import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Driver from '../../models/Driver.js';
import Booking from '../../models/Booking.js';
import driverAuth from '../../middleware/driverAuth.js';
import googleMapsService from '../../services/googleMapsService.js';
const router = express.Router();

// Apply driver authentication middleware to all routes
router.use(driverAuth);

// Get Driver's Current Active Trip
router.get('/current-trip', async (req, res) => {
    try {
        const driverId = req.user.id;

        const activeTrip = await Booking.findOne({
            assignedDriver: driverId,
            status: { $in: ['Confirmed', 'In Progress'] }
        })
        .populate('customer', 'firstName lastName phone email')
        .populate('packageDetails.packageId', 'name duration');

        if (!activeTrip) {
            return res.json({
                success: true,
                hasActiveTrip: false,
                trip: null
            });
        }

        const tripDetails = {
            id: activeTrip._id,
            bookingId: activeTrip.bookingId,
            status: activeTrip.status,
            customer: {
                id: activeTrip.customer?._id,
                name: activeTrip.customer?.name || `${activeTrip.customer?.firstName || ''} ${activeTrip.customer?.lastName || ''}`.trim() || 'N/A',
                phone: activeTrip.customer?.phone || 'N/A',
                email: activeTrip.customer?.email || 'N/A'
            },
            package: {
                id: activeTrip.packageId?._id,
                name: activeTrip.packageId?.name || activeTrip.packageDetails?.name || 'Custom Trip',
                duration: activeTrip.packageId?.duration || activeTrip.packageDetails?.duration || 'N/A',
                vehicleType: activeTrip.packageId?.vehicleType || activeTrip.vehiclePreference || 'Any'
            },
            pickup: {
                address: activeTrip.pickupLocation?.address || activeTrip.pickup?.address || 'N/A',
                coordinates: activeTrip.pickupLocation?.coordinates || activeTrip.pickup?.coordinates || null,
                time: activeTrip.pickupTime || activeTrip.schedule?.startDate
            },
            dropoff: {
                address: activeTrip.dropoffLocation?.address || activeTrip.dropoff?.address || 'N/A',
                coordinates: activeTrip.dropoffLocation?.coordinates || activeTrip.dropoff?.coordinates || null,
                time: activeTrip.dropoffTime
            },
            totalAmount: activeTrip.totalAmount || activeTrip.pricing?.totalAmount || 0,
            distance: activeTrip.distance || 0,
            estimatedDuration: activeTrip.duration || activeTrip.estimatedDuration || 0,
            specialInstructions: activeTrip.specialInstructions || activeTrip.specialRequests || '',
            paymentStatus: activeTrip.paymentStatus || 'Pending',
            createdAt: activeTrip.createdAt,
            acceptedAt: activeTrip.acceptedAt,
            startTime: activeTrip.startTime,
            estimatedArrival: activeTrip.estimatedArrival,
            driverMessage: activeTrip.driverMessage,
            vehiclePreference: activeTrip.vehiclePreference,
            tripType: activeTrip.tripType || 'one-way',
            passengers: activeTrip.passengers || 1
        };

        res.json({
            success: true,
            hasActiveTrip: true,
            trip: tripDetails
        });

    } catch (error) {
        console.error('Get current trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current trip',
            error: error.message
        });
    }
});

// Get Assigned/Available Orders for Driver
router.get('/orders', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { status, page = 1, limit = 10, dateFilter } = req.query;

        let query = {};

        // Date filtering logic
        if (dateFilter && dateFilter !== 'all') {
            const now = new Date();
            let startDate, endDate;

            switch (dateFilter.toLowerCase()) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    break;
                case 'week':
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    startDate = startOfWeek;
                    endDate = new Date(startOfWeek);
                    endDate.setDate(startOfWeek.getDate() + 7);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    break;
                default:
                    // No date filter
                    break;
            }

            if (startDate && endDate) {
                query.createdAt = {
                    $gte: startDate,
                    $lt: endDate
                };
            }
        }

        // Special handling for different status types
        if (status === 'pending' || status === 'Pending') {
            // For pending orders, show both assigned to this driver AND unassigned orders
            query = {
                ...query,
                status: { $regex: new RegExp(`^pending$`, 'i') }, // Case-insensitive
                $or: [
                    { assignedDriver: driverId },
                    { assignedDriver: { $exists: false } },
                    { assignedDriver: null }
                ]
            };
        } else if (status === 'completed' || status === 'Completed') {
            // For completed trips, show only this driver's completed trips
            query = {
                ...query,
                assignedDriver: driverId,
                status: { $regex: new RegExp(`^completed$`, 'i') } // Case-insensitive
            };
        } else if (status === 'confirmed' || status === 'Confirmed') {
            // For confirmed trips, show only this driver's confirmed trips
            query = {
                ...query,
                assignedDriver: driverId,
                status: { $regex: new RegExp(`^confirmed$`, 'i') } // Case-insensitive
            };
        } else if (status === 'cancelled' || status === 'Cancelled') {
            // For cancelled trips, show only this driver's cancelled trips
            query = {
                ...query,
                assignedDriver: driverId,
                status: { $regex: new RegExp(`^cancelled$`, 'i') } // Case-insensitive
            };
        } else if (status === 'available') {
            // Show only unassigned pending orders that haven't been rejected by this driver
            query = {
                ...query,
                status: { $regex: new RegExp(`^pending$`, 'i') }, // Case-insensitive
                $or: [
                    { assignedDriver: { $exists: false } },
                    { assignedDriver: null }
                ],
                // Exclude orders that have been rejected by this driver
                $and: [
                    {
                        $or: [
                            { rejectedBy: { $exists: false } },
                            { rejectedBy: { $size: 0 } },
                            { 'rejectedBy.driverId': { $ne: new mongoose.Types.ObjectId(driverId) } }
                        ]
                    }
                ]
            };
        } else {
            // For all other statuses, show only orders assigned to this driver
            query = { ...query, assignedDriver: driverId };
            if (status) {
                query.status = { $regex: new RegExp(`^${status}$`, 'i') }; // Case-insensitive
            }
        }

        console.log('🔍 Debug Orders Query:');
        console.log('Driver ID:', driverId);
        console.log('Status filter:', status);
        console.log('MongoDB Query:', JSON.stringify(query, null, 2));

        const orders = await Booking.find(query)
            .populate('customer', 'firstName lastName phone email')
            .populate('packageDetails.packageId', 'name duration')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalOrders = await Booking.countDocuments(query);

        console.log('📊 Query Results:');
        console.log('Total orders found:', totalOrders);
        console.log('Orders returned:', orders.length);

        // Debug rejection data
        if (status === 'available') {
            console.log('🚫 Rejected Orders Debug:');
            for (const order of orders) {
                console.log(`Order ${order.bookingId}:`, {
                    rejectedBy: order.rejectedBy,
                    isRejectedByCurrentDriver: order.rejectedBy?.some(r => r.driverId?.toString() === driverId.toString())
                });
            }
        }

        const ordersWithDetails = orders.map(order => ({
            id: order._id,
            bookingId: order.bookingId,
            customer: {
                id: order.customerId?._id || order.customer?._id,
                name: order.customer?.name || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'N/A',
                phone: order.customer?.phone || 'N/A',
                email: order.customer?.email || 'N/A'
            },
            package: {
                id: order.packageId?._id,
                name: order.packageId?.name || order.packageDetails?.name || 'Custom Trip',
                duration: order.packageId?.duration || order.packageDetails?.duration || 'N/A',
                vehicleType: order.packageId?.vehicleType || order.vehiclePreference || 'Any'
            },
            pickup: {
                address: order.pickupLocation?.address || order.pickup?.address || 'N/A',
                coordinates: order.pickupLocation?.coordinates || order.pickup?.coordinates || null,
                time: order.pickupTime || order.schedule?.startDate,
                landmark: order.pickup?.landmark || order.pickupLocation?.landmark
            },
            dropoff: {
                address: order.dropoffLocation?.address || order.dropoff?.address || 'N/A',
                coordinates: order.dropoffLocation?.coordinates || order.dropoff?.coordinates || null,
                time: order.dropoffTime,
                landmark: order.dropoff?.landmark || order.dropoffLocation?.landmark
            },
            status: order.status,
            totalAmount: order.totalAmount || order.pricing?.totalAmount || 0,
            distance: order.distance || order.actualDistance || 0,
            estimatedDuration: order.duration || order.estimatedDuration || 0,
            actualDuration: order.actualDuration || Math.round((new Date(order.endTime) - new Date(order.startTime)) / (1000 * 60)) || 0,
            specialInstructions: order.specialInstructions || order.specialRequests || '',
            paymentStatus: order.paymentStatus || 'Pending',
            createdAt: order.createdAt,
            bookingTime: order.createdAt, // For UI compatibility
            pickupTime: order.pickupTime || order.schedule?.startDate,
            assignedAt: order.acceptedAt || order.updatedAt,
            startTime: order.startTime,
            endTime: order.endTime,
            completedAt: order.tripDetails?.completedAt || order.endTime,
            assignedDriver: order.assignedDriver,
            vehiclePreference: order.vehiclePreference,
            tripType: order.tripType || 'one-way',
            passengers: order.passengers || 1,
            notes: order.tripSummary || order.notes || '',
            cancellationReason: order.cancellationReason,
            earnings: order.status?.toLowerCase() === 'completed' ? (order.totalAmount || 0) : 0,
            tripDetails: {
                startOdometerReading: order.startOdometerReading,
                endOdometerReading: order.endOdometerReading,
                actualDistance: order.actualDistance,
                routeTracking: order.routeTracking?.length || 0
            }
        }));

        res.json({
            success: true,
            orders: ordersWithDetails,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
                limit: parseInt(limit)
            },
            debug: {
                query,
                driverId,
                statusFilter: status
            }
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

// Get Available Orders (not assigned to any driver)
router.get('/orders/available', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { page = 1, limit = 10, vehicleType } = req.query;

        // Debug: Check all pending orders
        const allPendingOrders = await Booking.find({ status: 'Pending' }).select('bookingId status assignedDriver rejectedBy');
        console.log('🔍 Debug Available Orders:');
        console.log('Current Driver ID:', driverId);
        console.log('Total Pending Orders:', allPendingOrders.length);
        console.log('Pending Orders:', allPendingOrders.map(o => ({
            bookingId: o.bookingId,
            status: o.status,
            assignedDriver: o.assignedDriver,
            rejectedByCurrentDriver: o.rejectedBy?.some(r => r.driverId?.toString() === driverId.toString())
        })));

        const query = {
            status: 'Pending',
            $or: [
                { assignedDriver: { $exists: false } },
                { assignedDriver: null }
            ],
            // Exclude orders that have been rejected by this driver
            $and: [
                {
                    $or: [
                        { rejectedBy: { $exists: false } },
                        { rejectedBy: { $size: 0 } },
                        { 'rejectedBy.driverId': { $ne: driverId } }
                    ]
                }
            ]
        };

        if (vehicleType) {
            query.vehiclePreference = vehicleType;
        }

        console.log('🔍 Available Orders Query:', JSON.stringify(query, null, 2));

        const orders = await Booking.find(query)
            .populate('customer', 'firstName lastName phone')
            .populate('packageDetails.packageId', 'name duration')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalOrders = await Booking.countDocuments(query);

        console.log('📊 Available Orders Results:');
        console.log('Total available orders:', totalOrders);
        console.log('Orders returned:', orders.length);

        const availableOrders = orders.map(order => ({
            id: order._id,
            bookingId: order.bookingId,
            customer: {
                name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
                phone: order.customer?.phone
            },
            pickup: {
                address: order.pickup?.address,
                latitude: order.pickup?.latitude,
                longitude: order.pickup?.longitude,
                landmark: order.pickup?.landmark
            },
            dropoff: {
                address: order.dropoff?.address,
                latitude: order.dropoff?.latitude,
                longitude: order.dropoff?.longitude,
                landmark: order.dropoff?.landmark
            },
            schedule: {
                startDate: order.schedule?.startDate,
                startTime: order.schedule?.startTime
            },
            pricing: {
                totalAmount: order.pricing?.totalAmount,
                basePrice: order.pricing?.basePrice
            },
            passengers: order.passengers,
            vehiclePreference: order.vehiclePreference,
            tripType: order.tripType,
            bookingType: order.bookingType,
            specialRequests: order.specialRequests,
            createdAt: order.createdAt,
            urgency: order.schedule?.startDate ? 
                Math.max(0, Math.floor((new Date(order.schedule.startDate) - new Date()) / (1000 * 60 * 60))) : 0 // Hours until pickup
        }));

        res.json({
            success: true,
            orders: availableOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get available orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available orders',
            error: error.message
        });
    }
});

// Accept Order
router.post('/orders/:orderId/accept', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { orderId } = req.params;
        const { estimatedArrival, currentLocation, message } = req.body;

        // Find pending order that hasn't been assigned to any driver yet
        const order = await Booking.findOne({
            bookingId: orderId,
            status: 'Pending',
            $or: [
                { assignedDriver: { $exists: false } },
                { assignedDriver: null }
            ]
        }).populate('customer', 'firstName lastName phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found, already assigned, or not available for acceptance'
            });
        }

        // Assign driver and update order status
        order.assignedDriver = driverId;
        order.status = 'Confirmed';
        order.acceptedAt = new Date();
        
        if (estimatedArrival) {
            order.estimatedArrival = new Date(Date.now() + (estimatedArrival * 60 * 1000)); // Convert minutes to milliseconds
        }

        // Add driver location and message if provided
        if (currentLocation) {
            order.driverLocation = {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                address: currentLocation.address || '',
                timestamp: new Date()
            };
        }

        if (message) {
            order.driverMessage = message;
        }

        await order.save();

        // Update driver availability
        await Driver.findByIdAndUpdate(driverId, {
            isAvailable: false,
            currentBookingId: order.bookingId
        });

        // Here you can add notification logic to customer
        
        res.json({
            success: true,
            message: 'Order accepted successfully',
            order: {
                id: order._id,
                bookingId: order.bookingId,
                status: order.status,
                customer: {
                    name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
                    phone: order.customer?.phone
                },
                pickup: {
                    address: order.pickup?.address,
                    latitude: order.pickup?.latitude,
                    longitude: order.pickup?.longitude,
                    landmark: order.pickup?.landmark
                },
                dropoff: {
                    address: order.dropoff?.address,
                    latitude: order.dropoff?.latitude,
                    longitude: order.dropoff?.longitude,
                    landmark: order.dropoff?.landmark
                },
                schedule: {
                    startDate: order.schedule?.startDate,
                    startTime: order.schedule?.startTime
                },
                pricing: {
                    totalAmount: order.pricing?.totalAmount,
                    basePrice: order.pricing?.basePrice
                },
                passengers: order.passengers,
                acceptedAt: order.acceptedAt,
                estimatedArrival: order.estimatedArrival,
                driverMessage: order.driverMessage
            }
        });

    } catch (error) {
        console.error('Accept order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept order',
            error: error.message
        });
    }
});

// Reject Order
router.post('/orders/:orderId/reject', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { orderId } = req.params;
        const { reason } = req.body;

        // Find pending order that hasn't been assigned to any driver yet (same as accept)
        const order = await Booking.findOne({
            bookingId: orderId,
            status: 'Pending',
            $or: [
                { assignedDriver: { $exists: false } },
                { assignedDriver: null }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found, already assigned, or not available for rejection'
            });
        }

        // Remove driver assignment and set status back for reassignment
        order.assignedDriver = null;
        order.rejectedBy = order.rejectedBy || [];
        order.rejectedBy.push({
            driverId: driverId,
            reason: reason || 'No reason provided',
            rejectedAt: new Date()
        });
        
        console.log(`🚫 REJECTION DEBUG:`, {
            orderId: orderId,
            driverId: driverId,
            rejectedByArray: order.rejectedBy,
            reason: reason
        });
        
        await order.save();

        console.log(`✅ Order ${orderId} rejected and saved to database`);

        // Here you can add auto-reassignment logic
        
        res.json({
            success: true,
            message: 'Order rejected successfully'
        });

    } catch (error) {
        console.error('Reject order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject order',
            error: error.message
        });
    }
});

// Start Trip (Driver reached pickup location)
router.post('/orders/:orderId/start', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { orderId } = req.params;
        const { currentLocation, odometerReading } = req.body;

        const order = await Booking.findOne({
            bookingId: orderId,
            assignedDriver: driverId,
            status: 'Confirmed'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not in confirmed status'
            });
        }

        // Update order status to started
        order.status = 'In Progress';
        order.startTime = new Date();
        order.startLocation = currentLocation;
        order.startOdometerReading = odometerReading;
        await order.save();

        res.json({
            success: true,
            message: 'Trip started successfully',
            order: {
                id: order._id,
                bookingId: order.bookingId,
                status: order.status,
                startTime: order.startTime,
                startLocation: order.startLocation
            }
        });

    } catch (error) {
        console.error('Start trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start trip',
            error: error.message
        });
    }
});

// Complete Trip
router.post('/orders/:orderId/complete', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { orderId } = req.params;
        const { 
            endLocation, 
            odometerReading, 
            actualDistance, 
            actualAmount,
            tripSummary 
        } = req.body;

        const order = await Booking.findOne({
            bookingId: orderId,
            assignedDriver: driverId,
            status: 'In Progress'
        }).populate('customer', 'firstName lastName phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not in progress'
            });
        }

        // Calculate trip duration
        const startTime = order.startTime;
        const endTime = new Date();
        const duration = endTime - startTime; // in milliseconds

        // Calculate actual distance using Google Maps if start and end locations are available
        let finalActualDistance = actualDistance || order.distance;
        
        if (order.startLocation && endLocation && order.startLocation.coordinates && endLocation.coordinates) {
            try {
                const actualDistanceData = await googleMapsService.calculateDistance(
                    {
                        latitude: order.startLocation.coordinates[1],
                        longitude: order.startLocation.coordinates[0]
                    },
                    {
                        latitude: endLocation.coordinates[1],
                        longitude: endLocation.coordinates[0]
                    },
                    'driving'
                );
                
                finalActualDistance = actualDistanceData.distance.value;
                console.log(`Trip ${orderId}: Google Maps calculated distance: ${finalActualDistance} km`);
                
            } catch (mapsError) {
                console.warn('Could not calculate actual distance with Google Maps:', mapsError.message);
                // Keep the provided actualDistance or fallback to original distance
            }
        }

        // Update order completion details
        order.status = 'Completed';
        order.endTime = endTime;
        
        // Initialize tripDetails if it doesn't exist
        if (!order.tripDetails) {
            order.tripDetails = {};
        }
        order.tripDetails.completedAt = endTime; // Correct field path
        order.tripDetails.endTime = endTime;
        
        order.endLocation = endLocation;
        order.endOdometerReading = odometerReading;
        order.actualDistance = finalActualDistance;
        order.duration = Math.round(duration / (1000 * 60)); // in minutes
        
        if (actualAmount) {
            order.totalAmount = actualAmount;
        }
        
        // Ensure totalAmount has a valid value
        if (!order.totalAmount || isNaN(parseFloat(order.totalAmount))) {
            order.totalAmount = order.pricing?.totalAmount || 0;
        }

        if (tripSummary) {
            order.tripSummary = tripSummary;
        }

        await order.save();

        // Update driver availability and stats
        const driver = await Driver.findById(driverId);
        driver.isAvailable = true;
        driver.currentBookingId = null;
        driver.totalTrips = (driver.totalTrips || 0) + 1;
        
        // Ensure we have valid numbers for calculations
        const tripEarnings = parseFloat(order.totalAmount) || 0;
        const tripDistance = parseFloat(finalActualDistance) || 0;
        
        driver.totalEarnings = (driver.totalEarnings || 0) + tripEarnings;
        driver.totalDistance = (driver.totalDistance || 0) + tripDistance;
        await driver.save();

        res.json({
            success: true,
            message: 'Trip completed successfully',
            tripSummary: {
                id: order._id,
                bookingId: order.bookingId,
                customer: {
                    name: order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : 'N/A',
                    phone: order.customer?.phone || 'N/A'
                },
                startTime: order.startTime,
                endTime: order.endTime,
                duration: order.duration,
                distance: finalActualDistance,
                amount: order.totalAmount,
                pickup: {
                    address: order.pickup?.address,
                    latitude: order.pickup?.latitude,
                    longitude: order.pickup?.longitude,
                    landmark: order.pickup?.landmark
                },
                dropoff: {
                    address: order.dropoff?.address,
                    latitude: order.dropoff?.latitude,
                    longitude: order.dropoff?.longitude,
                    landmark: order.dropoff?.landmark
                },
                actualStartLocation: order.actualStartLocation,
                actualEndLocation: order.actualEndLocation,
                tripType: order.tripType,
                vehiclePreference: order.vehiclePreference,
                passengers: order.passengers,
                actualDistance: order.actualDistance,
                originalDistance: order.distance,
                bookingType: order.bookingType
            }
        });

    } catch (error) {
        console.error('Complete trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete trip',
            error: error.message
        });
    }
});

// Cancel Trip (Emergency cancellation)
router.post('/orders/:orderId/cancel', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { orderId } = req.params;
        const { reason, cancellationType } = req.body;

        const order = await Booking.findOne({
            bookingId: orderId,
            assignedDriver: driverId,
            status: { $in: ['Confirmed', 'In Progress'] }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or cannot be cancelled'
            });
        }

        // Update order status
        order.status = 'Cancelled';
        order.cancellationReason = reason || 'Cancelled by driver';
        order.cancellationType = cancellationType || 'driver';
        order.cancelledAt = new Date();
        order.cancelledBy = driverId;
        await order.save();

        // Update driver availability
        await Driver.findByIdAndUpdate(driverId, {
            isAvailable: true,
            currentBookingId: null
        });

        res.json({
            success: true,
            message: 'Trip cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel trip',
            error: error.message
        });
    }
});

// Update Trip Location (Real-time tracking during trip)
router.put('/orders/:orderId/location', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { orderId } = req.params;
        const { latitude, longitude, address, speed, heading } = req.body;

        const order = await Booking.findOne({
            bookingId: orderId,
            assignedDriver: driverId,
            status: 'In Progress'
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Active trip not found'
            });
        }

        // Update current location in the trip
        const locationUpdate = {
            coordinates: [longitude, latitude],
            address: address,
            timestamp: new Date(),
            speed: speed || 0,
            heading: heading || 0
        };

        if (!order.routeTracking) {
            order.routeTracking = [];
        }
        order.routeTracking.push(locationUpdate);

        // Keep only last 50 location points to prevent document size issues
        if (order.routeTracking.length > 50) {
            order.routeTracking = order.routeTracking.slice(-50);
        }

        await order.save();

        // Also update driver's current location
        await Driver.findByIdAndUpdate(driverId, {
            currentLocation: {
                type: 'Point',
                coordinates: [longitude, latitude],
                address: address,
                lastUpdated: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Location updated successfully'
        });

    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }
});

// Get Route Navigation Details with Google Maps Integration
router.get('/orders/:orderId/navigation', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { orderId } = req.params;

        const order = await Booking.findOne({
            bookingId: orderId,
            assignedDriver: driverId,
            status: { $in: ['Confirmed', 'In Progress'] }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Active trip not found'
            });
        }

        // Get pickup and dropoff coordinates
        let pickup = order.pickupLocation?.coordinates || order.pickup?.coordinates;
        let dropoff = order.dropoffLocation?.coordinates || order.dropoff?.coordinates;
        
        // If coordinates are missing, try to geocode from addresses
        if (!pickup && (order.pickupLocation?.address || order.pickup?.address)) {
            try {
                const pickupAddress = order.pickupLocation?.address || order.pickup?.address;
                console.log('🔍 Geocoding pickup address:', pickupAddress);
                const geocodeResult = await googleMapsService.geocodeAddress(pickupAddress);
                console.log('🔍 Pickup geocode result:', geocodeResult);
                if (geocodeResult && geocodeResult.latitude && geocodeResult.longitude) {
                    pickup = [geocodeResult.longitude, geocodeResult.latitude];
                    console.log('✅ Pickup coordinates geocoded:', pickup);
                }
            } catch (e) {
                console.warn('❌ Failed to geocode pickup address:', e.message);
            }
        }
        
        if (!dropoff && (order.dropoffLocation?.address || order.dropoff?.address)) {
            try {
                const dropoffAddress = order.dropoffLocation?.address || order.dropoff?.address;
                console.log('🔍 Geocoding dropoff address:', dropoffAddress);
                const geocodeResult = await googleMapsService.geocodeAddress(dropoffAddress);
                console.log('🔍 Dropoff geocode result:', geocodeResult);
                if (geocodeResult && geocodeResult.latitude && geocodeResult.longitude) {
                    dropoff = [geocodeResult.longitude, geocodeResult.latitude];
                    console.log('✅ Dropoff coordinates geocoded:', dropoff);
                }
            } catch (e) {
                console.warn('❌ Failed to geocode dropoff address:', e.message);
            }
        }
        
        if (!pickup || !dropoff) {
            return res.status(400).json({
                success: false,
                message: 'Pickup or dropoff coordinates not available',
                debug: {
                    pickup: pickup,
                    dropoff: dropoff,
                    pickupAddress: order.pickupLocation?.address || order.pickup?.address,
                    dropoffAddress: order.dropoffLocation?.address || order.dropoff?.address
                }
            });
        }

        try {
            // Use Google Maps API for accurate routing
            const routeData = await googleMapsService.getDirections(
                { latitude: pickup[1], longitude: pickup[0] },
                { latitude: dropoff[1], longitude: dropoff[0] },
                [], // No waypoints for direct route
                'driving', // Travel mode
                false // No alternative routes needed
            );

            // Also get current distance matrix for real-time traffic
            const distanceData = await googleMapsService.calculateDistance(
                { latitude: pickup[1], longitude: pickup[0] },
                { latitude: dropoff[1], longitude: dropoff[0] },
                'driving'
            );

            res.json({
                success: true,
                navigation: {
                    orderId: order._id,
                    bookingId: order.bookingId,
                    status: order.status,
                    pickup: {
                        address: order.pickupLocation?.address || routeData.start_address,
                        coordinates: pickup
                    },
                    dropoff: {
                        address: order.dropoffLocation?.address || routeData.end_address,
                        coordinates: dropoff
                    },
                    distance: routeData.distance.value,
                    distanceText: routeData.distance.text,
                    estimatedTime: Math.round(routeData.duration.value),
                    estimatedTimeText: routeData.duration.text,
                    estimatedTimeWithTraffic: routeData.duration_in_traffic ? 
                        Math.round(routeData.duration_in_traffic.value) : null,
                    estimatedTimeWithTrafficText: routeData.duration_in_traffic?.text,
                    estimatedAmount: order.totalAmount,
                    routeSteps: routeData.steps,
                    polyline: routeData.polyline,
                    bounds: routeData.bounds,
                    warnings: routeData.warnings,
                    routeTracking: order.routeTracking || [],
                    realTimeTraffic: {
                        distance: distanceData.distance,
                        duration: distanceData.duration,
                        durationInTraffic: distanceData.duration_in_traffic
                    }
                }
            });

        } catch (mapsError) {
            console.warn('Google Maps API error, using fallback:', mapsError.message);
            
            // Fallback to basic calculation
            const distance = calculateDistance(pickup[1], pickup[0], dropoff[1], dropoff[0]);
            const estimatedTime = Math.round(distance / 40 * 60); // Assuming 40 km/h average speed

            res.json({
                success: true,
                navigation: {
                    orderId: order._id,
                    bookingId: order.bookingId,
                    status: order.status,
                    pickup: {
                        address: order.pickupLocation?.address,
                        coordinates: pickup
                    },
                    dropoff: {
                        address: order.dropoffLocation?.address,
                        coordinates: dropoff
                    },
                    distance: parseFloat(distance.toFixed(2)),
                    distanceText: `${distance.toFixed(2)} km`,
                    estimatedTime: estimatedTime,
                    estimatedTimeText: `${estimatedTime} mins`,
                    estimatedAmount: order.totalAmount,
                    routeTracking: order.routeTracking || [],
                    fallbackMode: true,
                    note: 'Using basic distance calculation'
                }
            });
        }

    } catch (error) {
        console.error('Navigation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get navigation details',
            error: error.message
        });
    }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Calculate Fare with Google Maps Integration
router.post('/calculate-fare', async (req, res) => {
    try {
        const { pickup, dropoff, vehicleType, options = {} } = req.body;
        
        if (!pickup?.latitude || !pickup?.longitude || !dropoff?.latitude || !dropoff?.longitude) {
            return res.status(400).json({
                success: false,
                message: 'Pickup and dropoff coordinates are required'
            });
        }

        try {
            // Get accurate distance and time from Google Maps
            const distanceData = await googleMapsService.calculateDistance(
                pickup,
                dropoff,
                'driving'
            );

            // Calculate fare using Google Maps data
            const fareBreakdown = googleMapsService.calculateFare(
                distanceData.distance.value,
                distanceData.duration.value,
                {
                    baseRate: options.baseRate || 50,
                    perKmRate: options.perKmRate || (vehicleType === 'premium' ? 20 : 15),
                    perMinuteRate: options.perMinuteRate || 2,
                    surgeMultiplier: options.surgeMultiplier || 1,
                    minimumFare: options.minimumFare || 100
                }
            );

            res.json({
                success: true,
                fareCalculation: {
                    distance: distanceData.distance,
                    duration: distanceData.duration,
                    durationInTraffic: distanceData.duration_in_traffic,
                    vehicleType: vehicleType || 'standard',
                    fareBreakdown,
                    estimatedPickupTime: '5-10 mins',
                    source: 'google_maps'
                }
            });

        } catch (mapsError) {
            console.warn('Google Maps API error, using fallback fare calculation:', mapsError.message);
            
            // Fallback calculation
            const distance = calculateDistance(pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude);
            const estimatedTime = (distance / 40) * 60;
            
            const fareBreakdown = googleMapsService.calculateFare(
                distance,
                estimatedTime,
                {
                    baseRate: options.baseRate || 50,
                    perKmRate: options.perKmRate || (vehicleType === 'premium' ? 20 : 15),
                    perMinuteRate: options.perMinuteRate || 2,
                    surgeMultiplier: options.surgeMultiplier || 1,
                    minimumFare: options.minimumFare || 100
                }
            );

            res.json({
                success: true,
                fareCalculation: {
                    distance: {
                        text: `${distance.toFixed(2)} km`,
                        value: distance
                    },
                    duration: {
                        text: `${Math.round(estimatedTime)} mins`,
                        value: estimatedTime
                    },
                    vehicleType: vehicleType || 'standard',
                    fareBreakdown,
                    estimatedPickupTime: '5-10 mins',
                    source: 'fallback',
                    note: 'Calculated using basic distance formula'
                }
            });
        }

    } catch (error) {
        console.error('Fare calculation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate fare',
            error: error.message
        });
    }
});

// Geocoding - Convert address to coordinates
router.post('/geocode', async (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Address is required'
            });
        }

        const geocodeResult = await googleMapsService.geocodeAddress(address);
        
        res.json({
            success: true,
            geocode: geocodeResult
        });

    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to geocode address',
            error: error.message
        });
    }
});

// Reverse Geocoding - Convert coordinates to address
router.post('/reverse-geocode', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const reverseGeocodeResult = await googleMapsService.reverseGeocode(latitude, longitude);
        
        res.json({
            success: true,
            address: reverseGeocodeResult
        });

    } catch (error) {
        console.error('Reverse geocoding error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reverse geocode coordinates',
            error: error.message
        });
    }
});

// Route Optimization for multiple stops
router.post('/optimize-route', async (req, res) => {
    try {
        const { origin, destination, waypoints = [] } = req.body;
        
        if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
            return res.status(400).json({
                success: false,
                message: 'Origin and destination coordinates are required'
            });
        }

        const optimizedRoute = await googleMapsService.optimizeRoute(origin, destination, waypoints);
        
        res.json({
            success: true,
            optimizedRoute
        });

    } catch (error) {
        console.error('Route optimization error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to optimize route',
            error: error.message
        });
    }
});

export default router;