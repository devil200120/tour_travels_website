import 'dart:convert';
import 'package:http/http.dart' as http;

class EarningsService {
  static const String baseUrl = 'http://localhost:5000/api/driver/earnings';
  
  // Test method to check completed trips directly
  static Future<Map<String, dynamic>?> getCompletedTripsDebug(String? token) async {
    try {
      // Try to get completed trips from the trips endpoint
      final response = await http.get(
        Uri.parse('http://localhost:5000/api/driver/trips/orders?status=Completed'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('🔍 Debug completed trips response: ${response.statusCode}');
      print('🔍 Debug completed trips body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('🔍 Debug completed trips error: $e');
      return null;
    }
  }
  
  // Get today's earnings
  static Future<Map<String, dynamic>?> getTodayEarnings(String? token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/today'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Today earnings response: ${response.statusCode}');
      print('Today earnings body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['todayEarnings'];
        }
      }
      return null;
    } catch (e) {
      print('Today earnings error: $e');
      return null;
    }
  }

  // Get weekly earnings
  static Future<Map<String, dynamic>?> getWeeklyEarnings(String? token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/week'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Weekly earnings response: ${response.statusCode}');
      print('Weekly earnings body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['weeklyEarnings'];
        }
      }
      return null;
    } catch (e) {
      print('Weekly earnings error: $e');
      return null;
    }
  }

  // Get monthly earnings
  static Future<Map<String, dynamic>?> getMonthlyEarnings(String? token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/month'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Monthly earnings response: ${response.statusCode}');
      print('Monthly earnings body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['monthlyEarnings'];
        }
      }
      return null;
    } catch (e) {
      print('Monthly earnings error: $e');
      return null;
    }
  }

  // Get earnings overview
  static Future<Map<String, dynamic>?> getEarningsOverview(String? token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/earnings-overview'),
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
          return data['earningsOverview'];
        }
      }
      return null;
    } catch (e) {
      print('Earnings overview error: $e');
      return null;
    }
  }

  // Get earnings history
  static Future<Map<String, dynamic>?> getEarningsHistory(String? token, {
    String? period,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      String url = '$baseUrl/earnings-history?page=$page&limit=$limit';
      if (period != null && period != 'all') {
        // Map period to date ranges for backend
        DateTime now = DateTime.now();
        String? startDate, endDate;
        
        switch (period) {
          case 'today':
            startDate = DateTime(now.year, now.month, now.day).toIso8601String();
            endDate = DateTime(now.year, now.month, now.day, 23, 59, 59).toIso8601String();
            break;
          case 'week':
            DateTime startOfWeek = now.subtract(Duration(days: now.weekday - 1));
            startDate = DateTime(startOfWeek.year, startOfWeek.month, startOfWeek.day).toIso8601String();
            endDate = now.toIso8601String();
            break;
          case 'month':
            startDate = DateTime(now.year, now.month, 1).toIso8601String();
            endDate = now.toIso8601String();
            break;
        }
        
        if (startDate != null) url += '&startDate=$startDate';
        if (endDate != null) url += '&endDate=$endDate';
      }

      print('🔍 Fetching earnings from: $url');

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📊 Earnings history response: ${response.statusCode}');
      print('📊 Earnings history body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        } else {
          print('❌ Backend returned success=false: ${data['message']}');
        }
      } else {
        print('❌ HTTP Error ${response.statusCode}: ${response.body}');
      }
      return null;
    } catch (e) {
      print('❌ Earnings history error: $e');
      return null;
    }
  }

  // Get withdrawal history
  static Future<Map<String, dynamic>?> getWithdrawalHistory(String? token, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/withdrawal-history?page=$page&limit=$limit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Withdrawal history response: ${response.statusCode}');
      print('Withdrawal history body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Withdrawal history error: $e');
      return null;
    }
  }

  // Get payment methods
  static Future<Map<String, dynamic>?> getPaymentMethods(String? token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/payment-methods'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Payment methods response: ${response.statusCode}');
      print('Payment methods body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data;
        }
      }
      return null;
    } catch (e) {
      print('Payment methods error: $e');
      return null;
    }
  }

  // Get earnings analytics
  static Future<Map<String, dynamic>?> getEarningsAnalytics(String? token, {
    String? period,
  }) async {
    try {
      String url = '$baseUrl/analytics';
      if (period != null) url += '?period=$period';

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('Earnings analytics response: ${response.statusCode}');
      print('Earnings analytics body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['analytics'];
        }
      }
      return null;
    } catch (e) {
      print('Earnings analytics error: $e');
      return null;
    }
  }

  // Request withdrawal
  static Future<bool> requestWithdrawal(String? token, {
    required double amount,
    required String paymentMethod,
    String? notes,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/request-withdrawal'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'amount': amount,
          'paymentMethod': paymentMethod,
          if (notes != null) 'notes': notes,
        }),
      );

      print('Request withdrawal response: ${response.statusCode}');
      print('Request withdrawal body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Request withdrawal error: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getAnalytics(String period, String token) async {
    try {
      print('🔍 Fetching analytics for period: $period');
      
      final response = await http.get(
        Uri.parse('$baseUrl/driver/earnings/analytics?period=$period'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📊 Analytics response: ${response.statusCode}');
      print('📊 Analytics body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return data['analytics'];
        }
      }
    } catch (error) {
      print('❌ Analytics error: $error');
    }
    
    return null;
  }
}