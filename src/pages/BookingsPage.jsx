import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  X,
  RefreshCw,
  Loader,
  MapPin,
  Clock,
  User,
  Car,
  Phone,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  bookingsService,
  packagesService,
  vehiclesService,
  customersService,
} from "../services/api";

const BookingsPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardStats, setDashboardStats] = useState({
    todayBookings: 0,
    monthBookings: 0,
    statusDistribution: [],
    revenue: { totalRevenue: 0, avgBookingValue: 0 },
    typeDistribution: [],
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Create booking form state
  const [createFormData, setCreateFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    packageId: "",
    packageName: "",
    startDate: "",
    endDate: "",
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
    },
    vehicleType: "",
    specialRequests: "",
    pickupLocation: "",
    dropoffLocation: "",
    estimatedCost: 0,
  });
  const [createFormErrors, setCreateFormErrors] = useState({});
  const [packages, setPackages] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Define functions first
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: status || undefined,
      };

      const response = await bookingsService.getAll(params);
      setBookings(response.bookings || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0,
      }));
      setError("");
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load bookings. Please try again.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, status]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await bookingsService.getDashboardStats();
      setDashboardStats(response);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, []);

  // Fetch packages for dropdown
  const fetchPackages = useCallback(async () => {
    try {
      const response = await packagesService.getAll({
        limit: 100,
        isActive: true,
      });
      setPackages(response.packages || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  }, []);

  // Fetch vehicles for dropdown
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await vehiclesService.getAll({ limit: 100 });
      setVehicles(response.vehicles || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  }, []);

  // Fetch bookings from API
  useEffect(() => {
    fetchBookings();
    fetchDashboardStats();
    fetchPackages();
    fetchVehicles();
  }, [fetchBookings, fetchDashboardStats, fetchPackages, fetchVehicles]);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page !== 1) {
        // Reset to page 1 when search changes
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        fetchBookings();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [search, fetchBookings]);

  const handleRefresh = () => {
    fetchBookings();
    fetchDashboardStats();
  };

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

  // Modal handlers
  const viewBooking = async (booking) => {
    try {
      setActionLoading(true);
      const response = await bookingsService.getById(booking._id);
      setSelectedBooking(response);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setMessage({ type: "error", text: "Failed to load booking details." });
    } finally {
      setActionLoading(false);
    }
  };

  const editBooking = async (booking) => {
    try {
      setActionLoading(true);
      const response = await bookingsService.getById(booking._id);
      setSelectedBooking(response);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setMessage({ type: "error", text: "Failed to load booking details." });
    } finally {
      setActionLoading(false);
    }
  };

  const cancelBooking = async (booking) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      setActionLoading(true);
      await bookingsService.cancel(booking._id, "Cancelled by admin", 0);
      setMessage({ type: "success", text: "Booking cancelled successfully." });
      fetchBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setMessage({ type: "error", text: "Failed to cancel booking." });
    } finally {
      setActionLoading(false);
    }
  };

  // Create booking form handlers
  const handleCreateFormChange = (field, value) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (createFormErrors[field]) {
      setCreateFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleNestedCreateFormChange = (field, subfield, value) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subfield]: value,
      },
    }));
  };

  const handlePackageChange = (packageId) => {
    const selectedPackage = packages.find((pkg) => pkg._id === packageId);
    if (selectedPackage) {
      setCreateFormData((prev) => ({
        ...prev,
        packageId: packageId,
        packageName: selectedPackage.name,
        estimatedCost:
          selectedPackage.pricing?.pricePerPerson * prev.passengers.adults || 0,
      }));
    }
  };

  const validateCreateForm = () => {
    const errors = {};

    if (!createFormData.customerName.trim())
      errors.customerName = "Customer name is required";
    if (!createFormData.customerEmail.trim())
      errors.customerEmail = "Customer email is required";
    if (
      createFormData.customerEmail &&
      !/\S+@\S+\.\S+/.test(createFormData.customerEmail)
    ) {
      errors.customerEmail = "Please enter a valid email address";
    }
    if (!createFormData.customerPhone.trim())
      errors.customerPhone = "Customer phone is required";
    if (!createFormData.packageId)
      errors.packageId = "Package selection is required";
    if (!createFormData.startDate) errors.startDate = "Start date is required";
    if (!createFormData.endDate) errors.endDate = "End date is required";
    if (!createFormData.pickupLocation.trim())
      errors.pickupLocation = "Pickup location is required";
    if (createFormData.passengers.adults < 1)
      errors.adults = "At least 1 adult passenger is required";

    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBooking = async () => {
    if (!validateCreateForm()) return;

    try {
      setActionLoading(true);

      // First, create/find customer
      let customerId;
      try {
        // Try to find existing customer by email
        const customerResponse = await customersService.getAll({
          search: createFormData.customerEmail,
          limit: 1,
        });

        if (
          customerResponse.customers &&
          customerResponse.customers.length > 0
        ) {
          customerId = customerResponse.customers[0]._id;
        } else {
          // Create new customer
          const newCustomerResponse = await customersService.create({
            name: createFormData.customerName,
            email: createFormData.customerEmail,
            phone: createFormData.customerPhone,
            isVerified: true,
          });
          customerId = newCustomerResponse.customer._id;
        }
      } catch (error) {
        console.error("Error handling customer:", error);
        throw new Error("Failed to create/find customer");
      }

      // Calculate total passenger count
      const totalPassengers =
        createFormData.passengers.adults +
        createFormData.passengers.children +
        createFormData.passengers.infants;

      const bookingData = {
        customer: customerId,
        bookingType: "Package Tour",
        tripType: "Round trip",
        pickup: {
          address: createFormData.pickupLocation,
        },
        dropoff: {
          address:
            createFormData.dropoffLocation || createFormData.pickupLocation,
        },
        schedule: {
          startDate: createFormData.startDate,
          endDate: createFormData.endDate,
        },
        passengers: {
          adults: createFormData.passengers.adults,
          children: createFormData.passengers.children,
          totalCount: totalPassengers,
        },
        vehiclePreference: createFormData.vehicleType || "Sedan",
        packageDetails: {
          packageId: createFormData.packageId,
        },
        pricing: {
          basePrice: createFormData.estimatedCost,
          totalAmount: createFormData.estimatedCost,
        },
        specialRequests: createFormData.specialRequests,
        status: "Pending",
      };

      await bookingsService.create(bookingData);
      setMessage({ type: "success", text: "Booking created successfully!" });

      // Reset form
      setCreateFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        packageId: "",
        packageName: "",
        startDate: "",
        endDate: "",
        passengers: {
          adults: 1,
          children: 0,
          infants: 0,
        },
        vehicleType: "",
        specialRequests: "",
        pickupLocation: "",
        dropoffLocation: "",
        estimatedCost: 0,
      });

      closeModals();
      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error("Error creating booking:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to create booking. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowCreateModal(false);
    setSelectedBooking(null);
    setCreateFormErrors({});
    if (message) {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Calculate stats from bookings
  const calculateStats = () => {
    if (!bookings || bookings.length === 0) {
      return {
        totalBookings: 0,
        completedBookings: 0,
        inProgressBookings: 0,
        totalRevenue: 0,
      };
    }

    return {
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b) => b.status === "Completed")
        .length,
      inProgressBookings: bookings.filter((b) => b.status === "In Progress")
        .length,
      totalRevenue: bookings.reduce(
        (sum, b) => sum + (b.pricing?.totalAmount || 0),
        0
      ),
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Bookings Management
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {message.type === "success" ? "✅" : "❌"}
            </span>
            {message.text}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Bookings
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalBookings}
              </p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? "..." : stats.completedBookings}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? "..." : stats.inProgressBookings}
              </p>
            </div>
            <div className="text-2xl">🚗</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{loading ? "..." : stats.totalRevenue.toLocaleString()}
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 mb-4">
              {search || status
                ? "Try adjusting your search criteria."
                : "There are no bookings yet."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create New Booking
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.bookingId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.customer?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.customer?.email || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.bookingType}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-green-600" />
                          {booking.pickup?.address || "N/A"}
                        </div>
                        <div className="text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1 text-red-600" />
                          {booking.dropoff?.address || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.schedule?.startDate ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(
                            booking.schedule.startDate
                          ).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />₹
                        {booking.pricing?.totalAmount?.toLocaleString() || "0"}
                      </div>
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
                        <button
                          onClick={() => viewBooking(booking)}
                          disabled={actionLoading}
                          className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editBooking(booking)}
                          disabled={actionLoading}
                          className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50"
                          title="Edit Booking"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {booking.status === "Pending" && (
                          <button
                            onClick={() => cancelBooking(booking)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                            title="Cancel Booking"
                          >
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
        )}

        {/* Results Summary */}
        {!loading && bookings.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {bookings.length} of {pagination.total} bookings
                {search && ` matching "${search}"`}
                {status && ` with status "${status}"`}
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.pages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Booking Modal */}
      {showViewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Booking Details
                </h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Booking ID
                      </label>
                      <p className="text-sm text-gray-900 font-mono">
                        {selectedBooking.bookingId}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Booking Type
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.bookingType}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trip Type
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.tripType}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                          selectedBooking.status
                        )}`}
                      >
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.customer?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.customer?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.customer?.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Trip Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Pickup Location
                      </label>
                      <div className="flex items-start space-x-2 mt-1">
                        <MapPin className="h-4 w-4 text-green-600 mt-1" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {selectedBooking.pickup?.address || "N/A"}
                          </p>
                          {selectedBooking.pickup?.landmark && (
                            <p className="text-xs text-gray-500">
                              Landmark: {selectedBooking.pickup.landmark}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Dropoff Location
                      </label>
                      <div className="flex items-start space-x-2 mt-1">
                        <MapPin className="h-4 w-4 text-red-600 mt-1" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {selectedBooking.dropoff?.address || "N/A"}
                          </p>
                          {selectedBooking.dropoff?.landmark && (
                            <p className="text-xs text-gray-500">
                              Landmark: {selectedBooking.dropoff.landmark}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Scheduled Date & Time
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-gray-900">
                          {selectedBooking.schedule?.startDate
                            ? new Date(
                                selectedBooking.schedule.startDate
                              ).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Passengers
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="h-4 w-4 text-purple-600" />
                        <p className="text-sm text-gray-900">
                          {selectedBooking.passengers?.totalCount || 0}{" "}
                          passengers
                          {selectedBooking.passengers?.adults && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({selectedBooking.passengers.adults} adults
                              {selectedBooking.passengers.children > 0 &&
                                `, ${selectedBooking.passengers.children} children`}
                              {selectedBooking.passengers.infants > 0 &&
                                `, ${selectedBooking.passengers.infants} infants`}
                              )
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Driver & Vehicle */}
                {(selectedBooking.assignedDriver ||
                  selectedBooking.assignedVehicle) && (
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Assigned Resources
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedBooking.assignedDriver && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Driver
                          </label>
                          <div className="flex items-center space-x-2 mt-1">
                            <User className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-900">
                                {selectedBooking.assignedDriver.name}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {selectedBooking.assignedDriver.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedBooking.assignedVehicle && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Vehicle
                          </label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Car className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-900">
                                {selectedBooking.assignedVehicle.make}{" "}
                                {selectedBooking.assignedVehicle.model}
                              </p>
                              <p className="text-xs text-gray-500">
                                {selectedBooking.assignedVehicle.vehicleNumber}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pricing Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Total Amount
                        </label>
                        <p className="text-lg font-bold text-gray-900">
                          ₹
                          {selectedBooking.pricing?.totalAmount?.toLocaleString() ||
                            "0"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Payment Status
                        </label>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedBooking.payment?.status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : selectedBooking.payment?.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedBooking.payment?.status || "N/A"}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Payment Method
                        </label>
                        <p className="text-sm text-gray-900">
                          {selectedBooking.payment?.method || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Booking
                </h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <Edit className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Edit Booking Form
                </h3>
                <p className="text-gray-600 mb-4">
                  Booking editing functionality will be implemented here.
                </p>
                <p className="text-sm text-gray-500">
                  Booking ID: {selectedBooking.bookingId}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Create New Booking
                </h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {message && (
                <div
                  className={`mb-4 p-4 rounded-lg border ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">
                      {message.type === "success" ? "✅" : "❌"}
                    </span>
                    {message.text}
                  </div>
                </div>
              )}

              <form className="space-y-6">
                {/* Customer Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={createFormData.customerName}
                        onChange={(e) =>
                          handleCreateFormChange("customerName", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          createFormErrors.customerName
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter customer name"
                      />
                      {createFormErrors.customerName && (
                        <p className="text-red-600 text-xs mt-1">
                          {createFormErrors.customerName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={createFormData.customerEmail}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "customerEmail",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          createFormErrors.customerEmail
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter email address"
                      />
                      {createFormErrors.customerEmail && (
                        <p className="text-red-600 text-xs mt-1">
                          {createFormErrors.customerEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={createFormData.customerPhone}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "customerPhone",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          createFormErrors.customerPhone
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter phone number"
                      />
                      {createFormErrors.customerPhone && (
                        <p className="text-red-600 text-xs mt-1">
                          {createFormErrors.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Package & Schedule */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Package & Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Package *
                      </label>
                      <select
                        value={createFormData.packageId}
                        onChange={(e) => handlePackageChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          createFormErrors.packageId
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select a package</option>
                        {packages.map((pkg) => (
                          <option key={pkg._id} value={pkg._id}>
                            {pkg.name} - {pkg.duration?.days}D/
                            {pkg.duration?.nights}N - ₹
                            {pkg.pricing?.pricePerPerson}
                          </option>
                        ))}
                      </select>
                      {createFormErrors.packageId && (
                        <p className="text-red-600 text-xs mt-1">
                          {createFormErrors.packageId}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={createFormData.vehicleType}
                        onChange={(e) =>
                          handleCreateFormChange("vehicleType", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select vehicle type</option>
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Bus">Bus</option>
                        <option value="Tempo Traveller">Tempo Traveller</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={createFormData.startDate}
                        onChange={(e) =>
                          handleCreateFormChange("startDate", e.target.value)
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          createFormErrors.startDate
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {createFormErrors.startDate && (
                        <p className="text-red-600 text-xs mt-1">
                          {createFormErrors.startDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={createFormData.endDate}
                        onChange={(e) =>
                          handleCreateFormChange("endDate", e.target.value)
                        }
                        min={
                          createFormData.startDate ||
                          new Date().toISOString().split("T")[0]
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          createFormErrors.endDate
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {createFormErrors.endDate && (
                        <p className="text-red-600 text-xs mt-1">
                          {createFormErrors.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Passengers */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Passengers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adults *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={createFormData.passengers.adults}
                        onChange={(e) =>
                          handleNestedCreateFormChange(
                            "passengers",
                            "adults",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          createFormErrors.adults
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {createFormErrors.adults && (
                        <p className="text-red-600 text-xs mt-1">
                          {createFormErrors.adults}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Children
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={createFormData.passengers.children}
                        onChange={(e) =>
                          handleNestedCreateFormChange(
                            "passengers",
                            "children",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Infants
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={createFormData.passengers.infants}
                        onChange={(e) =>
                          handleNestedCreateFormChange(
                            "passengers",
                            "infants",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Locations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup Location *
                      </label>
                      <input
                        type="text"
                        value={createFormData.pickupLocation}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "pickupLocation",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          createFormErrors.pickupLocation
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter pickup location"
                      />
                      {createFormErrors.pickupLocation && (
                        <p className="text-red-600 text-xs mt-1">
                          {createFormErrors.pickupLocation}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Drop-off Location
                      </label>
                      <input
                        type="text"
                        value={createFormData.dropoffLocation}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "dropoffLocation",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter drop-off location (optional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Requests
                      </label>
                      <textarea
                        value={createFormData.specialRequests}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "specialRequests",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any special requests or notes"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={createFormData.estimatedCost}
                          onChange={(e) =>
                            handleCreateFormChange(
                              "estimatedCost",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                          readOnly={createFormData.packageId}
                        />
                      </div>
                      {createFormData.packageId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-calculated based on package and passengers
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModals}
                  disabled={actionLoading}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {actionLoading && (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Create Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
