import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async';
import '../providers/auth_provider.dart';
import '../services/trips_service.dart';
import 'home_screen.dart';
import 'map_navigation_screen.dart';

class TripNavigationScreen extends StatefulWidget {
  final Map<String, dynamic> tripData;

  const TripNavigationScreen({Key? key, required this.tripData}) : super(key: key);

  @override
  _TripNavigationScreenState createState() => _TripNavigationScreenState();
}

class _TripNavigationScreenState extends State<TripNavigationScreen> {
  Map<String, dynamic>? tripData;
  String tripStatus = 'In Progress';
  bool isLoading = false;
  
  // Trip state
  String currentPhase = 'pickup'; // pickup, dropoff
  String? estimatedTime = '5 mins';
  String? distance = '2.5 km';

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

  @override
  void initState() {
    super.initState();
    tripData = widget.tripData;
    tripStatus = tripData!['status'] ?? 'In Progress';
    _initializeMap();
    _getCurrentLocation();
    _startLocationTracking();
  }

  @override
  void dispose() {
    positionStreamSubscription?.cancel();
    locationUpdateTimer?.cancel();
    super.dispose();
  }

  void _initializeMap() {
    final pickup = tripData!['pickup'] ?? {};
    final dropoff = tripData!['dropoff'] ?? {};
    
    // Parse coordinates from trip data
    if (pickup['coordinates'] != null && pickup['coordinates'].length >= 2) {
      pickupLocation = LatLng(
        pickup['coordinates'][1].toDouble(), 
        pickup['coordinates'][0].toDouble()
      );
    }
    
    if (dropoff['coordinates'] != null && dropoff['coordinates'].length >= 2) {
      dropoffLocation = LatLng(
        dropoff['coordinates'][1].toDouble(), 
        dropoff['coordinates'][0].toDouble()
      );
    }
    
    _updateMarkers();
  }

  Future<void> _getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return;
        }
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      setState(() {
        currentPosition = position;
        driverLocation = LatLng(position.latitude, position.longitude);
      });
      
      _updateMarkers();
      _drawRoute();
      
      if (mapController != null) {
        mapController!.animateCamera(
          CameraUpdate.newLatLng(driverLocation!),
        );
      }
    } catch (e) {
      print('Error getting current location: $e');
    }
  }

  void _startLocationTracking() {
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // Update every 10 meters
    );

    positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((Position position) {
      setState(() {
        currentPosition = position;
        driverLocation = LatLng(position.latitude, position.longitude);
      });
      
      _updateMarkers();
      _updateDistanceAndETA();
      
      // Update location to backend
      _updateLocationToBackend(position);
      
      if (mapController != null) {
        mapController!.animateCamera(
          CameraUpdate.newLatLng(driverLocation!),
        );
      }
    });
    
    // Update location every 30 seconds
    locationUpdateTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (currentPosition != null) {
        _updateLocationToBackend(currentPosition!);
      }
    });
  }

  void _updateMarkers() {
    markers.clear();
    
    // Driver marker (current location)
    if (driverLocation != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('driver'),
          position: driverLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: const InfoWindow(title: 'Your Location'),
        ),
      );
    }
    
    // Pickup marker
    if (pickupLocation != null && currentPhase == 'pickup') {
      markers.add(
        Marker(
          markerId: const MarkerId('pickup'),
          position: pickupLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: InfoWindow(
            title: 'Pickup Location',
            snippet: tripData!['pickup']?['address'] ?? 'Pickup Point',
          ),
        ),
      );
    }
    
    // Dropoff marker
    if (dropoffLocation != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('dropoff'),
          position: dropoffLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(
            currentPhase == 'dropoff' ? BitmapDescriptor.hueGreen : BitmapDescriptor.hueRed
          ),
          infoWindow: InfoWindow(
            title: 'Dropoff Location',
            snippet: tripData!['dropoff']?['address'] ?? 'Destination',
          ),
        ),
      );
    }
    
    setState(() {});
  }

  void _drawRoute() {
    if (driverLocation == null) return;
    
    LatLng? destination;
    if (currentPhase == 'pickup' && pickupLocation != null) {
      destination = pickupLocation!;
    } else if (currentPhase == 'dropoff' && dropoffLocation != null) {
      destination = dropoffLocation!;
    }
    
    if (destination != null) {
      // Simple straight line route (in production, use Google Directions API)
      polylines.clear();
      polylines.add(
        Polyline(
          polylineId: const PolylineId('route'),
          points: [driverLocation!, destination],
          color: const Color(0xFF10B981),
          width: 5,
          patterns: [],
        ),
      );
      setState(() {});
    }
  }

  void _updateDistanceAndETA() {
    if (driverLocation == null) return;
    
    LatLng? destination;
    if (currentPhase == 'pickup' && pickupLocation != null) {
      destination = pickupLocation!;
    } else if (currentPhase == 'dropoff' && dropoffLocation != null) {
      destination = dropoffLocation!;
    }
    
    if (destination != null) {
      double distanceInMeters = Geolocator.distanceBetween(
        driverLocation!.latitude,
        driverLocation!.longitude,
        destination.latitude,
        destination.longitude,
      );
      
      double distanceInKm = distanceInMeters / 1000;
      double estimatedMinutes = (distanceInKm / 40) * 60; // Assuming 40 km/h average speed
      
      setState(() {
        distance = '${distanceInKm.toStringAsFixed(1)} km';
        estimatedTime = '${estimatedMinutes.round()} mins';
      });
    }
  }

  Future<void> _updateLocationToBackend(Position position) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.savedToken;
    
    if (token != null && tripData != null) {
      await TripsService.updateTripLocation(
        tripData!['bookingId'], 
        position.latitude, 
        position.longitude, 
        token,
      );
    }
  }

  Future<void> _completeTrip() async {
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
        final success = await TripsService.endTrip(tripData!['bookingId'], token);
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
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFFEF4444)),
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
  Widget build(BuildContext context) {
    if (tripData == null) {
      return const DriverHomeScreen();
    }

    final customer = tripData!['customer'] ?? {};
    final pickup = tripData!['pickup'] ?? {};
    final dropoff = tripData!['dropoff'] ?? {};

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: const Color(0xFF10B981),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Trip In Progress',
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'In Progress',
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Map Section
            Expanded(
              flex: 2,
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: GoogleMap(
                onMapCreated: (GoogleMapController controller) {
                  mapController = controller;
                  if (driverLocation != null) {
                    controller.animateCamera(
                      CameraUpdate.newLatLngZoom(driverLocation!, 15),
                    );
                  }
                },
                initialCameraPosition: CameraPosition(
                  target: driverLocation ?? const LatLng(28.6139, 77.2090), // Default to Delhi
                  zoom: 15,
                ),
                markers: markers,
                polylines: polylines,
                myLocationEnabled: true,
                myLocationButtonEnabled: true,
                zoomControlsEnabled: true,
                compassEnabled: true,
                trafficEnabled: true, // Show live traffic
                mapType: MapType.normal,
              ),
            ),
          ),
          
          // Trip Details Section
          Expanded(
            flex: 3,
            child: Container(
              color: Colors.white,
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Customer Info Card
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
                                    customer['name'] ?? 'Priya Patel',
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    customer['phone'] ?? '+919876543202',
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  child: IconButton(
                                    onPressed: () {
                                      // Add call functionality here
                                    },
                                    icon: const Icon(
                                      Icons.call,
                                      color: Color(0xFF10B981),
                                      size: 20,
                                    ),
                                    padding: EdgeInsets.zero,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Location Details
                      Row(
                        children: [
                          Expanded(
                            child: _buildLocationCard(
                              'PICKUP',
                              pickup['address'] ?? 'Andheri West, Mumbai, Maharashtra, India',
                              const Color(0xFF10B981),
                              Icons.location_on,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      Row(
                        children: [
                          Expanded(
                            child: _buildLocationCard(
                              'DROPOFF',
                              dropoff['address'] ?? 'Marine Drive, Mumbai, Maharashtra, India',
                              const Color(0xFFEF4444),
                              Icons.flag,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Trip Details
                      Row(
                        children: [
                          Expanded(
                            child: _buildInfoCard('Package', 'Custom Trip', Icons.card_giftcard),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildInfoCard('Amount', '₹1275', Icons.currency_rupee),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 50,
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => MapNavigationScreen(tripData: tripData!),
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF2196F3),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                icon: const Icon(Icons.navigation, color: Colors.white, size: 20),
                                label: Text(
                                  'Navigate',
                                  style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: isLoading ? null : _completeTrip,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFEF4444),
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
                                      'End Trip',
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
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationCard(String title, String address, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  address,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.grey[800],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFF10B981), size: 24),
          const SizedBox(height: 8),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}