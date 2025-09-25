import React, { useState } from "react";
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
} from "lucide-react";

const VehiclesPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Static vehicles data
  const vehicles = [
    {
      id: "VH001",
      registrationNumber: "DL 8C 1234",
      make: "Maruti Suzuki",
      model: "Swift Dzire",
      year: 2022,
      type: "Sedan",
      fuelType: "Petrol",
      capacity: 4,
      color: "White",
      status: "Available",
      driver: "Amit Singh",
      mileage: 45600,
      lastService: "2024-08-15",
      nextService: "2024-11-15",
      insurance: "2025-03-20",
      permit: "2025-01-10",
      fitness: "2025-07-30",
      totalTrips: 1247,
      avgRating: 4.8,
      monthlyEarnings: 45600,
      fuelEfficiency: 18.5,
      maintenanceCost: 8500,
    },
    {
      id: "VH002",
      registrationNumber: "HR 26 5678",
      make: "Toyota",
      model: "Innova Crysta",
      year: 2021,
      type: "SUV",
      fuelType: "Diesel",
      capacity: 7,
      color: "Silver",
      status: "On Trip",
      driver: "Vikash Yadav",
      mileage: 62300,
      lastService: "2024-09-01",
      nextService: "2024-12-01",
      insurance: "2025-05-15",
      permit: "2024-12-20",
      fitness: "2025-09-10",
      totalTrips: 892,
      avgRating: 4.9,
      monthlyEarnings: 52400,
      fuelEfficiency: 14.2,
      maintenanceCost: 12300,
    },
    {
      id: "VH003",
      registrationNumber: "DL 1C 9876",
      make: "Honda",
      model: "City",
      year: 2023,
      type: "Sedan",
      fuelType: "Petrol",
      capacity: 4,
      color: "Blue",
      status: "Maintenance",
      driver: "Ravi Kumar",
      mileage: 28900,
      lastService: "2024-09-10",
      nextService: "2024-12-10",
      insurance: "2025-08-30",
      permit: "2025-02-28",
      fitness: "2025-12-15",
      totalTrips: 678,
      avgRating: 4.7,
      monthlyEarnings: 38200,
      fuelEfficiency: 16.8,
      maintenanceCost: 15600,
    },
    {
      id: "VH004",
      registrationNumber: "TN 33 4567",
      make: "Hyundai",
      model: "Creta",
      year: 2022,
      type: "SUV",
      fuelType: "Petrol",
      capacity: 5,
      color: "Red",
      status: "Available",
      driver: "Karthik Raja",
      mileage: 34500,
      lastService: "2024-07-20",
      nextService: "2024-10-20",
      insurance: "2025-04-12",
      permit: "2025-06-15",
      fitness: "2025-11-22",
      totalTrips: 534,
      avgRating: 4.6,
      monthlyEarnings: 41800,
      fuelEfficiency: 15.4,
      maintenanceCost: 9200,
    },
    {
      id: "VH005",
      registrationNumber: "DL 5C 7890",
      make: "Maruti Suzuki",
      model: "Ertiga",
      year: 2020,
      type: "MPV",
      fuelType: "Petrol",
      capacity: 7,
      color: "Grey",
      status: "Out of Service",
      driver: "Deepak Singh",
      mileage: 78400,
      lastService: "2024-06-05",
      nextService: "2024-09-05",
      insurance: "2024-11-30",
      permit: "2024-10-15",
      fitness: "2025-03-08",
      totalTrips: 1456,
      avgRating: 4.3,
      monthlyEarnings: 22100,
      fuelEfficiency: 17.2,
      maintenanceCost: 18900,
    },
    {
      id: "VH006",
      registrationNumber: "GJ 01 2345",
      make: "Mahindra",
      model: "Scorpio",
      year: 2021,
      type: "SUV",
      fuelType: "Diesel",
      capacity: 7,
      color: "Black",
      status: "Available",
      driver: "Suresh Patel",
      mileage: 56700,
      lastService: "2024-08-28",
      nextService: "2024-11-28",
      insurance: "2025-06-10",
      permit: "2025-03-15",
      fitness: "2025-08-20",
      totalTrips: 956,
      avgRating: 4.5,
      monthlyEarnings: 48300,
      fuelEfficiency: 13.8,
      maintenanceCost: 14200,
    },
  ];

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

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      !search ||
      vehicle.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || vehicle.status === statusFilter;
    const matchesType = !typeFilter || vehicle.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
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
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {getVehicleIcon(vehicle.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.registrationNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </div>
                        <div className="text-xs text-gray-400">
                          {vehicle.type} • {vehicle.fuelType} •{" "}
                          {vehicle.capacity} seater
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
                      Last: {new Date(vehicle.lastService).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Next: {new Date(vehicle.nextService).toLocaleDateString()}
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
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Edit Vehicle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-purple-600 hover:text-purple-800 p-1"
                        title="Maintenance"
                      >
                        <Wrench className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-800 p-1"
                        title="Settings"
                      >
                        <Settings className="h-4 w-4" />
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
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
            {search && ` matching "${search}"`}
            {statusFilter && ` with status "${statusFilter}"`}
            {typeFilter && ` of type "${typeFilter}"`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclesPage;
