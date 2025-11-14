import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'package:permission_handler/permission_handler.dart';
import '../providers/auth_provider.dart';
import '../services/trips_service.dart';
import 'home_screen.dart';

class MapNavigationScreen extends StatefulWidget {
  final Map<String, dynamic> tripData;

  const MapNavigationScreen({Key? key, required this.tripData}) : super(key: key);

  @override
  _MapNavigationScreenState createState() => _MapNavigationScreenState();
}

class _MapNavigationScreenState extends State<MapNavigationScreen> {
  late GoogleMapController mapController;
  Map<String, dynamic>? tripData;
  String tripStatus = 'In Progress';
  String currentPhase = 'pickup'; // pickup, dropoff
  bool isLoading = false;
  
  // Map data
  LatLng? currentLocation;
  LatLng? destinationLocation;
  Set<Marker> markers = {};
  Set<Polyline> polylines = {};
  
  // Trip details
  String? estimatedTime = '5 mins';
  String? distance = '2.5 km';
  StreamSubscription<Position>? positionStream;

  @override
  void initState() {
    super.initState();
    tripData = widget.tripData;
    tripStatus = tripData!['status'] ?? 'In Progress';
    _initializeMap();
  }

  @override
  void dispose() {
    positionStream?.cancel();
    super.dispose();
  }

  Future<void> _initializeMap() async {
    await _requestLocationPermission();
    await _getCurrentLocation();
    _setDestinationFromTripData();
    _startLocationTracking();
  }

  Future<void> _requestLocationPermission() async {
    final permission = await Permission.location.request();
    if (permission.isDenied) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Location permission is required for navigation',
            style: GoogleFonts.poppins(),
          ),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      setState(() {
        currentLocation = LatLng(position.latitude, position.longitude);
        _addCurrentLocationMarker();
      });
    } catch (e) {
      print('Error getting location: $e');
    }
  }

  void _setDestinationFromTripData() {
    final pickup = tripData!['pickup'] ?? {};
    final dropoff = tripData!['dropoff'] ?? {};
    
    // For demo purposes, using Mumbai coordinates
    // In real implementation, you would get these from tripData coordinates
    if (currentPhase == 'pickup') {
      destinationLocation = const LatLng(19.0760, 72.8777); // Mumbai pickup example
    } else {
      destinationLocation = const LatLng(19.0896, 72.8656); // Mumbai dropoff example
    }
    
    _addDestinationMarker();
  }

  void _addCurrentLocationMarker() {
    if (currentLocation != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('current_location'),
          position: currentLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: const InfoWindow(title: 'Your Location'),
        ),
      );
    }
  }

  void _addDestinationMarker() {
    if (destinationLocation != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('destination'),
          position: destinationLocation!,
          icon: BitmapDescriptor.defaultMarkerWithHue(
            currentPhase == 'pickup' ? BitmapDescriptor.hueGreen : BitmapDescriptor.hueRed,
          ),
          infoWindow: InfoWindow(
            title: currentPhase == 'pickup' ? 'Pickup Location' : 'Dropoff Location',
          ),
        ),
      );
    }
  }

  void _startLocationTracking() {
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    positionStream = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((position) {
      setState(() {
        currentLocation = LatLng(position.latitude, position.longitude);
        _updateCurrentLocationMarker();
        _calculateDistance();
      });
    });
  }

  void _updateCurrentLocationMarker() {
    markers.removeWhere((marker) => marker.markerId.value == 'current_location');
    _addCurrentLocationMarker();
  }

  void _calculateDistance() {
    if (currentLocation != null && destinationLocation != null) {
      final distanceInMeters = Geolocator.distanceBetween(
        currentLocation!.latitude,
        currentLocation!.longitude,
        destinationLocation!.latitude,
        destinationLocation!.longitude,
      );
      
      final distanceInKm = distanceInMeters / 1000;
      final estimatedTimeMinutes = (distanceInKm / 30 * 60).round(); // Assuming 30 km/h average
      
      setState(() {
        distance = '${distanceInKm.toStringAsFixed(1)} km';
        estimatedTime = '${estimatedTimeMinutes} mins';
      });
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    mapController = controller;
    _fitMarkersInView();
  }

  void _fitMarkersInView() {
    if (currentLocation != null && destinationLocation != null) {
      final bounds = LatLngBounds(
        southwest: LatLng(
          currentLocation!.latitude < destinationLocation!.latitude
              ? currentLocation!.latitude
              : destinationLocation!.latitude,
          currentLocation!.longitude < destinationLocation!.longitude
              ? currentLocation!.longitude
              : destinationLocation!.longitude,
        ),
        northeast: LatLng(
          currentLocation!.latitude > destinationLocation!.latitude
              ? currentLocation!.latitude
              : destinationLocation!.latitude,
          currentLocation!.longitude > destinationLocation!.longitude
              ? currentLocation!.longitude
              : destinationLocation!.longitude,
        ),
      );
      
      mapController.animateCamera(CameraUpdate.newLatLngBounds(bounds, 100));
    }
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

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const DriverHomeScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final customer = tripData!['customer'] ?? {};
    final pickup = tripData!['pickup'] ?? {};
    final dropoff = tripData!['dropoff'] ?? {};

    return Scaffold(
      body: Stack(
        children: [
          // Google Maps
          GoogleMap(
            onMapCreated: _onMapCreated,
            initialCameraPosition: CameraPosition(
              target: currentLocation ?? const LatLng(19.0760, 72.8777),
              zoom: 14.0,
            ),
            markers: markers,
            polylines: polylines,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            trafficEnabled: true,
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
                    Colors.black.withOpacity(0.6),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      currentPhase == 'pickup' ? 'Going to Pickup' : 'Going to Dropoff',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.timer, color: Color(0xFF10B981), size: 16),
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
                        const Icon(Icons.route, color: Color(0xFF10B981), size: 16),
                        const SizedBox(width: 4),
                        Text(
                          distance ?? '2.5 km',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF10B981),
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
                            },
                            icon: const Icon(
                              Icons.call,
                              color: Color(0xFF10B981),
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              // Add message functionality here
                            },
                            icon: const Icon(
                              Icons.message,
                              color: Color(0xFF10B981),
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
                                  color: currentPhase == 'pickup' ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                currentPhase == 'pickup' ? 'PICKUP LOCATION' : 'DROPOFF LOCATION',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: currentPhase == 'pickup' ? const Color(0xFF10B981) : const Color(0xFFEF4444),
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
                                    _setDestinationFromTripData();
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
                                side: const BorderSide(color: Color(0xFFEF4444)),
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