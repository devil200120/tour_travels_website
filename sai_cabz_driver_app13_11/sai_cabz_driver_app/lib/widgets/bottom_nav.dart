import 'package:flutter/material.dart';
import '../theme.dart';
import '../routes.dart';

class BottomNav extends StatefulWidget {
  final int currentIndex;
  const BottomNav({super.key, required this.currentIndex});

  @override
  State<BottomNav> createState() => _BottomNavState();
}

class _BottomNavState extends State<BottomNav> {
  void _onTap(int i) {
    switch (i) {
      case 0: Navigator.pushReplacementNamed(context, AppRoutes.home); break;
      case 1: Navigator.pushReplacementNamed(context, AppRoutes.request); break;
      case 2: Navigator.pushReplacementNamed(context, AppRoutes.earnings); break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: widget.currentIndex,
      onTap: _onTap,
      selectedItemColor: AppColors.primary,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: "Home"),
        BottomNavigationBarItem(icon: Icon(Icons.local_taxi_outlined), label: "Requests"),
        BottomNavigationBarItem(icon: Icon(Icons.bar_chart_outlined), label: "Earnings"),
      ],
    );
  }
}
