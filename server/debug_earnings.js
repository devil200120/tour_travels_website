import mongoose from 'mongoose';
import Booking from './models/Booking.js';

// Connect to MongoDB
await mongoose.connect('mongodb+srv://sahusubhan112_edmanage:40c55JPZYF56Aogf@edumanege.ojeuk2q.mongodb.net/tour_travel');

console.log('🔍 Debugging Earnings Data...\n');

// Get the driver ID from your tests
const driverId = '69160b6078e52146b84326ee';

// Get current date info
const today = new Date();
console.log('📅 Current time (server):', today);
console.log('📅 Current time (ISO):', today.toISOString());
console.log('📅 Current time (local):', today.toLocaleString());

// Calculate date ranges
const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
console.log('📅 Start of day (server):', startOfDay);
console.log('📅 Start of day (ISO):', startOfDay.toISOString());

// Get completed trips
const completedTrips = await Booking.find({
    assignedDriver: driverId,
    status: 'Completed'
}).select('bookingId totalAmount endTime completedAt createdAt updatedAt');

console.log('\n🚗 Completed Trips Analysis:');
console.log(`Total completed trips: ${completedTrips.length}`);

completedTrips.forEach((trip, index) => {
    console.log(`\nTrip ${index + 1}:`);
    console.log(`  Booking ID: ${trip.bookingId}`);
    console.log(`  Total Amount: ₹${trip.totalAmount || 0}`);
    console.log(`  Created At: ${trip.createdAt} (${trip.createdAt?.toISOString()})`);
    console.log(`  Updated At: ${trip.updatedAt} (${trip.updatedAt?.toISOString()})`);
    console.log(`  End Time: ${trip.endTime} (${trip.endTime?.toISOString()})`);
    console.log(`  Completed At: ${trip.completedAt} (${trip.completedAt?.toISOString()})`);
    
    // Check if trip should be included in today's earnings
    const completionDate = trip.completedAt || trip.endTime;
    const isToday = completionDate && completionDate >= startOfDay;
    console.log(`  📊 Included in TODAY's earnings: ${isToday ? '✅ YES' : '❌ NO'}`);
    
    if (completionDate) {
        const hoursDiff = (today - completionDate) / (1000 * 60 * 60);
        console.log(`  ⏰ Hours ago: ${hoursDiff.toFixed(2)}`);
    }
});

// Test earnings calculation
const todayTrips = completedTrips.filter(trip => {
    const completionDate = trip.completedAt || trip.endTime;
    return completionDate && completionDate >= startOfDay;
});

const todayEarnings = todayTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);

console.log('\n💰 Earnings Summary:');
console.log(`Today's trips count: ${todayTrips.length}`);
console.log(`Today's gross earnings: ₹${todayEarnings}`);
console.log(`Total trips count: ${completedTrips.length}`);
console.log(`Total gross earnings: ₹${totalEarnings}`);

await mongoose.disconnect();
console.log('\n✅ Database connection closed.');