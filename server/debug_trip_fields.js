import mongoose from 'mongoose';
import Booking from './models/Booking.js';

// Connect to MongoDB
await mongoose.connect('mongodb+srv://sahusubhan112_edmanage:40c55JPZYF56Aogf@edumanege.ojeuk2q.mongodb.net/tour_travel');

console.log('🔍 Debugging Trip Fields...\n');

// Get the driver ID
const driverId = '69160b6078e52146b84326ee';

// Get ALL completed trips with ALL fields
const completedTrips = await Booking.find({
    assignedDriver: driverId,
    status: 'Completed'
});

console.log(`📊 Found ${completedTrips.length} completed trips\n`);

completedTrips.forEach((trip, index) => {
    console.log(`=== Trip ${index + 1} ===`);
    console.log(`Booking ID: ${trip.bookingId}`);
    console.log(`Status: ${trip.status}`);
    
    // Check all possible amount fields
    console.log('💰 Amount Fields:');
    console.log(`  totalAmount: ${trip.totalAmount}`);
    console.log(`  amount: ${trip.amount}`);
    console.log(`  fare: ${trip.fare}`);
    console.log(`  cost: ${trip.cost}`);
    console.log(`  price: ${trip.price}`);
    console.log(`  finalAmount: ${trip.finalAmount}`);
    console.log(`  payableAmount: ${trip.payableAmount}`);
    
    // Check all possible date fields
    console.log('📅 Date Fields:');
    console.log(`  createdAt: ${trip.createdAt}`);
    console.log(`  updatedAt: ${trip.updatedAt}`);
    console.log(`  endTime: ${trip.endTime}`);
    console.log(`  completedAt: ${trip.completedAt}`);
    console.log(`  startTime: ${trip.startTime}`);
    console.log(`  pickupTime: ${trip.pickupTime}`);
    console.log(`  dropoffTime: ${trip.dropoffTime}`);
    
    console.log('\n');
});

// Show the complete object structure for first trip
if (completedTrips.length > 0) {
    console.log('🔍 Complete structure of first trip:');
    console.log(JSON.stringify(completedTrips[0], null, 2));
}

await mongoose.disconnect();