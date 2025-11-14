// Migration script to add completedAt field to completed trips
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sahusubhan112_edmanage:40c55JPZYF56Aogf@edumanege.ojeuk2q.mongodb.net/tour_travel';

// Define Booking schema (simplified)
const BookingSchema = new mongoose.Schema({
  status: String,
  endTime: Date,
  completedAt: Date,
  assignedDriver: mongoose.Schema.Types.ObjectId,
  // other fields...
}, { timestamps: true });

const Booking = mongoose.model('Booking', BookingSchema);

async function migrateCompletedTrips() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    // Find all completed trips that don't have both completedAt and endTime fields
    const completedTrips = await Booking.find({
      status: 'Completed',
      $or: [
        { completedAt: { $exists: false } },
        { endTime: { $exists: false } },
        { completedAt: null },
        { endTime: null }
      ]
    });

    console.log(`Found ${completedTrips.length} completed trips without proper completion dates`);

    if (completedTrips.length === 0) {
      console.log('No trips to migrate');
      await mongoose.disconnect();
      return;
    }

    // Update each trip to set both endTime and completedAt
    let updated = 0;
    for (const trip of completedTrips) {
      try {
        // Use updatedAt as the completion time since it's the last modification
        const completionDate = trip.updatedAt || trip.createdAt || new Date();
        
        await Booking.updateOne(
          { _id: trip._id },
          { 
            $set: { 
              completedAt: completionDate,
              endTime: completionDate
            } 
          }
        );
        updated++;
        console.log(`Updated trip ${trip._id} - completion dates set to ${completionDate}`);
      } catch (error) {
        console.error(`Error updating trip ${trip._id}:`, error.message);
      }
    }

    console.log(`Successfully updated ${updated} trips`);

    // Verify the migration
    const verifyCompleted = await Booking.countDocuments({
      status: 'Completed',
      completedAt: { $exists: true }
    });

    console.log(`Total completed trips with completedAt field: ${verifyCompleted}`);

    await mongoose.disconnect();
    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Also add a function to check current data
async function checkCurrentData() {
  try {
    console.log('Checking current data...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'Completed' });
    const completedWithCompletedAt = await Booking.countDocuments({ 
      status: 'Completed', 
      completedAt: { $exists: true } 
    });
    const completedWithEndTime = await Booking.countDocuments({ 
      status: 'Completed', 
      endTime: { $exists: true } 
    });

    console.log('\n=== Current Data Summary ===');
    console.log(`Total Bookings: ${totalBookings}`);
    console.log(`Completed Bookings: ${completedBookings}`);
    console.log(`Completed with endTime: ${completedWithEndTime}`);
    console.log(`Completed with completedAt: ${completedWithCompletedAt}`);

    // Get sample data
    const sampleTrips = await Booking.find({ status: 'Completed' })
      .limit(3)
      .select('status endTime completedAt createdAt updatedAt assignedDriver')
      .lean();

    console.log('\n=== Sample Completed Trips ===');
    sampleTrips.forEach((trip, index) => {
      console.log(`Trip ${index + 1}:`);
      console.log(`  ID: ${trip._id}`);
      console.log(`  Status: ${trip.status}`);
      console.log(`  Created: ${trip.createdAt}`);
      console.log(`  Updated: ${trip.updatedAt}`);
      console.log(`  End Time: ${trip.endTime}`);
      console.log(`  Completed At: ${trip.completedAt}`);
      console.log(`  Driver: ${trip.assignedDriver}`);
      console.log('---');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Data check failed:', error);
    await mongoose.disconnect();
  }
}

// Run based on command line argument
const action = process.argv[2];

if (action === 'check') {
  checkCurrentData();
} else if (action === 'migrate') {
  migrateCompletedTrips();
} else {
  console.log('Usage:');
  console.log('  node migrate_completed_trips.js check    - Check current data');
  console.log('  node migrate_completed_trips.js migrate  - Run migration');
}