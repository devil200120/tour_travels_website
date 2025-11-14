const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Booking = require('./models/Booking');

async function fixCompletedTrips() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_travels', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');

        // Find all completed trips that don't have tripDetails.completedAt set
        const completedTripsWithoutCompletedAt = await Booking.find({
            status: { $in: ['Completed', 'completed'] },
            $or: [
                { 'tripDetails.completedAt': { $exists: false } },
                { 'tripDetails.completedAt': null },
                { 'tripDetails.completedAt': undefined }
            ]
        });

        console.log('🔍 Found', completedTripsWithoutCompletedAt.length, 'completed trips without completedAt field');

        let updateCount = 0;

        // Update each trip
        for (const trip of completedTripsWithoutCompletedAt) {
            console.log(`Updating trip: ${trip.bookingId}`);
            
            // Use endTime if available, otherwise use updatedAt, otherwise use createdAt
            let completedAt = trip.endTime || trip.updatedAt || trip.createdAt;
            
            // If none of these exist, use current date as fallback
            if (!completedAt) {
                completedAt = new Date();
            }

            // Initialize tripDetails if it doesn't exist
            if (!trip.tripDetails) {
                trip.tripDetails = {};
            }

            trip.tripDetails.completedAt = completedAt;
            
            // Also set endTime if it doesn't exist
            if (!trip.endTime) {
                trip.endTime = completedAt;
            }

            await trip.save();
            updateCount++;

            console.log(`✅ Updated trip ${trip.bookingId} with completedAt: ${completedAt}`);
        }

        console.log('🎉 Migration completed!');
        console.log(`📊 Updated ${updateCount} trips`);

        // Verify the fix by getting today's trips
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayCompletedTrips = await Booking.find({
            status: { $in: ['Completed', 'completed'] },
            'tripDetails.completedAt': { $gte: startOfDay, $lt: endOfDay }
        });

        console.log('🎯 Today\'s completed trips after migration:', todayCompletedTrips.length);
        
        todayCompletedTrips.forEach(trip => {
            console.log(`Today trip: ${trip.bookingId}, Completed at: ${trip.tripDetails.completedAt}, Driver: ${trip.assignedDriver}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

// Run the migration
fixCompletedTrips();