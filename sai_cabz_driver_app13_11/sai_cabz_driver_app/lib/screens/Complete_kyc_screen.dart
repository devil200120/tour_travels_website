import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sai_cabz_driver_app/providers/auth_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../routes.dart';
import '../theme.dart';

class CompleteKYCScreen extends StatefulWidget {
  const CompleteKYCScreen({super.key});

  @override
  State<CompleteKYCScreen> createState() => _CompleteKYCScreenState();
}

class _CompleteKYCScreenState extends State<CompleteKYCScreen> {
  bool _isChecking = true;
  bool _isFinalizing = false;

  @override
  void initState() {
    super.initState();
    _checkIfKycCompleted();
  }

  /// ✅ Check if user has already completed KYC
  Future<void> _checkIfKycCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    final bool? isKycDone = prefs.getBool('isKycCompleted');

    if (isKycDone == true && mounted) {
      // 🔹 Skip this screen and go to home
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } else {
      setState(() => _isChecking = false);
    }
  }

  /// ✅ Mark KYC as completed (SharedPreferences + secure token finalize)
  Future<void> _markKycAsCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isKycCompleted', true);

    // 🔐 Finalize signup: permanently save token and ID
    try {
      setState(() => _isFinalizing = true);

      final authProvider = context.read<AuthProvider>();
      await authProvider.finalizeSignupAfterKyc();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("✅ KYC Completed Successfully!"),
          backgroundColor: Colors.green,
        ),
      );

      // 🚀 Navigate to Home Screen
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } catch (e) {
      debugPrint("⚠️ Error finalizing signup: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Something went wrong while saving your KYC."),
          backgroundColor: Colors.redAccent,
        ),
      );
    } finally {
      if (mounted) setState(() => _isFinalizing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16, top: 8),
            child: ElevatedButton(
              onPressed: () {
                // TODO: Add help or support logic if needed
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary.withOpacity(0.9),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                elevation: 2,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
              ),
              child: const Text(
                "Need Help",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),

      // 🔹 Main KYC Section
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/kyc_verification.jpeg',
              height: 280,
              fit: BoxFit.contain,
            ),
            const SizedBox(height: 30),

            const Text(
              "Complete Your Documentation",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              "Kindly complete your KYC process by uploading necessary documents such as Aadhaar and Driver’s License.",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                height: 1.5,
                color: AppColors.subtext,
              ),
            ),
            const SizedBox(height: 40),

            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isFinalizing
                    ? null
                    : () async {
                        await _markKycAsCompleted();
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  elevation: 3,
                ),
                child: _isFinalizing
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        "Complete KYC",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
