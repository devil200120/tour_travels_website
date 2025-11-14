import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

class MapViewScreen extends StatefulWidget {
  const MapViewScreen({super.key});

  @override
  State<MapViewScreen> createState() => _MapViewScreenState();
}

class _MapViewScreenState extends State<MapViewScreen> {
  GoogleMapController? _controller;
  bool _hasLocationPermission = false;
  bool _isLoading = true;

  final LatLng pickupLocation = const LatLng(13.0827, 80.2707); // Chennai
  final LatLng dropLocation = const LatLng(
    13.0101,
    80.2214,
  ); // St. Thomas Mount

  final Set<Polyline> _route = {};

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  Future<void> _initializeMap() async {
    await _requestLocationPermission();
    _addRouteLine();
    setState(() => _isLoading = false);
  }

  Future<void> _requestLocationPermission() async {
    final status = await Permission.locationWhenInUse.request();
    if (status.isGranted) {
      setState(() => _hasLocationPermission = true);
    } else if (status.isPermanentlyDenied) {
      openAppSettings();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Location permission permanently denied. Please enable it in settings.",
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Location permission denied")),
      );
    }
  }

  void _addRouteLine() {
    _route.add(
      Polyline(
        polylineId: const PolylineId("route"),
        color: Colors.blueAccent,
        width: 5,
        points: [pickupLocation, dropLocation],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Map View'),
        backgroundColor: const Color(0xFF1565C0),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _hasLocationPermission
          ? ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: GoogleMap(
                mapType: MapType.normal,
                initialCameraPosition: CameraPosition(
                  target: pickupLocation,
                  zoom: 12.5,
                ),
                markers: {
                  Marker(
                    markerId: const MarkerId('pickup'),
                    position: pickupLocation,
                    infoWindow: const InfoWindow(title: 'Pickup Location'),
                    icon: BitmapDescriptor.defaultMarkerWithHue(
                      BitmapDescriptor.hueBlue,
                    ),
                  ),
                  Marker(
                    markerId: const MarkerId('drop'),
                    position: dropLocation,
                    infoWindow: const InfoWindow(title: 'Drop Location'),
                    icon: BitmapDescriptor.defaultMarkerWithHue(
                      BitmapDescriptor.hueRed,
                    ),
                  ),
                },
                polylines: _route,
                zoomControlsEnabled: true,
                compassEnabled: true,
                myLocationEnabled: true,
                myLocationButtonEnabled: true,
                mapToolbarEnabled: true,
                gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
                  Factory<OneSequenceGestureRecognizer>(
                    () => EagerGestureRecognizer(),
                  ),
                },
                onMapCreated: (controller) {
                  _controller = controller;
                },
              ),
            )
          : const Center(
              child: Text(
                "Location permission not granted.",
                style: TextStyle(color: Colors.grey),
              ),
            ),
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
}
