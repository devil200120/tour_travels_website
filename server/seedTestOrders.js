import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Driver from './models/Driver.js';
import Customer from './models/Customer.js';
import Booking from './models/Booking.js';
import Package from './models/Package.js';
import VehicleCategory from './models/VehicleCategory.js';
import bcrypt from 'bcryptjs';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Sample data for seeding
const sampleCustomers = [
    {
        firstName: 'Amit',
        lastName: 'Sharma',
        name: 'Amit Sharma',
        email: 'amit.sharma@example.com',
        phone: '+919876543201',
        password: 'customer123',
        referralCode: 'REF3201AMIT',
        address: {
            street: '123 Marine Drive',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
        },
        isVerified: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        registrationSource: 'Mobile App'
    },
    {
        firstName: 'Priya',
        lastName: 'Patel',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+919876543202',
        password: 'customer123',
        referralCode: 'REF3202PRIYA',
        address: {
            street: '456 MG Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
            country: 'India'
        },
        isVerified: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        registrationSource: 'Mobile App'
    },
    {
        firstName: 'Rahul',
        lastName: 'Gupta',
        name: 'Rahul Gupta',
        email: 'rahul.gupta@example.com',
        phone: '+919876543203',
        password: 'customer123',
        referralCode: 'REF3203RAHUL',
        address: {
            street: '789 CP',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India'
        },
        isVerified: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        registrationSource: 'Web'
    }
];

const sampleDrivers = [
    {
        name: 'Rajesh Kumar Singh',
        email: 'rajesh.driver@example.com',
        phone: '+919876543210',
        password: 'driver123',
        address: {
            street: '123 Driver Colony',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            country: 'India'
        },
        dateOfBirth: new Date('1985-05-15'),
        licenseNumber: 'MH02DL987654321',
        licenseExpiry: new Date('2028-05-15'),
        licenseType: 'Light Motor Vehicle',
        experience: 10,
        emergencyContact: {
            name: 'Sunita Singh',
            phone: '+919876543212',
            relation: 'Wife'
        },
        languages: ['English', 'Hindi', 'Marathi'],
        specializations: ['City Tours', 'Airport Transfer', 'Outstation'],
        vehicleDetails: {
            make: 'Maruti Suzuki',
            model: 'Swift Dzire',
            year: 2022,
            color: 'White',
            plateNumber: 'MH02AB9876',
            fuelType: 'Petrol',
            capacity: 4
        },
        kycStatus: 'Approved',
        isActive: true,
        isAvailable: true,
        currentLocation: {
            latitude: 19.0760,
            longitude: 72.8777,
            address: 'Mumbai Central, Mumbai',
            lastUpdated: new Date()
        },
        rating: {
            average: 4.5,
            count: 150
        },
        totalTrips: 150,
        totalEarnings: 75000
    },
    {
        name: 'Suresh Yadav',
        email: 'suresh.driver@example.com',
        phone: '+919876543211',
        password: 'driver123',
        address: {
            street: '456 Driver Nagar',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400002',
            country: 'India'
        },
        dateOfBirth: new Date('1980-03-20'),
        licenseNumber: 'MH02DL123456789',
        licenseExpiry: new Date('2027-03-20'),
        licenseType: 'Light Motor Vehicle',
        experience: 15,
        emergencyContact: {
            name: 'Maya Yadav',
            phone: '+919876543213',
            relation: 'Wife'
        },
        languages: ['English', 'Hindi'],
        specializations: ['Local Trips', 'Airport Transfer'],
        vehicleDetails: {
            make: 'Toyota',
            model: 'Innova',
            year: 2021,
            color: 'Silver',
            plateNumber: 'MH02CD5678',
            fuelType: 'Diesel',
            capacity: 7
        },
        kycStatus: 'Approved',
        isActive: true,
        isAvailable: true,
        currentLocation: {
            latitude: 19.0596,
            longitude: 72.8295,
            address: 'Dadar, Mumbai',
            lastUpdated: new Date()
        },
        rating: {
            average: 4.3,
            count: 200
        },
        totalTrips: 200,
        totalEarnings: 95000
    }
];

const samplePackages = [
    {
        name: 'Mumbai Local Sightseeing',
        description: 'Full day Mumbai city tour covering major attractions including Gateway of India, Marine Drive, and Elephanta Caves. Experience the vibrant culture and heritage of Mumbai with our expert guides.',
        shortDescription: 'Full day Mumbai city tour covering major attractions',
        category: 'Cultural',
        destinations: [
            {
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                stayDuration: 1
            }
        ],
        duration: {
            days: 1,
            nights: 0
        },
        itinerary: [
            {
                day: 1,
                title: 'Mumbai Sightseeing',
                description: 'Visit Gateway of India, Marine Drive, and Elephanta Caves',
                activities: ['Gateway of India visit', 'Marine Drive walk', 'Elephanta Caves tour'],
                meals: ['Lunch'],
                transportation: 'Air-conditioned car'
            }
        ],
        pricing: {
            basePrice: 2500,
            pricePerPerson: 500
        },
        inclusions: ['Transportation', 'Guide', 'Entry Tickets', 'Lunch'],
        exclusions: ['Personal expenses', 'Shopping'],
        highlights: ['Gateway of India', 'Marine Drive sunset', 'Elephanta Caves UNESCO site'],
        availability: {
            isActive: true,
            advanceBookingDays: 1,
            maxBookingDays: 30
        },
        tags: ['Mumbai', 'Sightseeing', 'Cultural', 'Heritage']
    },
    {
        name: 'Airport Transfer',
        description: 'Comfortable and reliable airport pickup and drop service with professional drivers. Available 24/7 with meet and greet service at the terminal.',
        shortDescription: 'Comfortable airport pickup and drop service',
        category: 'Business',
        destinations: [
            {
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                stayDuration: 0
            }
        ],
        duration: {
            days: 1,
            nights: 0
        },
        itinerary: [
            {
                day: 1,
                title: 'Airport Transfer',
                description: 'Direct transfer from/to airport',
                activities: ['Airport pickup/drop'],
                meals: [],
                transportation: 'Private car'
            }
        ],
        pricing: {
            basePrice: 800,
            pricePerPerson: 0
        },
        inclusions: ['Transportation', 'Meet & Greet', 'Waiting time up to 1 hour'],
        exclusions: ['Parking charges', 'Toll charges'],
        highlights: ['24/7 availability', 'Professional drivers', 'Meet and greet service'],
        availability: {
            isActive: true,
            advanceBookingDays: 0,
            maxBookingDays: 7
        },
        tags: ['Airport', 'Transfer', 'Business', 'Reliable']
    }
];

const sampleVehicleCategories = [
    {
        name: 'Sedan',
        displayName: 'Sedan Car',
        description: 'Comfortable 4-seater cars perfect for city rides and short trips',
        seatingCapacity: 4,
        luggageCapacity: 2,
        features: [
            { name: 'AC', icon: 'ac-icon', included: true },
            { name: 'Music System', icon: 'music-icon', included: true },
            { name: 'GPS', icon: 'gps-icon', included: true }
        ],
        pricing: {
            basePrice: 500,
            perKm: 15,
            perHour: 100,
            outstationRates: {
                '0-100km': { perKm: 15, driverAllowance: 300, minimumFare: 800 },
                '100-300km': { perKm: 12, driverAllowance: 500, minimumFare: 1500 },
                '300km+': { perKm: 10, driverAllowance: 800, minimumFare: 3000 }
            },
            roundTripDiscount: 10,
            multiCityMultiplier: 1.2,
            nightChargeMultiplier: 1.25,
            peakHourMultiplier: 1.15,
            airportSurcharge: 50,
            railwaySurcharge: 30,
            cancellationCharges: {
                'before_1_hour': 0,
                'before_30_min': 50,
                'after_arrival': 100
            }
        },
        isActive: true,
        availableCities: ['Mumbai', 'Delhi', 'Bangalore'],
        inclusions: ['Fuel', 'Driver', 'Toll charges'],
        exclusions: ['Parking charges', 'State tax'],
        sortOrder: 1
    },
    {
        name: 'SUV',
        displayName: 'SUV Vehicle',
        description: 'Spacious 7-seater vehicles ideal for group travels and outstation trips',
        seatingCapacity: 7,
        luggageCapacity: 4,
        features: [
            { name: 'AC', icon: 'ac-icon', included: true },
            { name: 'Music System', icon: 'music-icon', included: true },
            { name: 'GPS', icon: 'gps-icon', included: true },
            { name: 'Extra Luggage Space', icon: 'luggage-icon', included: true }
        ],
        pricing: {
            basePrice: 800,
            perKm: 20,
            perHour: 150,
            outstationRates: {
                '0-100km': { perKm: 20, driverAllowance: 400, minimumFare: 1200 },
                '100-300km': { perKm: 17, driverAllowance: 600, minimumFare: 2000 },
                '300km+': { perKm: 15, driverAllowance: 1000, minimumFare: 4000 }
            },
            roundTripDiscount: 12,
            multiCityMultiplier: 1.3,
            nightChargeMultiplier: 1.25,
            peakHourMultiplier: 1.20,
            airportSurcharge: 100,
            railwaySurcharge: 50,
            cancellationCharges: {
                'before_1_hour': 0,
                'before_30_min': 75,
                'after_arrival': 150
            }
        },
        isActive: true,
        availableCities: ['Mumbai', 'Delhi', 'Bangalore'],
        inclusions: ['Fuel', 'Driver', 'Toll charges', 'Extra luggage space'],
        exclusions: ['Parking charges', 'State tax'],
        sortOrder: 2
    }
];

// Generate test bookings with different statuses
const generateTestBookings = (customers, drivers, packages, vehicleCategories) => {
    const bookings = [];
    const statuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
    
    // Generate bookings for the last 30 days
    for (let i = 0; i < 25; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const driver = drivers[Math.floor(Math.random() * drivers.length)];
        const package_ = packages[Math.floor(Math.random() * packages.length)];
        const vehicleCategory = vehicleCategories[Math.floor(Math.random() * vehicleCategories.length)];
        
        // Random date in the last 30 days
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 30));
        
        // Random pickup date within next 7 days from booking
        const pickupDate = new Date(bookingDate);
        pickupDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 7));
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Mumbai coordinates for realistic locations
        const mumbaiLocations = [
            { name: 'Gateway of India', lat: 18.9220, lng: 72.8347 },
            { name: 'Marine Drive', lat: 18.9439, lng: 72.8229 },
            { name: 'Bandra West', lat: 18.9750, lng: 72.8258 },
            { name: 'Andheri West', lat: 19.1358, lng: 72.8258 },
            { name: 'Powai', lat: 19.1176, lng: 72.9060 },
            { name: 'Thane', lat: 19.2183, lng: 72.9781 },
            { name: 'Navi Mumbai', lat: 19.0330, lng: 73.0297 },
            { name: 'Mumbai Central', lat: 19.0760, lng: 72.8777 }
        ];
        
        const pickup = mumbaiLocations[Math.floor(Math.random() * mumbaiLocations.length)];
        const dropoff = mumbaiLocations[Math.floor(Math.random() * mumbaiLocations.length)];
        
        // Calculate distance (rough estimate)
        const distance = Math.random() * 50 + 5; // 5-55 km
        const duration = Math.round(distance * 2); // Rough estimate: 2 mins per km
        const baseAmount = vehicleCategory.pricing.basePrice + (distance * vehicleCategory.pricing.perKm);
        const totalAmount = Math.round(baseAmount * 1.18); // Including 18% GST
        
        const passengerCount = Math.floor(Math.random() * vehicleCategory.seatingCapacity) + 1;
        const bookingType = ['Outstation Transfer', 'Package Tour', 'Local Trip', 'Airport Transfer'][Math.floor(Math.random() * 4)];
        const tripType = ['One-way', 'Round trip', 'Multi-city'][Math.floor(Math.random() * 3)];
        
        const booking = {
            bookingId: `TT${Date.now()}${i.toString().padStart(3, '0')}`,
            customer: customer._id,
            bookingType: bookingType,
            tripType: tripType,
            pickup: {
                address: pickup.name + ', Mumbai, Maharashtra, India',
                latitude: pickup.lat,
                longitude: pickup.lng,
                landmark: pickup.name,
                contactPerson: customer.firstName + ' ' + customer.lastName,
                contactPhone: customer.phone
            },
            dropoff: {
                address: dropoff.name + ', Mumbai, Maharashtra, India',
                latitude: dropoff.lat,
                longitude: dropoff.lng,
                landmark: dropoff.name
            },
            schedule: {
                startDate: pickupDate,
                endDate: tripType === 'Round trip' ? new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000) : undefined,
                startTime: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'][Math.floor(Math.random() * 6)],
                duration: duration
            },
            passengers: {
                adults: Math.max(1, passengerCount - Math.floor(Math.random() * 2)),
                children: Math.min(2, Math.floor(Math.random() * 3)),
                totalCount: passengerCount
            },
            vehiclePreference: vehicleCategory.name,
            assignedDriver: ['Confirmed', 'In Progress', 'Completed'].includes(status) ? driver._id : undefined,
            packageDetails: {
                packageId: package_._id,
                inclusions: package_.inclusions,
                exclusions: package_.exclusions
            },
            pricing: {
                basePrice: baseAmount,
                totalAmount: totalAmount
            },
            payment: {
                status: ['Pending', 'Paid', 'Refunded'][Math.floor(Math.random() * 3)],
                method: ['Cash', 'Card', 'UPI', 'Wallet'][Math.floor(Math.random() * 4)],
                advanceAmount: status === 'Confirmed' ? Math.round(totalAmount * 0.3) : 0,
                balanceAmount: status === 'Confirmed' ? Math.round(totalAmount * 0.7) : totalAmount
            },
            status: status,
            tripDetails: {
                totalDistance: Math.round(distance * 100) / 100,
                actualDistance: status === 'Completed' ? Math.round((distance + Math.random() * 5) * 100) / 100 : undefined,
                startTime: ['Confirmed', 'In Progress', 'Completed'].includes(status) ? 
                    new Date(pickupDate.getTime() + Math.random() * 60 * 60 * 1000) : undefined,
                endTime: status === 'Completed' ? 
                    new Date(pickupDate.getTime() + (duration + Math.random() * 30) * 60 * 1000) : undefined
            },
            rating: status === 'Completed' ? {
                customerRating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                customerReview: ['Great service!', 'Very punctual driver', 'Comfortable ride', 'Highly recommended'][Math.floor(Math.random() * 4)],
                driverRating: Math.floor(Math.random() * 2) + 4
            } : undefined,
            specialRequests: i % 3 === 0 ? 'Please call before arrival' : '',
            notes: i % 4 === 0 ? 'Customer prefers specific route via highway' : '',
            createdAt: bookingDate,
            updatedAt: new Date()
        };
        
        // Add driver and trip details for confirmed/completed bookings
        if (['Confirmed', 'In Progress', 'Completed'].includes(status)) {
            booking.driverId = driver._id;
            booking.assignedAt = new Date(bookingDate.getTime() + 10 * 60000); // 10 mins after booking
            
            if (status === 'In Progress' || status === 'Completed') {
                booking.startTime = new Date(pickupDate.getTime() + Math.random() * 30 * 60000); // Within 30 mins of pickup time
                booking.startLocation = {
                    coordinates: [pickup.lng + (Math.random() - 0.5) * 0.01, pickup.lat + (Math.random() - 0.5) * 0.01],
                    address: pickup.name + ' (Nearby), Mumbai'
                };
            }
            
            if (status === 'Completed') {
                booking.endTime = new Date(booking.startTime.getTime() + duration * 60000);
                booking.endLocation = {
                    coordinates: [dropoff.lng + (Math.random() - 0.5) * 0.01, dropoff.lat + (Math.random() - 0.5) * 0.01],
                    address: dropoff.name + ' (Nearby), Mumbai'
                };
                booking.actualDistance = distance + (Math.random() - 0.5) * 2; // Slight variation in actual distance
                booking.duration = Math.round((booking.endTime - booking.startTime) / 60000); // in minutes
                booking.rating = {
                    customerRating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                    driverRating: Math.floor(Math.random() * 2) + 4,
                    customerFeedback: ['Great service!', 'Very professional driver', 'Smooth ride', 'On time pickup'][Math.floor(Math.random() * 4)]
                };
            }
        }
        
        bookings.push(booking);
    }
    
    return bookings;
};

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            Customer.deleteMany({}),
            Driver.deleteMany({}),
            Booking.deleteMany({}),
            Package.deleteMany({}),
            VehicleCategory.deleteMany({})
        ]);
        
        // Hash passwords for customers and drivers
        console.log('🔐 Hashing passwords...');
        const salt = await bcrypt.genSalt(10);
        
        for (let customer of sampleCustomers) {
            customer.password = await bcrypt.hash(customer.password, salt);
        }
        
        for (let driver of sampleDrivers) {
            driver.password = await bcrypt.hash(driver.password, salt);
        }
        
        // Create customers
        console.log('👥 Creating customers...');
        const customers = await Customer.create(sampleCustomers);
        console.log(`✅ Created ${customers.length} customers`);
        
        // Create drivers
        console.log('🚗 Creating drivers...');
        const drivers = await Driver.create(sampleDrivers);
        console.log(`✅ Created ${drivers.length} drivers`);
        
        // Create packages
        console.log('📦 Creating packages...');
        const packages = await Package.insertMany(samplePackages);
        console.log(`✅ Created ${packages.length} packages`);
        
        // Create vehicle categories
        console.log('🚙 Creating vehicle categories...');
        const vehicleCategories = await VehicleCategory.insertMany(sampleVehicleCategories);
        console.log(`✅ Created ${vehicleCategories.length} vehicle categories`);
        
        // Generate and create bookings
        console.log('📋 Generating test bookings...');
        const testBookings = generateTestBookings(customers, drivers, packages, vehicleCategories);
        const bookings = await Booking.insertMany(testBookings);
        console.log(`✅ Created ${bookings.length} test bookings`);
        
        // Print summary
        console.log('\n📊 SEEDING COMPLETE!');
        console.log('==========================================');
        console.log(`👥 Customers: ${customers.length}`);
        console.log(`🚗 Drivers: ${drivers.length}`);
        console.log(`📦 Packages: ${packages.length}`);
        console.log(`🚙 Vehicle Categories: ${vehicleCategories.length}`);
        console.log(`📋 Bookings: ${bookings.length}`);
        console.log('==========================================');
        
        // Print booking status breakdown
        const statusCounts = {};
        bookings.forEach(booking => {
            statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
        });
        
        console.log('\n📈 Booking Status Breakdown:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });
        
        // Print test credentials
        console.log('\n🔑 Test Credentials:');
        console.log('==========================================');
        console.log('Driver Login:');
        console.log('  Email: rajesh.driver@example.com');
        console.log('  Password: driver123');
        console.log('');
        console.log('  Email: suresh.driver@example.com');
        console.log('  Password: driver123');
        console.log('');
        console.log('Customer Login:');
        console.log('  Email: amit.sharma@example.com');
        console.log('  Password: customer123');
        console.log('==========================================');
        
        // Print sample booking IDs
        console.log('\n📋 Sample Booking IDs for Testing:');
        console.log('==========================================');
        const pendingBookings = bookings.filter(b => b.status === 'Pending').slice(0, 3);
        const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').slice(0, 3);
        const inProgressBookings = bookings.filter(b => b.status === 'In Progress').slice(0, 3);
        
        if (pendingBookings.length > 0) {
            console.log('Pending Orders (for Accept/Reject):');
            pendingBookings.forEach(booking => {
                console.log(`  ${booking.bookingId} - ${booking.pickup.address} → ${booking.dropoff.address}`);
            });
        }
        
        if (confirmedBookings.length > 0) {
            console.log('\nConfirmed Orders (for Start Trip):');
            confirmedBookings.forEach(booking => {
                console.log(`  ${booking.bookingId} - ${booking.pickup.address} → ${booking.dropoff.address}`);
            });
        }
        
        if (inProgressBookings.length > 0) {
            console.log('\nIn Progress Orders (for Complete Trip):');
            inProgressBookings.forEach(booking => {
                console.log(`  ${booking.bookingId} - ${booking.pickup.address} → ${booking.dropoff.address}`);
            });
        }
        
        console.log('\n🎉 Database seeded successfully! You can now test the APIs.');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the seeding
connectDB().then(() => {
    seedDatabase();
});