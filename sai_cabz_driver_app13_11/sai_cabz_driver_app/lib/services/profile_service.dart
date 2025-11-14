import 'dart:convert';
import 'package:http/http.dart' as http;

class ProfileService {
  static const String baseUrl = 'http://localhost:5000/api/driver/profile';
  
  // Get driver profile
  static Future<Map<String, dynamic>?> getProfile(String? token) async {
    try {
      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Get profile response: ${response.statusCode}');
      print('Get profile body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['profile'];
        }
      }
      return null;
    } catch (e) {
      print('Get profile error: $e');
      return null;
    }
  }

  // Update driver profile
  static Future<bool> updateProfile(String? token, Map<String, dynamic> profileData) async {
    try {
      final response = await http.put(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(profileData),
      );

      print('Update profile response: ${response.statusCode}');
      print('Update profile body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Update profile error: $e');
      return false;
    }
  }

  // Get driver settings
  static Future<Map<String, dynamic>?> getSettings(String? token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/settings'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Get settings response: ${response.statusCode}');
      print('Get settings body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['settings'];
        }
      }
      return null;
    } catch (e) {
      print('Get settings error: $e');
      return null;
    }
  }

  // Update driver settings
  static Future<bool> updateSettings(String? token, Map<String, dynamic> settingsData) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/settings'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(settingsData),
      );

      print('Update settings response: ${response.statusCode}');
      print('Update settings body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Update settings error: $e');
      return false;
    }
  }

  // Get nearby drivers
  static Future<Map<String, dynamic>?> getNearbyDrivers(String? token, {
    required double latitude,
    required double longitude,
    double radius = 10.0,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/nearby-drivers?lat=$latitude&lng=$longitude&radius=$radius'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Nearby drivers response: ${response.statusCode}');
      print('Nearby drivers body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Nearby drivers error: $e');
      return null;
    }
  }

  // Update driver location
  static Future<bool> updateLocation(String? token, {
    required double latitude,
    required double longitude,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/update-location'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'latitude': latitude,
          'longitude': longitude,
        }),
      );

      print('Update location response: ${response.statusCode}');
      print('Update location body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Update location error: $e');
      return false;
    }
  }

  // Upload profile image
  static Future<bool> uploadProfileImage(String? token, String imagePath) async {
    try {
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload-image'));
      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });
      
      request.files.add(await http.MultipartFile.fromPath('profileImage', imagePath));

      var response = await request.send();
      var responseBody = await response.stream.bytesToString();

      print('Upload image response: ${response.statusCode}');
      print('Upload image body: $responseBody');

      if (response.statusCode == 200) {
        final data = jsonDecode(responseBody);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Upload image error: $e');
      return false;
    }
  }
}