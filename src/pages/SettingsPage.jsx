import React, { useState } from "react";
import {
  Save,
  RefreshCw,
  Shield,
  Bell,
  User,
  Globe,
  Palette,
  Database,
  Mail,
  Lock,
  Key,
  Users,
  Settings,
  Truck,
  Calendar,
  CreditCard,
} from "lucide-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    general: {
      companyName: "TourTravel Pro",
      companyEmail: "admin@tourtravel.com",
      companyPhone: "+91 9876543210",
      companyAddress: "123 Business District, New Delhi, India",
      timezone: "Asia/Kolkata",
      currency: "INR",
      language: "en",
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      bookingAlerts: true,
      paymentAlerts: true,
      systemAlerts: false,
      marketingEmails: false,
    },
    booking: {
      autoConfirmBookings: false,
      maxAdvanceBookingDays: 90,
      cancellationWindow: 24,
      defaultVehicleType: "sedan",
      requireApproval: true,
      allowGuestBooking: true,
    },
    payment: {
      defaultGateway: "razorpay",
      enableWallet: true,
      autoRefund: false,
      gatewayFeePercent: 2.5,
      minimumAmount: 100,
      maxRefundDays: 7,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      lockoutAttempts: 5,
      ipWhitelist: false,
      auditLogs: true,
    },
  });

  const handleSettingChange = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { key: "general", label: "General", icon: Settings },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "booking", label: "Booking", icon: Calendar },
    { key: "payment", label: "Payments", icon: CreditCard },
    { key: "security", label: "Security", icon: Shield },
    { key: "users", label: "User Management", icon: Users },
    { key: "vehicles", label: "Vehicle Settings", icon: Truck },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.general.companyName}
            onChange={(e) =>
              handleSettingChange("general", "companyName", e.target.value)
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.general.companyEmail}
            onChange={(e) =>
              handleSettingChange("general", "companyEmail", e.target.value)
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Phone
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.general.companyPhone}
            onChange={(e) =>
              handleSettingChange("general", "companyPhone", e.target.value)
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.general.timezone}
            onChange={(e) =>
              handleSettingChange("general", "timezone", e.target.value)
            }
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="America/New_York">America/New_York (EST)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Address
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          value={settings.general.companyAddress}
          onChange={(e) =>
            handleSettingChange("general", "companyAddress", e.target.value)
          }
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(settings.notifications).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <h4 className="text-sm font-medium text-gray-900 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </h4>
              <p className="text-sm text-gray-500">
                {key === "emailNotifications" &&
                  "Receive notifications via email"}
                {key === "smsNotifications" && "Receive notifications via SMS"}
                {key === "pushNotifications" &&
                  "Receive push notifications in browser"}
                {key === "bookingAlerts" && "Get alerts for new bookings"}
                {key === "paymentAlerts" &&
                  "Get alerts for payment transactions"}
                {key === "systemAlerts" && "System maintenance and updates"}
                {key === "marketingEmails" &&
                  "Promotional and marketing emails"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={value}
                onChange={(e) =>
                  handleSettingChange("notifications", key, e.target.checked)
                }
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Auto-confirm Bookings
            </h4>
            <p className="text-sm text-gray-500">
              Automatically confirm bookings without manual approval
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.booking.autoConfirmBookings}
              onChange={(e) =>
                handleSettingChange(
                  "booking",
                  "autoConfirmBookings",
                  e.target.checked
                )
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Advance Booking Days
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.booking.maxAdvanceBookingDays}
            onChange={(e) =>
              handleSettingChange(
                "booking",
                "maxAdvanceBookingDays",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Window (Hours)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.booking.cancellationWindow}
            onChange={(e) =>
              handleSettingChange(
                "booking",
                "cancellationWindow",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Vehicle Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.booking.defaultVehicleType}
            onChange={(e) =>
              handleSettingChange(
                "booking",
                "defaultVehicleType",
                e.target.value
              )
            }
          >
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="hatchback">Hatchback</option>
            <option value="mpv">MPV</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Payment Gateway
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.payment.defaultGateway}
            onChange={(e) =>
              handleSettingChange("payment", "defaultGateway", e.target.value)
            }
          >
            <option value="razorpay">Razorpay</option>
            <option value="payu">PayU</option>
            <option value="stripe">Stripe</option>
            <option value="paytm">Paytm</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gateway Fee (%)
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.payment.gatewayFeePercent}
            onChange={(e) =>
              handleSettingChange(
                "payment",
                "gatewayFeePercent",
                parseFloat(e.target.value)
              )
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Amount (₹)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.payment.minimumAmount}
            onChange={(e) =>
              handleSettingChange(
                "payment",
                "minimumAmount",
                parseInt(e.target.value)
              )
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Refund Days
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={settings.payment.maxRefundDays}
            onChange={(e) =>
              handleSettingChange(
                "payment",
                "maxRefundDays",
                parseInt(e.target.value)
              )
            }
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Two-Factor Authentication
            </h4>
            <p className="text-sm text-gray-500">Require 2FA for admin login</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.security.twoFactorAuth}
              onChange={(e) =>
                handleSettingChange(
                  "security",
                  "twoFactorAuth",
                  e.target.checked
                )
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.security.sessionTimeout}
              onChange={(e) =>
                handleSettingChange(
                  "security",
                  "sessionTimeout",
                  parseInt(e.target.value)
                )
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Expiry (days)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.security.passwordExpiry}
              onChange={(e) =>
                handleSettingChange(
                  "security",
                  "passwordExpiry",
                  parseInt(e.target.value)
                )
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lockout Attempts
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.security.lockoutAttempts}
              onChange={(e) =>
                handleSettingChange(
                  "security",
                  "lockoutAttempts",
                  parseInt(e.target.value)
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "notifications":
        return renderNotificationSettings();
      case "booking":
        return renderBookingSettings();
      case "payment":
        return renderPaymentSettings();
      case "security":
        return renderSecuritySettings();
      case "users":
        return (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              User Management
            </h3>
            <p className="text-gray-600">
              User management settings will be implemented here.
            </p>
          </div>
        );
      case "vehicles":
        return (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Vehicle Settings
            </h3>
            <p className="text-gray-600">
              Vehicle configuration settings will be implemented here.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <div className="flex space-x-3">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Settings
              </h3>
              <nav className="space-y-2">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === key
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {tabs.find((tab) => tab.key === activeTab)?.label} Settings
              </h2>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
