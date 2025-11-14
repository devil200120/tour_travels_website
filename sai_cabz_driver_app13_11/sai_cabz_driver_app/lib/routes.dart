import 'package:flutter/material.dart';
import 'package:sai_cabz_driver_app/screens/Complete_kyc_screen.dart';
import 'package:sai_cabz_driver_app/screens/aadhar_upload_screen.dart';
import 'package:sai_cabz_driver_app/screens/available_orders_screen.dart';
import 'package:sai_cabz_driver_app/screens/document_submitted_screen.dart';
import 'package:sai_cabz_driver_app/screens/driving_license_upload_screen.dart';
import 'package:sai_cabz_driver_app/screens/earnings_history_screen.dart';
import 'package:sai_cabz_driver_app/screens/earnings_screen.dart';
import 'package:sai_cabz_driver_app/screens/edit_profile_screen.dart';
import 'package:sai_cabz_driver_app/screens/home_screen.dart';
import 'package:sai_cabz_driver_app/screens/login_screen.dart';
import 'package:sai_cabz_driver_app/screens/otp_verification_screen.dart';
import 'package:sai_cabz_driver_app/screens/pan_card_upload_screen.dart';
import 'package:sai_cabz_driver_app/screens/profile_screen.dart';
import 'package:sai_cabz_driver_app/screens/settings_screen.dart';
import 'package:sai_cabz_driver_app/screens/sign_up_screen.dart';
import 'package:sai_cabz_driver_app/screens/splash_screen.dart';
import 'package:sai_cabz_driver_app/screens/tracking_screen.dart';
import 'package:sai_cabz_driver_app/screens/trip_end_screen.dart';
import 'package:sai_cabz_driver_app/screens/trip_request_screen.dart';
import 'package:sai_cabz_driver_app/screens/trips_history_screen.dart';
import 'package:sai_cabz_driver_app/screens/vehicle_insurance_upload_screen.dart';
import 'package:sai_cabz_driver_app/screens/vehicle_registration_upload_screen.dart';

class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const signup = '/signup';
  static const kyc = '/kyc';
  static const home = '/home';
  static const request = '/request';
  static const earnings = '/earnings';
  static const tracking = '/tracking';
  static const tripEnd = '/tripEnd';
  static const otpVerify = '/otpVerify';
  static const drivingLicense = '/drivingLicense';
  static const vehicleInsurance = '/vehicleInsurance';
  static const vehicleRegistration = '/vehicleRegistration';
  static const aadhar = '/aadhar';
  static const panCard = '/panCard';
  static const documentSubmitted = '/documentSubmitted';
  static const String profile = '/profile';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';
  
  // New routes for additional screens
  static const String availableOrders = '/availableOrders';
  static const String tripsHistory = '/tripsHistory';
  static const String earningsHistory = '/earningsHistory';
  static const String settings = '/settings';
  static const String editProfile = '/editProfile';
  // static const mapView = '/mapView';

  static Map<String, WidgetBuilder> map = {
    splash: (_) => const SplashScreen(),
    login: (_) => const LoginScreen(),
    signup: (_) => const SignupScreen(),
    kyc: (_) => const CompleteKYCScreen(),
    home: (_) => const DriverHomeScreen(),
    request: (_) => const TripRequestScreen(),
    earnings: (_) => const EarningsScreen(),
    tracking: (_) => const TrackingScreen(),
    tripEnd: (_) => const TripEndScreen(),
    otpVerify: (context) {
      final phone = ModalRoute.of(context)!.settings.arguments as String;
      return OtpVerifyScreen(phone: phone);
    },

    drivingLicense: (_) => const DrivingLicenseUploadScreen(),
    vehicleInsurance: (_) => const VehicleInsuranceUploadScreen(),
    vehicleRegistration: (_) => const VehicleRegistrationUploadScreen(),
    aadhar: (_) => const AadharUploadScreen(),
    panCard: (_) => const PanCardUploadScreen(),
    documentSubmitted: (_) => const DocumentSubmittedScreen(),
    profile: (context) => const ProfileScreen(),
    
    // New screen routes
    availableOrders: (_) => const AvailableOrdersScreen(),
    tripsHistory: (_) => const TripsHistoryScreen(),
    earningsHistory: (_) => const EarningsHistoryScreen(),
    settings: (_) => const SettingsScreen(),
    editProfile: (_) => const EditProfileScreen(),
    
    // forgotPassword: (context) => const ForgotPasswordScreen(),
    // resetPassword: (context) => const ResetPasswordScreen(),
    // mapView: (_) => const MapViewScreen(),
  };
}
