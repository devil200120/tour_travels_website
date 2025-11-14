import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';

class WebCompatibleFile {
  final String name;
  final Uint8List bytes;
  final String? path; // null on web

  WebCompatibleFile({required this.name, required this.bytes, this.path});
}

class WebFilePickerHelper {
  static Future<WebCompatibleFile?> pickImage() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        withData: true, // Important for web - loads file bytes
      );

      if (result != null && result.files.single != null) {
        PlatformFile file = result.files.single;

        if (kIsWeb) {
          // On web, bytes are available
          if (file.bytes != null) {
            return WebCompatibleFile(
              name: file.name,
              bytes: file.bytes!,
              path: null, // No path on web
            );
          }
        } else {
          // On mobile, we need to read the file
          if (file.path != null) {
            // For mobile, we'll handle this differently
            return WebCompatibleFile(
              name: file.name,
              bytes: Uint8List(0), // Empty for mobile, will use path
              path: file.path,
            );
          }
        }
      }
    } catch (e) {
      print('Error picking file: $e');
    }
    return null;
  }

  static Future<List<WebCompatibleFile>> pickMultipleImages() async {
    List<WebCompatibleFile> files = [];

    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: true,
        withData: kIsWeb, // Only load bytes on web
      );

      if (result != null) {
        for (PlatformFile file in result.files) {
          if (kIsWeb && file.bytes != null) {
            files.add(
              WebCompatibleFile(
                name: file.name,
                bytes: file.bytes!,
                path: null,
              ),
            );
          } else if (!kIsWeb && file.path != null) {
            files.add(
              WebCompatibleFile(
                name: file.name,
                bytes: Uint8List(0),
                path: file.path,
              ),
            );
          }
        }
      }
    } catch (e) {
      print('Error picking files: $e');
    }

    return files;
  }
}
