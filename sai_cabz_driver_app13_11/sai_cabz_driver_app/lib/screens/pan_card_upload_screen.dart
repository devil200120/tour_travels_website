import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../routes.dart';
import '../theme.dart';

class PanCardUploadScreen extends StatefulWidget {
  const PanCardUploadScreen({super.key});

  @override
  State<PanCardUploadScreen> createState() => _PanCardUploadScreenState();
}

class _PanCardUploadScreenState extends State<PanCardUploadScreen> {
  File? _frontImage;
  File? _backImage;
  final ImagePicker _picker = ImagePicker();

  // 🔹 Pick Image (Gallery)
  Future<void> _pickImage(bool isFront) async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        if (isFront) {
          _frontImage = File(pickedFile.path);
        } else {
          _backImage = File(pickedFile.path);
        }
      });
    }
  }

  // 🔹 Save and Continue Button Action
  void _onSaveContinue() {
    if (_frontImage == null || _backImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Please upload both front and back images of your PAN card.',
          ),
        ),
      );
      return;
    }

    // ✅ Show Success Message then Navigate to Document Submitted Screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("PAN Card uploaded successfully!")),
    );

    Future.delayed(const Duration(milliseconds: 500), () {
      Navigator.pushNamed(context, AppRoutes.documentSubmitted);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          "PAN Card Images",
          style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white),
        ),
        backgroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 🔹 Front Image Section
              const Text(
                "PAN Card front image",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 12),
              _buildImageBox(isFront: true, file: _frontImage),

              const SizedBox(height: 30),

              // 🔹 Back Image Section
              const Text(
                "PAN Card back image",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 12),
              _buildImageBox(isFront: false, file: _backImage),

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
      ),
    );
  }

  // 🔹 Reusable Image Box Widget
  Widget _buildImageBox({required bool isFront, required File? file}) {
    return Stack(
      children: [
        Container(
          width: double.infinity,
          height: 230,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
            boxShadow: const [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 6,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: file != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(
                    file,
                    fit: BoxFit.cover,
                    width: double.infinity,
                  ),
                )
              : const Center(
                  child: Icon(
                    Icons.image_outlined,
                    color: Colors.grey,
                    size: 60,
                  ),
                ),
        ),
        Positioned(
          bottom: 10,
          right: 10,
          child: InkWell(
            onTap: () => _pickImage(isFront),
            borderRadius: BorderRadius.circular(30),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 4)],
              ),
              child: const Icon(Icons.edit, color: AppColors.primary, size: 22),
            ),
          ),
        ),
      ],
    );
  }
}
