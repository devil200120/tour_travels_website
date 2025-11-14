import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sai_cabz_db');

async function addCompletedAtField() {
    try {
        console.log('🔄 Starting migration to add completedAt field...');
        
        // Find all completed trips that don't have completedAt field
        const completedTripsWithoutCompletedAt = await Booking.find({
            status: 'Completed',
            completedAt: { $exists: false }
        });
        
        console.log(`📊 Found ${completedTripsWithoutCompletedAt.length} completed trips without completedAt field`);
        
        let updatedCount = 0;
        
        for (const trip of completedTripsWithoutCompletedAt) {
            // Set completedAt to endTime if available, otherwise use updatedAt
            const completedAt = trip.endTime || trip.updatedAt;
            
            await Booking.updateOne(
                { _id: trip._id },
                { $set: { completedAt: completedAt } }
            );
            
            updatedCount++;
            
            if (updatedCount % 10 === 0) {
                console.log(`✅ Updated ${updatedCount} trips...`);
            }
        }
        
        console.log(`🎉 Migration completed! Updated ${updatedCount} completed trips with completedAt field.`);
        
        // Verify the migration
        const tripsWithCompletedAt = await Booking.countDocuments({
            status: 'Completed',
            completedAt: { $exists: true }
        });
        
        console.log(`📈 Total completed trips with completedAt field: ${tripsWithCompletedAt}`);
        
        mongoose.connection.close();
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}

addCompletedAtField();