import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'dart:async';
import '../providers/auth_provider.dart';
import '../services/trips_service.dart';
import 'home_screen.dart';

class NavigationScreen extends StatefulWidget {
  final Map<String, dynamic> tripData;

  const NavigationScreen({Key? key, required this.tripData}) : super(key: key);

  @override
  State<NavigationScreen> createState() => _NavigationScreenState();
}

class _NavigationScreenState extends State<NavigationScreen> {
  GoogleMapController? mapController;
  Position? currentPosition;
  Set<Marker> markers = {};
  Set<Polyline> polylines = {};
  LatLng? pickupLocation;
  LatLng? dropoffLocation;
  LatLng? driverLocation;

  // Location tracking
  StreamSubscription<Position>? positionStreamSubscription;

  // Navigation data
  Map<String, dynamic>? navigationData;
  PolylinePoints polylinePoints = PolylinePoints();

  // Trip details
  String? estimatedTime = 'Loading...';
  String? distance = 'Loading...';
  bool isLoading = true;

  // Current trip data (will be refreshed from server)
  Map<String, dynamic>? currentTripData;

  @override
  void initState() {
    super.initState();
    _initializeNavigation();
  }

  @override
  void dispose() {
    positionStreamSubscription?.cancel();
    super.dispose();
  }

  Future<void> _initializeNavigation() async {
    await _requestLocationPermission();
    await _getCurrentLocation();
    await _loadFreshTripData(); // Load fresh trip data from server
    _extractTripLocations();
    _updateMarkers();
    await _loadNavigationData();
  }

  Future<void> _requestLocationPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always) {
      _startLocationTracking();
    }
  }

  Future<void> _loadFreshTripData() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.savedToken;

      if (token != null) {
        print('🔄 Loading fresh trip data from server...');
        final response = await TripsService.getCurrentTrip(token);

        if (response != null && response['hasActiveTrip'] == true) {
          setState(() {
            currentTripData = response['trip'];
          });
          print('📱 Fresh trip data loaded: ${currentTripData.toString()}');
        } else {
          // Fallback to passed trip data
          setState(() {
            currentTripData = widget.tripData;
          });
          print('⚠️ No active trip from server, using passed data');
        }
      } else {
        setState(() {
          currentTripData = widget.tripData;
        });
      }
    } catch (e) {
      print('❌ Error loading fresh trip data: $e');
      setState(() {
        currentTripData = widget.tripData;
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      setState(() {
        currentPosition = position;
        driverLocation = LatLng(position.latitude, position.longitude);
      });

      _updateMarkers();
    } catch (e) {
      print('Error getting location: $e');
    }
  }

  void _startLocationTracking() {
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    positionStreamSubscription =
        Geolocator.getPositionStream(locationSettings: locationSettings).listen(
          (Position position) {
            setState(() {
              currentPosition = position;
              driverLocation = LatLng(position.latitude, position.longitude);
            });

            _updateMarkers();
            _updateDriverLocationOnServer();
          },
        );
  }

  void _extractTripLocations() {
    if (currentTripData == null) {
      print('❌ No current trip data available for location extraction');
      return;
    }

    final pickup = currentTripData!['pickup'];
    final dropoff = currentTripData!['dropoff'];

    // Debug: Print the actual trip data structure
    print('🔍 DEBUG: Full current trip data: $currentTripData');
    print('🔍 DEBUG: Pickup data: $pickup');
    print('🔍 DEBUG: Dropoff data: $dropoff');

    // Handle different coordinate formats for pickup
    if (pickup != null) {
      print('🔍 DEBUG: Pickup coordinates: ${pickup['coordinates']}');
      print(
        '🔍 DEBUG: Pickup lat: ${pickup['latitude']}, lng: ${pickup['longitude']}',
      );

      if (pickup['coordinates'] != null && pickup['coordinates'] is List) {
        final coords = pickup['coordinates'];
        if (coords.length >= 2) {
          pickupLocation = LatLng(
            coords[1],
            coords[0],
          ); // [lng, lat] -> (lat, lng)
          print(
            '🔍 DEBUG: Using coordinates array for pickup: $pickupLocation',
          );
        }
      } else if (pickup['latitude'] != null && pickup['longitude'] != null) {
        pickupLocation = LatLng(pickup['latitude'], pickup['longitude']);
        print('🔍 DEBUG: Using lat/lng fields for pickup: $pickupLocation');
      }
    }

    // Handle different coordinate formats for dropoff
    if (dropoff != null) {
      print('🔍 DEBUG: Dropoff coordinates: ${dropoff['coordinates']}');
      print(
        '🔍 DEBUG: Dropoff lat: ${dropoff['latitude']}, lng: ${dropoff['longitude']}',
      );

      if (dropoff['coordinates'] != null && dropoff['coordinates'] is List) {
        final coords = dropoff['coordinates'];
        if (coords.length >= 2) {
          dropoffLocation = LatLng(coords[1], coords[0]);
          print(
            '🔍 DEBUG: Using coordinates array for dropoff: $dropoffLocation',
          );
        }
      } else if (dropoff['latitude'] != null && dropoff['longitude'] != null) {
        dropoffLocation = LatLng(dropoff['latitude'], dropoff['longitude']);
        print('🔍 DEBUG: Using lat/lng fields for dropoff: $dropoffLocation');
      }
    }

    print('📍 Trip locations extracted:');
    print('   Pickup: $pickupLocation');
    print('   Dropoff: $dropoffLocation');
  }

  Future<void> _loadNavigationData() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.savedToken;
      final bookingId = currentTripData?['bookingId'];

      print('🚗 Loading navigation for booking: $bookingId');

      if (token != null && bookingId != null) {
        final response = await TripsService.getNavigationDetails(
          bookingId.toString(),
          token,
        );

        if (response != null && mounted) {
          setState(() {
            navigationData = response;
            estimatedTime =
                response['estimatedTimeWithTrafficText'] ??
                response['estimatedTimeText'] ??
                'Unknown';
            distance = response['distanceText'] ?? 'Unknown';
            isLoading = false;
          });

          print('✅ Navigation data loaded successfully');
          await _drawRoute();
        } else {
          setState(() => isLoading = false);
          print('❌ No navigation data received');
        }
      } else {
        setState(() => isLoading = false);
        print('❌ Missing token or booking ID');
      }
    } catch (e) {
      setState(() => isLoading = false);
      print('❌ Error loading navigation: $e');
    }
  }

  Future<void> _drawRoute() async {
    if (navigationData?['polyline'] != null) {
      try {
        List<LatLng> polylineCoordinates = [];

        String encodedPolyline = navigationData!['polyline'];
        List<dynamic> decodedPolyline = polylinePoints.decodePolyline(
          encodedPolyline,
        );

        for (var point in decodedPolyline) {
          polylineCoordinates.add(LatLng(point.latitude, point.longitude));
        }

        setState(() {
          polylines.clear();
          polylines.add(
            Polyline(
              polylineId: const PolylineId('route'),
              color: const Color(0xFF4285F4), // Google blue
              width: 6,
              points: polylineCoordinates,
              geodesic: true,
            ),
          );

          // Add traffic overlay if available
          if (navigationData!['realTimeTraffic'] != null) {
            polylines.add(
              Polyline(
                polylineId: const PolylineId('traffic'),
                color: const Color(0xFFFF9800), // Orange for traffic
                width: 4,
                points: polylineCoordinates,
                patterns: [PatternItem.dash(10), PatternItem.gap(5)],
              ),
            );
          }
        });

        if (polylineCoordinates.isNotEmpty) {
          _fitCameraToRoute(polylineCoordinates);
        }

        print('✅ Route drawn with ${polylineCoordinates.length} points');
      } catch (e) {
        print('❌ Error drawing route: $e');
      }
    } else if (pickupLocation != null && dropoffLocation != null) {
      // Fallback: simple line
      setState(() {
        polylines.clear();
        polylines.add(
          Polyline(
            polylineId: const PolylineId('simple_route'),
            color: Colors.blue,
            width: 4,
            points: [pickupLocation!, dropoffLocation!],
          ),
        );
      });
    }
  }

  void _fitCameraToRoute(List<LatLng> points) {
    if (mapController != null && points.isNotEmpty) {
      double minLat = points.first.latitude;
      double maxLat = points.first.latitude;
      double minLng = points.first.longitude;
      double maxLng = points.first.longitude;

      for (LatLng point in points) {
        minLat = minLat < point.latitude ? minLat : point.latitude;
        maxLat = maxLat > point.latitude ? maxLat : point.latitude;
        minLng = minLng < point.longitude ? minLng : point.longitude;
        maxLng = maxLng > point.longitude ? maxLng : point.longitude;
      }

      mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(minLat, minLng),
            northeast: LatLng(maxLat, maxLng),
          ),
          100.0,
        ),
      );
    }
  }

  void _updateMarkers() {
    Set<Marker> newMarkers = {};

    // Driver location
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

    // Pickup location
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
            snippet:
                currentTripData?['pickup']?['address'] ?? 'Pickup Location',
          ),
        ),
      );
    }

    // Dropoff location
    if (dropoffLocation != null) {
      newMarkers.add(
        Marker(
          markerId: const MarkerId('dropoff'),
          position: dropoffLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: InfoWindow(
            title: 'Dropoff',
            snippet:
                currentTripData?['dropoff']?['address'] ?? 'Dropoff Location',
          ),
        ),
      );
    }

    setState(() {
      markers = newMarkers;
    });
  }

  void _updateDriverLocationOnServer() async {
    if (currentPosition != null) {
      try {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final token = authProvider.savedToken;
        final bookingId = currentTripData?['bookingId'];

        if (token != null && bookingId != null) {
          await TripsService.updateTripLocation(
            bookingId.toString(),
            currentPosition!.latitude,
            currentPosition!.longitude,
            token,
          );
        }
      } catch (e) {
        print('Error updating location: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final customer = currentTripData?['customer'] ?? {};

    return Scaffold(
      body: Stack(
        children: [
          // Google Maps
          GoogleMap(
            onMapCreated: (GoogleMapController controller) {
              mapController = controller;
              if (driverLocation != null) {
                controller.animateCamera(
                  CameraUpdate.newLatLngZoom(driverLocation!, 15.0),
                );
              }
            },
            initialCameraPosition: CameraPosition(
              target:
                  pickupLocation ??
                  driverLocation ??
                  const LatLng(20.5937, 78.9629), // India center
              zoom: 14.0,
            ),
            markers: markers,
            polylines: polylines,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            trafficEnabled: true, // Enable traffic like Uber
            buildingsEnabled: true,
            mapType: MapType.normal,
          ),

          // Back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 10,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),

          // Navigation info panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 20,
                    offset: Offset(0, -5),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Trip info
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: const Color(0xFF10B981),
                        child: Text(
                          customer['name']?.substring(0, 1).toUpperCase() ??
                              'C',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
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
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              customer['phone'] ?? '',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.phone, color: Color(0xFF10B981)),
                        onPressed: () {
                          // Implement call functionality
                        },
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Navigation stats
                  if (!isLoading) ...[
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            'Distance',
                            distance ?? 'Unknown',
                            Icons.straighten,
                            const Color(0xFF3B82F6),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            'ETA',
                            estimatedTime ?? 'Unknown',
                            Icons.access_time,
                            const Color(0xFF10B981),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    const Center(child: CircularProgressIndicator()),
                  ],

                  const SizedBox(height: 20),

                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            // Refresh navigation data
                            _loadNavigationData();
                          },
                          icon: const Icon(Icons.refresh),
                          label: Text(
                            'Refresh Route',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF6366F1),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
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
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
