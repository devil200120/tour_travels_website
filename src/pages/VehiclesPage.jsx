import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Settings,
  Car,
  Fuel,
  Calendar,
  MapPin,
  Wrench,
  AlertTriangle,
  Loader,
  RefreshCw,
  X,
  Trash2,
} from "lucide-react";
import { vehiclesService, driversService } from "../services/api";

const VehiclesPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Create vehicle form state
  const [createFormData, setCreateFormData] = useState({
    vehicleNumber: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vehicleType: "",
    seatingCapacity: 4,
    fuelType: "Petrol",
    color: "",
    owner: "", // Driver ID
    dailyRate: 0,
    perKmRate: 0,
  });

  // Fetch vehicles from API
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.isActive = statusFilter === "active";
      if (typeFilter) params.vehicleType = typeFilter;

      const response = await vehiclesService.getAll(params);
      setVehicles(response.vehicles || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setMessage({
        type: "error",
        text: "Failed to load vehicles. Please try again.",
      });
      setTimeout(() => setMessage(null), 3000);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, typeFilter]);

  // Fetch drivers for owner selection
  const fetchDrivers = useCallback(async () => {
    try {
      const response = await driversService.getAll();
      setDrivers(response.drivers || response.data || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }, []);

  // Load vehicles and drivers on mount
  useEffect(() => {
    const controller = new AbortController();

    const initialLoad = async () => {
      try {
        setLoading(true);
        // Load both vehicles and drivers
        await Promise.all([
          fetchDrivers(),
          (async () => {
            const response = await vehiclesService.getAll();
            setVehicles(response.data || []);
            setPagination((prev) => ({
              ...prev,
              total: response.data?.length || 0,
              pages: Math.ceil((response.data?.length || 0) / prev.limit),
            }));
          })(),
        ]);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error loading vehicles:", error);
          setMessage({
            type: "error",
            text: "Failed to load vehicles. Please try again.",
          });
          setTimeout(() => setMessage(null), 3000);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    initialLoad();

    return () => controller.abort();
  }, [fetchDrivers]);

  // Debounced search effect
  useEffect(() => {
    if (search || statusFilter || typeFilter) {
      const debounceTimer = setTimeout(() => {
        fetchVehicles();
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [search, statusFilter, typeFilter, fetchVehicles]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehiclesService.getAll();
      setVehicles(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.length || 0,
        pages: Math.ceil((response.data?.length || 0) / prev.limit),
      }));
    } catch (error) {
      console.error("Error loading vehicles:", error);
      setMessage({
        type: "error",
        text: "Failed to load vehicles. Please try again.",
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async () => {
    try {
      setActionLoading(true);
      const response = await vehiclesService.create(createFormData);

      if (response.success) {
        setMessage({
          type: "success",
          text: "Vehicle created successfully!",
        });
        setShowCreateModal(false);
        loadVehicles(); // Refresh the list

        // Reset form
        setCreateFormData({
          vehicleNumber: "",
          make: "",
          model: "",
          year: new Date().getFullYear(),
          vehicleType: "",
          seatingCapacity: 4,
          fuelType: "Petrol",
          color: "",
          owner: "",
          dailyRate: 0,
          perKmRate: 0,
        });
      }
    } catch (error) {
      console.error("Error creating vehicle:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create vehicle",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteVehicle = async () => {
    try {
      setActionLoading(true);
      const response = await vehiclesService.delete(selectedVehicle._id);

      if (response.success) {
        setMessage({
          type: "success",
          text: "Vehicle deleted successfully!",
        });
        setShowDeleteModal(false);
        setSelectedVehicle(null);
        loadVehicles(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete vehicle",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border-green-200";
      case "On Trip":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Out of Service":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case "Sedan":
        return "🚗";
      case "SUV":
        return "🚙";
      case "MPV":
        return "🚐";
      case "Hatchback":
        return "🚗";
      default:
        return "🚗";
    }
  };

  const isDocumentExpiring = (date) => {
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Since we're filtering on the server side with fetchVehicles, use vehicles directly
  const filteredVehicles = vehicles;

  // Pagination
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">
                {vehicles.length}
              </p>
            </div>
            <div className="text-2xl">🚗</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter((v) => v.status === "Available").length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On Trip</p>
              <p className="text-2xl font-bold text-blue-600">
                {vehicles.filter((v) => v.status === "On Trip").length}
              </p>
            </div>
            <div className="text-2xl">🚙</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Need Attention</p>
              <p className="text-2xl font-bold text-red-600">
                {
                  vehicles.filter(
                    (v) =>
                      v.status === "Maintenance" ||
                      v.status === "Out of Service"
                  ).length
                }
              </p>
            </div>
            <div className="text-2xl">⚠️</div>
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
                placeholder="Search by registration, make, model, or driver..."
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
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>
          <select
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="MPV">MPV</option>
            <option value="Hatchback">Hatchback</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance
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
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500">
                        Loading vehicles...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedVehicles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500">No vehicles found</div>
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {getVehicleIcon(vehicle.vehicleType || vehicle.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.vehicleNumber ||
                              vehicle.registrationNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </div>
                          <div className="text-xs text-gray-400">
                            {vehicle.vehicleType || vehicle.type} •{" "}
                            {vehicle.fuelType} • {vehicle.capacity} seater
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vehicle.driver}
                      </div>
                      <div className="text-xs text-gray-500">
                        {vehicle.mileage.toLocaleString()} km
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {vehicle.totalTrips} trips
                      </div>
                      <div className="text-xs text-gray-500">
                        ⭐ {vehicle.avgRating} rating
                      </div>
                      <div className="text-xs text-gray-400">
                        ⛽ {vehicle.fuelEfficiency} km/l
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div
                          className={`text-xs ${
                            isDocumentExpiring(vehicle.insurance)
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          🛡️ Insurance:{" "}
                          {new Date(vehicle.insurance).toLocaleDateString()}
                          {isDocumentExpiring(vehicle.insurance) && (
                            <AlertTriangle className="h-3 w-3 inline ml-1" />
                          )}
                        </div>
                        <div
                          className={`text-xs ${
                            isDocumentExpiring(vehicle.permit)
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          📋 Permit:{" "}
                          {new Date(vehicle.permit).toLocaleDateString()}
                          {isDocumentExpiring(vehicle.permit) && (
                            <AlertTriangle className="h-3 w-3 inline ml-1" />
                          )}
                        </div>
                        <div
                          className={`text-xs ${
                            isDocumentExpiring(vehicle.fitness)
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          🔧 Fitness:{" "}
                          {new Date(vehicle.fitness).toLocaleDateString()}
                          {isDocumentExpiring(vehicle.fitness) && (
                            <AlertTriangle className="h-3 w-3 inline ml-1" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Last:{" "}
                        {new Date(vehicle.lastService).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Next:{" "}
                        {new Date(vehicle.nextService).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Cost: ₹{vehicle.maintenanceCost.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{vehicle.monthlyEarnings.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">This month</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          vehicle.status
                        )}`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            // Could add view modal later
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            // Could add edit modal later
                          }}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Edit Vehicle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results Summary */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
            {search && ` matching "${search}"`}
            {statusFilter && ` with status "${statusFilter}"`}
            {typeFilter && ` of type "${typeFilter}"`}
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            <span className="flex-1">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Vehicle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Create New Vehicle
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Vehicle Number *
                          </label>
                          <input
                            type="text"
                            value={createFormData.vehicleNumber}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                vehicleNumber: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter vehicle number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            value={createFormData.status}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                status: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Available">Available</option>
                            <option value="On Trip">On Trip</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Out of Service">
                              Out of Service
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Make *
                          </label>
                          <input
                            type="text"
                            value={createFormData.make}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                make: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter vehicle make"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Model *
                          </label>
                          <input
                            type="text"
                            value={createFormData.model}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                model: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter vehicle model"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Year
                          </label>
                          <input
                            type="number"
                            value={createFormData.year}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                year: parseInt(e.target.value),
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Vehicle Type
                          </label>
                          <select
                            value={createFormData.vehicleType}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                vehicleType: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Type</option>
                            <option value="Sedan">Sedan</option>
                            <option value="SUV">SUV</option>
                            <option value="Hatchback">Hatchback</option>
                            <option value="Luxury">Luxury</option>
                            <option value="Bus">Bus</option>
                            <option value="Tempo Traveller">
                              Tempo Traveller
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Seating Capacity
                          </label>
                          <input
                            type="number"
                            value={createFormData.seatingCapacity}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                seatingCapacity: parseInt(e.target.value),
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Fuel Type *
                          </label>
                          <select
                            value={createFormData.fuelType}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                fuelType: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Fuel Type</option>
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="CNG">CNG</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Color
                          </label>
                          <input
                            type="text"
                            value={createFormData.color}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                color: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter vehicle color"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Owner (Driver) *
                          </label>
                          <select
                            value={createFormData.owner}
                            onChange={(e) =>
                              setCreateFormData({
                                ...createFormData,
                                owner: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Driver</option>
                            {drivers.map((driver) => (
                              <option key={driver._id} value={driver._id}>
                                {driver.name} - {driver.phone}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleCreateVehicle}
                  disabled={actionLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {actionLoading ? "Creating..." : "Create Vehicle"}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Vehicle Modal */}
      {showDeleteModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Vehicle
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete vehicle "
                        {selectedVehicle.vehicleNumber ||
                          selectedVehicle.registrationNumber}
                        "? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDeleteVehicle}
                  disabled={actionLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedVehicle(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;
