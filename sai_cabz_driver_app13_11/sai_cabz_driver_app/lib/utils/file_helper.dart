import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

// Universal file handling for both web and mobile
abstract class FileHelper {
  static Future<http.MultipartFile> createMultipartFile({
    required String fieldName,
    required Uint8List bytes,
    required String fileName,
    String? mimeType,
  }) async {
    if (kIsWeb) {
      // For web: Use bytes directly
      return http.MultipartFile.fromBytes(fieldName, bytes, filename: fileName);
    } else {
      // For mobile: This shouldn't be called directly, use fromPath instead
      throw UnsupportedError('Use createMultipartFileFromPath for mobile');
    }
  }

  static Future<http.MultipartFile> createMultipartFileFromPath({
    required String fieldName,
    required String filePath,
  }) async {
    if (kIsWeb) {
      throw UnsupportedError('Use createMultipartFile with bytes for web');
    } else {
      // For mobile: Use file path
      return http.MultipartFile.fromPath(fieldName, filePath);
    }
  }

  static String bytesToBase64(Uint8List bytes) {
    return base64Encode(bytes);
  }
}
