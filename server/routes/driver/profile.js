import express from 'express';
import Driver from '../../models/Driver.js';
import driverAuth from '../../middleware/driverAuth.js';
import googleMapsService from '../../services/googleMapsService.js';
const router = express.Router();

// Apply driver authentication middleware to all routes
router.use(driverAuth);

// Get Driver Profile
router.get('/profile', async (req, res) => {
    try {
        const driverId = req.user.id;
        
        const driver = await Driver.findById(driverId).select('-password -resetPasswordToken -resetPasswordExpires');
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver profile not found'
            });
        }

        res.json({
            success: true,
            profile: driver
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
});

// Update Driver Profile
router.put('/profile', async (req, res) => {
    try {
        const driverId = req.user.id;
        const {
            personalInfo,
            contactInfo,
            address,
            emergencyContact,
            preferences,
            bankDetails,
            vehicleDetails
        } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Update personal information
        if (personalInfo) {
            if (personalInfo.name) driver.name = personalInfo.name;
            if (personalInfo.dateOfBirth) driver.dateOfBirth = personalInfo.dateOfBirth;
            if (personalInfo.alternatePhone) driver.alternatePhone = personalInfo.alternatePhone;
        }

        // Update contact information
        if (contactInfo) {
            if (contactInfo.email) {
                // Check if email is already taken by another driver
                const existingDriver = await Driver.findOne({
                    email: contactInfo.email,
                    _id: { $ne: driverId }
                });
                if (existingDriver) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email is already registered with another driver'
                    });
                }
                driver.email = contactInfo.email;
            }
            if (contactInfo.phone) {
                // Check if phone is already taken by another driver
                const existingDriver = await Driver.findOne({
                    phone: contactInfo.phone,
                    _id: { $ne: driverId }
                });
                if (existingDriver) {
                    return res.status(400).json({
                        success: false,
                        message: 'Phone number is already registered with another driver'
                    });
                }
                driver.phone = contactInfo.phone;
            }
        }

        // Update address
        if (address) {
            driver.address = { ...driver.address, ...address };
        }

        // Update emergency contact
        if (emergencyContact) {
            driver.emergencyContact = { ...driver.emergencyContact, ...emergencyContact };
        }

        // Update preferences
        if (preferences) {
            if (preferences.languages) driver.languages = preferences.languages;
            if (preferences.specializations) driver.specializations = preferences.specializations;
            if (preferences.workingHours) {
                driver.workingHours = { ...driver.workingHours, ...preferences.workingHours };
            }
            if (preferences.preferences) {
                driver.preferences = { ...driver.preferences, ...preferences.preferences };
            }
        }

        // Update bank details
        if (bankDetails) {
            driver.bankDetails = { ...driver.bankDetails, ...bankDetails };
        }

        // Update vehicle details
        if (vehicleDetails) {
            driver.vehicleDetails = { ...driver.vehicleDetails, ...vehicleDetails };
        }

        await driver.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                address: driver.address,
                emergencyContact: driver.emergencyContact,
                workingHours: driver.workingHours,
                preferences: driver.preferences,
                bankDetails: driver.bankDetails,
                vehicleDetails: driver.vehicleDetails
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});

// Update Driver Availability
router.put('/availability', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { isAvailable, reason } = req.body;

        if (typeof isAvailable !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isAvailable must be a boolean value'
            });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if driver has an active booking
        if (driver.currentBookingId && isAvailable === false) {
            return res.status(400).json({
                success: false,
                message: 'Cannot go offline while having an active booking'
            });
        }

        driver.isAvailable = isAvailable;
        driver.availabilityReason = reason || (isAvailable ? 'Driver is available' : 'Driver is offline');
        driver.lastSeenDate = new Date();

        await driver.save();

        res.json({
            success: true,
            message: `Driver is now ${isAvailable ? 'available' : 'unavailable'}`,
            availability: {
                isAvailable: driver.isAvailable,
                reason: driver.availabilityReason,
                lastSeen: driver.lastSeenDate
            }
        });

    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update availability',
            error: error.message
        });
    }
});

// Update Driver Location with Google Maps Integration
router.put('/location', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { latitude, longitude, address, accuracy } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Get address from Google Maps if not provided
        let finalAddress = address;
        if (!address) {
            try {
                const reverseGeocodeResult = await googleMapsService.reverseGeocode(latitude, longitude);
                finalAddress = reverseGeocodeResult.formatted_address;
            } catch (mapsError) {
                console.warn('Google Maps reverse geocoding failed:', mapsError.message);
                finalAddress = 'Location not specified';
            }
        }

        driver.currentLocation = {
            type: 'Point',
            coordinates: [longitude, latitude],
            address: finalAddress,
            lastUpdated: new Date(),
            accuracy: accuracy || 0
        };

        await driver.save();

        res.json({
            success: true,
            message: 'Location updated successfully',
            location: driver.currentLocation,
            addressFromMaps: !address && finalAddress !== 'Location not specified'
        });

    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }
});

// Update Working Hours
router.put('/working-hours', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { start, end, daysOff } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        if (!driver.workingHours) {
            driver.workingHours = {};
        }

        if (start) driver.workingHours.start = start;
        if (end) driver.workingHours.end = end;
        if (daysOff) driver.workingHours.daysOff = daysOff;

        await driver.save();

        res.json({
            success: true,
            message: 'Working hours updated successfully',
            workingHours: driver.workingHours
        });

    } catch (error) {
        console.error('Update working hours error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update working hours',
            error: error.message
        });
    }
});

// Update Driver Preferences
router.put('/preferences', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { 
            maxRadius, 
            autoAcceptBookings, 
            notifications,
            preferredVehicleTypes,
            minimumFare
        } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        if (!driver.preferences) {
            driver.preferences = {};
        }

        if (maxRadius !== undefined) driver.preferences.maxRadius = maxRadius;
        if (autoAcceptBookings !== undefined) driver.preferences.autoAcceptBookings = autoAcceptBookings;
        if (notifications) {
            driver.preferences.notifications = { ...driver.preferences.notifications, ...notifications };
        }
        if (preferredVehicleTypes) driver.preferences.preferredVehicleTypes = preferredVehicleTypes;
        if (minimumFare !== undefined) driver.preferences.minimumFare = minimumFare;

        await driver.save();

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences: driver.preferences
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences',
            error: error.message
        });
    }
});

// Upload Profile Image
router.put('/profile-image', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { imageUrl, imageData } = req.body;

        if (!imageUrl && !imageData) {
            return res.status(400).json({
                success: false,
                message: 'Image URL or image data is required'
            });
        }

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // In production, you would upload the image to a cloud storage service
        // For now, we'll just store the URL
        driver.profileImage = imageUrl || `data:image/jpeg;base64,${imageData}`;

        await driver.save();

        res.json({
            success: true,
            message: 'Profile image updated successfully',
            profileImage: driver.profileImage
        });

    } catch (error) {
        console.error('Upload profile image error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile image',
            error: error.message
        });
    }
});

// Get Driver Settings
router.get('/settings', async (req, res) => {
    try {
        const driverId = req.user.id;
        
        const driver = await Driver.findById(driverId).select('preferences workingHours isAvailable kycStatus');
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        res.json({
            success: true,
            settings: {
                availability: {
                    isAvailable: driver.isAvailable,
                    workingHours: driver.workingHours || {}
                },
                preferences: driver.preferences || {},
                account: {
                    kycStatus: driver.kycStatus,
                    isActive: driver.isActive
                }
            }
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings',
            error: error.message
        });
    }
});

// Update Driver Settings
router.put('/settings', async (req, res) => {
    try {
        const driverId = req.user.id;
        const { preferences, workingHours, isAvailable } = req.body;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Update preferences
        if (preferences) {
            driver.preferences = { ...driver.preferences, ...preferences };
        }

        // Update working hours
        if (workingHours) {
            driver.workingHours = { ...driver.workingHours, ...workingHours };
        }

        // Update availability
        if (typeof isAvailable === 'boolean') {
            driver.isAvailable = isAvailable;
        }

        await driver.save();

        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: {
                preferences: driver.preferences,
                workingHours: driver.workingHours,
                isAvailable: driver.isAvailable
            }
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
});

// Find Nearby Drivers using Google Maps
router.get('/nearby-drivers', async (req, res) => {
    try {
        const { latitude, longitude, radius = 10, limit = 20 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Find drivers within a geographic area first (basic geo query)
        const nearbyDrivers = await Driver.find({
            isAvailable: true,
            status: 'approved',
            'currentLocation.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: radius * 1000 // Convert km to meters
                }
            }
        }).limit(parseInt(limit));

        // Enhanced with Google Maps distance calculation
        const driversWithDistance = await Promise.all(
            nearbyDrivers.map(async (driver) => {
                try {
                    const distanceData = await googleMapsService.calculateDistance(
                        {
                            latitude: parseFloat(latitude),
                            longitude: parseFloat(longitude)
                        },
                        {
                            latitude: driver.currentLocation.coordinates[1],
                            longitude: driver.currentLocation.coordinates[0]
                        },
                        'driving'
                    );

                    return {
                        driverId: driver._id,
                        name: driver.name,
                        phone: driver.phone,
                        vehicleInfo: {
                            type: driver.vehicleInfo?.type,
                            model: driver.vehicleInfo?.model,
                            plateNumber: driver.vehicleInfo?.plateNumber
                        },
                        currentLocation: driver.currentLocation,
                        rating: driver.rating,
                        totalTrips: driver.totalTrips,
                        distance: distanceData.distance,
                        estimatedArrival: distanceData.duration,
                        estimatedArrivalWithTraffic: distanceData.duration_in_traffic
                    };
                } catch (mapsError) {
                    console.warn(`Distance calculation failed for driver ${driver._id}:`, mapsError.message);
                    
                    // Fallback to basic calculation
                    const basicDistance = calculateBasicDistance(
                        parseFloat(latitude),
                        parseFloat(longitude),
                        driver.currentLocation.coordinates[1],
                        driver.currentLocation.coordinates[0]
                    );

                    return {
                        driverId: driver._id,
                        name: driver.name,
                        phone: driver.phone,
                        vehicleInfo: {
                            type: driver.vehicleInfo?.type,
                            model: driver.vehicleInfo?.model,
                            plateNumber: driver.vehicleInfo?.plateNumber
                        },
                        currentLocation: driver.currentLocation,
                        rating: driver.rating,
                        totalTrips: driver.totalTrips,
                        distance: {
                            text: `${basicDistance.toFixed(2)} km`,
                            value: basicDistance
                        },
                        estimatedArrival: {
                            text: `${Math.round(basicDistance / 40 * 60)} mins`,
                            value: basicDistance / 40 * 60
                        },
                        fallbackCalculation: true
                    };
                }
            })
        );

        // Sort by distance
        driversWithDistance.sort((a, b) => a.distance.value - b.distance.value);

        res.json({
            success: true,
            nearbyDrivers: driversWithDistance,
            searchCenter: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            searchRadius: parseFloat(radius),
            totalFound: driversWithDistance.length
        });

    } catch (error) {
        console.error('Nearby drivers search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find nearby drivers',
            error: error.message
        });
    }
});

// Get Distance Between Two Points
router.post('/calculate-distance', async (req, res) => {
    try {
        const { origin, destination, mode = 'driving' } = req.body;

        if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
            return res.status(400).json({
                success: false,
                message: 'Origin and destination coordinates are required'
            });
        }

        const distanceData = await googleMapsService.calculateDistance(
            origin,
            destination,
            mode
        );

        res.json({
            success: true,
            distance: distanceData
        });

    } catch (error) {
        console.error('Distance calculation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate distance',
            error: error.message
        });
    }
});

// Helper function for basic distance calculation
function calculateBasicDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

export default router;