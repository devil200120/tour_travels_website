import express from 'express';
import Driver from '../../models/Driver.js';
import Booking from '../../models/Booking.js';
import driverAuth from '../../middleware/driverAuth.js';
const router = express.Router();

// Apply driver authentication middleware to all routes
router.use(driverAuth);

// Get Today's Earnings (Quick Summary)
router.get('/today', async (req, res) => {
    try {
        const driverId = req.user.id;
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        console.log('🔍 Debug Today\'s Earnings:');
        console.log('Driver ID:', driverId);
        console.log('Start of day:', startOfDay);
        console.log('End of day:', endOfDay);

        // Get today's completed trips
        const todayTrips = await Booking.find({
            assignedDriver: driverId,
            status: 'Completed',
            endTime: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        }).populate('customer', 'firstName lastName phone');

        console.log('Today\'s trips found:', todayTrips.length);

        // Calculate earnings
        const grossEarnings = todayTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        const commission = grossEarnings * 0.15; // 15% platform commission
        const netEarnings = grossEarnings - commission;

        // Get trips currently in progress
        const ongoingTrips = await Booking.find({
            assignedDriver: driverId,
            status: 'In Progress'
        }).populate('customer', 'firstName lastName phone');

        // Calculate distance and time
        const totalDistance = todayTrips.reduce((sum, trip) => sum + (trip.actualDistance || trip.distance || 0), 0);
        const totalDuration = todayTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0);

        // Format trip details
        const tripDetails = todayTrips.map(trip => ({
            id: trip._id,
            bookingId: trip.bookingId,
            customer: {
                name: trip.customer ? `${trip.customer.firstName || ''} ${trip.customer.lastName || ''}`.trim() : 'N/A',
                phone: trip.customer?.phone || 'N/A'
            },
            pickup: trip.pickup?.address || trip.pickupLocation?.address || 'N/A',
            dropoff: trip.dropoff?.address || trip.dropoffLocation?.address || 'N/A',
            amount: trip.totalAmount || 0,
            distance: trip.actualDistance || trip.distance || 0,
            duration: trip.duration || 0,
            startTime: trip.startTime,
            endTime: trip.endTime,
            commission: (trip.totalAmount || 0) * 0.15,
            netAmount: (trip.totalAmount || 0) * 0.85
        }));

        res.json({
            success: true,
            todayEarnings: {
                summary: {
                    grossEarnings: parseFloat(grossEarnings.toFixed(2)),
                    commission: parseFloat(commission.toFixed(2)),
                    netEarnings: parseFloat(netEarnings.toFixed(2)),
                    tripCount: todayTrips.length,
                    ongoingTrips: ongoingTrips.length,
                    totalDistance: parseFloat(totalDistance.toFixed(2)),
                    totalDuration: Math.round(totalDuration), // in minutes
                    averagePerTrip: todayTrips.length > 0 ? parseFloat((grossEarnings / todayTrips.length).toFixed(2)) : 0
                },
                trips: tripDetails,
                ongoingTrips: ongoingTrips.map(trip => ({
                    id: trip._id,
                    bookingId: trip.bookingId,
                    customer: {
                        name: trip.customer ? `${trip.customer.firstName || ''} ${trip.customer.lastName || ''}`.trim() : 'N/A',
                        phone: trip.customer?.phone || 'N/A'
                    },
                    pickup: trip.pickup?.address || trip.pickupLocation?.address || 'N/A',
                    dropoff: trip.dropoff?.address || trip.dropoffLocation?.address || 'N/A',
                    startTime: trip.startTime,
                    estimatedAmount: trip.totalAmount || 0
                })),
                date: today.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('Today\'s earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s earnings',
            error: error.message
        });
    }
});

// Get This Week's Earnings
router.get('/week', async (req, res) => {
    try {
        const driverId = req.user.id;
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const weekTrips = await Booking.find({
            assignedDriver: driverId,
            status: 'Completed',
            endTime: {
                $gte: startOfWeek,
                $lt: endOfWeek
            }
        }).populate('customer', 'firstName lastName phone');

        const grossEarnings = weekTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        const commission = grossEarnings * 0.15;
        const netEarnings = grossEarnings - commission;

        res.json({
            success: true,
            weekEarnings: {
                summary: {
                    grossEarnings: parseFloat(grossEarnings.toFixed(2)),
                    commission: parseFloat(commission.toFixed(2)),
                    netEarnings: parseFloat(netEarnings.toFixed(2)),
                    tripCount: weekTrips.length,
                    weekStart: startOfWeek.toISOString().split('T')[0],
                    weekEnd: endOfWeek.toISOString().split('T')[0]
                }
            }
        });

    } catch (error) {
        console.error('Week earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch week earnings',
            error: error.message
        });
    }
});

// Get This Month's Earnings
router.get('/month', async (req, res) => {
    try {
        const driverId = req.user.id;
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const monthTrips = await Booking.find({
            assignedDriver: driverId,
            status: 'Completed',
            endTime: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }).populate('customer', 'firstName lastName phone');

        const grossEarnings = monthTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        const commission = grossEarnings * 0.15;
        const netEarnings = grossEarnings - commission;

        res.json({
            success: true,
            monthEarnings: {
                summary: {
                    grossEarnings: parseFloat(grossEarnings.toFixed(2)),
                    commission: parseFloat(commission.toFixed(2)),
                    netEarnings: parseFloat(netEarnings.toFixed(2)),
                    tripCount: monthTrips.length,
                    month: today.toLocaleString('default', { month: 'long', year: 'numeric' })
                }
            }
        });

    } catch (error) {
        console.error('Month earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch month earnings',
            error: error.message
        });
    }
});

// Get Driver Earnings Overview
router.get('/earnings-overview', async (req, res) => {
    try {
        const driverId = req.user.id;
        const today = new Date();
        
        // Calculate date ranges
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Get driver details
        const driver = await Driver.findById(driverId).select('totalEarnings earningsHistory');

        // Get completed bookings for calculations
        const allCompletedTrips = await Booking.find({
            assignedDriver: driverId,
            status: 'Completed'
        }).sort({ endTime: -1 });

        // Today's earnings
        const todayTrips = allCompletedTrips.filter(trip => 
            trip.endTime >= startOfDay
        );
        const todayEarnings = todayTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        const todayCommission = todayEarnings * 0.15; // 15% commission
        const todayNetEarnings = todayEarnings - todayCommission;

        // This week's earnings
        const weekTrips = allCompletedTrips.filter(trip => 
            trip.endTime >= startOfWeek
        );
        const weekEarnings = weekTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        const weekCommission = weekEarnings * 0.15;
        const weekNetEarnings = weekEarnings - weekCommission;

        // This month's earnings
        const monthTrips = allCompletedTrips.filter(trip => 
            trip.endTime >= startOfMonth
        );
        const monthEarnings = monthTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        const monthCommission = monthEarnings * 0.15;
        const monthNetEarnings = monthEarnings - monthCommission;

        // Total earnings
        const totalGrossEarnings = allCompletedTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        const totalCommission = totalGrossEarnings * 0.15;
        const totalNetEarnings = totalGrossEarnings - totalCommission;

        // Pending settlements
        const pendingSettlement = driver.earningsHistory?.pendingAmount || 0;

        res.json({
            success: true,
            earnings: {
                today: {
                    grossEarnings: parseFloat(todayEarnings.toFixed(2)),
                    commission: parseFloat(todayCommission.toFixed(2)),
                    netEarnings: parseFloat(todayNetEarnings.toFixed(2)),
                    tripCount: todayTrips.length
                },
                thisWeek: {
                    grossEarnings: parseFloat(weekEarnings.toFixed(2)),
                    commission: parseFloat(weekCommission.toFixed(2)),
                    netEarnings: parseFloat(weekNetEarnings.toFixed(2)),
                    tripCount: weekTrips.length
                },
                thisMonth: {
                    grossEarnings: parseFloat(monthEarnings.toFixed(2)),
                    commission: parseFloat(monthCommission.toFixed(2)),
                    netEarnings: parseFloat(monthNetEarnings.toFixed(2)),
                    tripCount: monthTrips.length
                },
                total: {
                    grossEarnings: parseFloat(totalGrossEarnings.toFixed(2)),
                    commission: parseFloat(totalCommission.toFixed(2)),
                    netEarnings: parseFloat(totalNetEarnings.toFixed(2)),
                    tripCount: allCompletedTrips.length
                },
                pendingSettlement: parseFloat(pendingSettlement.toFixed(2))
            }
        });

    } catch (error) {
        console.error('Earnings overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings overview',
            error: error.message
        });
    }
});

// Get Detailed Earnings History
router.get('/earnings-history', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { 
            startDate, 
            endDate, 
            page = 1, 
            limit = 20,
            type = 'all' // 'trip', 'bonus', 'deduction', 'settlement', 'all'
        } = req.query;

        // Build query for bookings
        const bookingQuery = {
            assignedDriver: driverId,
            status: 'Completed'
        };

        if (startDate || endDate) {
            bookingQuery.endTime = {};
            if (startDate) bookingQuery.endTime.$gte = new Date(startDate);
            if (endDate) bookingQuery.endTime.$lte = new Date(endDate);
        }

        // Get completed trips
        const trips = await Booking.find(bookingQuery)
            .populate('customerId', 'name phone')
            .sort({ endTime: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalTrips = await Booking.countDocuments(bookingQuery);

        // Format earnings history
        const earningsHistory = trips.map(trip => {
            const grossAmount = trip.totalAmount || 0;
            const commission = grossAmount * 0.15;
            const netAmount = grossAmount - commission;

            return {
                id: trip._id,
                type: 'trip',
                bookingId: trip.bookingId,
                customer: {
                    name: trip.customerId?.name || 'N/A',
                    phone: trip.customerId?.phone || 'N/A'
                },
                grossAmount: parseFloat(grossAmount.toFixed(2)),
                commission: parseFloat(commission.toFixed(2)),
                netAmount: parseFloat(netAmount.toFixed(2)),
                distance: trip.actualDistance || trip.distance || 0,
                duration: trip.duration || 0,
                date: trip.endTime || trip.updatedAt,
                pickup: trip.pickupLocation?.address || 'N/A',
                dropoff: trip.dropoffLocation?.address || 'N/A'
            };
        });

        // Get driver's earnings adjustments (bonuses, deductions, settlements)
        const driver = await Driver.findById(driverId).select('earningsHistory');
        let adjustments = [];
        
        if (driver.earningsHistory && driver.earningsHistory.transactions) {
            adjustments = driver.earningsHistory.transactions
                .filter(transaction => {
                    if (type !== 'all' && transaction.type !== type) return false;
                    if (startDate && transaction.date < new Date(startDate)) return false;
                    if (endDate && transaction.date > new Date(endDate)) return false;
                    return true;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice((page - 1) * limit, page * limit);
        }

        // Combine and sort all earnings data
        const allEarnings = [...earningsHistory, ...adjustments]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            earnings: allEarnings,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil((totalTrips + adjustments.length) / limit),
                totalRecords: totalTrips + adjustments.length,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Earnings history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings history',
            error: error.message
        });
    }
});

// Request Withdrawal/Settlement
router.post('/request-withdrawal', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { amount, paymentMethod, bankDetails } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid withdrawal amount is required'
            });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Calculate available balance
        const completedTrips = await Booking.find({
            assignedDriver: driverId,
            status: 'Completed'
        });

        const totalGrossEarnings = completedTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        const totalCommission = totalGrossEarnings * 0.15;
        const availableBalance = totalGrossEarnings - totalCommission - (driver.earningsHistory?.withdrawnAmount || 0);

        if (amount > availableBalance) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`
            });
        }

        // Create withdrawal request
        const withdrawalRequest = {
            id: new Date().getTime().toString(),
            amount: amount,
            paymentMethod: paymentMethod || 'bank_transfer',
            bankDetails: bankDetails || driver.bankDetails,
            status: 'Pending',
            requestDate: new Date(),
            estimatedProcessingTime: '2-3 business days'
        };

        // Initialize earnings history if not exists
        if (!driver.earningsHistory) {
            driver.earningsHistory = {
                totalEarnings: 0,
                withdrawnAmount: 0,
                pendingAmount: 0,
                transactions: [],
                withdrawalRequests: []
            };
        }

        // Add withdrawal request
        driver.earningsHistory.withdrawalRequests.push(withdrawalRequest);
        driver.earningsHistory.pendingAmount = (driver.earningsHistory.pendingAmount || 0) + amount;

        // Add transaction record
        driver.earningsHistory.transactions.push({
            id: withdrawalRequest.id,
            type: 'withdrawal_request',
            amount: amount,
            description: `Withdrawal request for ₹${amount}`,
            date: new Date(),
            status: 'Pending'
        });

        await driver.save();

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            withdrawalRequest: {
                id: withdrawalRequest.id,
                amount: withdrawalRequest.amount,
                status: withdrawalRequest.status,
                requestDate: withdrawalRequest.requestDate,
                estimatedProcessingTime: withdrawalRequest.estimatedProcessingTime
            },
            availableBalance: parseFloat((availableBalance - amount).toFixed(2))
        });

    } catch (error) {
        console.error('Request withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process withdrawal request',
            error: error.message
        });
    }
});

// Get Withdrawal History
router.get('/withdrawal-history', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;

        const driver = await Driver.findById(driverId).select('earningsHistory');
        
        if (!driver || !driver.earningsHistory || !driver.earningsHistory.withdrawalRequests) {
            return res.json({
                success: true,
                withdrawals: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalRecords: 0,
                    limit: parseInt(limit)
                }
            });
        }

        let withdrawals = driver.earningsHistory.withdrawalRequests;

        // Filter by status if provided
        if (status) {
            withdrawals = withdrawals.filter(w => w.status.toLowerCase() === status.toLowerCase());
        }

        // Sort by request date (newest first)
        withdrawals.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

        // Paginate
        const totalRecords = withdrawals.length;
        const startIndex = (page - 1) * limit;
        const paginatedWithdrawals = withdrawals.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            withdrawals: paginatedWithdrawals,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Withdrawal history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal history',
            error: error.message
        });
    }
});

// Get Payment Methods
router.get('/payment-methods', async (req, res) => {
    try {
        const driverId = req.user.id;
        
        const driver = await Driver.findById(driverId).select('bankDetails paymentMethods');
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        const paymentMethods = [
            {
                id: 'bank_transfer',
                type: 'Bank Transfer',
                isDefault: true,
                details: driver.bankDetails || {},
                processingTime: '2-3 business days',
                minimumAmount: 100
            }
        ];

        // Add UPI if available
        if (driver.paymentMethods && driver.paymentMethods.upi) {
            paymentMethods.push({
                id: 'upi',
                type: 'UPI',
                isDefault: false,
                details: driver.paymentMethods.upi,
                processingTime: 'Instant',
                minimumAmount: 50
            });
        }

        res.json({
            success: true,
            paymentMethods
        });

    } catch (error) {
        console.error('Payment methods error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment methods',
            error: error.message
        });
    }
});

// Update Payment Methods
router.put('/payment-methods', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { bankDetails, upiDetails } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Update bank details
        if (bankDetails) {
            driver.bankDetails = { ...driver.bankDetails, ...bankDetails };
        }

        // Update UPI details
        if (upiDetails) {
            if (!driver.paymentMethods) {
                driver.paymentMethods = {};
            }
            driver.paymentMethods.upi = upiDetails;
        }

        await driver.save();

        res.json({
            success: true,
            message: 'Payment methods updated successfully',
            paymentMethods: {
                bankDetails: driver.bankDetails,
                upiDetails: driver.paymentMethods?.upi
            }
        });

    } catch (error) {
        console.error('Update payment methods error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment methods',
            error: error.message
        });
    }
});

// Get Earnings Analytics
router.get('/analytics', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { period = 'month' } = req.query; // 'week', 'month', 'year'

        const now = new Date();
        let startDate, groupBy;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                groupBy = '$dayOfYear';
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                groupBy = '$month';
                break;
            default: // month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                groupBy = '$dayOfMonth';
        }

        // Get trips for the period
        const trips = await Booking.aggregate([
            {
                $match: {
                    assignedDriver: driverId,
                    status: 'Completed',
                    endTime: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        period: { [groupBy]: '$endTime' },
                        year: { $year: '$endTime' },
                        month: { $month: '$endTime' }
                    },
                    totalEarnings: { $sum: '$totalAmount' },
                    tripCount: { $sum: 1 },
                    totalDistance: { $sum: '$actualDistance' }
                }
            },
            {
                $sort: { '_id.period': 1 }
            }
        ]);

        // Calculate analytics
        const analytics = trips.map(item => ({
            period: item._id.period,
            grossEarnings: parseFloat((item.totalEarnings || 0).toFixed(2)),
            commission: parseFloat((item.totalEarnings * 0.15).toFixed(2)),
            netEarnings: parseFloat((item.totalEarnings * 0.85).toFixed(2)),
            tripCount: item.tripCount,
            totalDistance: parseFloat((item.totalDistance || 0).toFixed(2)),
            averagePerTrip: parseFloat(((item.totalEarnings || 0) / item.tripCount).toFixed(2))
        }));

        res.json({
            success: true,
            analytics: {
                period,
                data: analytics,
                summary: {
                    totalGrossEarnings: analytics.reduce((sum, a) => sum + a.grossEarnings, 0),
                    totalNetEarnings: analytics.reduce((sum, a) => sum + a.netEarnings, 0),
                    totalTrips: analytics.reduce((sum, a) => sum + a.tripCount, 0),
                    totalDistance: analytics.reduce((sum, a) => sum + a.totalDistance, 0)
                }
            }
        });

    } catch (error) {
        console.error('Earnings analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings analytics',
            error: error.message
        });
    }
});

export default router;