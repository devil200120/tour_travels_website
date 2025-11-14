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
    // Initialize map markers
    final pickup = tripData!['pickup'] ?? {};
    final dropoff = tripData!['dropoff'] ?? {};

    // Set pickup location (Mumbai example)
    pickupLocation = const LatLng(19.1358, 72.8258); // Andheri West
    dropoffLocation = const LatLng(18.9439, 72.8229); // Marine Drive

    _updateMarkers();
  }

  void _updateMarkers() {
    markers.clear();
    
    if (pickupLocation != null) {
      markers.add(Marker(
        markerId: const MarkerId('pickup'),
        position: pickupLocation!,
        infoWindow: const InfoWindow(title: 'Pickup Location'),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
      ));
    }

    if (dropoffLocation != null) {
      markers.add(Marker(
        markerId: const MarkerId('dropoff'),
        position: dropoffLocation!,
        infoWindow: const InfoWindow(title: 'Dropoff Location'),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
      ));
    }

    if (driverLocation != null) {
      markers.add(Marker(
        markerId: const MarkerId('driver'),
        position: driverLocation!,
        infoWindow: const InfoWindow(title: 'Your Location'),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
      ));
    }

    setState(() {});
  }

  Future<void> _getCurrentLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition();
      driverLocation = LatLng(position.latitude, position.longitude);
      _updateMarkers();
      
      if (mapController != null) {
        mapController!.animateCamera(
          CameraUpdate.newLatLngZoom(driverLocation!, 15),
        );
      }
    } catch (e) {
      print('Error getting location: $e');
    }
  }

  void _startLocationTracking() {
    // Start location updates every 10 seconds
    locationUpdateTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _getCurrentLocation();
    });

    // Also listen to position stream for real-time updates
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    positionStreamSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((Position position) {
      setState(() {
        driverLocation = LatLng(position.latitude, position.longitude);
        _updateMarkers();
      });
    });
  }

  Future<void> _completeTrip() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Complete Trip',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to complete this trip?',
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
              'Complete',
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
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) => const DriverHomeScreen()),
            (route) => false,
          );
        } else {
          setState(() {
            isLoading = false;
          });
          if (mounted) {
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
                    target: driverLocation ?? const LatLng(19.1358, 72.8258),
                    zoom: 15,
                  ),
                  markers: markers,
                  polylines: polylines,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: true,
                  zoomControlsEnabled: true,
                  compassEnabled: true,
                  trafficEnabled: true,
                  mapType: MapType.normal,
                ),
              ),
            ),
            
            // Trip Details Section
            Flexible(
              flex: 3,
              child: Container(
                color: Colors.white,
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Customer Info Card
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.person,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    customer['name'] ?? 'Rahul Gupta',
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    customer['phone'] ?? '+919876543203',
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                // Add call functionality here
                              },
                              icon: const Icon(
                                Icons.call,
                                color: Color(0xFF10B981),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Location Details
                      _buildLocationCard(
                        'PICKUP',
                        pickup['address'] ?? 'Powai, Mumbai, Maharashtra, India',
                        const Color(0xFF10B981),
                        Icons.location_on,
                      ),

                      const SizedBox(height: 8),

                      _buildLocationCard(
                        'DROPOFF',
                        dropoff['address'] ?? 'Navi Mumbai, Mumbai, Maharashtra, India',
                        const Color(0xFFEF4444),
                        Icons.flag,
                      ),

                      const SizedBox(height: 12),

                      // Trip Details
                      Row(
                        children: [
                          Expanded(
                            child: _buildInfoCard('Package', 'Custom Trip', Icons.card_giftcard),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildInfoCard('Amount', '₹994', Icons.currency_rupee),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 45,
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
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                icon: const Icon(Icons.navigation, color: Colors.white, size: 18),
                                label: Text(
                                  'Navigate',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
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
                              height: 45,
                              child: ElevatedButton(
                                onPressed: isLoading ? null : _completeTrip,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFEF4444),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: isLoading 
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Text(
                                      'End Trip',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
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
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard(String title, String address, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(8),
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
          const SizedBox(width: 8),
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
                    fontSize: 13,
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
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFF10B981), size: 20),
          const SizedBox(height: 6),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}