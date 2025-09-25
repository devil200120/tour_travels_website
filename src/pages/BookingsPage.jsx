import React, { useState } from "react";
import { Search, Filter, Plus, Eye, Edit, X } from "lucide-react";

const BookingsPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Static booking data
  const bookings = [
    {
      _id: '1',
      bookingId: 'BK2024001',
      customer: { name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com' },
      bookingType: 'Outstation',
      pickup: { address: 'IGI Airport Terminal 3, New Delhi' },
      dropoff: { address: 'Hotel Taj Palace, Delhi' },
      schedule: { startDate: '2024-09-22T16:00:00Z' },
      pricing: { totalAmount: 450 },
      status: 'Completed'
    },
    {
      _id: '2',
      bookingId: 'BK2024002',
      customer: { name: 'Priya Sharma', email: 'priya.sharma@email.com' },
      bookingType: 'City Ride',
      pickup: { address: 'Connaught Place, New Delhi' },
      dropoff: { address: 'Cyber City, Gurgaon' },
      schedule: { startDate: '2024-09-22T17:30:00Z' },
      pricing: { totalAmount: 680 },
      status: 'In Progress'
    },
    {
      _id: '3',
      bookingId: 'BK2024003',
      customer: { name: 'Suresh Patel', email: 'suresh.patel@email.com' },
      bookingType: 'City Ride',
      pickup: { address: 'Karol Bagh Metro Station' },
      dropoff: { address: 'Lotus Temple, Delhi' },
      schedule: { startDate: '2024-09-22T18:00:00Z' },
      pricing: { totalAmount: 320 },
      status: 'Pending'
    },
    {
      _id: '4',
      bookingId: 'BK2024004',
      customer: { name: 'Anita Gupta', email: 'anita.gupta@email.com' },
      bookingType: 'Package Tour',
      pickup: { address: 'India Gate, Delhi' },
      dropoff: { address: 'Red Fort, Delhi' },
      schedule: { startDate: '2024-09-22T14:15:00Z' },
      pricing: { totalAmount: 180 },
      status: 'Cancelled'
    },
    {
      _id: '5',
      bookingId: 'BK2024005',
      customer: { name: 'Mohit Verma', email: 'mohit.verma@email.com' },
      bookingType: 'City Ride',
      pickup: { address: 'Janpath Market, Delhi' },
      dropoff: { address: 'Khan Market, Delhi' },
      schedule: { startDate: '2024-09-22T12:30:00Z' },
      pricing: { totalAmount: 220 },
      status: 'Completed'
    },
    {
      _id: '6',
      bookingId: 'BK2024006',
      customer: { name: 'Neha Singh', email: 'neha.singh@email.com' },
      bookingType: 'Outstation',
      pickup: { address: 'Noida Sector 62' },
      dropoff: { address: 'Agra, Uttar Pradesh' },
      schedule: { startDate: '2024-09-23T09:00:00Z' },
      pricing: { totalAmount: 2450 },
      status: 'Confirmed'
    },
    {
      _id: '7',
      bookingId: 'BK2024007',
      customer: { name: 'Arjun Kapoor', email: 'arjun.kapoor@email.com' },
      bookingType: 'Airport Transfer',
      pickup: { address: 'Dwarka Sector 21, Delhi' },
      dropoff: { address: 'IGI Airport Terminal 1' },
      schedule: { startDate: '2024-09-23T06:30:00Z' },
      pricing: { totalAmount: 380 },
      status: 'Assigned'
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      Pending: "bg-yellow-100 text-yellow-800",
      Confirmed: "bg-blue-100 text-blue-800",
      Assigned: "bg-purple-100 text-purple-800",
      "In Progress": "bg-indigo-100 text-indigo-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !search || 
      booking.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      booking.bookingId.toLowerCase().includes(search.toLowerCase()) ||
      booking.pickup.address.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !status || booking.status === status;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'Completed').length}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{bookings.filter(b => b.status === 'In Progress').length}</p>
            </div>
            <div className="text-2xl">🚗</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">₹{bookings.reduce((sum, b) => sum + b.pricing.totalAmount, 0).toLocaleString()}</p>
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
                placeholder="Search bookings by customer, ID, or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <select
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.bookingId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customer?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customer?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.bookingType}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">📍 {booking.pickup?.address}</div>
                      <div className="text-gray-500">🏁 {booking.dropoff?.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.schedule?.startDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{booking.pricing?.totalAmount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 p-1">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800 p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      {booking.status === "Pending" && (
                        <button className="text-red-600 hover:text-red-800 p-1">
                          <X className="h-4 w-4" />
                        </button>
                      )}
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
            Showing {filteredBookings.length} of {bookings.length} bookings
            {search && ` matching "${search}"`}
            {status && ` with status "${status}"`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
