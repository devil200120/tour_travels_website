import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/earnings_service.dart';
import '../providers/auth_provider.dart';
import 'advanced_analytics_screen.dart';

class EarningsHistoryScreen extends StatefulWidget {
  const EarningsHistoryScreen({Key? key}) : super(key: key);

  @override
  State<EarningsHistoryScreen> createState() => _EarningsHistoryScreenState();
}

class _EarningsHistoryScreenState extends State<EarningsHistoryScreen> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  List<Map<String, dynamic>> earningsHistory = [];
  List<Map<String, dynamic>> withdrawalHistory = [];
  Map<String, dynamic> earningsAnalytics = {};
  Map<String, dynamic> paymentMethods = {};
  
  bool isLoadingEarnings = true;
  bool isLoadingWithdrawals = true;
  int currentEarningsPage = 1;
  int currentWithdrawalPage = 1;
  String selectedPeriod = 'all';

  String formatDate(DateTime date) {
    final months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month]} ${date.day}, ${date.year}';
  }

  String formatTime(DateTime date) {
    final hour = date.hour > 12 ? date.hour - 12 : date.hour == 0 ? 12 : date.hour;
    final minute = date.minute.toString().padLeft(2, '0');
    final ampm = date.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $ampm';
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    await Future.wait([
      _loadEarningsHistory(),
      _loadWithdrawalHistory(),
      _loadEarningsAnalytics(),
    ]);
  }

  Future<void> _loadEarningsHistory({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        earningsHistory.clear();
        currentEarningsPage = 1;
        isLoadingEarnings = true;
      });
    }

    print('🔍 Loading earnings history...');
    print('📊 Selected period: $selectedPeriod');

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.savedToken;
      
      print('🔑 Auth token available: ${token != null ? 'Yes' : 'No'}');
      
      if (token != null) {
        final response = await EarningsService.getEarningsHistory(
          token,
          period: selectedPeriod,
          page: currentEarningsPage,
          limit: 20,
        );

        print('📈 Earnings response received: ${response != null ? 'Yes' : 'No'}');

        if (response != null && mounted) {
          final earnings = List<Map<String, dynamic>>.from(response['earnings'] ?? []);
          
          print('💰 Earnings found: ${earnings.length}');
          
          setState(() {
            if (refresh) {
              earningsHistory = earnings;
            } else {
              earningsHistory.addAll(earnings);
            }
            currentEarningsPage++;
            isLoadingEarnings = false;
          });
          
          // Show debug message if no earnings found
          if (earnings.isEmpty && refresh) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    selectedPeriod == 'today' 
                      ? 'No rides completed today. Complete some trips to see earnings!'
                      : 'No earnings found for $selectedPeriod period.',
                    style: GoogleFonts.poppins(),
                  ),
                  backgroundColor: const Color(0xFFF59E0B),
                ),
              );
            }
          }
        } else {
          print('❌ No response or null response from earnings service');
          if (mounted) {
            setState(() => isLoadingEarnings = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Unable to load earnings data. Check your connection and try again.',
                  style: GoogleFonts.poppins(),
                ),
                backgroundColor: const Color(0xFFEF4444),
                action: SnackBarAction(
                  label: 'Retry',
                  textColor: Colors.white,
                  onPressed: () => _loadEarningsHistory(refresh: true),
                ),
              ),
            );
          }
        }
      } else {
        print('❌ No auth token available');
        if (mounted) {
          setState(() => isLoadingEarnings = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Authentication required. Please login again.',
                style: GoogleFonts.poppins(),
              ),
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
      }
    } catch (e) {
      print('❌ Load earnings history error: $e');
      if (mounted) {
        setState(() => isLoadingEarnings = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Error loading earnings: ${e.toString()}',
              style: GoogleFonts.poppins(),
            ),
            backgroundColor: const Color(0xFFEF4444),
            action: SnackBarAction(
              label: 'Retry',
              textColor: Colors.white,
              onPressed: () => _loadEarningsHistory(refresh: true),
            ),
          ),
        );
      }
    }
  }

  Future<void> _loadWithdrawalHistory({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        withdrawalHistory.clear();
        currentWithdrawalPage = 1;
        isLoadingWithdrawals = true;
      });
    }

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.savedToken;
      if (token != null) {
        final response = await EarningsService.getWithdrawalHistory(
          token,
          page: currentWithdrawalPage,
          limit: 20,
        );

        if (response != null && mounted) {
          setState(() {
            if (refresh) {
              withdrawalHistory = List<Map<String, dynamic>>.from(response['withdrawals'] ?? []);
            } else {
              withdrawalHistory.addAll(List<Map<String, dynamic>>.from(response['withdrawals'] ?? []));
            }
            currentWithdrawalPage++;
            isLoadingWithdrawals = false;
          });
        }
      }
    } catch (e) {
      print('Load withdrawal history error: $e');
      if (mounted) {
        setState(() => isLoadingWithdrawals = false);
      }
    }
  }

  Future<void> _loadEarningsAnalytics() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.savedToken;
      if (token != null) {
        final analyticsResponse = await EarningsService.getEarningsAnalytics(token);
        final paymentMethodsResponse = await EarningsService.getPaymentMethods(token);

        if (analyticsResponse != null && paymentMethodsResponse != null && mounted) {
          setState(() {
            earningsAnalytics = analyticsResponse;
            paymentMethods = paymentMethodsResponse;
          });
        }
      }
    } catch (e) {
      print('Load earnings analytics error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFF10B981),
        foregroundColor: Colors.white,
        title: Text(
          'Earnings & Withdrawals',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Earnings'),
            Tab(text: 'Withdrawals'),
            Tab(text: 'Analytics'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildEarningsTab(),
          _buildWithdrawalsTab(),
          _buildAnalyticsTab(),
        ],
      ),
    );
  }

  Widget _buildEarningsTab() {
    return Column(
      children: [
        _buildPeriodFilter(),
        Expanded(
          child: isLoadingEarnings && earningsHistory.isEmpty
              ? _buildLoadingState()
              : earningsHistory.isEmpty
                  ? _buildEmptyState('No earnings history found')
                  : _buildEarningsList(),
        ),
      ],
    );
  }

  Widget _buildPeriodFilter() {
    final periods = [
      {'value': 'all', 'label': 'All Time'},
      {'value': 'today', 'label': 'Today'},
      {'value': 'week', 'label': 'This Week'},
      {'value': 'month', 'label': 'This Month'},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: periods.map((period) {
          final isSelected = selectedPeriod == period['value'];
          return Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  selectedPeriod = period['value']!;
                });
                _loadEarningsHistory(refresh: true);
              },
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF10B981) : Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF10B981) : Colors.grey[300]!,
                  ),
                ),
                child: Text(
                  period['label']!,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: isSelected ? Colors.white : Colors.grey[700],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEarningsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: earningsHistory.length + 1,
      itemBuilder: (context, index) {
        if (index == earningsHistory.length) {
          return _buildLoadMoreButton();
        }
        
        final earning = earningsHistory[index];
        return _buildEarningItem(earning);
      },
    );
  }

  Widget _buildEarningItem(Map<String, dynamic> earning) {
    // Handle both backend response formats
    final grossAmount = earning['grossAmount']?.toString() ?? earning['amount']?.toString() ?? '0';
    final netAmount = earning['netAmount']?.toString() ?? grossAmount;
    final tripId = earning['bookingId'] ?? earning['tripId'] ?? 'Unknown';
    final commission = earning['commission']?.toString() ?? (double.parse(grossAmount) * 0.15).toString();
    
    final dateStr = earning['date'] ?? earning['endTime'] ?? earning['createdAt'];
    final date = dateStr != null
        ? formatDate(DateTime.parse(dateStr))
        : 'Unknown Date';
    final time = dateStr != null
        ? formatTime(DateTime.parse(dateStr))
        : 'Unknown Time';
    final type = earning['type'] ?? 'trip';
    
    // Handle customer info
    final customer = earning['customer'] ?? {};
    final customerName = customer['name'] ?? 'Customer';

    IconData getEarningIcon(String type) {
      switch (type.toLowerCase()) {
        case 'trip':
          return Icons.drive_eta_rounded;
        case 'bonus':
          return Icons.card_giftcard_rounded;
        case 'incentive':
          return Icons.star_rounded;
        default:
          return Icons.account_balance_wallet_rounded;
      }
    }

    Color getEarningColor(String type) {
      switch (type.toLowerCase()) {
        case 'trip':
          return const Color(0xFF10B981);
        case 'bonus':
          return const Color(0xFFF59E0B);
        case 'incentive':
          return const Color(0xFF8B5CF6);
        default:
          return const Color(0xFF3B82F6);
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: getEarningColor(type).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  getEarningIcon(type),
                  color: getEarningColor(type),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      type.toUpperCase(),
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: getEarningColor(type),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Trip #$tripId',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      customerName,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$date at $time',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹$grossAmount',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: getEarningColor(type),
                    ),
                  ),
                  if (grossAmount != netAmount) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Commission: ₹$commission',
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        color: Colors.red[600],
                      ),
                    ),
                    Text(
                      'Net: ₹$netAmount',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.green[600],
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          
          // Show trip details if available
          if (earning['pickup'] != null || earning['dropoff'] != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  if (earning['pickup'] != null) ...[
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF10B981),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'From: ${earning['pickup']}',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: Colors.grey[700],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (earning['dropoff'] != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFFEF4444),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'To: ${earning['dropoff']}',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: Colors.grey[700],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (earning['distance'] != null || earning['duration'] != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        if (earning['distance'] != null)
                          Row(
                            children: [
                              const Icon(Icons.route, size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(
                                '${earning['distance']} km',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        if (earning['duration'] != null)
                          Row(
                            children: [
                              const Icon(Icons.timer, size: 14, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(
                                '${earning['duration']} mins',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildWithdrawalsTab() {
    return Column(
      children: [
        _buildWithdrawalSummary(),
        Expanded(
          child: isLoadingWithdrawals && withdrawalHistory.isEmpty
              ? _buildLoadingState()
              : withdrawalHistory.isEmpty
                  ? _buildEmptyState('No withdrawal history found')
                  : _buildWithdrawalsList(),
        ),
      ],
    );
  }

  Widget _buildWithdrawalSummary() {
    final availableBalance = paymentMethods['availableBalance']?.toString() ?? '0';
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'Available Balance',
            style: GoogleFonts.poppins(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '₹$availableBalance',
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _showWithdrawalDialog(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF10B981),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Request Withdrawal',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWithdrawalsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: withdrawalHistory.length + 1,
      itemBuilder: (context, index) {
        if (index == withdrawalHistory.length) {
          return _buildLoadMoreWithdrawalButton();
        }
        
        final withdrawal = withdrawalHistory[index];
        return _buildWithdrawalItem(withdrawal);
      },
    );
  }

  Widget _buildWithdrawalItem(Map<String, dynamic> withdrawal) {
    final amount = withdrawal['amount']?.toString() ?? '0';
    final status = withdrawal['status'] ?? 'pending';
    final date = withdrawal['createdAt'] != null
        ? formatDate(DateTime.parse(withdrawal['createdAt']))
        : 'Unknown Date';
    final bankAccount = withdrawal['bankAccount'] ?? 'Unknown Account';

    Color getStatusColor(String status) {
      switch (status.toLowerCase()) {
        case 'completed':
          return const Color(0xFF10B981);
        case 'processing':
          return const Color(0xFFF59E0B);
        case 'failed':
          return const Color(0xFFEF4444);
        default:
          return const Color(0xFF6B7280);
      }
    }

    IconData getStatusIcon(String status) {
      switch (status.toLowerCase()) {
        case 'completed':
          return Icons.check_circle_rounded;
        case 'processing':
          return Icons.schedule_rounded;
        case 'failed':
          return Icons.error_rounded;
        default:
          return Icons.pending_rounded;
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: getStatusColor(status).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              getStatusIcon(status),
              color: getStatusColor(status),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  status.toUpperCase(),
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: getStatusColor(status),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  bankAccount,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  date,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Text(
            '₹$amount',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: getStatusColor(status),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    final totalEarnings = earningsAnalytics['totalEarnings']?.toString() ?? '0';
    final totalTrips = earningsAnalytics['totalTrips']?.toString() ?? '0';
    final averageEarning = earningsAnalytics['averageEarningPerTrip']?.toString() ?? '0';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Quick Overview Cards
          Row(
            children: [
              Expanded(
                child: _buildQuickStatsCard(
                  title: 'Total Earnings',
                  value: '₹$totalEarnings',
                  icon: Icons.account_balance_wallet_rounded,
                  color: const Color(0xFF10B981),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQuickStatsCard(
                  title: 'Total Trips',
                  value: totalTrips,
                  icon: Icons.drive_eta_rounded,
                  color: const Color(0xFF3B82F6),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          _buildQuickStatsCard(
            title: 'Average Per Trip',
            value: '₹$averageEarning',
            icon: Icons.trending_up_rounded,
            color: const Color(0xFFF59E0B),
            isFullWidth: true,
          ),
          
          const SizedBox(height: 24),
          
          // Advanced Analytics Button
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF10B981), Color(0xFF059669)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(40),
                  ),
                  child: const Icon(
                    Icons.analytics_rounded,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Advanced Analytics',
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Get detailed insights with interactive charts,\nwave animations, and AI-powered analytics',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AdvancedAnalyticsScreen(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF10B981),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.show_chart, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'View Advanced Analytics',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Feature Preview Cards
          Text(
            'Available Features',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: _buildFeatureCard(
                  title: 'Live Charts',
                  subtitle: 'Interactive graphs\nwith real-time data',
                  icon: Icons.trending_up,
                  color: const Color(0xFF3B82F6),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildFeatureCard(
                  title: 'Wave Analytics',
                  subtitle: 'Beautiful animated\nperformance waves',
                  icon: Icons.graphic_eq,
                  color: const Color(0xFF8B5CF6),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildFeatureCard(
                  title: 'AI Insights',
                  subtitle: 'Smart recommendations\nfor better earnings',
                  icon: Icons.psychology,
                  color: const Color(0xFFFF9500),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildFeatureCard(
                  title: 'Heat Maps',
                  subtitle: 'Hourly performance\nvisualization',
                  icon: Icons.grid_view,
                  color: const Color(0xFFEF4444),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStatsCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    bool isFullWidth = false,
  }) {
    return Container(
      width: isFullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 10,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.poppins(
              fontSize: 10,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    bool isFullWidth = false,
  }) {
    return Container(
      width: isFullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: color,
              size: 24,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsBreakdownItem({
    required String label,
    required String amount,
    required Color color,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
            ),
          ),
          Text(
            amount,
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadMoreButton() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: ElevatedButton(
        onPressed: () => _loadEarningsHistory(),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF10B981),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(
          'Load More Earnings',
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildLoadMoreWithdrawalButton() {
    return Container(
      margin: const EdgeInsets.all(16),
      child: ElevatedButton(
        onPressed: () => _loadWithdrawalHistory(),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF10B981),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(
          'Load More Withdrawals',
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(
        color: Color(0xFF10B981),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              selectedPeriod == 'today' ? Icons.drive_eta : Icons.inbox_rounded,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              selectedPeriod == 'today' 
                ? 'No rides completed today'
                : message,
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              selectedPeriod == 'today' 
                ? 'Complete some trips to start earning! Check the \'Find Rides\' section for available orders.'
                : 'Complete trips in this period to see earnings data here.',
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _loadEarningsHistory(refresh: true),
              icon: const Icon(Icons.refresh, color: Colors.white),
              label: Text(
                'Refresh',
                style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => _showDebugInfo(),
              icon: const Icon(Icons.info_outline, color: Color(0xFF10B981)),
              label: Text(
                'Debug Info',
                style: GoogleFonts.poppins(
                  color: const Color(0xFF10B981),
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF10B981)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDebugInfo() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Debug Information',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Backend URL:', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              Text('http://localhost:5000/api/driver/earnings', style: GoogleFonts.poppins(fontSize: 12)),
              const SizedBox(height: 8),
              Text('Auth Token:', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              Text(authProvider.savedToken != null ? 'Available (${authProvider.savedToken!.substring(0, 20)}...)' : 'Not Available', style: GoogleFonts.poppins(fontSize: 12)),
              const SizedBox(height: 8),
              Text('Selected Period:', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              Text(selectedPeriod, style: GoogleFonts.poppins(fontSize: 12)),
              const SizedBox(height: 8),
              Text('Earnings Found:', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              Text('${earningsHistory.length} items', style: GoogleFonts.poppins(fontSize: 12)),
              const SizedBox(height: 16),
              Text(
                'If you have completed trips but don\'t see earnings:\n\n'
                '1. Check if the backend server is running on port 5000\n'
                '2. Verify your completed trips are stored in the database\n'
                '3. Check network connectivity to localhost:5000\n'
                '4. Review the console logs for error details',
                style: GoogleFonts.poppins(fontSize: 11, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Close',
              style: GoogleFonts.poppins(color: const Color(0xFF10B981)),
            ),
          ),
        ],
      ),
    );
  }

  void _showWithdrawalDialog() {
    final TextEditingController amountController = TextEditingController();
    String selectedAccount = '';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Request Withdrawal',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Amount (₹)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                prefixText: '₹ ',
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              decoration: InputDecoration(
                labelText: 'Bank Account',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'primary',
                  child: Text('Primary Account'),
                ),
                DropdownMenuItem(
                  value: 'secondary',
                  child: Text('Secondary Account'),
                ),
              ],
              onChanged: (value) {
                selectedAccount = value ?? '';
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(color: Colors.grey[600]),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              if (amountController.text.isNotEmpty && selectedAccount.isNotEmpty) {
                // TODO: Process withdrawal
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Withdrawal request submitted successfully!',
                      style: GoogleFonts.poppins(),
                    ),
                    backgroundColor: const Color(0xFF10B981),
                  ),
                );
                _loadWithdrawalHistory(refresh: true);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
            ),
            child: Text(
              'Request',
              style: GoogleFonts.poppins(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}