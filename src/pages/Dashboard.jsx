import React from "react";
import {
  Calendar,
  Users,
  Car,
  CreditCard,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Star,
  DollarSign,
  Activity,
  Zap,
  Globe,
  Shield,
  Award,
  Heart,
  Eye,
  UserCheck,
} from "lucide-react";

const Dashboard = () => {
  // Mock data for demo purposes
  const mockStats = {
    todayBookings: 23,
    monthBookings: 487,
    totalRevenue: 234750,
    activeDrivers: 45,
    completionRate: 94.2,
    customerSatisfaction: 4.8,
  };

  const statsCards = [
    {
      name: "Today's Rides",
      value: mockStats.todayBookings,
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-400",
      change: "+12%",
      changeType: "increase",
      description: "vs yesterday",
    },
    {
      name: "Monthly Revenue",
      value: `₹${mockStats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-green-400",
      change: "+23%",
      changeType: "increase",
      description: "vs last month",
    },
    {
      name: "Active Drivers",
      value: mockStats.activeDrivers,
      icon: Users,
      gradient: "from-purple-500 to-pink-400",
      change: "+8%",
      changeType: "increase",
      description: "online now",
    },
    {
      name: "Completion Rate",
      value: `${mockStats.completionRate}%`,
      icon: CheckCircle,
      gradient: "from-orange-500 to-red-400",
      change: "+2.1%",
      changeType: "increase",
      description: "this month",
    },
  ];

  const recentTrips = [
    {
      id: "TR001",
      customer: "Rajesh Kumar",
      driver: "Amit Singh",
      route: "Airport → Hotel Taj",
      distance: "12.5 km",
      fare: "₹450",
      status: "completed",
      time: "2 min ago",
      rating: 5,
    },
    {
      id: "TR002",
      customer: "Priya Sharma",
      driver: "Vikash Yadav",
      route: "Mall → Residence",
      distance: "8.2 km",
      fare: "₹320",
      status: "ongoing",
      time: "5 min ago",
      rating: null,
    },
    {
      id: "TR003",
      customer: "Rohit Gupta",
      driver: "Suresh Kumar",
      route: "Station → Office",
      distance: "15.8 km",
      fare: "₹580",
      status: "pending",
      time: "8 min ago",
      rating: null,
    },
  ];

  const topDrivers = [
    {
      name: "Amit Singh",
      trips: 234,
      rating: 4.9,
      earnings: "₹45,600",
      avatar: "AS",
      status: "online",
    },
    {
      name: "Vikash Yadav",
      trips: 198,
      rating: 4.8,
      earnings: "₹38,200",
      avatar: "VY",
      status: "online",
    },
    {
      name: "Suresh Kumar",
      trips: 176,
      rating: 4.7,
      earnings: "₹34,800",
      avatar: "SK",
      status: "busy",
    },
    {
      name: "Rajiv Mehta",
      trips: 165,
      rating: 4.6,
      earnings: "₹32,100",
      avatar: "RM",
      status: "offline",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "ongoing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getDriverStatus = (status) => {
    switch (status) {
      case "online":
        return "bg-emerald-400";
      case "busy":
        return "bg-amber-400";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                Live Updates
              </span>
            </div>
            <div className="text-sm text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-200">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out cursor-pointer focus:outline-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">
                    {stat.name}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500">
                      {stat.description}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-out focus:outline-none">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Trips</h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
              <span>View All</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 ease-out cursor-pointer focus:outline-none"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-slate-900">
                        {trip.customer}
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          trip.status
                        )}`}
                      >
                        {trip.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {trip.route}
                    </p>
                    <p className="text-xs text-slate-500">
                      Driver: {trip.driver} • {trip.distance}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-slate-900">
                    {trip.fare}
                  </p>
                  <p className="text-xs text-slate-500">{trip.time}</p>
                  {trip.rating && (
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < trip.rating
                              ? "text-amber-400 fill-current"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Top Drivers</h2>
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <div className="space-y-4">
            {topDrivers.map((driver) => (
              <div
                key={driver.name}
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-2xl border border-slate-200/50 hover:bg-white hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 ease-out cursor-pointer focus:outline-none"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <span className="text-white font-semibold text-sm">
                        {driver.avatar}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 ${getDriverStatus(
                        driver.status
                      )} rounded-full border-2 border-white`}
                    ></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {driver.name}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-amber-400 fill-current" />
                      <span className="text-xs text-slate-600">
                        {driver.rating}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">
                        {driver.trips} trips
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-900">
                    {driver.earnings}
                  </p>
                  <p className="text-xs text-slate-500">this month</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-out">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="group bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-6 rounded-2xl hover:shadow-xl transform hover:scale-110 transition-all duration-300 ease-out active:scale-95 focus:outline-none">
              <Calendar className="h-8 w-8 mb-3 group-hover:scale-125 group-hover:rotate-3 transition-all duration-300" />
              <h3 className="font-semibold mb-1">New Booking</h3>
              <p className="text-xs opacity-90">Create manual booking</p>
            </button>
            <button className="group bg-gradient-to-r from-emerald-500 to-green-400 text-white p-6 rounded-2xl hover:shadow-xl transform hover:scale-110 transition-all duration-300 ease-out active:scale-95 focus:outline-none">
              <Users className="h-8 w-8 mb-3 group-hover:scale-125 group-hover:rotate-3 transition-all duration-300" />
              <h3 className="font-semibold mb-1">Add Driver</h3>
              <p className="text-xs opacity-90">Register new driver</p>
            </button>
            <button className="group bg-gradient-to-r from-purple-500 to-pink-400 text-white p-6 rounded-2xl hover:shadow-xl transform hover:scale-110 transition-all duration-300 ease-out active:scale-95 focus:outline-none">
              <Car className="h-8 w-8 mb-3 group-hover:scale-125 group-hover:rotate-3 transition-all duration-300" />
              <h3 className="font-semibold mb-1">Add Vehicle</h3>
              <p className="text-xs opacity-90">Register new vehicle</p>
            </button>
            <button className="group bg-gradient-to-r from-orange-500 to-red-400 text-white p-6 rounded-2xl hover:shadow-xl transform hover:scale-110 transition-all duration-300 ease-out active:scale-95 focus:outline-none">
              <Activity className="h-8 w-8 mb-3 group-hover:scale-125 group-hover:rotate-3 transition-all duration-300" />
              <h3 className="font-semibold mb-1">Reports</h3>
              <p className="text-xs opacity-90">Generate analytics</p>
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 ease-out">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Performance Metrics
          </h2>
          <div className="space-y-6">
            <div className="group flex items-center justify-between hover:bg-gray-50 rounded-lg p-3 -m-3 transition-all duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Response Time
                  </h4>
                  <p className="text-sm text-slate-600">Average pickup time</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">4.2m</p>
                <p className="text-xs text-emerald-600 font-medium">
                  -0.8m from last week
                </p>
              </div>
            </div>

            <div className="group flex items-center justify-between hover:bg-gray-50 rounded-lg p-3 -m-3 transition-all duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Customer Satisfaction
                  </h4>
                  <p className="text-sm text-slate-600">Average rating</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">4.8/5</p>
                <p className="text-xs text-emerald-600 font-medium">
                  +0.2 from last month
                </p>
              </div>
            </div>

            <div className="group flex items-center justify-between hover:bg-gray-50 rounded-lg p-3 -m-3 transition-all duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">
                    Service Coverage
                  </h4>
                  <p className="text-sm text-slate-600">Cities covered</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">12</p>
                <p className="text-xs text-emerald-600 font-medium">
                  +2 new cities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
