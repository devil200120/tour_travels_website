import 'dart:convert';
import 'package:http/http.dart' as http;

class DashboardService {
  static const String baseUrl = 'http://localhost:5000/api/driver';
  
  // Get dashboard overview
  static Future<Map<String, dynamic>?> getDashboardOverview(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dashboard/overview'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Dashboard overview response: ${response.statusCode}');
      print('Dashboard overview body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['dashboard'];
        }
      }
      return null;
    } catch (e) {
      print('Dashboard overview error: $e');
      return null;
    }
  }

  // Get today's rides
  static Future<Map<String, dynamic>?> getTodayRides(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dashboard/today-rides'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Today rides response: ${response.statusCode}');
      print('Today rides body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Today rides error: $e');
      return null;
    }
  }

  // Get weekly performance
  static Future<Map<String, dynamic>?> getWeeklyPerformance(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dashboard/weekly-performance'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Weekly performance response: ${response.statusCode}');
      print('Weekly performance body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['weeklyPerformance'];
        }
      }
      return null;
    } catch (e) {
      print('Weekly performance error: $e');
      return null;
    }
  }

  // Get monthly analytics
  static Future<Map<String, dynamic>?> getMonthlyAnalytics(String token, {int? month, int? year}) async {
    try {
      String url = '$baseUrl/dashboard/monthly-analytics';
      if (month != null && year != null) {
        url += '?month=$month&year=$year';
      }
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['analytics'];
        }
      }
      return null;
    } catch (e) {
      print('Monthly analytics error: $e');
      return null;
    }
  }

  // Get earnings overview
  static Future<Map<String, dynamic>?> getEarningsOverview(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/earnings/earnings-overview'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Earnings overview response: ${response.statusCode}');
      print('Earnings overview body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Earnings overview error: $e');
      return null;
    }
  }

  // Update driver availability
  static Future<bool> updateAvailability(String token, bool isAvailable, String? reason) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/profile/availability'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'isAvailable': isAvailable,
          'reason': reason ?? (isAvailable ? 'Ready to take rides' : 'Going offline'),
        }),
      );

      print('Update availability response: ${response.statusCode}');
      print('Update availability body: ${response.body}');

      return response.statusCode == 200;
    } catch (e) {
      print('Update availability error: $e');
      return false;
    }
  }
}