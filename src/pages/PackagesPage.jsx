import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MapPin,
  Calendar,
  Users,
  Star,
  DollarSign,
  Clock,
  Trash2,
} from "lucide-react";

const PackagesPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Static packages data
  const packages = [
    {
      id: "PKG001",
      name: "Golden Triangle Tour",
      description:
        "Experience the magical Golden Triangle covering Delhi, Agra, and Jaipur with comfortable accommodation and guided tours.",
      category: "Cultural",
      duration: "6 Days / 5 Nights",
      destinations: ["Delhi", "Agra", "Jaipur"],
      maxGuests: 8,
      price: 25999,
      originalPrice: 32999,
      status: "Active",
      rating: 4.8,
      totalBookings: 156,
      revenue: 4055844,
      createdDate: "2024-01-15",
      lastBooking: "2024-09-20",
      includes: ["Hotels", "Transportation", "Guide", "Breakfast"],
      excludes: ["Flights", "Lunch", "Dinner", "Personal Expenses"],
      highlights: ["Taj Mahal Visit", "Amber Fort", "Red Fort", "City Palace"],
      image: "🏛️",
      difficulty: "Easy",
      season: "Oct-Mar",
    },
    {
      id: "PKG002",
      name: "Kerala Backwaters Experience",
      description:
        "Explore the serene backwaters of Kerala with houseboat stays, spice plantation visits, and traditional cuisine.",
      category: "Nature",
      duration: "5 Days / 4 Nights",
      destinations: ["Kochi", "Alleppey", "Kumarakom"],
      maxGuests: 6,
      price: 18999,
      originalPrice: 24999,
      status: "Active",
      rating: 4.9,
      totalBookings: 89,
      revenue: 1690911,
      createdDate: "2024-02-10",
      lastBooking: "2024-09-18",
      includes: ["Houseboat", "Transportation", "All Meals", "Guide"],
      excludes: ["Flights", "Personal Expenses", "Shopping"],
      highlights: [
        "Houseboat Stay",
        "Spice Gardens",
        "Backwater Cruise",
        "Kathakali Show",
      ],
      image: "🚤",
      difficulty: "Easy",
      season: "Sep-May",
    },
    {
      id: "PKG003",
      name: "Himalayan Adventure Trek",
      description:
        "Challenging trek through the majestic Himalayas with breathtaking views and mountain camping experience.",
      category: "Adventure",
      duration: "8 Days / 7 Nights",
      destinations: ["Manali", "Kasol", "Tosh", "Malana"],
      maxGuests: 12,
      price: 15999,
      originalPrice: 19999,
      status: "Active",
      rating: 4.7,
      totalBookings: 67,
      revenue: 1071933,
      createdDate: "2024-03-05",
      lastBooking: "2024-09-15",
      includes: ["Camping", "Trekking Guide", "Equipment", "Meals"],
      excludes: ["Transportation to Base", "Personal Gear", "Insurance"],
      highlights: [
        "Mountain Camping",
        "River Crossing",
        "Local Villages",
        "Snow Peaks",
      ],
      image: "🏔️",
      difficulty: "Hard",
      season: "Apr-Jun, Sep-Nov",
    },
    {
      id: "PKG004",
      name: "Goa Beach Paradise",
      description:
        "Relax on pristine beaches, enjoy water sports, and experience vibrant nightlife in beautiful Goa.",
      category: "Beach",
      duration: "4 Days / 3 Nights",
      destinations: ["North Goa", "South Goa"],
      maxGuests: 10,
      price: 12999,
      originalPrice: 16999,
      status: "Active",
      rating: 4.6,
      totalBookings: 203,
      revenue: 2638797,
      createdDate: "2024-01-20",
      lastBooking: "2024-09-22",
      includes: ["Beach Resort", "Water Sports", "Transportation", "Breakfast"],
      excludes: ["Flights", "Lunch", "Dinner", "Alcohol"],
      highlights: [
        "Parasailing",
        "Beach Shacks",
        "Sunset Cruise",
        "Dudhsagar Falls",
      ],
      image: "🏖️",
      difficulty: "Easy",
      season: "Oct-Mar",
    },
    {
      id: "PKG005",
      name: "Rajasthan Royal Heritage",
      description:
        "Experience the royal heritage of Rajasthan with palace stays, camel safaris, and cultural performances.",
      category: "Heritage",
      duration: "7 Days / 6 Nights",
      destinations: ["Jaipur", "Jodhpur", "Udaipur", "Jaisalmer"],
      maxGuests: 8,
      price: 35999,
      originalPrice: 45999,
      status: "Active",
      rating: 4.9,
      totalBookings: 124,
      revenue: 4463876,
      createdDate: "2024-02-28",
      lastBooking: "2024-09-19",
      includes: ["Palace Hotels", "Transportation", "Guide", "Cultural Shows"],
      excludes: ["Flights", "Personal Expenses", "Optional Activities"],
      highlights: [
        "Palace Stay",
        "Camel Safari",
        "Mehrangarh Fort",
        "Lake Pichola",
      ],
      image: "🏰",
      difficulty: "Easy",
      season: "Oct-Mar",
    },
    {
      id: "PKG006",
      name: "Andaman Island Escape",
      description:
        "Discover pristine beaches, coral reefs, and crystal-clear waters in the beautiful Andaman Islands.",
      category: "Island",
      duration: "6 Days / 5 Nights",
      destinations: ["Port Blair", "Havelock", "Neil Island"],
      maxGuests: 6,
      price: 28999,
      originalPrice: 36999,
      status: "Inactive",
      rating: 4.8,
      totalBookings: 45,
      revenue: 1304955,
      createdDate: "2024-04-12",
      lastBooking: "2024-08-10",
      includes: ["Island Resort", "Ferry Transfers", "Snorkeling", "All Meals"],
      excludes: ["Flights", "Scuba Diving", "Personal Expenses"],
      highlights: [
        "Radhanagar Beach",
        "Cellular Jail",
        "Coral Reefs",
        "Glass Bottom Boat",
      ],
      image: "🏝️",
      difficulty: "Easy",
      season: "Oct-May",
    },
  ];

  const getStatusColor = (status) => {
    return status === "Active"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDiscountPercentage = (original, current) => {
    return Math.round(((original - current) / original) * 100);
  };

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      !search ||
      pkg.name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.destinations.some((dest) =>
        dest.toLowerCase().includes(search.toLowerCase())
      ) ||
      pkg.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || pkg.status === statusFilter;
    const matchesCategory = !categoryFilter || pkg.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Packages</p>
              <p className="text-2xl font-bold text-gray-900">
                {packages.length}
              </p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Packages</p>
              <p className="text-2xl font-bold text-green-600">
                {packages.filter((p) => p.status === "Active").length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">
                {packages.reduce((sum, p) => sum + p.totalBookings, 0)}
              </p>
            </div>
            <div className="text-2xl">🎫</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹
                {(
                  packages.reduce((sum, p) => sum + p.revenue, 0) / 1000000
                ).toFixed(1)}
                M
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
                placeholder="Search packages by name, destination, or category..."
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
          <select
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Cultural">Cultural</option>
            <option value="Nature">Nature</option>
            <option value="Adventure">Adventure</option>
            <option value="Beach">Beach</option>
            <option value="Heritage">Heritage</option>
            <option value="Island">Island</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
          >
            {/* Package Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="text-3xl mr-3">{pkg.image}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pkg.name}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {pkg.id}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                    pkg.status
                  )}`}
                >
                  {pkg.status}
                </span>
              </div>
            </div>

            {/* Package Details */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {pkg.description}
              </p>

              {/* Key Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{pkg.duration}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{pkg.destinations.join(", ")}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Max {pkg.maxGuests} guests</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Best: {pkg.season}</span>
                </div>
              </div>

              {/* Category & Difficulty */}
              <div className="flex items-center space-x-2 mb-4">
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {pkg.category}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                    pkg.difficulty
                  )}`}
                >
                  {pkg.difficulty}
                </span>
              </div>

              {/* Rating & Bookings */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">{pkg.rating}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({pkg.totalBookings} bookings)
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Last booked: {new Date(pkg.lastBooking).toLocaleDateString()}
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{pkg.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 line-through ml-2">
                      ₹{pkg.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {getDiscountPercentage(pkg.originalPrice, pkg.price)}% OFF
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{(pkg.revenue / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs text-gray-500">Revenue</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button className="flex-1 bg-green-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button className="bg-red-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results Summary */}
      {filteredPackages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No packages found
          </h3>
          <p className="text-gray-600">
            {search || statusFilter || categoryFilter
              ? "Try adjusting your search criteria or filters."
              : "Start by creating your first travel package."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-700">
            Showing {filteredPackages.length} of {packages.length} packages
            {search && ` matching "${search}"`}
            {statusFilter && ` with status "${statusFilter}"`}
            {categoryFilter && ` in category "${categoryFilter}"`}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
