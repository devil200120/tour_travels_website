import React, { useState } from "react";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "Super Admin",
    email: user?.email || "admin@tourtravel.com",
    phone: "+91 9876543210",
    address: "123 Business District, New Delhi, India",
    department: "Administration",
    joinDate: "2023-01-15",
    bio: "Experienced administrator managing tour and travel operations with expertise in business management and customer relations.",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Here you would typically save to a backend
    console.log("Saving profile data:", formData);
    setIsEditing(false);
    // Show success message
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: user?.name || "Super Admin",
      email: user?.email || "admin@tourtravel.com",
      phone: "+91 9876543210",
      address: "123 Business District, New Delhi, India",
      department: "Administration",
      joinDate: "2023-01-15",
      bio: "Experienced administrator managing tour and travel operations with expertise in business management and customer relations.",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              {/* Profile Picture */}
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-4xl">
                    {formData.name.charAt(0)}
                  </span>
                </div>
                {isEditing && (
                  <button className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {formData.name}
              </h2>
              <p className="text-gray-600 mb-2">
                {user?.role || "Super Admin"}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {formData.department}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">2.5</p>
                  <p className="text-xs text-gray-500">Years</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">99.2%</p>
                  <p className="text-xs text-gray-500">Uptime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Key className="h-4 w-4 mr-3 text-gray-400" />
                Change Password
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Shield className="h-4 w-4 mr-3 text-gray-400" />
                Security Settings
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Mail className="h-4 w-4 mr-3 text-gray-400" />
                Email Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Profile Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="flex items-center text-gray-900">
                    <span>{formData.name}</span>
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="flex items-center text-gray-900">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {formData.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="flex items-center text-gray-900">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {formData.phone}
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                {isEditing ? (
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Administration">Administration</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Customer Service">Customer Service</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{formData.department}</p>
                )}
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Date
                </label>
                <p className="flex items-center text-gray-900">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {new Date(formData.joinDate).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="flex items-start text-gray-900">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                  {formData.address}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{formData.bio}</p>
              )}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Activity Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  1,247
                </div>
                <div className="text-sm text-gray-600">Actions Performed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  98.5%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  24/7
                </div>
                <div className="text-sm text-gray-600">Availability</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
