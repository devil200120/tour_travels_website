import express from 'express';
import Driver from '../../models/Driver.js';
import Booking from '../../models/Booking.js';
import driverAuth from '../../middleware/driverAuth.js';
const router = express.Router();

// Apply driver authentication middleware to all routes
router.use(driverAuth);

// Driver Dashboard - Today's Stats (Overview)
router.get('/overview', async (req, res) => {
    try {
        const driverId = req.user.id;
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Get driver details
        const driver = await Driver.findById(driverId).select('-password');
        
        // Today's trips
        const todayTrips = await Booking.find({
            driverId: driverId,
            createdAt: { $gte: startOfDay, $lt: endOfDay }
        });

        // Calculate today's stats
        const completedTrips = todayTrips.filter(trip => trip.status === 'Completed');
        const pendingTrips = todayTrips.filter(trip => trip.status === 'Pending');
        const confirmedTrips = todayTrips.filter(trip => trip.status === 'Confirmed');
        const cancelledTrips = todayTrips.filter(trip => trip.status === 'Cancelled');

        // Calculate today's earnings
        const todayEarnings = completedTrips.reduce((total, trip) => {
            return total + (trip.totalAmount || 0);
        }, 0);

        // Calculate today's distance
        const todayDistance = completedTrips.reduce((total, trip) => {
            return total + (trip.distance || 0);
        }, 0);

        // Calculate average rating from completed trips
        const ratedTrips = completedTrips.filter(trip => trip.rating && trip.rating > 0);
        const averageRating = ratedTrips.length > 0 
            ? ratedTrips.reduce((sum, trip) => sum + trip.rating, 0) / ratedTrips.length 
            : driver.rating?.average || 0;

        // This week's stats
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const weekTrips = await Booking.find({
            driverId: driverId,
            createdAt: { $gte: startOfWeek, $lt: endOfDay }
        });

        const weekEarnings = weekTrips
            .filter(trip => trip.status === 'Completed')
            .reduce((total, trip) => total + (trip.totalAmount || 0), 0);

        // This month's stats
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthTrips = await Booking.find({
            driverId: driverId,
            createdAt: { $gte: startOfMonth, $lt: endOfDay }
        });

        const monthEarnings = monthTrips
            .filter(trip => trip.status === 'Completed')
            .reduce((total, trip) => total + (trip.totalAmount || 0), 0);

        res.json({
            success: true,
            dashboard: {
                driver: {
                    id: driver._id,
                    name: driver.name,
                    phone: driver.phone,
                    isAvailable: driver.isAvailable,
                    kycStatus: driver.kycStatus,
                    currentLocation: driver.currentLocation,
                    profileImage: driver.profileImage
                },
                today: {
                    totalTrips: todayTrips.length,
                    completedTrips: completedTrips.length,
                    pendingTrips: pendingTrips.length,
                    confirmedTrips: confirmedTrips.length,
                    cancelledTrips: cancelledTrips.length,
                    totalEarnings: todayEarnings,
                    totalDistance: todayDistance,
                    averageRating: parseFloat(averageRating.toFixed(1))
                },
                thisWeek: {
                    totalTrips: weekTrips.length,
                    totalEarnings: weekEarnings
                },
                thisMonth: {
                    totalTrips: monthTrips.length,
                    totalEarnings: monthEarnings
                },
                overall: {
                    totalTrips: driver.totalTrips || 0,
                    totalEarnings: driver.totalEarnings || 0,
                    totalDistance: driver.totalDistance || 0,
                    rating: driver.rating || { average: 0, count: 0 }
                }
            }
        });

    } catch (error) {
        console.error('Driver dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});

// Get Driver's Today Rides
router.get('/today-rides', async (req, res) => {
    try {
        const driverId = req.user.id;
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayRides = await Booking.find({
            driverId: driverId,
            createdAt: { $gte: startOfDay, $lt: endOfDay }
        })
        .populate('customerId', 'name phone email')
        .populate('packageId', 'name duration')
        .sort({ createdAt: -1 });

        const ridesWithDetails = todayRides.map(ride => ({
            id: ride._id,
            bookingId: ride.bookingId,
            customer: {
                name: ride.customerId?.name || 'N/A',
                phone: ride.customerId?.phone || 'N/A'
            },
            package: {
                name: ride.packageId?.name || 'Custom Trip',
                duration: ride.packageId?.duration || 'N/A'
            },
            pickup: {
                address: ride.pickupLocation?.address || 'N/A',
                coordinates: ride.pickupLocation?.coordinates || null,
                time: ride.pickupTime
            },
            dropoff: {
                address: ride.dropoffLocation?.address || 'N/A',
                coordinates: ride.dropoffLocation?.coordinates || null,
                time: ride.dropoffTime
            },
            status: ride.status,
            totalAmount: ride.totalAmount || 0,
            distance: ride.distance || 0,
            duration: ride.duration || 0,
            rating: ride.rating || null,
            createdAt: ride.createdAt,
            startTime: ride.startTime,
            endTime: ride.endTime
        }));

        res.json({
            success: true,
            rides: ridesWithDetails,
            summary: {
                total: todayRides.length,
                completed: todayRides.filter(r => r.status === 'Completed').length,
                pending: todayRides.filter(r => r.status === 'Pending').length,
                confirmed: todayRides.filter(r => r.status === 'Confirmed').length,
                cancelled: todayRides.filter(r => r.status === 'Cancelled').length
            }
        });

    } catch (error) {
        console.error('Today rides error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today rides',
            error: error.message
        });
    }
});

// Get Driver's Today Earnings
router.get('/today-earnings', async (req, res) => {
    try {
        const driverId = req.user.id;
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayRides = await Booking.find({
            driverId: driverId,
            createdAt: { $gte: startOfDay, $lt: endOfDay }
        });

        const completedRides = todayRides.filter(ride => ride.status === 'Completed');
        
        const earnings = {
            totalEarnings: 0,
            commission: 0,
            netEarnings: 0,
            rideCount: completedRides.length,
            rides: []
        };

        completedRides.forEach(ride => {
            const rideAmount = ride.totalAmount || 0;
            const commissionRate = 0.15; // 15% commission
            const commissionAmount = rideAmount * commissionRate;
            const netAmount = rideAmount - commissionAmount;

            earnings.totalEarnings += rideAmount;
            earnings.commission += commissionAmount;
            earnings.netEarnings += netAmount;

            earnings.rides.push({
                id: ride._id,
                bookingId: ride.bookingId,
                amount: rideAmount,
                commission: commissionAmount,
                netAmount: netAmount,
                distance: ride.distance || 0,
                completedAt: ride.endTime || ride.updatedAt
            });
        });

        // Round to 2 decimal places
        earnings.totalEarnings = parseFloat(earnings.totalEarnings.toFixed(2));
        earnings.commission = parseFloat(earnings.commission.toFixed(2));
        earnings.netEarnings = parseFloat(earnings.netEarnings.toFixed(2));

        res.json({
            success: true,
            earnings
        });

    } catch (error) {
        console.error('Today earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today earnings',
            error: error.message
        });
    }
});

// Driver Statistics Summary
router.get('/stats-summary', async (req, res) => {
    try {
        const driverId = req.user.id;
        const driver = await Driver.findById(driverId);

        // Get all time stats
        const allTrips = await Booking.find({ driverId: driverId });
        const completedTrips = allTrips.filter(trip => trip.status === 'Completed');

        // Calculate total earnings
        const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
        
        // Calculate total distance
        const totalDistance = completedTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0);

        // Calculate average rating
        const ratedTrips = completedTrips.filter(trip => trip.rating && trip.rating > 0);
        const averageRating = ratedTrips.length > 0 
            ? ratedTrips.reduce((sum, trip) => sum + trip.rating, 0) / ratedTrips.length 
            : 0;

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentTrips = allTrips.filter(trip => trip.createdAt >= sevenDaysAgo);
        const recentEarnings = recentTrips
            .filter(trip => trip.status === 'Completed')
            .reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);

        res.json({
            success: true,
            stats: {
                totalTrips: allTrips.length,
                completedTrips: completedTrips.length,
                totalEarnings: parseFloat(totalEarnings.toFixed(2)),
                totalDistance: parseFloat(totalDistance.toFixed(2)),
                averageRating: parseFloat(averageRating.toFixed(1)),
                recentActivity: {
                    last7Days: {
                        trips: recentTrips.length,
                        earnings: parseFloat(recentEarnings.toFixed(2))
                    }
                },
                memberSince: driver.registrationDate || driver.createdAt,
                kycStatus: driver.kycStatus,
                isAvailable: driver.isAvailable
            }
        });

    } catch (error) {
        console.error('Stats summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

// Weekly Performance
router.get('/weekly-performance', async (req, res) => {
    try {
        const driverId = req.user.id;
        
        // Calculate date ranges for current week and previous week
        const now = new Date();
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
        currentWeekStart.setHours(0, 0, 0, 0);
        
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of current week (Saturday)
        currentWeekEnd.setHours(23, 59, 59, 999);
        
        const previousWeekStart = new Date(currentWeekStart);
        previousWeekStart.setDate(currentWeekStart.getDate() - 7);
        
        const previousWeekEnd = new Date(currentWeekEnd);
        previousWeekEnd.setDate(currentWeekEnd.getDate() - 7);
        
        // Get current week trips
        const currentWeekTrips = await Booking.find({
            driverId: driverId,
            status: 'Completed',
            completedAt: {
                $gte: currentWeekStart,
                $lte: currentWeekEnd
            }
        });
        
        // Get previous week trips
        const previousWeekTrips = await Booking.find({
            driverId: driverId,
            status: 'Completed',
            completedAt: {
                $gte: previousWeekStart,
                $lte: previousWeekEnd
            }
        });
        
        // Calculate current week stats
        const currentWeekStats = {
            trips: currentWeekTrips.length,
            earnings: currentWeekTrips.reduce((sum, trip) => sum + (trip.driverEarnings || trip.totalAmount || 0), 0),
            distance: currentWeekTrips.reduce((sum, trip) => sum + (trip.actualDistance || trip.distance || 0), 0),
            duration: currentWeekTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0),
            ratings: currentWeekTrips.filter(trip => trip.customerRating && trip.customerRating > 0),
            averageRating: 0
        };
        
        if (currentWeekStats.ratings.length > 0) {
            const ratingsSum = currentWeekStats.ratings.reduce((sum, trip) => sum + trip.customerRating, 0);
            currentWeekStats.averageRating = Math.round((ratingsSum / currentWeekStats.ratings.length) * 10) / 10;
        }
        
        // Calculate previous week stats
        const previousWeekStats = {
            trips: previousWeekTrips.length,
            earnings: previousWeekTrips.reduce((sum, trip) => sum + (trip.driverEarnings || trip.totalAmount || 0), 0),
            distance: previousWeekTrips.reduce((sum, trip) => sum + (trip.actualDistance || trip.distance || 0), 0),
            duration: previousWeekTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0)
        };
        
        // Calculate growth percentages
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100 * 100) / 100;
        };
        
        const growth = {
            trips: calculateGrowth(currentWeekStats.trips, previousWeekStats.trips),
            earnings: calculateGrowth(currentWeekStats.earnings, previousWeekStats.earnings),
            distance: calculateGrowth(currentWeekStats.distance, previousWeekStats.distance),
            duration: calculateGrowth(currentWeekStats.duration, previousWeekStats.duration)
        };
        
        // Calculate daily breakdown for current week
        const dailyBreakdown = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            
            const dayTrips = currentWeekTrips.filter(trip => {
                const tripDate = new Date(trip.completedAt);
                return tripDate.toDateString() === date.toDateString();
            });
            
            dailyBreakdown.push({
                date: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                trips: dayTrips.length,
                earnings: Math.round(dayTrips.reduce((sum, trip) => sum + (trip.driverEarnings || trip.totalAmount || 0), 0) * 100) / 100,
                distance: Math.round(dayTrips.reduce((sum, trip) => sum + (trip.actualDistance || trip.distance || 0), 0) * 100) / 100,
                duration: dayTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0)
            });
        }
        
        // Find best performing day
        const bestDay = dailyBreakdown.reduce((best, day) => 
            day.earnings > best.earnings ? day : best, dailyBreakdown[0]);
        
        res.json({
            success: true,
            weeklyPerformance: {
                currentWeek: {
                    period: `${currentWeekStart.toISOString().split('T')[0]} to ${currentWeekEnd.toISOString().split('T')[0]}`,
                    summary: {
                        totalTrips: currentWeekStats.trips,
                        totalEarnings: Math.round(currentWeekStats.earnings * 100) / 100,
                        totalDistance: Math.round(currentWeekStats.distance * 100) / 100,
                        totalDuration: Math.round(currentWeekStats.duration),
                        averageRating: currentWeekStats.averageRating,
                        averageEarningsPerTrip: currentWeekStats.trips > 0 ? 
                            Math.round((currentWeekStats.earnings / currentWeekStats.trips) * 100) / 100 : 0,
                        averageDistancePerTrip: currentWeekStats.trips > 0 ? 
                            Math.round((currentWeekStats.distance / currentWeekStats.trips) * 100) / 100 : 0
                    },
                    dailyBreakdown
                },
                previousWeek: {
                    period: `${previousWeekStart.toISOString().split('T')[0]} to ${previousWeekEnd.toISOString().split('T')[0]}`,
                    summary: {
                        totalTrips: previousWeekStats.trips,
                        totalEarnings: Math.round(previousWeekStats.earnings * 100) / 100,
                        totalDistance: Math.round(previousWeekStats.distance * 100) / 100,
                        totalDuration: Math.round(previousWeekStats.duration)
                    }
                },
                growth,
                insights: {
                    bestPerformingDay: bestDay,
                    workingDays: dailyBreakdown.filter(day => day.trips > 0).length,
                    consistency: Math.round((dailyBreakdown.filter(day => day.trips > 0).length / 7) * 100),
                    trend: growth.earnings >= 0 ? 'improving' : 'declining'
                }
            }
        });

    } catch (error) {
        console.error('Weekly performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weekly performance',
            error: error.message
        });
    }
});

// Monthly Analytics
router.get('/monthly-analytics', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { month, year } = req.query;
        
        // Default to current month and year if not provided
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // JavaScript months are 0-indexed
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();
        
        // Create date range for the specified month
        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
        
        // Get completed trips for the month
        const monthlyTrips = await Booking.find({
            driverId: driverId,
            status: 'Completed',
            completedAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });
        
        // Calculate monthly analytics
        const totalTrips = monthlyTrips.length;
        const totalEarnings = monthlyTrips.reduce((sum, trip) => sum + (trip.driverEarnings || trip.totalAmount || 0), 0);
        const totalDistance = monthlyTrips.reduce((sum, trip) => sum + (trip.actualDistance || trip.distance || 0), 0);
        const totalDuration = monthlyTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0);
        
        // Calculate daily breakdown
        const dailyStats = {};
        const daysInMonth = endOfMonth.getDate();
        
        // Initialize all days with zero values
        for (let day = 1; day <= daysInMonth; day++) {
            dailyStats[day] = {
                date: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                trips: 0,
                earnings: 0,
                distance: 0,
                duration: 0
            };
        }
        
        // Populate actual data
        monthlyTrips.forEach(trip => {
            if (trip.completedAt) {
                const day = trip.completedAt.getDate();
                dailyStats[day].trips += 1;
                dailyStats[day].earnings += trip.driverEarnings || trip.totalAmount || 0;
                dailyStats[day].distance += trip.actualDistance || trip.distance || 0;
                dailyStats[day].duration += trip.duration || 0;
            }
        });
        
        // Calculate weekly averages
        const weeksInMonth = Math.ceil(daysInMonth / 7);
        const weeklyAverages = {
            trips: Math.round(totalTrips / weeksInMonth * 100) / 100,
            earnings: Math.round(totalEarnings / weeksInMonth * 100) / 100,
            distance: Math.round(totalDistance / weeksInMonth * 100) / 100,
            duration: Math.round(totalDuration / weeksInMonth * 100) / 100
        };
        
        // Get average rating for the month
        const ratingsSum = monthlyTrips.reduce((sum, trip) => sum + (trip.customerRating || 0), 0);
        const ratedTrips = monthlyTrips.filter(trip => trip.customerRating && trip.customerRating > 0).length;
        const averageRating = ratedTrips > 0 ? Math.round((ratingsSum / ratedTrips) * 10) / 10 : 0;
        
        // Calculate performance metrics
        const previousMonth = targetMonth === 0 ? 11 : targetMonth - 1;
        const previousYear = targetMonth === 0 ? targetYear - 1 : targetYear;
        const prevMonthStart = new Date(previousYear, previousMonth, 1);
        const prevMonthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        
        const previousMonthTrips = await Booking.find({
            driverId: driverId,
            status: 'Completed',
            completedAt: {
                $gte: prevMonthStart,
                $lte: prevMonthEnd
            }
        });
        
        const prevMonthEarnings = previousMonthTrips.reduce((sum, trip) => sum + (trip.driverEarnings || trip.totalAmount || 0), 0);
        const earningsGrowth = prevMonthEarnings > 0 ? 
            Math.round(((totalEarnings - prevMonthEarnings) / prevMonthEarnings) * 100 * 100) / 100 : 0;
        
        const tripsGrowth = previousMonthTrips.length > 0 ? 
            Math.round(((totalTrips - previousMonthTrips.length) / previousMonthTrips.length) * 100 * 100) / 100 : 0;
        
        res.json({
            success: true,
            analytics: {
                month: targetMonth + 1,
                year: targetYear,
                monthName: new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long' }),
                summary: {
                    totalTrips,
                    totalEarnings: Math.round(totalEarnings * 100) / 100,
                    totalDistance: Math.round(totalDistance * 100) / 100,
                    totalDuration: Math.round(totalDuration),
                    averageRating,
                    averageEarningsPerTrip: totalTrips > 0 ? Math.round((totalEarnings / totalTrips) * 100) / 100 : 0,
                    averageDistancePerTrip: totalTrips > 0 ? Math.round((totalDistance / totalTrips) * 100) / 100 : 0
                },
                growth: {
                    earnings: earningsGrowth,
                    trips: tripsGrowth
                },
                weeklyAverages,
                dailyBreakdown: Object.values(dailyStats),
                performance: {
                    bestDay: Object.values(dailyStats).reduce((best, day) => 
                        day.earnings > best.earnings ? day : best, dailyStats[1]),
                    totalWorkingDays: Object.values(dailyStats).filter(day => day.trips > 0).length,
                    consistency: Math.round((Object.values(dailyStats).filter(day => day.trips > 0).length / daysInMonth) * 100)
                }
            }
        });

    } catch (error) {
        console.error('Monthly analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch monthly analytics',
            error: error.message
        });
    }
});

export default router;