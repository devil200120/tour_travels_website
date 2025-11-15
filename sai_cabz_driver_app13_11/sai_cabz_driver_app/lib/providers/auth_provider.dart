// providers/auth_provider.dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AuthProvider with ChangeNotifier {
  // -----------------------
  // Config
  // -----------------------
  static const String baseUrl =
      "http://localhost:5000/api/driver"; // Changed to local backend
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // -----------------------
  // State
  // -----------------------
  bool isLoading = false;
  bool isInitialized = false;
  String? errorMessage;
  String? verificationId;
  String? _tempPhone;
  String? savedToken;
  String? savedDriverId;

  // -----------------------
  // Init
  // -----------------------
  Future<void> initAuth() async {
    if (isInitialized) return;
    isInitialized = true;

    try {
      savedToken = await _storage.read(key: "driver_token");
      savedDriverId = await _storage.read(key: "driver_id");
    } catch (e) {
      debugPrint("Error reading secure storage: $e");
    }

    notifyListeners();
  }

  // -----------------------
  // Request OTP (backend -> then firebase)
  // -----------------------
  Future<bool> requestOtp(String phone) async {
    try {
      isLoading = true;
      errorMessage = null;
      notifyListeners();

      _tempPhone = phone;
      final url = Uri.parse("$baseUrl/auth/login/request-otp");

      final response = await http
          .post(
            url,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({"phone": phone}),
          )
          .timeout(const Duration(seconds: 60));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data["success"] == true) {
        await _sendOtpWithFirebase(phone);
        return true;
      } else {
        errorMessage = data["message"] ?? "Failed to request OTP";
        return false;
      }
    } catch (e) {
      errorMessage = "OTP request failed: $e";
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // -----------------------
  // Send OTP using Firebase
  // -----------------------
  Future<void> _sendOtpWithFirebase(String phone) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phone,
      timeout: const Duration(seconds: 60),
      verificationCompleted: (PhoneAuthCredential credential) async {
        try {
          await _auth.signInWithCredential(credential);
          debugPrint("Auto verification completed");
        } catch (_) {}
      },
      verificationFailed: (FirebaseAuthException e) {
        errorMessage = e.message;
        notifyListeners();
      },
      codeSent: (String verId, int? resendToken) {
        verificationId = verId;
        notifyListeners();
      },
      codeAutoRetrievalTimeout: (String verId) {
        verificationId = verId;
      },
    );
  }

  // -----------------------
  // Verify OTP (backend + firebase)
  // -----------------------
  Future<bool> verifyOtp(String otp) async {
    if (_tempPhone == null) {
      errorMessage = "No phone stored. Please request OTP again.";
      return false;
    }

    try {
      isLoading = true;
      errorMessage = null;
      notifyListeners();

      final url = Uri.parse("$baseUrl/auth/login/verify-otp");
      final response = await http
          .post(
            url,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({"phone": _tempPhone, "otp": otp}),
          )
          .timeout(const Duration(seconds: 60));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        // Try firebase sign-in with sms code if verificationId present
        if (verificationId != null) {
          try {
            final credential = PhoneAuthProvider.credential(
              verificationId: verificationId!,
              smsCode: otp,
            );
            await _auth.signInWithCredential(credential);
          } catch (_) {
            // firebase sign-in optional — we continue even if it fails
            debugPrint("Firebase sign-in via OTP failed (non-fatal).");
          }
        }

        final token = data["token"];
        final driver = data["driver"];
        if (token != null && driver != null) {
          await _storage.write(key: "driver_token", value: token.toString());
          await _storage.write(
            key: "driver_id",
            value: driver["_id"].toString(),
          );
          savedToken = token.toString();
          savedDriverId = driver["_id"].toString();
        }

        return true;
      } else {
        errorMessage = data["message"] ?? "OTP verification failed";
        return false;
      }
    } catch (e) {
      errorMessage = "OTP verification failed: $e";
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // -----------------------
  // Signup with documents (multipart)
  // -----------------------
  Future<bool> signupWithDocuments({
    required String name,
    required String phone,
    required String email,
    required String password,
    required String licenseNumber,
    required int experience,
    required String vehicleNumber,
    required File aadharFile,
    required File panFile,
    required File licenseFile,
    required File policeVerificationFile,
    required File medicalCertificateFile,
    required String dateOfBirth,
    required String licenseExpiry,
    required String licenseType,
    required String alternatePhone,
    required String address,
    required String emergencyContact,
    required String languages,
    required String specializations,
    required String bankDetails,
  }) async {
    try {
      isLoading = true;
      errorMessage = null;
      notifyListeners();

      final url = Uri.parse("$baseUrl/auth/signup");
      final request = http.MultipartRequest('POST', url);

      request.fields.addAll({
        "name": name,
        "phone": phone,
        "email": email,
        "password": password,
        "licenseNumber": licenseNumber,
        "experience": experience.toString(),
        "vehicleNumber": vehicleNumber,
        "dateOfBirth": dateOfBirth,
        "licenseExpiry": licenseExpiry,
        "licenseType": licenseType,
        "alternatePhone": alternatePhone,
        "address": address,
        "emergencyContact": emergencyContact,
        "languages": languages,
        "specializations": specializations,
        "bankDetails": bankDetails,
      });

      // files keys expected by backend
      request.files.add(
        await http.MultipartFile.fromPath('aadhar', aadharFile.path),
      );
      request.files.add(await http.MultipartFile.fromPath('pan', panFile.path));
      request.files.add(
        await http.MultipartFile.fromPath('license', licenseFile.path),
      );
      request.files.add(
        await http.MultipartFile.fromPath(
          'policeVerification',
          policeVerificationFile.path,
        ),
      );
      request.files.add(
        await http.MultipartFile.fromPath(
          'medicalCertificate',
          medicalCertificateFile.path,
        ),
      );

      final streamed = await request.send().timeout(
        const Duration(seconds: 180),
      );
      final response = await http.Response.fromStream(streamed);

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Optionally store token returned on signup
        if (data is Map && data["token"] != null && data["driver"] != null) {
          await _storage.write(
            key: "driver_token",
            value: data["token"].toString(),
          );
          await _storage.write(
            key: "driver_id",
            value: data["driver"]["_id"].toString(),
          );
        }
        return true;
      } else {
        errorMessage = (data is Map && data["message"] != null)
            ? data["message"].toString()
            : "Signup failed";
        return false;
      }
    } catch (e) {
      errorMessage = "Signup failed: $e";
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // =======================
  // 🔹 FETCH DRIVER PROFILE
  // =======================
  Future<Map<String, dynamic>?> fetchDriverProfile() async {
    try {
      isLoading = true;
      errorMessage = null;
      notifyListeners();

      final token = await _storage.read(key: "driver_token");
      if (token == null) {
        errorMessage = "No login token found.";
        return null;
      }

      final url = Uri.parse("$baseUrl/auth/profile");

      final response = await http.get(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        debugPrint("👤 Profile Loaded Successfully");
        return data["driver"];
      } else {
        errorMessage = data["message"] ?? "Unable to load profile.";
        debugPrint("⚠️ Profile Error: $errorMessage");
        return null;
      }
    } catch (e) {
      errorMessage = "Profile request failed: $e";
      debugPrint("❌ Profile Exception: $e");
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // ===========================================
  //  FINALIZE SIGNUP AFTER KYC (REQUIRED)
  // ===========================================
  Future<void> finalizeSignupAfterKyc() async {
    try {
      // Re-read stored login token and ID
      savedToken = await _storage.read(key: "driver_token");
      savedDriverId = await _storage.read(key: "driver_id");

      debugPrint(
        "✅ finalizeSignupAfterKyc executed. Token: $savedToken, DriverID: $savedDriverId",
      );
    } catch (e) {
      debugPrint("❌ finalizeSignupAfterKyc error: $e");
    }
  }

  // -----------------------
  // Logout
  // -----------------------
  Future<void> logout() async {
    await _storage.deleteAll();
    savedToken = null;
    savedDriverId = null;
    notifyListeners();
  }
}
