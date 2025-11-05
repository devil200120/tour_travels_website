import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
} from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Bookings", href: "/bookings", icon: Calendar },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Drivers", href: "/drivers", icon: Users },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl shadow-2xl border-r border-white/20 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        <div className="flex items-center justify-between h-20 px-8 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">TT</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Tour & Travels
            </h1>
          </div>
          <button
            className="lg:hidden p-2 hover:bg-white/20 rounded-xl transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-2xl mb-2 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 transform scale-105"
                      : "text-slate-700 hover:bg-white/50 hover:text-slate-900 hover:shadow-md hover:scale-105 backdrop-blur-sm"
                  }`}
                >
                  <Icon
                    className={`mr-4 h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? "text-white"
                        : "text-slate-500 group-hover:text-slate-700"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-72 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div className="flex items-center justify-between h-20 px-8">
            <button
              className="lg:hidden p-3 hover:bg-white/20 rounded-2xl transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 text-slate-700" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center space-x-6">
              <button className="relative p-3 text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-2xl transition-all duration-200 hover:scale-105">
                <Bell className="h-6 w-6" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>

              <div className="flex items-center space-x-4 bg-white/50 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                <div className="text-sm text-right">
                  <p className="font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-slate-600 text-xs">{user?.role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0) || "A"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
