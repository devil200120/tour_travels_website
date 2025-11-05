import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VehicleCategory from '../models/VehicleCategory.js';
import Package from '../models/Package.js';

dotenv.config();

const seedCustomerData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_travels_admin');
    console.log('Connected to MongoDB');

    // Clear existing data
    await VehicleCategory.deleteMany({});
    await Package.deleteMany({});

    // Vehicle Categories
    const vehicleCategories = [
      {
        name: 'Mini',
        displayName: 'Mini',
        description: 'Compact cars for city rides',
        image: '/images/vehicles/mini.jpg',
        seatingCapacity: 4,
        luggageCapacity: 2,
        features: [
          { name: 'Air Conditioning', icon: 'ac', included: true },
          { name: 'Music System', icon: 'music', included: true },
          { name: 'GPS Navigation', icon: 'gps', included: true }
        ],
        pricing: {
          basePrice: 300,
          perKm: 12,
          perHour: 150,
          outstationRates: {
            '0-100km': { perKm: 10, driverAllowance: 300, minimumFare: 1000 },
            '100-300km': { perKm: 9, driverAllowance: 500, minimumFare: 2500 },
            '300km+': { perKm: 8, driverAllowance: 800, minimumFare: 5000 }
          },
          roundTripDiscount: 10,
          multiCityMultiplier: 1.2,
          nightChargeMultiplier: 1.25,
          peakHourMultiplier: 1.15,
          cancellationCharges: {
            'before_1_hour': 0,
            'before_30_min': 50,
            'after_arrival': 100
          }
        },
        isActive: true,
        availableCities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'],
        sortOrder: 1
      },
      {
        name: 'Sedan',
        displayName: 'Sedan',
        description: 'Comfortable sedans for longer trips',
        image: '/images/vehicles/sedan.jpg',
        seatingCapacity: 4,
        luggageCapacity: 3,
        features: [
          { name: 'Air Conditioning', icon: 'ac', included: true },
          { name: 'Music System', icon: 'music', included: true },
          { name: 'GPS Navigation', icon: 'gps', included: true },
          { name: 'Phone Charger', icon: 'charger', included: true }
        ],
        pricing: {
          basePrice: 500,
          perKm: 15,
          perHour: 200,
          outstationRates: {
            '0-100km': { perKm: 13, driverAllowance: 400, minimumFare: 1500 },
            '100-300km': { perKm: 12, driverAllowance: 600, minimumFare: 3000 },
            '300km+': { perKm: 11, driverAllowance: 1000, minimumFare: 6000 }
          },
          roundTripDiscount: 10,
          multiCityMultiplier: 1.2,
          nightChargeMultiplier: 1.25,
          peakHourMultiplier: 1.15,
          cancellationCharges: {
            'before_1_hour': 0,
            'before_30_min': 75,
            'after_arrival': 150
          }
        },
        isActive: true,
        availableCities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad'],
        sortOrder: 2
      },
      {
        name: 'SUV',
        displayName: 'SUV',
        description: 'Spacious SUVs for families and groups',
        image: '/images/vehicles/suv.jpg',
        seatingCapacity: 7,
        luggageCapacity: 5,
        features: [
          { name: 'Air Conditioning', icon: 'ac', included: true },
          { name: 'Music System', icon: 'music', included: true },
          { name: 'GPS Navigation', icon: 'gps', included: true },
          { name: 'Phone Charger', icon: 'charger', included: true },
          { name: 'Extra Legroom', icon: 'legroom', included: true }
        ],
        pricing: {
          basePrice: 800,
          perKm: 20,
          perHour: 300,
          outstationRates: {
            '0-100km': { perKm: 18, driverAllowance: 500, minimumFare: 2000 },
            '100-300km': { perKm: 16, driverAllowance: 800, minimumFare: 4000 },
            '300km+': { perKm: 15, driverAllowance: 1200, minimumFare: 8000 }
          },
          roundTripDiscount: 12,
          multiCityMultiplier: 1.3,
          nightChargeMultiplier: 1.25,
          peakHourMultiplier: 1.15,
          cancellationCharges: {
            'before_1_hour': 0,
            'before_30_min': 100,
            'after_arrival': 200
          }
        },
        isActive: true,
        availableCities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Goa'],
        sortOrder: 3
      },
      {
        name: 'Luxury',
        displayName: 'Luxury',
        description: 'Premium luxury cars for special occasions',
        image: '/images/vehicles/luxury.jpg',
        seatingCapacity: 4,
        luggageCapacity: 3,
        features: [
          { name: 'Climate Control', icon: 'climate', included: true },
          { name: 'Premium Sound System', icon: 'premium-audio', included: true },
          { name: 'GPS Navigation', icon: 'gps', included: true },
          { name: 'Phone Charger', icon: 'charger', included: true },
          { name: 'Leather Seats', icon: 'leather', included: true },
          { name: 'Wi-Fi', icon: 'wifi', included: true }
        ],
        pricing: {
          basePrice: 1500,
          perKm: 35,
          perHour: 500,
          outstationRates: {
            '0-100km': { perKm: 30, driverAllowance: 800, minimumFare: 3500 },
            '100-300km': { perKm: 28, driverAllowance: 1200, minimumFare: 7000 },
            '300km+': { perKm: 25, driverAllowance: 1800, minimumFare: 12000 }
          },
          roundTripDiscount: 15,
          multiCityMultiplier: 1.4,
          nightChargeMultiplier: 1.3,
          peakHourMultiplier: 1.2,
          cancellationCharges: {
            'before_1_hour': 0,
            'before_30_min': 200,
            'after_arrival': 500
          }
        },
        isActive: true,
        availableCities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'],
        sortOrder: 4
      },
      {
        name: 'Tempo Traveller',
        displayName: 'Tempo Traveller',
        description: 'Large vehicles for group travel',
        image: '/images/vehicles/tempo.jpg',
        seatingCapacity: 12,
        luggageCapacity: 10,
        features: [
          { name: 'Air Conditioning', icon: 'ac', included: true },
          { name: 'Music System', icon: 'music', included: true },
          { name: 'GPS Navigation', icon: 'gps', included: true },
          { name: 'Phone Charger', icon: 'charger', included: true },
          { name: 'Reading Lights', icon: 'lights', included: true }
        ],
        pricing: {
          basePrice: 2000,
          perKm: 25,
          perHour: 400,
          outstationRates: {
            '0-100km': { perKm: 22, driverAllowance: 600, minimumFare: 3000 },
            '100-300km': { perKm: 20, driverAllowance: 1000, minimumFare: 6000 },
            '300km+': { perKm: 18, driverAllowance: 1500, minimumFare: 10000 }
          },
          roundTripDiscount: 15,
          multiCityMultiplier: 1.3,
          nightChargeMultiplier: 1.25,
          peakHourMultiplier: 1.15,
          cancellationCharges: {
            'before_1_hour': 0,
            'before_30_min': 300,
            'after_arrival': 600
          }
        },
        isActive: true,
        availableCities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Goa'],
        sortOrder: 5
      }
    ];

    await VehicleCategory.insertMany(vehicleCategories);
    console.log('Vehicle categories seeded successfully');

    // Package Tours
    const packages = [
      {
        name: 'Golden Triangle Tour',
        shortDescription: 'Delhi, Agra, Jaipur - 3 Days',
        longDescription: 'Experience the magnificent Golden Triangle covering Delhi, Agra, and Jaipur. Visit iconic monuments like Taj Mahal, Red Fort, and Hawa Mahal.',
        images: [
          '/images/packages/golden-triangle-1.jpg',
          '/images/packages/golden-triangle-2.jpg',
          '/images/packages/golden-triangle-3.jpg'
        ],
        duration: 3,
        cities: ['Delhi', 'Agra', 'Jaipur'],
        category: 'Heritage',
        difficulty: 'Easy',
        basePrice: 15000,
        discountedPrice: 12000,
        groupSize: { min: 2, max: 8 },
        itinerary: [
          {
            day: 1,
            title: 'Delhi Sightseeing',
            description: 'Visit Red Fort, Jama Masjid, India Gate, and Lotus Temple',
            activities: ['Red Fort', 'Jama Masjid', 'India Gate', 'Lotus Temple'],
            meals: ['Lunch', 'Dinner'],
            accommodation: 'Hotel in Delhi'
          },
          {
            day: 2,
            title: 'Delhi to Agra',
            description: 'Travel to Agra and visit the magnificent Taj Mahal',
            activities: ['Taj Mahal', 'Agra Fort', 'Mehtab Bagh'],
            meals: ['Breakfast', 'Lunch', 'Dinner'],
            accommodation: 'Hotel in Agra'
          },
          {
            day: 3,
            title: 'Agra to Jaipur',
            description: 'Visit Fatehpur Sikri en route to Jaipur, evening at leisure',
            activities: ['Fatehpur Sikri', 'Jaipur arrival', 'Local markets'],
            meals: ['Breakfast', 'Lunch'],
            accommodation: 'Hotel in Jaipur'
          }
        ],
        inclusions: [
          'AC Transportation',
          'Hotel accommodation',
          'Daily breakfast',
          'Professional guide',
          'All entrance fees'
        ],
        exclusions: [
          'Lunch and dinner (except mentioned)',
          'Personal expenses',
          'Tips and gratuities',
          'Travel insurance'
        ],
        highlights: [
          'Witness sunrise at Taj Mahal',
          'Explore Delhi\'s rich history',
          'Visit UNESCO World Heritage sites',
          'Professional photography assistance'
        ],
        isActive: true,
        featured: true,
        popularity: 95,
        rating: 4.8,
        reviewCount: 245,
        tags: ['Heritage', 'Culture', 'Photography', 'History']
      },
      {
        name: 'Goa Beach Paradise',
        shortDescription: 'North & South Goa - 4 Days',
        longDescription: 'Relax on pristine beaches, enjoy water sports, and experience the vibrant nightlife of Goa.',
        images: [
          '/images/packages/goa-1.jpg',
          '/images/packages/goa-2.jpg',
          '/images/packages/goa-3.jpg'
        ],
        duration: 4,
        cities: ['Goa'],
        category: 'Beach',
        difficulty: 'Easy',
        basePrice: 18000,
        discountedPrice: 14400,
        groupSize: { min: 2, max: 6 },
        itinerary: [
          {
            day: 1,
            title: 'Arrival in Goa',
            description: 'Check-in and relax at the beach resort',
            activities: ['Airport pickup', 'Hotel check-in', 'Beach walk', 'Welcome dinner'],
            meals: ['Dinner'],
            accommodation: 'Beach Resort'
          },
          {
            day: 2,
            title: 'North Goa Exploration',
            description: 'Visit famous beaches and forts in North Goa',
            activities: ['Calangute Beach', 'Baga Beach', 'Aguada Fort', 'Anjuna Market'],
            meals: ['Breakfast', 'Lunch'],
            accommodation: 'Beach Resort'
          },
          {
            day: 3,
            title: 'South Goa Tour',
            description: 'Explore the serene beaches of South Goa',
            activities: ['Colva Beach', 'Palolem Beach', 'Basilica of Bom Jesus', 'Spice plantation'],
            meals: ['Breakfast', 'Lunch'],
            accommodation: 'Beach Resort'
          },
          {
            day: 4,
            title: 'Water Sports & Departure',
            description: 'Enjoy water sports before departure',
            activities: ['Parasailing', 'Jet skiing', 'Banana boat ride', 'Departure'],
            meals: ['Breakfast'],
            accommodation: null
          }
        ],
        inclusions: [
          'AC Transportation',
          'Beach resort accommodation',
          'Daily breakfast',
          'Water sports activities',
          'Airport transfers'
        ],
        exclusions: [
          'Lunch and dinner (except mentioned)',
          'Alcoholic beverages',
          'Personal expenses',
          'Travel insurance'
        ],
        highlights: [
          'Stay at beachfront resort',
          'Multiple water sports included',
          'Visit historic churches and forts',
          'Experience Goan nightlife'
        ],
        isActive: true,
        featured: true,
        popularity: 88,
        rating: 4.6,
        reviewCount: 189,
        tags: ['Beach', 'Water Sports', 'Relaxation', 'Nightlife']
      },
      {
        name: 'Kerala Backwaters',
        shortDescription: 'Alleppey & Kumarakom - 3 Days',
        longDescription: 'Experience the serene backwaters of Kerala with houseboat stays and traditional cuisine.',
        images: [
          '/images/packages/kerala-1.jpg',
          '/images/packages/kerala-2.jpg',
          '/images/packages/kerala-3.jpg'
        ],
        duration: 3,
        cities: ['Alleppey', 'Kumarakom'],
        category: 'Nature',
        difficulty: 'Easy',
        basePrice: 22000,
        discountedPrice: 18000,
        groupSize: { min: 2, max: 4 },
        itinerary: [
          {
            day: 1,
            title: 'Arrival in Alleppey',
            description: 'Board traditional houseboat and cruise through backwaters',
            activities: ['Houseboat boarding', 'Backwater cruise', 'Village visits', 'Sunset viewing'],
            meals: ['Lunch', 'Dinner'],
            accommodation: 'Houseboat'
          },
          {
            day: 2,
            title: 'Kumarakom Bird Sanctuary',
            description: 'Visit bird sanctuary and enjoy nature walks',
            activities: ['Bird watching', 'Nature walks', 'Fishing', 'Ayurvedic massage'],
            meals: ['Breakfast', 'Lunch', 'Dinner'],
            accommodation: 'Lake Resort'
          },
          {
            day: 3,
            title: 'Cultural Experience',
            description: 'Experience local culture and traditions',
            activities: ['Kathakali performance', 'Spice garden visit', 'Local market', 'Departure'],
            meals: ['Breakfast', 'Lunch'],
            accommodation: null
          }
        ],
        inclusions: [
          'Houseboat accommodation',
          'Resort accommodation',
          'All meals during houseboat stay',
          'Cultural performances',
          'Transportation'
        ],
        exclusions: [
          'Personal expenses',
          'Tips for crew',
          'Travel insurance',
          'Extra activities'
        ],
        highlights: [
          'Traditional houseboat experience',
          'Bird watching at Kumarakom',
          'Authentic Kerala cuisine',
          'Ayurvedic treatments'
        ],
        isActive: true,
        featured: false,
        popularity: 82,
        rating: 4.7,
        reviewCount: 156,
        tags: ['Nature', 'Backwaters', 'Culture', 'Relaxation']
      },
      {
        name: 'Rajasthan Royal Tour',
        shortDescription: 'Jaipur, Jodhpur, Udaipur - 5 Days',
        longDescription: 'Explore the royal heritage of Rajasthan with majestic palaces, forts, and desert experiences.',
        images: [
          '/images/packages/rajasthan-1.jpg',
          '/images/packages/rajasthan-2.jpg',
          '/images/packages/rajasthan-3.jpg'
        ],
        duration: 5,
        cities: ['Jaipur', 'Jodhpur', 'Udaipur'],
        category: 'Heritage',
        difficulty: 'Moderate',
        basePrice: 28000,
        discountedPrice: 24000,
        groupSize: { min: 2, max: 10 },
        itinerary: [
          {
            day: 1,
            title: 'Jaipur - The Pink City',
            description: 'Explore the royal palaces and forts of Jaipur',
            activities: ['Amber Fort', 'City Palace', 'Hawa Mahal', 'Jantar Mantar'],
            meals: ['Lunch', 'Dinner'],
            accommodation: 'Heritage Hotel'
          },
          {
            day: 2,
            title: 'Jaipur to Jodhpur',
            description: 'Travel to the Blue City of Jodhpur',
            activities: ['Mehrangarh Fort', 'Jaswant Thada', 'Blue city walk', 'Local markets'],
            meals: ['Breakfast', 'Lunch', 'Dinner'],
            accommodation: 'Palace Hotel'
          },
          {
            day: 3,
            title: 'Jodhpur Exploration',
            description: 'Explore more of Jodhpur and surrounding areas',
            activities: ['Umaid Bhawan Palace', 'Mandore Gardens', 'Village safari', 'Sunset at fort'],
            meals: ['Breakfast', 'Lunch', 'Dinner'],
            accommodation: 'Palace Hotel'
          },
          {
            day: 4,
            title: 'Jodhpur to Udaipur',
            description: 'Travel to the City of Lakes',
            activities: ['City Palace Udaipur', 'Lake Pichola boat ride', 'Jagdish Temple'],
            meals: ['Breakfast', 'Lunch', 'Dinner'],
            accommodation: 'Lake Palace Hotel'
          },
          {
            day: 5,
            title: 'Udaipur & Departure',
            description: 'Final exploration and departure',
            activities: ['Saheliyon ki Bari', 'Fateh Sagar Lake', 'Shopping', 'Departure'],
            meals: ['Breakfast', 'Lunch'],
            accommodation: null
          }
        ],
        inclusions: [
          'AC Transportation',
          'Heritage hotel stays',
          'All meals',
          'Professional guide',
          'All entrance fees',
          'Cultural performances'
        ],
        exclusions: [
          'Personal expenses',
          'Tips and gratuities',
          'Travel insurance',
          'Camera fees at monuments'
        ],
        highlights: [
          'Stay in heritage palaces',
          'Witness royal architecture',
          'Boat ride on Lake Pichola',
          'Traditional Rajasthani cuisine'
        ],
        isActive: true,
        featured: true,
        popularity: 91,
        rating: 4.9,
        reviewCount: 298,
        tags: ['Heritage', 'Royal', 'Architecture', 'Culture']
      }
    ];

    await Package.insertMany(packages);
    console.log('Package tours seeded successfully');

    console.log('Customer data seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding customer data:', error);
    process.exit(1);
  }
};

seedCustomerData();