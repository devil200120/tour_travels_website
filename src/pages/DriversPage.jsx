import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  UserX,
  Star,
  Phone,
  Mail,
} from "lucide-react";

const DriversPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Static drivers data
  const drivers = [
    {
      id: "DR001",
      name: "Amit Singh",
      phone: "+91 9876543210",
      email: "amit.singh@email.com",
      license: "DL1420110012345",
      experience: "8 years",
      rating: 4.9,
      totalTrips: 1247,
      status: "online",
      vehicle: "Swift Dzire (DL 8C 1234)",
      earnings: 45600,
      joinDate: "2020-03-15",
      avatar: "AS",
      documents: {
        license: "verified",
        aadhar: "verified",
        pan: "verified",
        photo: "verified",
      },
    },
    {
      id: "DR002",
      name: "Vikash Yadav",
      phone: "+91 9123456789",
      email: "vikash.yadav@email.com",
      license: "DL1420110067890",
      experience: "5 years",
      rating: 4.8,
      totalTrips: 892,
      status: "busy",
      vehicle: "Toyota Innova (HR 26 5678)",
      earnings: 38900,
      joinDate: "2021-07-22",
      avatar: "VY",
      documents: {
        license: "verified",
        aadhar: "verified",
        pan: "pending",
        photo: "verified",
      },
    },
    {
      id: "DR003",
      name: "Ravi Kumar",
      phone: "+91 9988776655",
      email: "ravi.kumar@email.com",
      license: "DL1420110054321",
      experience: "6 years",
      rating: 4.7,
      totalTrips: 678,
      status: "offline",
      vehicle: "Honda City (DL 1C 9876)",
      earnings: 32100,
      joinDate: "2021-01-10",
      avatar: "RK",
      documents: {
        license: "verified",
        aadhar: "verified",
        pan: "verified",
        photo: "rejected",
      },
    },
    {
      id: "DR004",
      name: "Karthik Raja",
      phone: "+91 9555444333",
      email: "karthik.raja@email.com",
      license: "TN1420110098765",
      experience: "4 years",
      rating: 4.6,
      totalTrips: 534,
      status: "online",
      vehicle: "Hyundai Creta (TN 33 4567)",
      earnings: 28750,
      joinDate: "2022-05-18",
      avatar: "KR",
      documents: {
        license: "verified",
        aadhar: "pending",
        pan: "verified",
        photo: "verified",
      },
    },
    {
      id: "DR005",
      name: "Deepak Singh",
      phone: "+91 9777888999",
      email: "deepak.singh@email.com",
      license: "DL1420110087654",
      experience: "3 years",
      rating: 4.5,
      totalTrips: 421,
      status: "suspended",
      vehicle: "Maruti Ertiga (DL 5C 7890)",
      earnings: 24300,
      joinDate: "2022-11-03",
      avatar: "DS",
      documents: {
        license: "expired",
        aadhar: "verified",
        pan: "verified",
        photo: "verified",
      },
    },
    {
      id: "DR006",
      name: "Suresh Patel",
      phone: "+91 9444555666",
      email: "suresh.patel@email.com",
      license: "GJ1420110065432",
      experience: "7 years",
      rating: 4.8,
      totalTrips: 956,
      status: "online",
      vehicle: "Mahindra Scorpio (GJ 01 2345)",
      earnings: 41200,
      joinDate: "2020-08-12",
      avatar: "SP",
      documents: {
        license: "verified",
        aadhar: "verified",
        pan: "verified",
        photo: "verified",
      },
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200";
      case "busy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "offline":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDocumentStatus = (status) => {
    switch (status) {
      case "verified":
        return "✅";
      case "pending":
        return "⏳";
      case "rejected":
        return "❌";
      case "expired":
        return "⚠️";
      default:
        return "❓";
    }
  };

  // Filter drivers
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      !search ||
      driver.name.toLowerCase().includes(search.toLowerCase()) ||
      driver.phone.includes(search) ||
      driver.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {drivers.length}
              </p>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online Now</p>
              <p className="text-2xl font-bold text-green-600">
                {drivers.filter((d) => d.status === "online").length}
              </p>
            </div>
            <div className="text-2xl">🟢</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(
                  drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length
                ).toFixed(1)}
              </p>
            </div>
            <div className="text-2xl">⭐</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹
                {(
                  drivers.reduce((sum, d) => sum + d.earnings, 0) / 1000
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
                placeholder="Search drivers by name, phone, or ID..."
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
            <option value="online">Online</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
            <option value="suspended">Suspended</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Drivers Grid/Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
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
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {driver.avatar}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {driver.id}
                        </div>
                        <div className="text-xs text-gray-400">
                          {driver.experience} experience
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {driver.phone}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {driver.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      License: {driver.license}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {driver.vehicle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-medium">{driver.rating}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {driver.totalTrips} trips completed
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      <span title="License">
                        {getDocumentStatus(driver.documents.license)}
                      </span>
                      <span title="Aadhar">
                        {getDocumentStatus(driver.documents.aadhar)}
                      </span>
                      <span title="PAN">
                        {getDocumentStatus(driver.documents.pan)}
                      </span>
                      <span title="Photo">
                        {getDocumentStatus(driver.documents.photo)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{driver.earnings.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">This month</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                        driver.status
                      )}`}
                    >
                      {driver.status}
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
                        title="Edit Driver"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Suspend Driver"
                      >
                        <UserX className="h-4 w-4" />
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
            Showing {filteredDrivers.length} of {drivers.length} drivers
            {search && ` matching "${search}"`}
            {statusFilter && ` with status "${statusFilter}"`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriversPage;
