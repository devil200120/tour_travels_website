// Enhanced booking service with Google Maps API integration
import googleMapsService from './googleMapsService.js';

export const calculateDistance = async (pickup, destination, additionalStops = []) => {
  try {
    if (additionalStops.length === 0) {
      // Simple pickup to destination trip
      const result = await googleMapsService.calculateDistance(pickup, destination, 'driving');
      
      return {
        distance: result.distance.value,
        duration: result.duration.value,
        durationText: result.duration.text,
        distanceText: result.distance.text,
        durationInTraffic: result.duration_in_traffic?.value,
        source: 'google_maps'
      };
    } else {
      // Multi-stop trip - optimize route
      const optimizedRoute = await googleMapsService.optimizeRoute(pickup, destination, additionalStops);
      
      return {
        distance: optimizedRoute.total_distance,
        duration: optimizedRoute.total_duration,
        optimizedOrder: optimizedRoute.optimized_order,
        legs: optimizedRoute.legs,
        source: 'google_maps_optimized'
      };
    }

  } catch (error) {
    console.error('Google Maps distance calculation error:', error);
    
    // Fallback to basic calculation
    const baseDistance = Math.sqrt(
      Math.pow(destination.latitude - pickup.latitude, 2) + 
      Math.pow(destination.longitude - pickup.longitude, 2)
    ) * 111; // Rough conversion to kilometers

    let totalDistance = baseDistance;
    let totalDuration = baseDistance * 1.5; // Rough estimate: 1.5 minutes per km

    // Add additional stops
    if (additionalStops.length > 0) {
      for (const stop of additionalStops) {
        const stopDistance = Math.sqrt(
          Math.pow(stop.latitude - pickup.latitude, 2) + 
          Math.pow(stop.longitude - pickup.longitude, 2)
        ) * 111;
        totalDistance += stopDistance;
        totalDuration += stopDistance * 1.5;
      }
    }

    return {
      distance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      duration: Math.round(totalDuration), // In minutes
      source: 'fallback',
      note: 'Calculated using basic distance formula'
    };
  }
};

export const calculateFare = ({
  distance,
  duration,
  vehicleCategory,
  serviceType,
  pickupDate,
  pickupTime,
  returnDate
}) => {
  try {
    let baseFare = vehicleCategory.pricing.basePrice;
    let distanceCharges = 0;
    let timeCharges = 0;
    
    // Determine rate based on distance
    const rates = vehicleCategory.pricing.outstationRates;
    let rateCategory = '0-100km';
    
    if (distance > 300) {
      rateCategory = '300km+';
    } else if (distance > 100) {
      rateCategory = '100-300km';
    }
    
    const applicableRate = rates[rateCategory];
    distanceCharges = distance * (applicableRate?.perKm || vehicleCategory.pricing.perKm);
    
    // Enhanced Google Maps integration for fare calculation
    if (duration) {
      // Use Google Maps duration for more accurate time-based pricing
      timeCharges = Math.round(duration / 60) * (vehicleCategory.pricing.perHour || 50);
    }
    
    // Add driver allowance for outstation trips
    if (distance > 50) {
      baseFare += applicableRate?.driverAllowance || 500;
    }
    
    // Round trip discount
    if (serviceType === 'round_trip') {
      const discount = vehicleCategory.pricing.roundTripDiscount || 10;
      distanceCharges = distanceCharges * (1 - discount / 100);
    }
    
    // Multi-city multiplier
    if (serviceType === 'multi_city') {
      const multiplier = vehicleCategory.pricing.multiCityMultiplier || 1.2;
      distanceCharges = distanceCharges * multiplier;
    }
    
    // Night charges (10 PM to 6 AM)
    const pickupHour = parseInt(pickupTime.split(':')[0]);
    if (pickupHour >= 22 || pickupHour <= 6) {
      const nightMultiplier = vehicleCategory.pricing.nightChargeMultiplier || 1.25;
      distanceCharges = distanceCharges * nightMultiplier;
      baseFare = baseFare * nightMultiplier;
    }
    
    // Peak hour charges (8-10 AM, 6-8 PM on weekdays)
    const pickupDay = new Date(pickupDate).getDay();
    if (pickupDay >= 1 && pickupDay <= 5) { // Monday to Friday
      if ((pickupHour >= 8 && pickupHour <= 10) || (pickupHour >= 18 && pickupHour <= 20)) {
        const peakMultiplier = vehicleCategory.pricing.peakHourMultiplier || 1.15;
        distanceCharges = distanceCharges * peakMultiplier;
      }
    }
    
    // Calculate taxes (18% GST)
    const subtotal = baseFare + distanceCharges + timeCharges;
    const taxes = Math.round(subtotal * 0.18);
    
    const totalFare = subtotal + taxes;
    
    return {
      baseFare: Math.round(baseFare),
      distanceCharges: Math.round(distanceCharges),
      timeCharges: Math.round(timeCharges),
      taxes,
      tolls: 0, // Can be calculated based on route
      discount: 0,
      promoDiscount: 0,
      totalFare: Math.round(totalFare),
      priceBreakdown: {
        distance: `${distance.toFixed(2)} km`,
        estimatedTime: duration ? `${Math.round(duration)} mins` : 'N/A',
        baseFareDesc: `Base fare: ₹${Math.round(baseFare)}`,
        distanceDesc: `Distance charges: ₹${Math.round(distanceCharges)}`,
        timeDesc: timeCharges > 0 ? `Time charges: ₹${Math.round(timeCharges)}` : null,
        taxDesc: `Taxes (18% GST): ₹${taxes}`
      }
    };

  } catch (error) {
    console.error('Fare calculation error:', error);
    // Return default fare structure
    return {
      baseFare: 500,
      distanceCharges: 1000,
      timeCharges: 0,
      taxes: 270,
      tolls: 0,
      discount: 0,
      promoDiscount: 0,
      totalFare: 1770
    };
  }
};

export const validatePromoCode = async (promoCode, totalFare) => {
  try {
    // Mock promo codes - replace with database lookup
    const promoCodes = {
      'FIRST50': { discount: 50, minAmount: 500, maxDiscount: 100, type: 'fixed' },
      'SAVE20': { discount: 20, minAmount: 1000, maxDiscount: 200, type: 'percentage' },
      'WELCOME': { discount: 100, minAmount: 800, maxDiscount: 150, type: 'fixed' },
      'WEEKEND15': { discount: 15, minAmount: 1500, maxDiscount: 300, type: 'percentage' }
    };

    const promo = promoCodes[promoCode.toUpperCase()];
    
    if (!promo) {
      return { isValid: false, message: 'Invalid promo code' };
    }

    if (totalFare < promo.minAmount) {
      return { 
        isValid: false, 
        message: `Minimum order amount ₹${promo.minAmount} required` 
      };
    }

    let discount = 0;
    if (promo.type === 'fixed') {
      discount = promo.discount;
    } else if (promo.type === 'percentage') {
      discount = Math.round((totalFare * promo.discount) / 100);
    }

    // Apply max discount limit
    if (discount > promo.maxDiscount) {
      discount = promo.maxDiscount;
    }

    return {
      isValid: true,
      discount,
      promoDetails: promo
    };

  } catch (error) {
    console.error('Promo validation error:', error);
    return { isValid: false, message: 'Error validating promo code' };
  }
};