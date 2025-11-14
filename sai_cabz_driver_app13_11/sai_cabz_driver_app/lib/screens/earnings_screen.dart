import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/foundation.dart'; // ✅ Add this line (important)
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _hasLocationPermission = false;

  final LatLng pickupLocation = const LatLng(13.0827, 80.2707); // Chennai
  final LatLng dropLocation = const LatLng(
    13.0101,
    80.2214,
  ); // St. Thomas Mount

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _requestLocationPermission();
  }

  Future<void> _requestLocationPermission() async {
    final status = await Permission.location.request();
    if (status.isGranted) {
      setState(() => _hasLocationPermission = true);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Location permission denied")),
        );
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1565C0),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 🔹 Header
            Container(
              width: double.infinity,
              color: const Color(0xFF1565C0),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 25),
              child: const Text(
                "Earnings",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

            // 🔹 White rounded container
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(40),
                    topRight: Radius.circular(40),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 10,
                      offset: Offset(0, -3),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 10),
                    TabBar(
                      controller: _tabController,
                      indicatorColor: Colors.blue,
                      labelColor: Colors.blue,
                      unselectedLabelColor: Colors.black54,
                      labelStyle: const TextStyle(fontWeight: FontWeight.bold),
                      tabs: const [
                        Tab(text: "Daily"),
                        Tab(text: "Weekly"),
                        Tab(text: "Total"),
                      ],
                    ),

                    // 🔹 Tab Views
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          // ---------------- DAILY TAB ----------------
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: SingleChildScrollView(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // ✅ Optimized Map (with RepaintBoundary)
                                  RepaintBoundary(
                                    child: TripMapView(
                                      pickupLocation: pickupLocation,
                                      dropLocation: dropLocation,
                                      hasPermission: _hasLocationPermission,
                                    ),
                                  ),
                                  const SizedBox(height: 15),

                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Column(
                                        children: [
                                          const Icon(
                                            Icons.location_on,
                                            color: Colors.blue,
                                            size: 22,
                                          ),
                                          Container(
                                            height: 80,
                                            width: 2,
                                            color: Colors.blue,
                                          ),
                                          const Icon(
                                            Icons.flag,
                                            color: Colors.blue,
                                            size: 18,
                                          ),
                                        ],
                                      ),
                                      const SizedBox(width: 10),
                                      const Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              "Pickup",
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            Text(
                                              "313, Anna Nagar, Chennai",
                                              style: TextStyle(
                                                color: Colors.black54,
                                              ),
                                            ),
                                            SizedBox(height: 60),
                                            Text(
                                              "Drop",
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            Text(
                                              "St. Thomas Mount",
                                              style: TextStyle(
                                                color: Colors.black54,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // ---------------- WEEKLY TAB ----------------
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  "Today's earnings",
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 5),
                                const Text(
                                  "₹1,200",
                                  style: TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 20),

                                Expanded(
                                  child: LineChart(
                                    LineChartData(
                                      gridData: FlGridData(show: false),
                                      borderData: FlBorderData(show: false),
                                      titlesData: FlTitlesData(show: false),
                                      lineBarsData: [
                                        LineChartBarData(
                                          isCurved: true,
                                          preventCurveOverShooting: true,
                                          dotData: FlDotData(show: false),
                                          color: Colors.blue,
                                          barWidth: 3,
                                          belowBarData: BarAreaData(
                                            show: false,
                                          ),
                                          spots: const [
                                            FlSpot(0, 500),
                                            FlSpot(1, 900),
                                            FlSpot(2, 1300),
                                            FlSpot(3, 1000),
                                            FlSpot(4, 1600),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // ---------------- TOTAL TAB ----------------
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: SingleChildScrollView(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    "Total Earnings Overview",
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 15),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildSummaryCard(
                                        "Total Earnings",
                                        "₹42,500",
                                        Icons.currency_rupee,
                                      ),
                                      _buildSummaryCard(
                                        "Trips Completed",
                                        "128",
                                        Icons.directions_car,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 15),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildSummaryCard(
                                        "Weekly Avg",
                                        "₹5,250",
                                        Icons.show_chart,
                                      ),
                                      _buildSummaryCard(
                                        "Best Day",
                                        "₹8,200",
                                        Icons.star_rate,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 25),
                                  const Text(
                                    "Earnings Growth (Last 6 Weeks)",
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 15),
                                  SizedBox(
                                    height: 250,
                                    child: BarChart(
                                      BarChartData(
                                        borderData: FlBorderData(show: false),
                                        gridData: FlGridData(show: false),
                                        titlesData: FlTitlesData(
                                          bottomTitles: AxisTitles(
                                            sideTitles: SideTitles(
                                              showTitles: true,
                                              reservedSize: 30,
                                              getTitlesWidget: (value, _) {
                                                const weeks = [
                                                  "W1",
                                                  "W2",
                                                  "W3",
                                                  "W4",
                                                  "W5",
                                                  "W6",
                                                ];
                                                return Text(
                                                  weeks[value.toInt() %
                                                      weeks.length],
                                                  style: const TextStyle(
                                                    color: Colors.black54,
                                                    fontSize: 12,
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        ),
                                        barGroups: List.generate(6, (index) {
                                          final heights = [
                                            4.2,
                                            5.5,
                                            6.8,
                                            5.0,
                                            7.3,
                                            8.0,
                                          ];
                                          return BarChartGroupData(
                                            x: index,
                                            barRods: [
                                              BarChartRodData(
                                                toY: heights[index],
                                                width: 18,
                                                borderRadius:
                                                    BorderRadius.circular(4),
                                              ),
                                            ],
                                          );
                                        }),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ✅ Summary Card Widget
  Widget _buildSummaryCard(String title, String value, IconData icon) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 6,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.blue, size: 22),
                const SizedBox(width: 6),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.black87,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ✅ Optimized Map Widget

class TripMapView extends StatefulWidget {
  final LatLng pickupLocation;
  final LatLng dropLocation;
  final bool hasPermission;

  const TripMapView({
    super.key,
    required this.pickupLocation,
    required this.dropLocation,
    required this.hasPermission,
  });

  @override
  State<TripMapView> createState() => _TripMapViewState();
}

class _TripMapViewState extends State<TripMapView>
    with AutomaticKeepAliveClientMixin {
  GoogleMapController? _controller;
  final Set<Polyline> _route = {};

  @override
  bool get wantKeepAlive => true; // ✅ Keeps map alive when switching tabs

  @override
  void initState() {
    super.initState();
    _createRoute();
  }

  /// ✅ Create polyline route between pickup and drop
  void _createRoute() {
    _route.add(
      Polyline(
        polylineId: const PolylineId("route"),
        color: Colors.blueAccent,
        width: 4,
        points: [widget.pickupLocation, widget.dropLocation],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // ✅ Important for mixin

    if (!widget.hasPermission) {
      return const Center(
        child: Text(
          "Requesting location permission...",
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(15),
      child: RepaintBoundary(
        child: SizedBox(
          height: 350,
          width: double.infinity,
          child: GoogleMap(
            mapType: MapType.normal,
            initialCameraPosition: CameraPosition(
              target: widget.pickupLocation,
              zoom: 12.5,
            ),
            markers: {
              Marker(
                markerId: const MarkerId('pickup'),
                position: widget.pickupLocation,
                infoWindow: const InfoWindow(title: 'Pickup Location'),
                icon: BitmapDescriptor.defaultMarkerWithHue(
                  BitmapDescriptor.hueBlue,
                ),
              ),
              Marker(
                markerId: const MarkerId('drop'),
                position: widget.dropLocation,
                infoWindow: const InfoWindow(title: 'Drop Location'),
                icon: BitmapDescriptor.defaultMarkerWithHue(
                  BitmapDescriptor.hueRed,
                ),
              ),
            },
            polylines: _route,
            myLocationEnabled: false,
            zoomControlsEnabled: false,
            compassEnabled: false,
            mapToolbarEnabled: false,
            onMapCreated: (controller) {
              _controller = controller;
            },
            gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
              // ✅ Works now
              Factory<OneSequenceGestureRecognizer>(
                () => EagerGestureRecognizer(),
              ),
            },
          ),
        ),
      ),
    );
  }
}
