import React, { useState, useEffect, useCallback } from "react";
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
  MapPin,
  Calendar,
  Car,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { driversService } from "../services/api";

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    availableDrivers: 0,
    approvedDrivers: 0,
    pendingKyc: 0,
    todayRegistrations: 0,
  });
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    licenseNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    kycStatus: 'Pending',
    isActive: true,
    notes: ''
  });
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    licenseNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    password: '',
    confirmPassword: '',
    kycStatus: 'Pending',
    isActive: true,
    notes: ''
  });

  // Fetch drivers from API
  const fetchDrivers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 10, // Fixed limit to avoid dependency issue
          ...(search && { search }),
          ...(kycFilter && { kycStatus: kycFilter }),
          ...(statusFilter && { isActive: statusFilter === "active" }),
          ...(availabilityFilter && {
            isAvailable: availabilityFilter === "available",
          }),
        };

        const response = await driversService.getAll(params);
        setDrivers(response.drivers || []);
        setPagination((prev) => ({ ...prev, ...response.pagination }));
        setError(null);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setError("Failed to fetch drivers");
      } finally {
        setLoading(false);
      }
    },
    [search, kycFilter, statusFilter, availabilityFilter]
  );

  // Fetch driver statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = (await driversService.getStats?.()) || {};
      setStats((prev) => ({ ...prev, ...(response.overview || {}) }));
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // Handle driver actions
  const handleUpdateKyc = async (driverId, kycStatus, notes = "") => {
    try {
      await driversService.updateKyc(driverId, kycStatus, notes);
      fetchDrivers(pagination.page);
      fetchStats();
      toast.success(`KYC status updated to ${kycStatus} successfully`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error updating KYC:", err);
      toast.error("Failed to update KYC status", {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  const handleToggleAvailability = async (driverId, isAvailable) => {
    try {
      await driversService.toggleAvailability(driverId, isAvailable, 'Admin action');
      fetchDrivers(pagination.page);
      fetchStats();
      toast.success(`Driver availability ${isAvailable ? 'enabled' : 'disabled'} successfully`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error toggling availability:", err);
      toast.error("Failed to update driver availability", {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  const handleViewDriver = async (driverId) => {
    try {
      const response = await driversService.getById(driverId);
      setSelectedDriver(response);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching driver details:", err);
      toast.error("Failed to load driver details", {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  const handleSuspendDriver = async (driverId) => {
    try {
      await driversService.update(driverId, { isActive: false });
      fetchDrivers(pagination.page);
      fetchStats();
      toast.success('Driver suspended successfully', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error suspending driver:", err);
      toast.error("Failed to suspend driver", {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  const handleEditDriver = async (driverId) => {
    try {
      setLoading(true);
      const response = await driversService.getById(driverId);
      const driver = response.driver || response;
      
      setEditingDriver(driver);
      setEditFormData({
        name: driver.name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        experience: driver.experience || '',
        licenseNumber: driver.licenseNumber || '',
        address: driver.address || '',
        emergencyContactName: driver.emergencyContact?.name || '',
        emergencyContactPhone: driver.emergencyContact?.phone || '',
        kycStatus: driver.kycStatus || 'Pending',
        isActive: driver.isActive !== false,
        notes: driver.notes || ''
      });
      setShowEditModal(true);
    } catch (err) {
      console.error("Error fetching driver for edit:", err);
      toast.error("Failed to load driver details for editing", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditDriver = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        experience: parseInt(editFormData.experience) || 0,
        licenseNumber: editFormData.licenseNumber,
        address: editFormData.address,
        emergencyContact: {
          name: editFormData.emergencyContactName,
          phone: editFormData.emergencyContactPhone
        },
        kycStatus: editFormData.kycStatus,
        isActive: editFormData.isActive,
        notes: editFormData.notes
      };

      await driversService.update(editingDriver._id, updateData);
      
      setShowEditModal(false);
      setEditingDriver(null);
      fetchDrivers(pagination.page);
      fetchStats();
      toast.success('Driver updated successfully', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error updating driver:", err);
      toast.error("Failed to update driver: " + (err.response?.data?.message || err.message), {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingDriver(null);
    setEditFormData({
      name: '',
      email: '',
      phone: '',
      experience: '',
      licenseNumber: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      kycStatus: 'Pending',
      isActive: true,
      notes: ''
    });
  };

  const handleAddDriver = () => {
    setAddFormData({
      name: '',
      email: '',
      phone: '',
      experience: '',
      licenseNumber: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      password: '',
      confirmPassword: '',
      kycStatus: 'Pending',
      isActive: true,
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleSaveNewDriver = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (addFormData.password !== addFormData.confirmPassword) {
      toast.error('Passwords do not match', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (addFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters long', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      
      const newDriverData = {
        name: addFormData.name,
        email: addFormData.email,
        phone: addFormData.phone,
        password: addFormData.password,
        experience: parseInt(addFormData.experience) || 0,
        licenseNumber: addFormData.licenseNumber,
        address: addFormData.address,
        emergencyContact: {
          name: addFormData.emergencyContactName,
          phone: addFormData.emergencyContactPhone
        },
        kycStatus: addFormData.kycStatus,
        isActive: addFormData.isActive,
        notes: addFormData.notes
      };

      await driversService.create(newDriverData);
      
      setShowAddModal(false);
      fetchDrivers(1); // Go to first page
      fetchStats();
      toast.success('Driver added successfully', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error adding driver:", err);
      toast.error("Failed to add driver: " + (err.response?.data?.message || err.message), {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setAddFormData({
      name: '',
      email: '',
      phone: '',
      experience: '',
      licenseNumber: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      password: '',
      confirmPassword: '',
      kycStatus: 'Pending',
      isActive: true,
      notes: ''
    });
  };

  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchDrivers();
      await fetchStats();
    };
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload data when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDrivers(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter, kycFilter, availabilityFilter, fetchDrivers]);

  const getStatusColor = (driver) => {
    if (!driver.isActive) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (driver.isAvailable) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getStatusText = (driver) => {
    if (!driver.isActive) return "Inactive";
    return driver.isAvailable ? "Available" : "Busy";
  };

  const getKycStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "Under Review":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
        <button 
          onClick={handleAddDriver}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDrivers}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Now</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.availableDrivers}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">KYC Approved</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.approvedDrivers}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending KYC</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.pendingKyc}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
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
                placeholder="Search drivers by name, phone, email, or license..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <select
            className="w-full md:w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="w-full md:w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
          >
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
          </select>
          <select
            className="w-full md:w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
          >
            <option value="">All KYC</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
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
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KYC Status
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
              {drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {getInitials(driver.name || "Unknown")}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {driver._id?.slice(-8) || "N/A"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {driver.experience
                            ? `${driver.experience} years exp`
                            : "Experience N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {driver.phone || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {driver.email || "N/A"}
                    </div>
                    <div className="text-xs text-gray-400">
                      License: {driver.licenseNumber || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-medium">
                          {driver.rating?.average?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {driver.totalTrips || 0} trips completed
                      </div>
                      <div className="text-xs text-gray-400">
                        {driver.totalDistance
                          ? `${driver.totalDistance.toFixed(0)} km`
                          : "0 km"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getKycStatusIcon(driver.kycStatus)}
                      <span className="ml-2 text-sm text-gray-900">
                        {driver.kycStatus || "Pending"}
                      </span>
                    </div>
                    {driver.kycStatus === "Pending" && (
                      <div className="flex space-x-1 mt-1">
                        <button
                          onClick={() =>
                            handleUpdateKyc(driver._id, "Approved")
                          }
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateKyc(
                              driver._id,
                              "Rejected",
                              "Rejected by admin"
                            )
                          }
                          className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(driver.totalEarnings)}
                    </div>
                    <div className="text-xs text-gray-500">Total earnings</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                        driver
                      )}`}
                    >
                      {getStatusText(driver)}
                    </span>
                    {driver.isActive && (
                      <button
                        onClick={() =>
                          handleToggleAvailability(
                            driver._id,
                            !driver.isAvailable
                          )
                        }
                        className="block mt-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        {driver.isAvailable ? "Set Busy" : "Set Available"}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDriver(driver._id)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditDriver(driver._id)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Edit Driver"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to suspend ${driver.name}? This will prevent them from accepting new trips.`)) {
                            handleSuspendDriver(driver._id);
                          }
                        }}
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

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} drivers
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchDrivers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => fetchDrivers(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      page === pagination.page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => fetchDrivers(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {drivers.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500">
              {search || statusFilter || kycFilter || availabilityFilter
                ? "No drivers found matching your filters"
                : "No drivers found"}
            </div>
          </div>
        )}
      </div>

      {/* Driver Details Modal */}
      {showModal && selectedDriver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Driver Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getInitials(selectedDriver.driver?.name || "Unknown")}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold">
                      {selectedDriver.driver?.name}
                    </h4>
                    <p className="text-gray-600">
                      {selectedDriver.driver?.email}
                    </p>
                    <p className="text-gray-600">
                      {selectedDriver.driver?.phone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-medium">
                      {selectedDriver.driver?.experience || 0} years
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">License Number</p>
                    <p className="font-medium">
                      {selectedDriver.driver?.licenseNumber || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">KYC Status</p>
                    <p className="font-medium">
                      {selectedDriver.driver?.kycStatus || "Pending"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Total Trips</p>
                    <p className="font-medium">
                      {selectedDriver.driver?.totalTrips || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="font-medium">
                      {selectedDriver.driver?.rating?.average?.toFixed(1) ||
                        "0.0"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Total Earnings</p>
                    <p className="font-medium">
                      {formatCurrency(selectedDriver.driver?.totalEarnings)}
                    </p>
                  </div>
                </div>

                {selectedDriver.vehicles &&
                  selectedDriver.vehicles.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Vehicles</h5>
                      <div className="space-y-2">
                        {selectedDriver.vehicles.map((vehicle, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded flex items-center"
                          >
                            <Car className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <p className="font-medium">
                                {vehicle.brand} {vehicle.model}
                              </p>
                              <p className="text-sm text-gray-600">
                                {vehicle.vehicleNumber}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedDriver.recentBookings &&
                  selectedDriver.recentBookings.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Recent Trips</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedDriver.recentBookings.map((booking, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {booking.customer?.name || "Unknown Customer"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Booking ID: {booking.bookingId}
                                </p>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditModal && editingDriver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Driver: {editingDriver.name}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaveEditDriver} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.licenseNumber}
                      onChange={(e) => setEditFormData({...editFormData, licenseNumber: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.experience}
                      onChange={(e) => setEditFormData({...editFormData, experience: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      KYC Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.kycStatus}
                      onChange={(e) => setEditFormData({...editFormData, kycStatus: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.emergencyContactName}
                      onChange={(e) => setEditFormData({...editFormData, emergencyContactName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editFormData.emergencyContactPhone}
                      onChange={(e) => setEditFormData({...editFormData, emergencyContactPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                    placeholder="Any notes about this driver..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({...editFormData, isActive: e.target.checked})}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active Driver (can accept new trips)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add New Driver
                </h3>
                <button
                  onClick={handleCancelAdd}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaveNewDriver} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({...addFormData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.licenseNumber}
                      onChange={(e) => setAddFormData({...addFormData, licenseNumber: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.password}
                      onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.confirmPassword}
                      onChange={(e) => setAddFormData({...addFormData, confirmPassword: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.experience}
                      onChange={(e) => setAddFormData({...addFormData, experience: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial KYC Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.kycStatus}
                      onChange={(e) => setAddFormData({...addFormData, kycStatus: e.target.value})}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={addFormData.address}
                    onChange={(e) => setAddFormData({...addFormData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.emergencyContactName}
                      onChange={(e) => setAddFormData({...addFormData, emergencyContactName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addFormData.emergencyContactPhone}
                      onChange={(e) => setAddFormData({...addFormData, emergencyContactPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={addFormData.notes}
                    onChange={(e) => setAddFormData({...addFormData, notes: e.target.value})}
                    placeholder="Any notes about this driver..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveAdd"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={addFormData.isActive}
                    onChange={(e) => setAddFormData({...addFormData, isActive: e.target.checked})}
                  />
                  <label htmlFor="isActiveAdd" className="ml-2 block text-sm text-gray-900">
                    Active Driver (can accept new trips)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelAdd}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Driver'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
