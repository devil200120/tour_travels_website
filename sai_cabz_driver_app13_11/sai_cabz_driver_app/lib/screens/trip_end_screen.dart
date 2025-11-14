import 'package:flutter/material.dart';
import '../theme.dart';
import '../routes.dart';
import '../widgets/bottom_nav.dart';

class TripEndScreen extends StatelessWidget {
  const TripEndScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>? ?? {};
    final fare = args['fare'] ?? 1200;
    final distanceKm = (args['distanceKm'] ?? 25.0).toDouble();
    final timeMin = (args['timeMin'] ?? 40).toInt();

    return Scaffold(
      appBar: AppBar(title: const Text('Trip summary')),
      bottomNavigationBar: const BottomNav(currentIndex: 1),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [BoxShadow(color: Color(0x11000000), blurRadius: 8, offset: Offset(0,2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Trip completed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _SummaryTile(title: 'Fare', value: '₹ ${fare.toString()}'),
                      const SizedBox(width: 12),
                      _SummaryTile(title: 'Distance', value: '${distanceKm.toStringAsFixed(1)} km'),
                      const SizedBox(width: 12),
                      _SummaryTile(title: 'Time', value: '${(timeMin~/60)}h ${(timeMin%60)}m'),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                onPressed: () => Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (r) => false),
                child: const Text('GO TO HOME'),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  final String title;
  final String value;
  const _SummaryTile({required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: AppColors.subtext, fontSize: 12)),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
