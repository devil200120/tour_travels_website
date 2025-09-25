import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
} from "lucide-react";

const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [selectedReport, setSelectedReport] = useState("overview");

  // Static analytics data
  const analyticsData = {
    overview: {
      totalRevenue: 1547826,
      totalBookings: 684,
      totalCustomers: 425,
      avgBookingValue: 2263,
      revenueGrowth: 15.4,
      bookingGrowth: 8.7,
      customerGrowth: 12.3,
      conversionRate: 3.8,
    },
    bookings: {
      byStatus: {
        completed: 456,
        confirmed: 89,
        pending: 67,
        cancelled: 72,
      },
      byType: {
        "City Ride": 245,
        Outstation: 189,
        "Package Tour": 156,
        "Airport Transfer": 94,
      },
      byMonth: [
        { month: "Jan", bookings: 45, revenue: 112500 },
        { month: "Feb", bookings: 52, revenue: 128400 },
        { month: "Mar", bookings: 61, revenue: 145600 },
        { month: "Apr", bookings: 58, revenue: 139200 },
        { month: "May", bookings: 67, revenue: 162800 },
        { month: "Jun", bookings: 73, revenue: 178500 },
        { month: "Jul", bookings: 81, revenue: 195600 },
        { month: "Aug", bookings: 89, revenue: 218400 },
        { month: "Sep", bookings: 94, revenue: 231200 },
      ],
    },
    customers: {
      byTier: {
        Platinum: 28,
        Gold: 67,
        Silver: 134,
        Bronze: 196,
      },
      byLocation: {
        Delhi: 125,
        Mumbai: 89,
        Bangalore: 76,
        Chennai: 54,
        Hyderabad: 43,
        Pune: 38,
      },
      retention: {
        new: 145,
        returning: 280,
        retentionRate: 65.9,
      },
    },
    vehicles: {
      utilization: {
        high: 4, // >80%
        medium: 8, // 60-80%
        low: 6, // <60%
      },
      performance: {
        totalTrips: 1247,
        totalDistance: 45680,
        avgRating: 4.7,
        fuelEfficiency: 16.2,
      },
    },
    revenue: {
      bySource: {
        "Package Tours": 485600,
        "City Rides": 324800,
        Outstation: 456200,
        "Airport Transfers": 281226,
      },
      byPaymentMethod: {
        "Credit Card": 512400,
        UPI: 387600,
        "Net Banking": 298500,
        "Debit Card": 245600,
        Wallet: 103726,
      },
    },
  };

  const topPackages = [
    { name: "Golden Triangle Tour", bookings: 156, revenue: 4055844 },
    { name: "Kerala Backwaters", bookings: 89, revenue: 1690911 },
    { name: "Goa Beach Paradise", bookings: 203, revenue: 2638797 },
    { name: "Rajasthan Heritage", bookings: 124, revenue: 4463876 },
    { name: "Himalayan Trek", bookings: 67, revenue: 1071933 },
  ];

  const topDrivers = [
    { name: "Amit Singh", trips: 1247, rating: 4.9, earnings: 45600 },
    { name: "Vikash Yadav", trips: 892, rating: 4.8, earnings: 38900 },
    { name: "Suresh Patel", trips: 956, rating: 4.8, earnings: 41200 },
    { name: "Ravi Kumar", trips: 678, rating: 4.7, earnings: 32100 },
    { name: "Karthik Raja", trips: 534, rating: 4.6, earnings: 28750 },
  ];

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{(analyticsData.overview.totalRevenue / 100000).toFixed(1)}L
            </p>
            <div className="flex items-center mt-1">
              {getGrowthIcon(analyticsData.overview.revenueGrowth)}
              <span
                className={`text-sm ml-1 ${getGrowthColor(
                  analyticsData.overview.revenueGrowth
                )}`}
              >
                {analyticsData.overview.revenueGrowth}%
              </span>
            </div>
          </div>
          <div className="text-2xl">💰</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">
              {analyticsData.overview.totalBookings}
            </p>
            <div className="flex items-center mt-1">
              {getGrowthIcon(analyticsData.overview.bookingGrowth)}
              <span
                className={`text-sm ml-1 ${getGrowthColor(
                  analyticsData.overview.bookingGrowth
                )}`}
              >
                {analyticsData.overview.bookingGrowth}%
              </span>
            </div>
          </div>
          <div className="text-2xl">📊</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900">
              {analyticsData.overview.totalCustomers}
            </p>
            <div className="flex items-center mt-1">
              {getGrowthIcon(analyticsData.overview.customerGrowth)}
              <span
                className={`text-sm ml-1 ${getGrowthColor(
                  analyticsData.overview.customerGrowth
                )}`}
              >
                {analyticsData.overview.customerGrowth}%
              </span>
            </div>
          </div>
          <div className="text-2xl">👥</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Booking Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{analyticsData.overview.avgBookingValue}
            </p>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-600">
                Conversion: {analyticsData.overview.conversionRate}%
              </span>
            </div>
          </div>
          <div className="text-2xl">💳</div>
        </div>
      </div>
    </div>
  );

  const renderBookingCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Booking Status Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bookings by Status
        </h3>
        <div className="space-y-3">
          {Object.entries(analyticsData.bookings.byStatus).map(
            ([status, count]) => {
              const total = Object.values(
                analyticsData.bookings.byStatus
              ).reduce((a, b) => a + b, 0);
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        status === "completed"
                          ? "bg-green-500"
                          : status === "confirmed"
                          ? "bg-blue-500"
                          : status === "pending"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600 capitalize">
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Booking Type Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bookings by Type
        </h3>
        <div className="space-y-3">
          {Object.entries(analyticsData.bookings.byType).map(
            ([type, count]) => {
              const total = Object.values(analyticsData.bookings.byType).reduce(
                (a, b) => a + b,
                0
              );
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{type}</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      {count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );

  const renderTopPerformers = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Packages */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Performing Packages
        </h3>
        <div className="space-y-4">
          {topPackages.map((pkg, index) => (
            <div
              key={pkg.name}
              className="flex items-center justify-between border-b border-gray-100 pb-2"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {pkg.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {pkg.bookings} bookings
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  ₹{(pkg.revenue / 100000).toFixed(1)}L
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Drivers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Performing Drivers
        </h3>
        <div className="space-y-4">
          {topDrivers.map((driver, index) => (
            <div
              key={driver.name}
              className="flex items-center justify-between border-b border-gray-100 pb-2"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {driver.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {driver.trips} trips • ⭐ {driver.rating}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  ₹{driver.earnings.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <div className="flex space-x-3">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last 1 year</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "bookings", label: "Bookings", icon: Calendar },
            { key: "customers", label: "Customers", icon: Users },
            { key: "revenue", label: "Revenue", icon: DollarSign },
            { key: "performance", label: "Performance", icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedReport(key)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedReport === key
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Charts and Analytics */}
      {selectedReport === "bookings" && renderBookingCharts()}

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue Trend
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-4">
          {analyticsData.bookings.byMonth.map((month) => (
            <div key={month.month} className="text-center">
              <div
                className="bg-blue-500 rounded-t"
                style={{
                  height: `${(month.revenue / 250000) * 100}px`,
                  minHeight: "20px",
                }}
              ></div>
              <div className="text-xs text-gray-600 mt-2">{month.month}</div>
              <div className="text-xs font-medium text-gray-900">
                ₹{(month.revenue / 1000).toFixed(0)}K
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      {renderTopPerformers()}

      {/* Customer Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Tiers
          </h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.customers.byTier).map(
              ([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{tier}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Cities
          </h3>
          <div className="space-y-3">
            {Object.entries(analyticsData.customers.byLocation)
              .slice(0, 5)
              .map(([city, count]) => (
                <div key={city} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{city}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Retention
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Customers</span>
              <span className="text-sm font-medium text-gray-900">
                {analyticsData.customers.retention.new}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Returning</span>
              <span className="text-sm font-medium text-gray-900">
                {analyticsData.customers.retention.returning}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-medium text-gray-900">
                Retention Rate
              </span>
              <span className="text-sm font-bold text-green-600">
                {analyticsData.customers.retention.retentionRate}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
