import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageTransition from "../PageTransition/PageTransition";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Car,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  UserCheck,
  User,
  Shield,
  HelpCircle,
  ChevronDown,
  Check,
  Trash2,
  Clock,
  Star,
  Wrench,
  DollarSign,
} from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Sample notifications data
  const notifications = [
    {
      id: 1,
      title: "New Booking Received",
      message: "Rajesh Kumar booked Golden Triangle Tour",
      time: "2 minutes ago",
      type: "booking",
      read: false,
    },
    {
      id: 2,
      title: "Payment Confirmed",
      message: "₹25,999 payment received for booking #BK2024001",
      time: "5 minutes ago",
      type: "payment",
      read: false,
    },
    {
      id: 3,
      title: "Driver Available",
      message: "Amit Singh is now online and available",
      time: "10 minutes ago",
      type: "driver",
      read: true,
    },
    {
      id: 4,
      title: "Vehicle Maintenance Due",
      message: "DL 8C 1234 service due in 3 days",
      time: "1 hour ago",
      type: "maintenance",
      read: true,
    },
    {
      id: 5,
      title: "Customer Review",
      message: "New 5-star review from Priya Sharma",
      time: "2 hours ago",
      type: "review",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "driver":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case "review":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Bookings", href: "/bookings", icon: Calendar },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Drivers", href: "/drivers", icon: UserCheck },
    { name: "Vehicles", href: "/vehicles", icon: Car },
    { name: "Packages", href: "/packages", icon: Package },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TT</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Tour & Travels</h1>
          </div>
          <button
            className="lg:hidden p-1 hover:bg-gray-100 rounded-md transition-colors focus:outline-none"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-all duration-300 ease-out transform hover:scale-105 focus:outline-none overflow-hidden ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700 scale-105 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                }`}
              >
                {/* Ripple effect background */}
                <div className="absolute inset-0 bg-blue-100 transform scale-0 group-hover:scale-100 transition-transform duration-300 ease-out rounded-lg opacity-20"></div>

                <Icon
                  className={`relative z-10 mr-3 h-5 w-5 transition-all duration-300 ease-out transform group-hover:scale-110 ${
                    isActive
                      ? "text-blue-700 scale-110"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                <span className="relative z-10">{item.name}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full animate-scaleIn"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {user?.name?.charAt(0) || "S"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || "Super Admin"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role || "Administrator"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center space-x-4">
              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={`relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none group ${
                    unreadCount > 0 ? "animate-bell-bounce" : ""
                  }`}
                  onMouseEnter={(e) => {
                    if (unreadCount > 0) {
                      e.currentTarget.classList.add("animate-bell-ring");
                      setTimeout(() => {
                        e.currentTarget.classList.remove("animate-bell-ring");
                      }, 1000);
                    }
                  }}
                >
                  <Bell
                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                      unreadCount > 0 ? "animate-bell-pulse" : ""
                    }`}
                  />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
                      {unreadCount}
                    </div>
                  )}
                </button>

                {/* Notifications Dropdown Menu */}
                <div
                  className={`absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out origin-top-right ${
                    notificationsOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Mark all as read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 ${
                            !notification.read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                !notification.read
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                              }`}
                            ></div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p
                                  className={`text-sm font-medium ${
                                    !notification.read
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <div className="flex items-center space-x-2">
                                  {getNotificationIcon(notification.type)}
                                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {notification.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          No notifications
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <div className="text-sm text-right hidden sm:block">
                    <p className="font-medium text-gray-900">
                      {user?.name || "Super Admin"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {user?.role || "Super Admin"}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0) || "S"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out origin-top-right ${
                    profileDropdownOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {user?.name?.charAt(0) || "S"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user?.name || "Super Admin"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user?.email || "admin@tourtravel.com"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user?.role || "Super Admin"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <User className="h-4 w-4 mr-3 text-gray-400" />
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-400" />
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        // Add security settings navigation
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Shield className="h-4 w-4 mr-3 text-gray-400" />
                      Security
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        // Add help navigation
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <HelpCircle className="h-4 w-4 mr-3 text-gray-400" />
                      Help & Support
                    </button>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gray-50 p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
};

export default Layout;
