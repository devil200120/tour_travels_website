import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../theme.dart';
import '../routes.dart';
import '../widgets/bottom_nav.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  GoogleMapController? _controller;
  final LatLng pickup = const LatLng(13.0850, 80.2101); // Anna Nagar (approx)
  final LatLng drop = const LatLng(13.0033, 80.1964);   // St. Thomas Mount (approx)

  late List<LatLng> _route;
  int _index = 0;
  Timer? _timer;
  bool _arrived = false;

  @override
  void initState() {
    super.initState();
    _route = _generateRoute(pickup, drop, 80);
    // Start simulated movement
    _timer = Timer.periodic(const Duration(milliseconds: 800), (t) {
      if (!mounted) return;
      setState(() {
        if (_index < _route.length - 1) {
          _index++;
          _controller?.animateCamera(CameraUpdate.newLatLng(_route[_index]));
        } else {
          _arrived = true;
          _timer?.cancel();
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  List<LatLng> _generateRoute(LatLng a, LatLng b, int steps) {
    final pts = <LatLng>[];
    for (int i=0;i<=steps;i++) {
      final t = i/steps;
      final lat = a.latitude + (b.latitude - a.latitude) * t;
      final lng = a.longitude + (b.longitude - a.longitude) * t;
      pts.add(LatLng(lat, lng));
    }
    return pts;
  }

  @override
  Widget build(BuildContext context) {
    final current = _route[_index];
    final polyline = Polyline(
      polylineId: const PolylineId('route'),
      color: AppColors.primary,
      width: 5,
      points: _route,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Trip in progress')),
      bottomNavigationBar: const BottomNav(currentIndex: 1),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(target: pickup, zoom: 13),
            onMapCreated: (c) {
              _controller = c;
              Future.delayed(const Duration(milliseconds: 300), () {
                _fitBounds();
              });
            },
            polylines: { polyline },
            markers: {
              Marker(markerId: const MarkerId('pickup'), position: pickup, icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen)),
              Marker(markerId: const MarkerId('drop'), position: drop, icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed)),
              Marker(markerId: const MarkerId('car'), position: current, icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure)),
            },
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
          ),

          Positioned(
            left: 16, right: 16, bottom: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: const [BoxShadow(color: Color(0x22000000), blurRadius: 8, offset: Offset(0,2))],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.route, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_arrived ? 'Arrived at destination' : 'Navigating to destination...', style: const TextStyle(fontWeight: FontWeight.w600))),
                      Text('${(_index / (_route.length-1) * 100).toStringAsFixed(0)}%'),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 52,
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: _arrived ? AppColors.danger : Colors.grey, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    onPressed: _arrived ? () {
                      // mock summary
                      Navigator.pushReplacementNamed(
                        context,
                        AppRoutes.tripEnd,
                        arguments: {
                          'fare': 1200,
                          'distanceKm': 25.0,
                          'timeMin': 40,
                        },
                      );
                    } : null,
                    child: Text(_arrived ? 'END TRIP' : 'Driving...'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _fitBounds() {
    final sw = LatLng(
      pickup.latitude < drop.latitude ? pickup.latitude : drop.latitude,
      pickup.longitude < drop.longitude ? pickup.longitude : drop.longitude,
    );
    final ne = LatLng(
      pickup.latitude > drop.latitude ? pickup.latitude : drop.latitude,
      pickup.longitude > drop.longitude ? pickup.longitude : drop.longitude,
    );
    _controller?.animateCamera(CameraUpdate.newLatLngBounds(LatLngBounds(southwest: sw, northeast: ne), 64));
  }
}
