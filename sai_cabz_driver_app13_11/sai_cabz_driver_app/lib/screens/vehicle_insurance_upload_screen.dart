import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../routes.dart'; // ✅ for navigation
import '../theme.dart';

class VehicleInsuranceUploadScreen extends StatefulWidget {
  const VehicleInsuranceUploadScreen({super.key});

  @override
  State<VehicleInsuranceUploadScreen> createState() =>
      _VehicleInsuranceUploadScreenState();
}

class _VehicleInsuranceUploadScreenState
    extends State<VehicleInsuranceUploadScreen> {
  File? insuranceFront;
  File? insuranceBack;
  final picker = ImagePicker();

  Future<void> _pickImage(bool isFront) async {
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() {
        if (isFront) {
          insuranceFront = File(picked.path);
        } else {
          insuranceBack = File(picked.path);
        }
      });
    }
  }

  void _onSaveContinue() {
    if (insuranceFront == null || insuranceBack == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please upload both insurance images.")),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Insurance images uploaded successfully!")),
    );

    // ✅ Navigate to Vehicle Registration Upload Screen
    Future.delayed(const Duration(milliseconds: 500), () {
      Navigator.pushNamed(context, AppRoutes.vehicleRegistration);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          "Vehicle Insurance Images",
          style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white),
        ),
        backgroundColor: AppColors.primary,
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),

            // 🔹 Insurance Front Image
            const Text(
              "Vehicle Insurance front image",
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 10),
            _buildImageCard(insuranceFront, true),

            const SizedBox(height: 30),

            // 🔹 Insurance Back Image
            const Text(
              "Vehicle Insurance back image",
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 10),
            _buildImageCard(insuranceBack, false),

            const SizedBox(height: 50),

            // 🔹 Save & Continue Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _onSaveContinue,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  elevation: 3,
                ),
                child: const Text(
                  "Save & Continue",
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // 🔹 Reusable Image Picker Card
  Widget _buildImageCard(File? image, bool isFront) {
    return Stack(
      children: [
        Container(
          width: double.infinity,
          height: 230,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black12.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: image != null
                ? Image.file(image, fit: BoxFit.cover, width: double.infinity)
                : const Center(
                    child: Icon(
                      Icons.image_outlined,
                      color: Colors.grey,
                      size: 60,
                    ),
                  ),
          ),
        ),
        Positioned(
          bottom: 12,
          right: 12,
          child: FloatingActionButton.small(
            heroTag: isFront ? "front" : "back",
            onPressed: () => _pickImage(isFront),
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.edit, color: Colors.white),
          ),
        ),
      ],
    );
  }
}
