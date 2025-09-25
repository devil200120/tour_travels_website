import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
} from "lucide-react";

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Static customers data
  const customers = [
    {
      id: "CUS001",
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      phone: "+91 9876543210",
      location: "New Delhi, India",
      joinDate: "2023-01-15",
      totalBookings: 24,
      completedTrips: 22,
      totalSpent: 45600,
      avgRating: 4.8,
      status: "Active",
      lastBooking: "2024-09-20",
      preferredVehicle: "Sedan",
      avatar: "RK",
      loyaltyPoints: 1250,
      membershipTier: "Gold",
    },
    {
      id: "CUS002",
      name: "Priya Sharma",
      email: "priya.sharma@email.com",
      phone: "+91 9123456789",
      location: "Mumbai, Maharashtra",
      joinDate: "2023-03-22",
      totalBookings: 18,
      completedTrips: 17,
      totalSpent: 32400,
      avgRating: 4.9,
      status: "Active",
      lastBooking: "2024-09-18",
      preferredVehicle: "SUV",
      avatar: "PS",
      loyaltyPoints: 890,
      membershipTier: "Silver",
    },
    {
      id: "CUS003",
      name: "Amit Singh",
      email: "amit.singh@email.com",
      phone: "+91 9988776655",
      location: "Bangalore, Karnataka",
      joinDate: "2022-11-08",
      totalBookings: 31,
      completedTrips: 29,
      totalSpent: 62100,
      avgRating: 4.7,
      status: "Active",
      lastBooking: "2024-09-21",
      preferredVehicle: "Hatchback",
      avatar: "AS",
      loyaltyPoints: 1680,
      membershipTier: "Platinum",
    },
    {
      id: "CUS004",
      name: "Sneha Patel",
      email: "sneha.patel@email.com",
      phone: "+91 9555444333",
      location: "Ahmedabad, Gujarat",
      joinDate: "2024-02-14",
      totalBookings: 8,
      completedTrips: 7,
      totalSpent: 12800,
      avgRating: 4.6,
      status: "Active",
      lastBooking: "2024-09-15",
      preferredVehicle: "Sedan",
      avatar: "SP",
      loyaltyPoints: 320,
      membershipTier: "Bronze",
    },
    {
      id: "CUS005",
      name: "Vikash Yadav",
      email: "vikash.yadav@email.com",
      phone: "+91 9777888999",
      location: "Hyderabad, Telangana",
      joinDate: "2023-07-30",
      totalBookings: 15,
      completedTrips: 13,
      totalSpent: 28500,
      avgRating: 4.5,
      status: "Inactive",
      lastBooking: "2024-08-10",
      preferredVehicle: "SUV",
      avatar: "VY",
      loyaltyPoints: 640,
      membershipTier: "Silver",
    },
    {
      id: "CUS006",
      name: "Anita Gupta",
      email: "anita.gupta@email.com",
      phone: "+91 9444555666",
      location: "Chennai, Tamil Nadu",
      joinDate: "2023-09-12",
      totalBookings: 12,
      completedTrips: 11,
      totalSpent: 19200,
      avgRating: 4.8,
      status: "Active",
      lastBooking: "2024-09-19",
      preferredVehicle: "Hatchback",
      avatar: "AG",
      loyaltyPoints: 480,
      membershipTier: "Bronze",
    },
  ];

  const getStatusColor = (status) => {
    return status === "Active"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "Platinum":
        return "bg-purple-100 text-purple-800";
      case "Gold":
        return "bg-yellow-100 text-yellow-800";
      case "Silver":
        return "bg-gray-100 text-gray-800";
      case "Bronze":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      !search ||
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search) ||
      customer.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Customer Management
        </h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.length}
              </p>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-green-600">
                {customers.filter((c) => c.status === "Active").length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(
                  customers.reduce((sum, c) => sum + c.avgRating, 0) /
                  customers.length
                ).toFixed(1)}
              </p>
            </div>
            <div className="text-2xl">⭐</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹
                {(
                  customers.reduce((sum, c) => sum + c.totalSpent, 0) / 1000
                ).toFixed(0)}
                K
              </p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <select
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {customer.avatar}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {customer.id}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Joined{" "}
                          {new Date(customer.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {customer.phone}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {customer.email}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {customer.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">
                        {customer.totalBookings} total
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.completedTrips} completed
                      </div>
                      <div className="text-xs text-gray-400">
                        Last:{" "}
                        {new Date(customer.lastBooking).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{customer.totalSpent.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: ₹
                      {Math.round(
                        customer.totalSpent / customer.totalBookings
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {customer.loyaltyPoints} points
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">
                        {customer.avgRating}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Prefers {customer.preferredVehicle}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(
                        customer.membershipTier
                      )}`}
                    >
                      {customer.membershipTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                        customer.status
                      )}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-purple-600 hover:text-purple-800 p-1"
                        title="View Analytics"
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results Summary */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            Showing {filteredCustomers.length} of {customers.length} customers
            {search && ` matching "${search}"`}
            {statusFilter && ` with status "${statusFilter}"`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
