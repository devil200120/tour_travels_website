import express from 'express';
import mongoose from 'mongoose';
import Package from '../../models/Package.js';
import VehicleCategory from '../../models/VehicleCategory.js';
import googleMapsService from '../../services/googleMapsService.js';

const router = express.Router();

// Helper function for place suggestions
const getPlaceSuggestions = async (query, options = {}) => {
  try {
    const fetch = (await import('node-fetch')).default;
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    if (options.latitude && options.longitude) {
      url += `&location=${options.latitude},${options.longitude}&radius=${options.radius || 50000}`;
    }
    
    if (options.types) {
      url += `&types=${options.types}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.predictions.map(p => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text,
        secondaryText: p.structured_formatting?.secondary_text,
        types: p.types
      }));
    }
    return [];
  } catch (error) {
    console.error('Place suggestions error:', error);
    return [];
  }
};

// Helper function for place details
const getPlaceDetails = async (placeId) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,address_components&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      const result = data.result;
      return {
        placeId,
        name: result.name,
        address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        addressComponents: result.address_components
      };
    }
    return null;
  } catch (error) {
    console.error('Place details error:', error);
    return null;
  }
};

// Helper function for geocoding
const getGeocode = async (address) => {
  try {
    return await googleMapsService.geocodeAddress(address);
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
};

// @route   GET /api/customer/search/places
// @desc    Search places using Google Places API
// @access  Public
router.get('/places', async (req, res) => {
  try {
    const { query, latitude, longitude, radius = 50000, types } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Use Google Maps service for place suggestions
    const suggestions = await getPlaceSuggestions(query, {
      latitude,
      longitude,
      radius,
      types
    });

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Search places error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching places'
    });
  }
});

// @route   GET /api/customer/search/places/:placeId
// @desc    Get place details
// @access  Public
router.get('/places/:placeId', async (req, res) => {
  try {
    const details = await getPlaceDetails(req.params.placeId);

    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    res.json({
      success: true,
      data: details
    });

  } catch (error) {
    console.error('Get place details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching place details'
    });
  }
});

// @route   GET /api/customer/search/geocode
// @desc    Get coordinates from address (Geocoding)
// @access  Public
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const result = await getGeocode(address);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({
      success: false,
      message: 'Error geocoding address'
    });
  }
});

// @route   GET /api/customer/search/reverse-geocode
// @desc    Get address from coordinates (Reverse Geocoding)
// @access  Public
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Use Google Maps Geocoding API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.results.length) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const result = data.results[0];

    res.json({
      success: true,
      data: {
        address: result.formatted_address,
        placeId: result.place_id,
        addressComponents: result.address_components,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });

  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reverse geocoding'
    });
  }
});

// @route   GET /api/customer/search/popular-destinations
// @desc    Get popular destinations
// @access  Public
router.get('/popular-destinations', async (req, res) => {
  try {
    const { city, limit = 10 } = req.query;

    // Mock popular destinations - in production, this would come from analytics
    const popularDestinations = [
      {
        id: 1,
        name: 'Goa',
        state: 'Goa',
        description: 'Beautiful beaches and nightlife',
        imageUrl: '/images/goa.jpg',
        distance: '500 km',
        estimatedTime: '8-10 hours',
        popularity: 95,
        tags: ['beach', 'nightlife', 'adventure']
      },
      {
        id: 2,
        name: 'Manali',
        state: 'Himachal Pradesh',
        description: 'Snow-capped mountains and adventure sports',
        imageUrl: '/images/manali.jpg',
        distance: '530 km',
        estimatedTime: '10-12 hours',
        popularity: 90,
        tags: ['mountains', 'snow', 'adventure']
      },
      {
        id: 3,
        name: 'Jaipur',
        state: 'Rajasthan',
        description: 'The Pink City with royal heritage',
        imageUrl: '/images/jaipur.jpg',
        distance: '280 km',
        estimatedTime: '4-5 hours',
        popularity: 88,
        tags: ['heritage', 'culture', 'forts']
      },
      {
        id: 4,
        name: 'Agra',
        state: 'Uttar Pradesh',
        description: 'Home of the Taj Mahal',
        imageUrl: '/images/agra.jpg',
        distance: '200 km',
        estimatedTime: '3-4 hours',
        popularity: 92,
        tags: ['heritage', 'wonder', 'history']
      },
      {
        id: 5,
        name: 'Rishikesh',
        state: 'Uttarakhand',
        description: 'Yoga capital and adventure hub',
        imageUrl: '/images/rishikesh.jpg',
        distance: '240 km',
        estimatedTime: '5-6 hours',
        popularity: 85,
        tags: ['yoga', 'adventure', 'spiritual']
      },
      {
        id: 6,
        name: 'Udaipur',
        state: 'Rajasthan',
        description: 'City of Lakes with romantic vibes',
        imageUrl: '/images/udaipur.jpg',
        distance: '660 km',
        estimatedTime: '10-12 hours',
        popularity: 82,
        tags: ['lakes', 'romantic', 'heritage']
      },
      {
        id: 7,
        name: 'Nainital',
        state: 'Uttarakhand',
        description: 'Beautiful hill station with lake',
        imageUrl: '/images/nainital.jpg',
        distance: '300 km',
        estimatedTime: '6-7 hours',
        popularity: 80,
        tags: ['hills', 'lake', 'nature']
      },
      {
        id: 8,
        name: 'Shimla',
        state: 'Himachal Pradesh',
        description: 'Queen of Hills with colonial charm',
        imageUrl: '/images/shimla.jpg',
        distance: '350 km',
        estimatedTime: '7-8 hours',
        popularity: 87,
        tags: ['hills', 'heritage', 'snow']
      }
    ];

    const destinations = popularDestinations
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: destinations
    });

  } catch (error) {
    console.error('Get popular destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular destinations'
    });
  }
});

// @route   GET /api/customer/search/packages
// @desc    Search tour packages
// @access  Public
router.get('/packages', async (req, res) => {
  try {
    const {
      query,
      destination,
      minDuration,
      maxDuration,
      minPrice,
      maxPrice,
      category,
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const filter = { isActive: true };

    // Full-text search on name and description
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { cities: { $regex: query, $options: 'i' } }
      ];
    }

    if (destination) {
      filter.cities = { $in: [new RegExp(destination, 'i')] };
    }

    if (minDuration || maxDuration) {
      filter.duration = {};
      if (minDuration) filter.duration.$gte = parseInt(minDuration);
      if (maxDuration) filter.duration.$lte = parseInt(maxDuration);
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseInt(minPrice);
      if (maxPrice) filter.basePrice.$lte = parseInt(maxPrice);
    }

    if (category) filter.category = category;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const packages = await Package.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Package.countDocuments(filter);

    res.json({
      success: true,
      data: {
        packages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalResults: total
        },
        filters: {
          appliedFilters: {
            query,
            destination,
            duration: { min: minDuration, max: maxDuration },
            price: { min: minPrice, max: maxPrice },
            category
          }
        }
      }
    });

  } catch (error) {
    console.error('Search packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching packages'
    });
  }
});

// @route   GET /api/customer/search/vehicles
// @desc    Search available vehicle categories
// @access  Public
router.get('/vehicles', async (req, res) => {
  try {
    const {
      seatingCapacity,
      priceRange,
      features,
      sortBy = 'sortOrder'
    } = req.query;

    const filter = { isActive: true };

    if (seatingCapacity) {
      filter.seatingCapacity = { $gte: parseInt(seatingCapacity) };
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filter.basePrice = { $gte: min, $lte: max };
    }

    if (features) {
      const featureList = features.split(',');
      filter.features = { $all: featureList };
    }

    const vehicles = await VehicleCategory.find(filter).sort({ [sortBy]: 1 });

    res.json({
      success: true,
      data: vehicles
    });

  } catch (error) {
    console.error('Search vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching vehicles'
    });
  }
});

// @route   GET /api/customer/search/suggestions
// @desc    Get search suggestions based on history and popular
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    const suggestions = {
      recentSearches: [
        'Delhi to Agra',
        'Mumbai to Goa',
        'Bangalore to Mysore'
      ],
      popularSearches: [
        'Weekend getaway',
        'Honeymoon packages',
        'Family trip to mountains',
        'Beach vacation'
      ],
      trendingDestinations: [
        'Goa',
        'Manali',
        'Jaipur',
        'Kashmir'
      ],
      featuredPackages: [
        'Golden Triangle Tour',
        'Kerala Backwaters',
        'Rajasthan Heritage Tour'
      ]
    };

    let data = suggestions;
    if (type !== 'all' && suggestions[type]) {
      data = suggestions[type];
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions'
    });
  }
});

// @route   GET /api/customer/search/nearby
// @desc    Get nearby places of interest
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, type = 'tourist_attraction', radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Use Google Places Nearby Search
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      return res.json({
        success: true,
        data: []
      });
    }

    const places = data.results.map(place => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      types: place.types,
      location: place.geometry.location,
      isOpen: place.opening_hours?.open_now,
      photo: place.photos?.[0]?.photo_reference
    }));

    res.json({
      success: true,
      data: places
    });

  } catch (error) {
    console.error('Get nearby places error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby places'
    });
  }
});

export default router;
