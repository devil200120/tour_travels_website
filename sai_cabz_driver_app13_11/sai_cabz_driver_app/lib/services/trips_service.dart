import 'dart:convert';
import 'package:http/http.dart' as http;

class TripsService {
  static const String baseUrl = 'http://localhost:5000/api/driver/trips';

  // Get current active trip
  static Future<Map<String, dynamic>?> getCurrentTrip(String? token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/current-trip'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Current trip response: ${response.statusCode}');
      print('Current trip body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Current trip error: $e');
      return null;
    }
  }

  // Get assigned/available orders for driver
  static Future<Map<String, dynamic>?> getOrders({
    String? status,
    int page = 1,
    int limit = 10,
    String? token,
  }) async {
    try {
      String url = '$baseUrl/orders?page=$page&limit=$limit';
      if (status != null && status.isNotEmpty && status != 'all') {
        url += '&status=$status';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Get orders response: ${response.statusCode}');
      print('Get orders body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Get orders error: $e');
      return null;
    }
  }

  // Get trip history with enhanced details
  static Future<Map<String, dynamic>?> getTripHistory({
    String? status,
    int page = 1,
    int limit = 10,
    String? token,
    String? dateFilter, // today, week, month, all
  }) async {
    try {
      String url = '$baseUrl/orders?page=$page&limit=$limit';
      if (status != null && status.isNotEmpty && status != 'all') {
        url += '&status=$status';
      }
      if (dateFilter != null && dateFilter.isNotEmpty && dateFilter != 'all') {
        url += '&dateFilter=$dateFilter';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Get trip history response: ${response.statusCode}');
      print('Get trip history body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Get trip history error: $e');
      return null;
    }
  }

  // Get available orders
  static Future<Map<String, dynamic>?> getAvailableOrders({
    String? token,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders?status=available&page=$page&limit=$limit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Available orders response: ${response.statusCode}');
      print('Available orders body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Available orders error: $e');
      return null;
    }
  }

  // Accept an order
  static Future<bool> acceptOrder(String orderId, String? token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders/$orderId/accept'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Accept order response: ${response.statusCode}');
      print('Accept order body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Accept order error: $e');
      return false;
    }
  }

  // Reject an order
  static Future<bool> rejectOrder(
    String orderId,
    String reason,
    String? token,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders/$orderId/reject'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'reason': reason}),
      );

      print('Reject order response: ${response.statusCode}');
      print('Reject order body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Reject order error: $e');
      return false;
    }
  }

  // Start trip
  static Future<bool> startTrip(String orderId, String? token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders/$orderId/start'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Start trip response: ${response.statusCode}');
      print('Start trip body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Start trip error: $e');
      return false;
    }
  }

  // End trip
  static Future<bool> endTrip(
    String orderId,
    String? token, {
    double? finalAmount,
    String? notes,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders/$orderId/complete'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          if (finalAmount != null) 'actualAmount': finalAmount,
          if (notes != null) 'tripSummary': notes,
        }),
      );

      print('End trip response: ${response.statusCode}');
      print('End trip body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('End trip error: $e');
      return false;
    }
  }

  // Cancel trip
  static Future<bool> cancelTrip(
    String orderId,
    String? token, {
    String? reason,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/orders/$orderId/cancel'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          if (reason != null) 'reason': reason,
          'cancellationType': 'driver',
        }),
      );

      print('Cancel trip response: ${response.statusCode}');
      print('Cancel trip body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Cancel trip error: $e');
      return false;
    }
  }

  // Get navigation details for a trip
  static Future<Map<String, dynamic>?> getNavigationDetails(
    String orderId,
    String? token,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders/$orderId/navigation'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Navigation details response: ${response.statusCode}');
      print('Navigation details body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['navigation'];
        }
      }
      return null;
    } catch (e) {
      print('Navigation details error: $e');
      return null;
    }
  }

  // Update trip location
  static Future<bool> updateTripLocation(
    String orderId,
    double lat,
    double lng,
    String? token,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/orders/$orderId/location'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'latitude': lat, 'longitude': lng}),
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
}
