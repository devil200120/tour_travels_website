import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'dart:async';
import '../providers/auth_provider.dart';
import '../services/trips_service.dart';
import 'home_screen.dart';
import 'dart:math' as math;

class TripNavigationMapScreen extends StatefulWidget {
  final Map<String, dynamic> tripData;

  const TripNavigationMapScreen({Key? key, required this.tripData})
    : super(key: key);

  @override
  _TripNavigationMapScreenState createState() =>
      _TripNavigationMapScreenState();
}

class _TripNavigationMapScreenState extends State<TripNavigationMapScreen>
    with TickerProviderStateMixin {
  Map<String, dynamic>? tripData;
  String tripStatus = 'In Progress';
  bool isLoading = false;

  // Trip state
  String currentPhase = 'pickup'; // pickup, dropoff
  String? estimatedTime = '5 mins';
  String? distance = '2.5 km';
  double currentSpeed = 0.0;

  // Google Maps
  GoogleMapController? mapController;
  Position? currentPosition;
  Set<Marker> markers = {};
  Set<Polyline> polylines = {};
  LatLng? pickupLocation;
  LatLng? dropoffLocation;
  LatLng? driverLocation;

  // Location tracking
  StreamSubscription<Position>? positionStreamSubscription;
  Timer? locationUpdateTimer;

  // Navigation data
  Map<String, dynamic>? navigationData;
  PolylinePoints polylinePoints = PolylinePoints();

  // Animation controllers for smooth UI transitions
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    tripData = widget.tripData;
    tripStatus = tripData!['status'] ?? 'In Progress';
    
    print('TripNavigationMapScreen initialized with data: ${tripData.toString()}');

    // Initialize animations
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _pulseController.repeat(reverse: true);

    // Initialize Google Maps and navigation
    _initializeMap();
    _requestLocationPermission();
    _loadNavigationData();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    positionStreamSubscription?.cancel();
    locationUpdateTimer?.cancel();
    super.dispose();
  }

  // Initialize Google Maps
  void _initializeMap() {
    // Extract locations from trip data
    final pickup = tripData?['pickup'];
    final dropoff = tripData?['dropoff'];

    // Handle different coordinate formats
    if (pickup != null) {
      if (pickup['coordinates'] != null) {
        final coords = pickup['coordinates'];
        if (coords is List && coords.length >= 2) {
          // Handle [longitude, latitude] format
          pickupLocation = LatLng(coords[1], coords[0]);
        }
      } else if (pickup['latitude'] != null && pickup['longitude'] != null) {
        // Handle separate lat/lng fields
        pickupLocation = LatLng(pickup['latitude'], pickup['longitude']);
      }
    }
    
    if (dropoff != null) {
      if (dropoff['coordinates'] != null) {
        final coords = dropoff['coordinates'];
        if (coords is List && coords.length >= 2) {
          // Handle [longitude, latitude] format
          dropoffLocation = LatLng(coords[1], coords[0]);
        }
      } else if (dropoff['latitude'] != null && dropoff['longitude'] != null) {
        // Handle separate lat/lng fields
        dropoffLocation = LatLng(dropoff['latitude'], dropoff['longitude']);
      }
    }
    
    print('🗺️ Map initialized:');
    print('   Pickup: $pickupLocation');
    print('   Dropoff: $dropoffLocation');
    print('   Trip Data: ${tripData?['bookingId']}');

    _updateMarkers();
  }

  // Request location permissions
  Future<void> _requestLocationPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return;
    }

    _getCurrentLocation();
    _startLocationTracking();
  }

  // Get current location
  Future<void> _getCurrentLocation() async {
    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        currentPosition = position;
        driverLocation = LatLng(position.latitude, position.longitude);
      });

      _updateMarkers();
      _updateMapCamera();
    } catch (e) {
      print('Error getting location: $e');
    }
  }

  // Start real-time location tracking
  void _startLocationTracking() {
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // Update every 10 meters
    );

    positionStreamSubscription =
        Geolocator.getPositionStream(locationSettings: locationSettings).listen(
          (Position position) {
            setState(() {
              currentPosition = position;
              driverLocation = LatLng(position.latitude, position.longitude);
              currentSpeed = position.speed * 3.6; // Convert m/s to km/h
            });

            _updateMarkers();
            _updateDriverLocationOnServer();
          },
        );
  }

  // Load navigation data from backend
  Future<void> _loadNavigationData() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.savedToken;
      
      // Use bookingId instead of id for API calls
      final orderId = tripData?['bookingId'] ?? tripData?['id'];
      
      print('🚗 Loading navigation data...');
      print('   BookingId: $orderId');
      print('   Token available: ${token != null}');
      
      if (token != null && orderId != null) {
        print('📡 Calling navigation API for order: $orderId');
        final response = await TripsService.getNavigationDetails(
          orderId.toString(),
          token,
        );
        
        print('📡 Navigation API response received: ${response != null}');
        if (response != null) {
          print('🛣️ Response keys: ${response.keys.toList()}');
          print('   Distance: ${response['distanceText']}');
          print('   Time: ${response['estimatedTimeText']}');
          print('   Has polyline: ${response['polyline'] != null}');
        }
        
        if (response != null && mounted) {
          setState(() {
            navigationData = response;
            estimatedTime = response['estimatedTimeText'] ?? response['estimatedTimeWithTrafficText'] ?? 'Unknown';
            distance = response['distanceText'] ?? 'Unknown';
          });
          
          _drawRoute();
        } else {
          print('❌ No navigation response or widget unmounted');
        }
      } else {
        print('❌ Missing token or orderId');
        print('   Token: ${token != null}');
        print('   OrderId: $orderId');
      }
    } catch (e) {
      print('❌ Error loading navigation data: $e');
    }
  }
      print('Error loading navigation data: $e');
    }
  }  // Update markers on map
  void _updateMarkers() {
    Set<Marker> newMarkers = {};

    // Driver location marker
    if (driverLocation != null) {
      newMarkers.add(
        Marker(
          markerId: const MarkerId('driver'),
          position: driverLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: const InfoWindow(title: 'Your Location'),
        ),
      );
    }

    // Pickup location marker
    if (pickupLocation != null) {
      newMarkers.add(
        Marker(
          markerId: const MarkerId('pickup'),
          position: pickupLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueGreen,
          ),
          infoWindow: InfoWindow(
            title: 'Pickup',
            snippet: tripData?['pickup']?['address'] ?? 'Pickup Location',
          ),
        ),
      );
    }

    // Dropoff location marker
    if (dropoffLocation != null && currentPhase == 'dropoff') {
      newMarkers.add(
        Marker(
          markerId: const MarkerId('dropoff'),
          position: dropoffLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: InfoWindow(
            title: 'Dropoff',
            snippet: tripData?['dropoff']?['address'] ?? 'Dropoff Location',
          ),
        ),
      );
    }

    setState(() {
      markers = newMarkers;
    });
  }

  // Draw route on map
  void _drawRoute() async {
    if (navigationData?['polyline'] != null) {
      // If we have polyline from Google Maps API
      try {
        List<LatLng> polylineCoordinates = [];
        
        // Decode polyline from Google Maps API
        String encodedPolyline = navigationData!['polyline'];
        List<dynamic> decodedPolyline = polylinePoints.decodePolyline(encodedPolyline);
        
        for (var point in decodedPolyline) {
          polylineCoordinates.add(LatLng(point.latitude, point.longitude));
        }
        
        setState(() {
          polylines.clear();
          polylines.add(Polyline(
            polylineId: const PolylineId('route'),
            color: const Color(0xFF4285F4), // Google Blue like Google Maps
            width: 6,
            points: polylineCoordinates,
            patterns: [], // Solid line for main route
            geodesic: true, // Follow earth's curvature
          ));
          
          // Add traffic-aware styling if available
          if (navigationData!['realTimeTraffic'] != null) {
            polylines.add(Polyline(
              polylineId: const PolylineId('traffic_route'),
              color: const Color(0xFFFF9800), // Orange for traffic
              width: 4,
              points: polylineCoordinates,
              patterns: [PatternItem.dash(10), PatternItem.gap(5)], // Dashed for traffic
            ));
          }
        });
        
        // Update camera to show entire route
        if (polylineCoordinates.isNotEmpty) {
          _fitCameraToRoute(polylineCoordinates);
        }
        
        print('✅ Route polyline drawn with ${polylineCoordinates.length} points');
        
      } catch (e) {
        print('❌ Error drawing polyline: $e');
      }
    } else {
      // Fallback: draw straight line if no polyline available
      if (pickupLocation != null && dropoffLocation != null) {
        setState(() {
          polylines.clear();
          polylines.add(Polyline(
            polylineId: const PolylineId('fallback_route'),
            color: Colors.grey,
            width: 4,
            points: [pickupLocation!, dropoffLocation!],
          ));
        });
      }
    }
  }
  
  // Fit camera to show entire route
  void _fitCameraToRoute(List<LatLng> points) {
    if (mapController != null && points.isNotEmpty) {
      double minLat = points.first.latitude;
      double maxLat = points.first.latitude;
      double minLng = points.first.longitude;
      double maxLng = points.first.longitude;
      
      for (LatLng point in points) {
        minLat = math.min(minLat, point.latitude);
        maxLat = math.max(maxLat, point.latitude);
        minLng = math.min(minLng, point.longitude);
        maxLng = math.max(maxLng, point.longitude);
      }
      
      mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(minLat, minLng),
            northeast: LatLng(maxLat, maxLng),
          ),
          100.0, // padding
        ),
      );
    }
  }

  // Update map camera
  void _updateMapCamera() {
    if (mapController != null && driverLocation != null) {
      mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(driverLocation!, 16.0),
      );
    }
  }

  // Update driver location on server
  void _updateDriverLocationOnServer() async {
    // Use bookingId instead of id for API calls
    final orderId = tripData?['bookingId'] ?? tripData?['id'];
    
    if (currentPosition != null && orderId != null) {
      try {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final token = authProvider.savedToken;
        
        if (token != null) {
          await TripsService.updateTripLocation(
            orderId.toString(),
            currentPosition!.latitude,
            currentPosition!.longitude,
            token,
          );
        }
      } catch (e) {
        print('Error updating location: $e');
      }
    }
  }  Future<void> _completeTrip() async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Complete Trip',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to complete this trip? This action cannot be undone.',
          style: GoogleFonts.poppins(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(color: Colors.grey[600]),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
            ),
            child: Text(
              'Complete Trip',
              style: GoogleFonts.poppins(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        isLoading = true;
      });

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.savedToken;

      if (token != null && tripData != null) {
        final success = await TripsService.endTrip(
          tripData!['bookingId'],
          token,
        );
        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Trip completed successfully!',
                style: GoogleFonts.poppins(),
              ),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
          // Navigate back to home screen
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const DriverHomeScreen()),
            (route) => false,
          );
        } else {
          setState(() {
            isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Failed to complete trip. Please try again.',
                style: GoogleFonts.poppins(),
              ),
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
      }
    }
  }

  Future<void> _cancelTrip() async {
    String? cancellationReason;

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Cancel Trip',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            color: const Color(0xFFEF4444),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Are you sure you want to cancel this trip? This action will affect your rating.',
              style: GoogleFonts.poppins(),
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: InputDecoration(
                hintText: 'Reason for cancellation (optional)',
                hintStyle: GoogleFonts.poppins(),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              maxLines: 2,
              onChanged: (value) {
                cancellationReason = value;
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Keep Trip',
              style: GoogleFonts.poppins(color: Colors.grey[600]),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
            ),
            child: Text(
              'Cancel Trip',
              style: GoogleFonts.poppins(color: Colors.white),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        isLoading = true;
      });

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.savedToken;

      if (token != null && tripData != null) {
        final success = await TripsService.cancelTrip(
          tripData!['bookingId'],
          token,
          reason: cancellationReason,
        );

        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Trip cancelled successfully.',
                style: GoogleFonts.poppins(),
              ),
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
      }

      // Navigate back to home regardless of success
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const DriverHomeScreen()),
        (route) => false,
      );
    }
  }

  @override
  @override
  Widget build(BuildContext context) {
    if (tripData == null) {
      return const DriverHomeScreen();
    }

    final customer = tripData!['customer'] ?? {};
    final pickup = tripData!['pickup'] ?? {};
    final dropoff = tripData!['dropoff'] ?? {};

    return Scaffold(
      body: Stack(
        children: [
          // Google Maps View
          GoogleMap(
            onMapCreated: (GoogleMapController controller) {
              mapController = controller;
              _updateMapCamera();
            },
            initialCameraPosition: CameraPosition(
              target: pickupLocation ?? 
                  driverLocation ??
                  const LatLng(20.5937, 78.9629), // India center
              zoom: 14.0, // Better zoom for navigation
            ),
            markers: markers,
            polylines: polylines,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            compassEnabled: true,
            rotateGesturesEnabled: true,
            scrollGesturesEnabled: true,
            tiltGesturesEnabled: true,
            zoomGesturesEnabled: true,
            trafficEnabled: true, // Enable traffic layer like Uber
            buildingsEnabled: true,
            mapType: MapType.normal,
            onCameraMove: (CameraPosition position) {
              // Update camera position for smooth navigation
            },
          ),

          // Current location button
          Positioned(
            bottom: 200,
            right: 16,
            child: FloatingActionButton(
              backgroundColor: Colors.white,
              onPressed: _getCurrentLocation,
              child: const Icon(Icons.my_location, color: Color(0xFF2563EB)),
            ),
          ),

          // Top Status Bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 16,
                right: 16,
                bottom: 16,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.black.withOpacity(0.4),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      currentPhase == 'pickup'
                          ? 'Going to Pickup'
                          : 'Going to Dropoff',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.timer,
                          color: Color(0xFF10B981),
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          estimatedTime ?? '5 mins',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF10B981),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.route,
                          color: Color(0xFF3B82F6),
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          distance ?? '2.5 km',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF3B82F6),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Speed indicator
          if (currentSpeed > 0)
            Positioned(
              top: 120,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${currentSpeed.toStringAsFixed(0)}',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF10B981),
                      ),
                    ),
                    Text(
                      'km/h',
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Bottom Trip Details Card
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 10,
                    offset: Offset(0, -5),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Customer Info
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.person,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  customer['name'] ?? 'Customer',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  customer['phone'] ?? 'N/A',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              // Add call functionality here
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Calling ${customer['phone'] ?? 'customer'}...',
                                    style: GoogleFonts.poppins(),
                                  ),
                                  backgroundColor: const Color(0xFF10B981),
                                ),
                              );
                            },
                            icon: const Icon(
                              Icons.call,
                              color: Color(0xFF10B981),
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              // Add message functionality here
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Opening messages...',
                                    style: GoogleFonts.poppins(),
                                  ),
                                  backgroundColor: const Color(0xFF3B82F6),
                                ),
                              );
                            },
                            icon: const Icon(
                              Icons.message,
                              color: Color(0xFF3B82F6),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Current Destination
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: currentPhase == 'pickup'
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFFEF4444),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                currentPhase == 'pickup'
                                    ? 'PICKUP LOCATION'
                                    : 'DROPOFF LOCATION',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: currentPhase == 'pickup'
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFFEF4444),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            currentPhase == 'pickup'
                                ? (pickup['address'] ?? 'Pickup location')
                                : (dropoff['address'] ?? 'Dropoff location'),
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              color: Colors.grey[800],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.route,
                                size: 16,
                                color: Colors.grey,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                distance ?? '2.5 km',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(width: 16),
                              const Icon(
                                Icons.timer,
                                size: 16,
                                color: Colors.grey,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                estimatedTime ?? '5 mins',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Action Buttons
                    Row(
                      children: [
                        if (currentPhase == 'pickup') ...[
                          Expanded(
                            child: SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    currentPhase = 'dropoff';
                                    estimatedTime = '5 mins';
                                    distance = '2.5 km';
                                  });
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Customer picked up! Now heading to dropoff.',
                                        style: GoogleFonts.poppins(),
                                      ),
                                      backgroundColor: const Color(0xFF10B981),
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF10B981),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Text(
                                  'Customer Picked Up',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ] else ...[
                          Expanded(
                            child: SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: isLoading ? null : _completeTrip,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF10B981),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: isLoading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : Text(
                                        'Complete Trip',
                                        style: GoogleFonts.poppins(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(width: 12),
                        Expanded(
                          child: SizedBox(
                            height: 50,
                            child: OutlinedButton(
                              onPressed: isLoading ? null : _cancelTrip,
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                  color: Color(0xFFEF4444),
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: Text(
                                'Cancel Trip',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFFEF4444),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
