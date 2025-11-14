import 'package:flutter/material.dart';

class AppColors {
  static const primary = Color(0xFF1565C0); // Blue from mock
  static const background = Color(0xFFF7F8FA);
  static const text = Color(0xFF0E1116);
  static const subtext = Color(0xFF6B7280);
  static const card = Colors.white;
  static const success = Color(0xFF2E7D32);
  static const danger = Color(0xFFC62828);
  static const border = Color(0xFFE5E7EB);
}

ThemeData buildTheme() {
  return ThemeData(
    useMaterial3: false,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.background,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.2),
      ),
    ),
  );
}
