import { Client } from '@googlemaps/google-maps-services-js';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

class GoogleMapsService {
    constructor() {
        this.client = new Client({});
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
        
        if (!this.apiKey) {
            console.warn('Google Maps API key not found. Using fallback distance calculation.');
        }
    }

    /**
     * Calculate accurate distance and duration between two points using Google Distance Matrix API
     * @param {Object} origin - {latitude, longitude}
     * @param {Object} destination - {latitude, longitude}
     * @param {string} mode - travel mode: 'driving', 'walking', 'bicycling', 'transit'
     * @param {boolean} avoidTolls - whether to avoid toll roads
     * @param {boolean} avoidHighways - whether to avoid highways
     * @returns {Promise<Object>} - {distance: {text, value}, duration: {text, value}, status}
     */
    async calculateDistance(origin, destination, mode = 'driving', avoidTolls = false, avoidHighways = false) {
        try {
            if (!this.apiKey) {
                return this.fallbackDistanceCalculation(origin, destination);
            }

            const originStr = `${origin.latitude},${origin.longitude}`;
            const destinationStr = `${destination.latitude},${destination.longitude}`;

            const response = await this.client.distancematrix({
                params: {
                    key: this.apiKey,
                    origins: [originStr],
                    destinations: [destinationStr],
                    mode: mode,
                    units: 'metric',
                    avoid: [
                        ...(avoidTolls ? ['tolls'] : []),
                        ...(avoidHighways ? ['highways'] : [])
                    ],
                    departure_time: 'now', // For real-time traffic data
                },
            });

            const element = response.data.rows[0]?.elements[0];
            
            if (element?.status === 'OK') {
                return {
                    distance: {
                        text: element.distance.text,
                        value: element.distance.value / 1000, // Convert meters to kilometers
                    },
                    duration: {
                        text: element.duration.text,
                        value: element.duration.value / 60, // Convert seconds to minutes
                    },
                    duration_in_traffic: element.duration_in_traffic ? {
                        text: element.duration_in_traffic.text,
                        value: element.duration_in_traffic.value / 60, // Convert seconds to minutes
                    } : null,
                    status: 'OK'
                };
            } else {
                console.warn('Google Maps API returned non-OK status:', element?.status);
                return this.fallbackDistanceCalculation(origin, destination);
            }
        } catch (error) {
            console.error('Google Maps Distance Matrix API error:', error.message);
            return this.fallbackDistanceCalculation(origin, destination);
        }
    }

    /**
     * Get detailed route directions between two points
     * @param {Object} origin - {latitude, longitude}
     * @param {Object} destination - {latitude, longitude}
     * @param {Array} waypoints - Array of {latitude, longitude} objects for intermediate stops
     * @param {string} mode - travel mode: 'driving', 'walking', 'bicycling', 'transit'
     * @param {boolean} alternatives - whether to return alternative routes
     * @returns {Promise<Object>} - Route information with steps, polyline, etc.
     */
    async getDirections(origin, destination, waypoints = [], mode = 'driving', alternatives = false) {
        try {
            if (!this.apiKey) {
                throw new Error('Google Maps API key not available for directions');
            }

            const originStr = `${origin.latitude},${origin.longitude}`;
            const destinationStr = `${destination.latitude},${destination.longitude}`;
            const waypointsStr = waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');

            const params = {
                key: this.apiKey,
                origin: originStr,
                destination: destinationStr,
                mode: mode,
                alternatives: alternatives,
                departure_time: 'now',
            };

            if (waypoints.length > 0) {
                params.waypoints = waypointsStr;
            }

            const response = await this.client.directions({ params });

            if (response.data.status === 'OK' && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                const leg = route.legs[0];

                return {
                    distance: {
                        text: leg.distance.text,
                        value: leg.distance.value / 1000, // Convert to kilometers
                    },
                    duration: {
                        text: leg.duration.text,
                        value: leg.duration.value / 60, // Convert to minutes
                    },
                    duration_in_traffic: leg.duration_in_traffic ? {
                        text: leg.duration_in_traffic.text,
                        value: leg.duration_in_traffic.value / 60,
                    } : null,
                    start_address: leg.start_address,
                    end_address: leg.end_address,
                    steps: leg.steps.map(step => ({
                        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
                        distance: step.distance.text,
                        duration: step.duration.text,
                        start_location: step.start_location,
                        end_location: step.end_location,
                    })),
                    polyline: route.overview_polyline.points,
                    bounds: route.bounds,
                    warnings: route.warnings,
                    status: 'OK'
                };
            } else {
                throw new Error(`Directions API error: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Google Maps Directions API error:', error.message);
            throw error;
        }
    }

    /**
     * Convert address to coordinates (Geocoding)
     * @param {string} address - Address to geocode
     * @returns {Promise<Object>} - {latitude, longitude, formatted_address, place_id}
     */
    async geocodeAddress(address) {
        try {
            if (!this.apiKey) {
                throw new Error('Google Maps API key not available for geocoding');
            }

            const response = await this.client.geocode({
                params: {
                    key: this.apiKey,
                    address: address,
                },
            });

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                const location = result.geometry.location;

                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formatted_address: result.formatted_address,
                    place_id: result.place_id,
                    address_components: result.address_components,
                    types: result.types,
                    status: 'OK'
                };
            } else {
                throw new Error(`Geocoding API error: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Google Maps Geocoding API error:', error.message);
            throw error;
        }
    }

    /**
     * Convert coordinates to address (Reverse Geocoding)
     * @param {number} latitude 
     * @param {number} longitude 
     * @returns {Promise<Object>} - Address information
     */
    async reverseGeocode(latitude, longitude) {
        try {
            if (!this.apiKey) {
                throw new Error('Google Maps API key not available for reverse geocoding');
            }

            const response = await this.client.reverseGeocode({
                params: {
                    key: this.apiKey,
                    latlng: `${latitude},${longitude}`,
                },
            });

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];

                return {
                    formatted_address: result.formatted_address,
                    place_id: result.place_id,
                    address_components: result.address_components,
                    types: result.types,
                    status: 'OK'
                };
            } else {
                throw new Error(`Reverse Geocoding API error: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Google Maps Reverse Geocoding API error:', error.message);
            throw error;
        }
    }

    /**
     * Find nearby drivers within a radius
     * @param {Object} center - {latitude, longitude}
     * @param {number} radius - radius in kilometers
     * @param {string} type - place type to search for (optional)
     * @returns {Promise<Array>} - Array of nearby places
     */
    async findNearbyPlaces(center, radius = 5, type = null) {
        try {
            if (!this.apiKey) {
                throw new Error('Google Maps API key not available for nearby search');
            }

            const params = {
                key: this.apiKey,
                location: `${center.latitude},${center.longitude}`,
                radius: radius * 1000, // Convert km to meters
            };

            if (type) {
                params.type = type;
            }

            const response = await this.client.placesNearby({ params });

            if (response.data.status === 'OK') {
                return response.data.results.map(place => ({
                    place_id: place.place_id,
                    name: place.name,
                    location: place.geometry.location,
                    types: place.types,
                    rating: place.rating,
                    vicinity: place.vicinity,
                }));
            } else {
                throw new Error(`Nearby Places API error: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Google Maps Nearby Places API error:', error.message);
            throw error;
        }
    }

    /**
     * Calculate fare based on distance, time, and other factors
     * @param {number} distance - distance in kilometers
     * @param {number} duration - duration in minutes
     * @param {Object} options - {baseRate, perKmRate, perMinuteRate, surgeMultiplier}
     * @returns {Object} - Fare breakdown
     */
    calculateFare(distance, duration, options = {}) {
        const {
            baseRate = 50, // Base fare in currency
            perKmRate = 15, // Rate per kilometer
            perMinuteRate = 2, // Rate per minute
            surgeMultiplier = 1, // Surge pricing multiplier
            minimumFare = 100 // Minimum fare
        } = options;

        const distanceFare = distance * perKmRate;
        const timeFare = duration * perMinuteRate;
        const subtotal = baseRate + distanceFare + timeFare;
        const fareWithSurge = subtotal * surgeMultiplier;
        const finalFare = Math.max(fareWithSurge, minimumFare);

        return {
            baseRate,
            distanceFare: parseFloat(distanceFare.toFixed(2)),
            timeFare: parseFloat(timeFare.toFixed(2)),
            subtotal: parseFloat(subtotal.toFixed(2)),
            surgeMultiplier,
            fareWithSurge: parseFloat(fareWithSurge.toFixed(2)),
            finalFare: parseFloat(finalFare.toFixed(2)),
            breakdown: {
                distance: `${distance.toFixed(2)} km × ₹${perKmRate} = ₹${distanceFare.toFixed(2)}`,
                time: `${duration.toFixed(0)} min × ₹${perMinuteRate} = ₹${timeFare.toFixed(2)}`,
                base: `Base fare: ₹${baseRate}`,
                surge: surgeMultiplier > 1 ? `Surge (${surgeMultiplier}x): +₹${(fareWithSurge - subtotal).toFixed(2)}` : null
            }
        };
    }

    /**
     * Fallback distance calculation using Haversine formula
     * @param {Object} origin - {latitude, longitude}
     * @param {Object} destination - {latitude, longitude}
     * @returns {Object} - Distance and estimated duration
     */
    fallbackDistanceCalculation(origin, destination) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
        const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in kilometers

        // Estimate duration assuming 40 km/h average speed in city
        const estimatedDuration = (distance / 40) * 60; // Convert to minutes

        return {
            distance: {
                text: `${distance.toFixed(2)} km`,
                value: distance,
            },
            duration: {
                text: `${Math.round(estimatedDuration)} mins`,
                value: estimatedDuration,
            },
            status: 'FALLBACK',
            note: 'Calculated using Haversine formula (straight-line distance)'
        };
    }

    /**
     * Optimize route for multiple stops
     * @param {Object} origin - Starting point
     * @param {Object} destination - End point  
     * @param {Array} waypoints - Array of intermediate stops
     * @returns {Promise<Object>} - Optimized route
     */
    async optimizeRoute(origin, destination, waypoints = []) {
        try {
            if (!this.apiKey || waypoints.length === 0) {
                return this.getDirections(origin, destination);
            }

            const originStr = `${origin.latitude},${origin.longitude}`;
            const destinationStr = `${destination.latitude},${destination.longitude}`;
            const waypointsStr = waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');

            const response = await this.client.directions({
                params: {
                    key: this.apiKey,
                    origin: originStr,
                    destination: destinationStr,
                    waypoints: `optimize:true|${waypointsStr}`, // Request route optimization
                    mode: 'driving',
                    departure_time: 'now',
                },
            });

            if (response.data.status === 'OK' && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                
                return {
                    optimized_order: route.waypoint_order,
                    total_distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000,
                    total_duration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60,
                    legs: route.legs.map(leg => ({
                        distance: leg.distance.value / 1000,
                        duration: leg.duration.value / 60,
                        start_address: leg.start_address,
                        end_address: leg.end_address,
                    })),
                    polyline: route.overview_polyline.points,
                    status: 'OK'
                };
            } else {
                throw new Error(`Route optimization error: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Route optimization error:', error.message);
            // Fallback to simple directions
            return this.getDirections(origin, destination, waypoints);
        }
    }
}

export default new GoogleMapsService();