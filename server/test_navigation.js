import googleMapsService from './services/googleMapsService.js';

// Test navigation with different pickup/dropoff
async function testNavigation() {
  try {
    console.log('🧪 Testing navigation with different locations...');
    
    const pickup = { latitude: 18.9690247, longitude: 72.8205292 }; // Mumbai Central
    const dropoff = { latitude: 18.9220711, longitude: 72.8344311 }; // Marine Drive
    
    console.log('📍 Pickup:', pickup);
    console.log('📍 Dropoff:', dropoff);
    
    // Test distance calculation first
    const distance = await googleMapsService.calculateDistance(pickup, dropoff);
    console.log('📏 Distance calculation:', distance);
    
    // Test directions
    const directions = await googleMapsService.getDirections(
      pickup, // Already has latitude, longitude
      dropoff, // Already has latitude, longitude
      [], // waypoints
      'driving'
    );
    
    if (directions && directions.status === 'OK') {
      console.log('✅ Navigation successful!');
      console.log('�️ Full directions response:', JSON.stringify(directions, null, 2));
    } else {
      console.log('❌ Navigation failed:', directions);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testNavigation();