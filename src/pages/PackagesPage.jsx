import React, { useState, useEffect } from "react";
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
  RefreshCw,
  Loader,
} from "lucide-react";
import { packagesService } from "../services/api";

const PackagesPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    duration: { days: "", nights: "" },
    destinations: [{ city: "", state: "", country: "India", stayDuration: "" }],
    pricing: {
      basePrice: "",
      pricePerPerson: "",
      childPrice: "",
      infantPrice: "",
    },
    inclusions: [""],
    exclusions: [""],
    highlights: [""],
    availability: { isActive: true },
    tags: [""],
  });

  // Add form data (separate from edit form)
  const [addFormData, setAddFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    category: "",
    duration: { days: "", nights: "" },
    destinations: [{ city: "", state: "", country: "India", stayDuration: "" }],
    pricing: {
      basePrice: "",
      pricePerPerson: "",
      childPrice: "",
      infantPrice: "",
    },
    inclusions: [""],
    exclusions: [""],
    highlights: [""],
    availability: { isActive: true },
    tags: [""],
  });

  const [editFormErrors, setEditFormErrors] = useState({});
  const [addFormErrors, setAddFormErrors] = useState({});

  // Fetch packages from API
  const fetchPackages = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        category: categoryFilter || undefined,
        isActive:
          statusFilter === "Active"
            ? true
            : statusFilter === "Inactive"
            ? false
            : undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const response = await packagesService.getAll(params);
      setPackages(response.packages);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching packages:", error);
      setError("Failed to fetch packages. Please try again.");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, categoryFilter]);

  // Load packages on component mount and when filters change
  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [statusFilter, categoryFilter]);

  // Transform backend data to match frontend format
  const transformPackage = React.useCallback(
    (pkg) => ({
      id: pkg._id,
      name: pkg.name,
      description: pkg.description,
      shortDescription: pkg.shortDescription,
      category: pkg.category,
      duration: `${pkg.duration.days} Days / ${pkg.duration.nights} Nights`,
      destinations: pkg.destinations?.map((d) => d.city).filter(Boolean) || [],
      maxGuests:
        pkg.vehicleOptions?.reduce(
          (max, v) => Math.max(max, v.capacity || 0),
          4
        ) || 8,
      price: pkg.pricing?.pricePerPerson || 0,
      originalPrice: Math.round((pkg.pricing?.pricePerPerson || 0) * 1.3), // Assume 30% discount
      status: pkg.availability?.isActive ? "Active" : "Inactive",
      rating: pkg.rating?.average || 4.0,
      totalBookings: pkg.totalBookings || 0,
      revenue: (pkg.totalBookings || 0) * (pkg.pricing?.pricePerPerson || 0),
      createdDate: new Date(pkg.createdAt).toISOString().split("T")[0],
      lastBooking: new Date(pkg.updatedAt).toISOString().split("T")[0],
      includes: pkg.inclusions || [],
      excludes: pkg.exclusions || [],
      highlights: pkg.highlights || [],
      image: getCategoryEmoji(pkg.category),
      difficulty: getDifficultyFromCategory(pkg.category),
      season: "Year Round", // Could be enhanced with seasonal data
    }),
    []
  );

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      Adventure: "🏔️",
      Pilgrimage: "🙏",
      Beach: "🏖️",
      "Hill Station": "⛰️",
      Heritage: "🏛️",
      Wildlife: "🦁",
      Cultural: "🎭",
      Business: "💼",
    };
    return emojiMap[category] || "📦";
  };

  const getDifficultyFromCategory = (category) => {
    const difficultyMap = {
      Adventure: "Hard",
      Pilgrimage: "Medium",
      Beach: "Easy",
      "Hill Station": "Medium",
      Heritage: "Easy",
      Wildlife: "Medium",
      Cultural: "Easy",
      Business: "Easy",
    };
    return difficultyMap[category] || "Easy";
  };

  // Transform packages for display
  const transformedPackages = React.useMemo(() => {
    return packages.map(transformPackage);
  }, [packages, transformPackage]);

  // Filter packages (now handled by backend, but keeping for client-side consistency)
  const filteredPackages = transformedPackages;

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

  const handleRefresh = () => {
    fetchPackages();
  };

  // Package action handlers
  const handleViewPackage = async (packageId) => {
    try {
      setActionLoading(true);
      const response = await packagesService.getById(packageId);
      setSelectedPackage(response.package);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error fetching package details:", error);
      setError("Failed to load package details.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPackage = async (packageId) => {
    try {
      setActionLoading(true);
      const response = await packagesService.getById(packageId);
      const pkg = response.package;

      // Populate edit form with existing data
      setEditFormData({
        name: pkg.name || "",
        description: pkg.description || "",
        shortDescription: pkg.shortDescription || "",
        category: pkg.category || "",
        duration: {
          days: pkg.duration?.days?.toString() || "",
          nights: pkg.duration?.nights?.toString() || "",
        },
        destinations:
          pkg.destinations?.length > 0
            ? pkg.destinations.map((dest) => ({
                city: dest.city || "",
                state: dest.state || "",
                country: dest.country || "India",
                stayDuration: dest.stayDuration?.toString() || "",
              }))
            : [{ city: "", state: "", country: "India", stayDuration: "" }],
        pricing: {
          basePrice: pkg.pricing?.basePrice?.toString() || "",
          pricePerPerson: pkg.pricing?.pricePerPerson?.toString() || "",
          childPrice: pkg.pricing?.childPrice?.toString() || "",
          infantPrice: pkg.pricing?.infantPrice?.toString() || "",
        },
        inclusions: pkg.inclusions?.length > 0 ? pkg.inclusions : [""],
        exclusions: pkg.exclusions?.length > 0 ? pkg.exclusions : [""],
        highlights: pkg.highlights?.length > 0 ? pkg.highlights : [""],
        availability: {
          isActive: pkg.availability?.isActive ?? true,
        },
        tags: pkg.tags?.length > 0 ? pkg.tags : [""],
      });

      setSelectedPackage(pkg);
      setEditFormErrors({});
      setShowEditModal(true);
    } catch (error) {
      console.error("Error fetching package details:", error);
      setError("Failed to load package details.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (editFormErrors[field]) {
      setEditFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleNestedFormChange = (field, subfield, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subfield]: value,
      },
    }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleDestinationChange = (index, field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      destinations: prev.destinations.map((dest, i) =>
        i === index ? { ...dest, [field]: value } : dest
      ),
    }));
  };

  const addArrayField = (field) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayField = (field, index) => {
    if (editFormData[field].length > 1) {
      setEditFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  const addDestination = () => {
    setEditFormData((prev) => ({
      ...prev,
      destinations: [
        ...prev.destinations,
        { city: "", state: "", country: "India", stayDuration: "" },
      ],
    }));
  };

  const removeDestination = (index) => {
    if (editFormData.destinations.length > 1) {
      setEditFormData((prev) => ({
        ...prev,
        destinations: prev.destinations.filter((_, i) => i !== index),
      }));
    }
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData.name.trim()) errors.name = "Package name is required";
    if (!editFormData.description.trim())
      errors.description = "Description is required";
    if (!editFormData.shortDescription.trim())
      errors.shortDescription = "Short description is required";
    if (!editFormData.category) errors.category = "Category is required";
    if (!editFormData.duration.days || editFormData.duration.days < 1)
      errors.days = "Valid duration in days is required";
    if (!editFormData.duration.nights || editFormData.duration.nights < 0)
      errors.nights = "Valid duration in nights is required";
    if (
      !editFormData.pricing.pricePerPerson ||
      editFormData.pricing.pricePerPerson < 0
    )
      errors.pricePerPerson = "Valid price per person is required";

    // Validate destinations
    editFormData.destinations.forEach((dest, index) => {
      if (!dest.city.trim())
        errors[`destination_city_${index}`] = "City is required";
      if (!dest.state.trim())
        errors[`destination_state_${index}`] = "State is required";
    });

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) return;

    try {
      setActionLoading(true);

      const updateData = {
        name: editFormData.name,
        description: editFormData.description,
        shortDescription: editFormData.shortDescription,
        category: editFormData.category,
        duration: {
          days: parseInt(editFormData.duration.days),
          nights: parseInt(editFormData.duration.nights),
        },
        destinations: editFormData.destinations.map((dest) => ({
          city: dest.city,
          state: dest.state,
          country: dest.country,
          stayDuration: dest.stayDuration
            ? parseInt(dest.stayDuration)
            : undefined,
        })),
        pricing: {
          basePrice: editFormData.pricing.basePrice
            ? parseFloat(editFormData.pricing.basePrice)
            : undefined,
          pricePerPerson: parseFloat(editFormData.pricing.pricePerPerson),
          childPrice: editFormData.pricing.childPrice
            ? parseFloat(editFormData.pricing.childPrice)
            : undefined,
          infantPrice: editFormData.pricing.infantPrice
            ? parseFloat(editFormData.pricing.infantPrice)
            : undefined,
        },
        inclusions: editFormData.inclusions.filter((item) => item.trim()),
        exclusions: editFormData.exclusions.filter((item) => item.trim()),
        highlights: editFormData.highlights.filter((item) => item.trim()),
        availability: {
          isActive: editFormData.availability.isActive,
        },
        tags: editFormData.tags.filter((tag) => tag.trim()),
      };

      await packagesService.update(selectedPackage._id, updateData);
      closeModals();
      fetchPackages(); // Refresh the list
    } catch (error) {
      console.error("Error updating package:", error);
      setError("Failed to update package.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePackage = (pkg) => {
    setSelectedPackage(pkg);
    setShowDeleteModal(true);
  };

  const confirmDeletePackage = async () => {
    if (!selectedPackage) return;

    try {
      setActionLoading(true);
      await packagesService.delete(selectedPackage.id);
      setShowDeleteModal(false);
      setSelectedPackage(null);
      fetchPackages(); // Refresh the list
    } catch (error) {
      console.error("Error deleting package:", error);
      setError("Failed to delete package.");
    } finally {
      setActionLoading(false);
    }
  };

  // Add Form Handlers
  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (addFormErrors[field]) {
      setAddFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleAddNestedFormChange = (field, subfield, value) => {
    setAddFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subfield]: value,
      },
    }));
  };

  const handleAddArrayFieldChange = (field, index, value) => {
    setAddFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleAddDestinationChange = (index, field, value) => {
    setAddFormData((prev) => ({
      ...prev,
      destinations: prev.destinations.map((dest, i) =>
        i === index ? { ...dest, [field]: value } : dest
      ),
    }));
  };

  const addAddDestination = () => {
    setAddFormData((prev) => ({
      ...prev,
      destinations: [
        ...prev.destinations,
        { city: "", state: "", country: "India", stayDuration: "" },
      ],
    }));
  };

  const removeAddDestination = (index) => {
    if (addFormData.destinations.length > 1) {
      setAddFormData((prev) => ({
        ...prev,
        destinations: prev.destinations.filter((_, i) => i !== index),
      }));
    }
  };

  const addAddArrayField = (field) => {
    setAddFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeAddArrayField = (field, index) => {
    if (addFormData[field].length > 1) {
      setAddFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  const validateAddForm = () => {
    const errors = {};

    if (!addFormData.name.trim()) errors.name = "Package name is required";
    if (!addFormData.description.trim())
      errors.description = "Description is required";
    if (!addFormData.shortDescription.trim())
      errors.shortDescription = "Short description is required";
    if (!addFormData.category) errors.category = "Category is required";
    if (!addFormData.duration.days || addFormData.duration.days < 1)
      errors.days = "Valid duration in days is required";
    if (!addFormData.duration.nights || addFormData.duration.nights < 0)
      errors.nights = "Valid duration in nights is required";
    if (
      !addFormData.pricing.pricePerPerson ||
      addFormData.pricing.pricePerPerson < 0
    )
      errors.pricePerPerson = "Valid price per person is required";

    // Validate destinations
    addFormData.destinations.forEach((dest, index) => {
      if (!dest.city.trim())
        errors[`destination_city_${index}`] = "City is required";
      if (!dest.state.trim())
        errors[`destination_state_${index}`] = "State is required";
    });

    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePackage = async () => {
    if (!validateAddForm()) return;

    try {
      setActionLoading(true);

      const packageData = {
        name: addFormData.name,
        description: addFormData.description,
        shortDescription: addFormData.shortDescription,
        category: addFormData.category,
        duration: {
          days: parseInt(addFormData.duration.days),
          nights: parseInt(addFormData.duration.nights),
        },
        destinations: addFormData.destinations.map((dest) => ({
          city: dest.city,
          state: dest.state,
          country: dest.country,
          stayDuration: dest.stayDuration
            ? parseInt(dest.stayDuration)
            : undefined,
        })),
        pricing: {
          basePrice: addFormData.pricing.basePrice
            ? parseFloat(addFormData.pricing.basePrice)
            : undefined,
          pricePerPerson: parseFloat(addFormData.pricing.pricePerPerson),
          childPrice: addFormData.pricing.childPrice
            ? parseFloat(addFormData.pricing.childPrice)
            : undefined,
          infantPrice: addFormData.pricing.infantPrice
            ? parseFloat(addFormData.pricing.infantPrice)
            : undefined,
        },
        inclusions: addFormData.inclusions.filter((item) => item.trim()),
        exclusions: addFormData.exclusions.filter((item) => item.trim()),
        highlights: addFormData.highlights.filter((item) => item.trim()),
        availability: {
          isActive: addFormData.availability.isActive,
        },
        tags: addFormData.tags.filter((tag) => tag.trim()),
      };

      await packagesService.create(packageData);
      setMessage({ type: "success", text: "Package created successfully!" });

      // Reset form
      setAddFormData({
        name: "",
        description: "",
        shortDescription: "",
        category: "",
        duration: { days: "", nights: "" },
        destinations: [
          { city: "", state: "", country: "India", stayDuration: "" },
        ],
        pricing: {
          basePrice: "",
          pricePerPerson: "",
          childPrice: "",
          infantPrice: "",
        },
        inclusions: [""],
        exclusions: [""],
        highlights: [""],
        availability: { isActive: true },
        tags: [""],
      });

      closeModals();
      fetchPackages(); // Refresh the list
    } catch (error) {
      console.error("Error creating package:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to create package. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowAddModal(false);
    setSelectedPackage(null);
    setEditFormErrors({});
    setAddFormErrors({});
    if (message) {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
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
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Package
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
                Error Loading Packages
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-auto bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && packages.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Packages...
          </h3>
          <p className="text-gray-600">
            Please wait while we fetch your packages.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Packages</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.total || 0}
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
                {
                  transformedPackages.filter((p) => p.status === "Active")
                    .length
                }
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
                {transformedPackages.reduce(
                  (sum, p) => sum + p.totalBookings,
                  0
                )}
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
                  transformedPackages.reduce((sum, p) => sum + p.revenue, 0) /
                  1000000
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
            <option value="Adventure">Adventure</option>
            <option value="Pilgrimage">Pilgrimage</option>
            <option value="Beach">Beach</option>
            <option value="Hill Station">Hill Station</option>
            <option value="Heritage">Heritage</option>
            <option value="Wildlife">Wildlife</option>
            <option value="Cultural">Cultural</option>
            <option value="Business">Business</option>
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
                <button
                  onClick={() => handleViewPackage(pkg.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleEditPackage(pkg.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePackage(pkg)}
                  disabled={actionLoading}
                  className="bg-red-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results Summary and Pagination */}
      {!loading && (
        <>
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
            <>
              {/* Results Summary */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {filteredPackages.length} of {pagination.total}{" "}
                    packages
                    {search && ` matching "${search}"`}
                    {statusFilter && ` with status "${statusFilter}"`}
                    {categoryFilter && ` in category "${categoryFilter}"`}
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
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: Math.min(pagination.pages, prev.page + 1),
                          }))
                        }
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* View Package Modal */}
      {showViewModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Package Details
                </h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedPackage.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedPackage.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Category:</span>{" "}
                      {selectedPackage.category}
                    </p>
                    <p>
                      <span className="font-medium">Duration:</span>{" "}
                      {selectedPackage.duration?.days} days /{" "}
                      {selectedPackage.duration?.nights} nights
                    </p>
                    <p>
                      <span className="font-medium">Price:</span> ₹
                      {selectedPackage.pricing?.pricePerPerson?.toLocaleString()}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span
                        className={`ml-1 px-2 py-1 rounded text-xs ${
                          selectedPackage.availability?.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedPackage.availability?.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Destinations</h4>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    {selectedPackage.destinations?.map((dest, index) => (
                      <p key={index}>
                        {dest.city}, {dest.state}
                      </p>
                    ))}
                  </div>
                  <h4 className="font-medium mb-2">Highlights</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {selectedPackage.highlights?.map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Inclusions</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {selectedPackage.inclusions?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Exclusions</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {selectedPackage.exclusions?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Package: {selectedPackage.name}
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
              <form className="space-y-8">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) =>
                          handleEditFormChange("name", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.name
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter package name"
                      />
                      {editFormErrors.name && (
                        <p className="text-red-600 text-xs mt-1">
                          {editFormErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={editFormData.category}
                        onChange={(e) =>
                          handleEditFormChange("category", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.category
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Category</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Pilgrimage">Pilgrimage</option>
                        <option value="Beach">Beach</option>
                        <option value="Hill Station">Hill Station</option>
                        <option value="Heritage">Heritage</option>
                        <option value="Wildlife">Wildlife</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Business">Business</option>
                      </select>
                      {editFormErrors.category && (
                        <p className="text-red-600 text-xs mt-1">
                          {editFormErrors.category}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description *
                    </label>
                    <textarea
                      value={editFormData.shortDescription}
                      onChange={(e) =>
                        handleEditFormChange("shortDescription", e.target.value)
                      }
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editFormErrors.shortDescription
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Brief description for listings"
                    />
                    {editFormErrors.shortDescription && (
                      <p className="text-red-600 text-xs mt-1">
                        {editFormErrors.shortDescription}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detailed Description *
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) =>
                        handleEditFormChange("description", e.target.value)
                      }
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editFormErrors.description
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Detailed package description"
                    />
                    {editFormErrors.description && (
                      <p className="text-red-600 text-xs mt-1">
                        {editFormErrors.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duration and Pricing */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Duration & Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editFormData.duration.days}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "duration",
                            "days",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.days
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {editFormErrors.days && (
                        <p className="text-red-600 text-xs mt-1">
                          {editFormErrors.days}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nights *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.duration.nights}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "duration",
                            "nights",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.nights
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {editFormErrors.nights && (
                        <p className="text-red-600 text-xs mt-1">
                          {editFormErrors.nights}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price per Person *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.pricing.pricePerPerson}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "pricing",
                            "pricePerPerson",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editFormErrors.pricePerPerson
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {editFormErrors.pricePerPerson && (
                        <p className="text-red-600 text-xs mt-1">
                          {editFormErrors.pricePerPerson}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.pricing.basePrice}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "pricing",
                            "basePrice",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Child Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.pricing.childPrice}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "pricing",
                            "childPrice",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Infant Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.pricing.infantPrice}
                        onChange={(e) =>
                          handleNestedFormChange(
                            "pricing",
                            "infantPrice",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Destinations */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Destinations
                    </h3>
                    <button
                      type="button"
                      onClick={addDestination}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      + Add Destination
                    </button>
                  </div>

                  {editFormData.destinations.map((destination, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 mb-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Destination {index + 1}
                        </span>
                        {editFormData.destinations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDestination(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={destination.city}
                            onChange={(e) =>
                              handleDestinationChange(
                                index,
                                "city",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editFormErrors[`destination_city_${index}`]
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="City name"
                          />
                          {editFormErrors[`destination_city_${index}`] && (
                            <p className="text-red-600 text-xs mt-1">
                              {editFormErrors[`destination_city_${index}`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={destination.state}
                            onChange={(e) =>
                              handleDestinationChange(
                                index,
                                "state",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              editFormErrors[`destination_state_${index}`]
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="State name"
                          />
                          {editFormErrors[`destination_state_${index}`] && (
                            <p className="text-red-600 text-xs mt-1">
                              {editFormErrors[`destination_state_${index}`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            value={destination.country}
                            onChange={(e) =>
                              handleDestinationChange(
                                index,
                                "country",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Country"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stay Duration (days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={destination.stayDuration}
                            onChange={(e) =>
                              handleDestinationChange(
                                index,
                                "stayDuration",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Days"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dynamic Arrays (Inclusions, Exclusions, Highlights) */}
                {["inclusions", "exclusions", "highlights"].map((field) => (
                  <div key={field} className="border-b border-gray-200 pb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {field}
                      </h3>
                      <button
                        type="button"
                        onClick={() => addArrayField(field)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        + Add {field.slice(0, -1)}
                      </button>
                    </div>

                    {editFormData[field].map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            handleArrayFieldChange(field, index, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Enter ${field.slice(0, -1)}`}
                        />
                        {editFormData[field].length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayField(field, index)}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Tags and Status */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Tags
                        </h3>
                        <button
                          type="button"
                          onClick={() => addArrayField("tags")}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          + Add Tag
                        </button>
                      </div>

                      {editFormData.tags.map((tag, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) =>
                              handleArrayFieldChange(
                                "tags",
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter tag"
                          />
                          {editFormData.tags.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField("tags", index)}
                              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Package Status
                      </h3>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={editFormData.availability.isActive}
                          onChange={(e) =>
                            handleNestedFormChange(
                              "availability",
                              "isActive",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor="isActive"
                          className="ml-2 text-sm font-medium text-gray-700"
                        >
                          Package is Active
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Active packages are visible to customers for booking
                      </p>
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
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {actionLoading && (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Package
                  </h3>
                  <p className="text-gray-600">
                    Are you sure you want to delete this package?
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900">
                  {selectedPackage.name}
                </h4>
                <p className="text-sm text-gray-600">
                  ID: {selectedPackage.id}
                </p>
                <p className="text-sm text-gray-600">
                  Category: {selectedPackage.category}
                </p>
              </div>

              <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-6">
                <strong>Warning:</strong> This action cannot be undone. All
                booking data associated with this package will be preserved, but
                the package will no longer be available for new bookings.
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePackage}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {actionLoading && (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Delete Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Add New Package
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
              {message && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form className="space-y-8">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        value={addFormData.name}
                        onChange={(e) =>
                          handleAddFormChange("name", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.name
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter package name"
                      />
                      {addFormErrors.name && (
                        <p className="text-red-600 text-xs mt-1">
                          {addFormErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={addFormData.category}
                        onChange={(e) =>
                          handleAddFormChange("category", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.category
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Category</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Pilgrimage">Pilgrimage</option>
                        <option value="Beach">Beach</option>
                        <option value="Hill Station">Hill Station</option>
                        <option value="Heritage">Heritage</option>
                        <option value="Wildlife">Wildlife</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Business">Business</option>
                      </select>
                      {addFormErrors.category && (
                        <p className="text-red-600 text-xs mt-1">
                          {addFormErrors.category}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description *
                    </label>
                    <textarea
                      value={addFormData.shortDescription}
                      onChange={(e) =>
                        handleAddFormChange("shortDescription", e.target.value)
                      }
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        addFormErrors.shortDescription
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Brief description for listings"
                    />
                    {addFormErrors.shortDescription && (
                      <p className="text-red-600 text-xs mt-1">
                        {addFormErrors.shortDescription}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detailed Description *
                    </label>
                    <textarea
                      value={addFormData.description}
                      onChange={(e) =>
                        handleAddFormChange("description", e.target.value)
                      }
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        addFormErrors.description
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Detailed package description"
                    />
                    {addFormErrors.description && (
                      <p className="text-red-600 text-xs mt-1">
                        {addFormErrors.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duration and Pricing */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Duration & Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={addFormData.duration.days}
                        onChange={(e) =>
                          handleAddNestedFormChange(
                            "duration",
                            "days",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.days
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {addFormErrors.days && (
                        <p className="text-red-600 text-xs mt-1">
                          {addFormErrors.days}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nights *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={addFormData.duration.nights}
                        onChange={(e) =>
                          handleAddNestedFormChange(
                            "duration",
                            "nights",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.nights
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {addFormErrors.nights && (
                        <p className="text-red-600 text-xs mt-1">
                          {addFormErrors.nights}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price per Person *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={addFormData.pricing.pricePerPerson}
                        onChange={(e) =>
                          handleAddNestedFormChange(
                            "pricing",
                            "pricePerPerson",
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          addFormErrors.pricePerPerson
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {addFormErrors.pricePerPerson && (
                        <p className="text-red-600 text-xs mt-1">
                          {addFormErrors.pricePerPerson}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={addFormData.pricing.basePrice}
                        onChange={(e) =>
                          handleAddNestedFormChange(
                            "pricing",
                            "basePrice",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Child Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={addFormData.pricing.childPrice}
                        onChange={(e) =>
                          handleAddNestedFormChange(
                            "pricing",
                            "childPrice",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Infant Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={addFormData.pricing.infantPrice}
                        onChange={(e) =>
                          handleAddNestedFormChange(
                            "pricing",
                            "infantPrice",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Destinations */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Destinations
                    </h3>
                    <button
                      type="button"
                      onClick={addAddDestination}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      + Add Destination
                    </button>
                  </div>

                  {addFormData.destinations.map((destination, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 mb-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Destination {index + 1}
                        </span>
                        {addFormData.destinations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddDestination(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={destination.city}
                            onChange={(e) =>
                              handleAddDestinationChange(
                                index,
                                "city",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              addFormErrors[`destination_city_${index}`]
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="City name"
                          />
                          {addFormErrors[`destination_city_${index}`] && (
                            <p className="text-red-600 text-xs mt-1">
                              {addFormErrors[`destination_city_${index}`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={destination.state}
                            onChange={(e) =>
                              handleAddDestinationChange(
                                index,
                                "state",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              addFormErrors[`destination_state_${index}`]
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="State name"
                          />
                          {addFormErrors[`destination_state_${index}`] && (
                            <p className="text-red-600 text-xs mt-1">
                              {addFormErrors[`destination_state_${index}`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            value={destination.country}
                            onChange={(e) =>
                              handleAddDestinationChange(
                                index,
                                "country",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Country"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stay Duration (days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={destination.stayDuration}
                            onChange={(e) =>
                              handleAddDestinationChange(
                                index,
                                "stayDuration",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Days"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dynamic Arrays (Inclusions, Exclusions, Highlights) */}
                {["inclusions", "exclusions", "highlights"].map((field) => (
                  <div key={field} className="border-b border-gray-200 pb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {field}
                      </h3>
                      <button
                        type="button"
                        onClick={() => addAddArrayField(field)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        + Add {field.slice(0, -1)}
                      </button>
                    </div>

                    {addFormData[field].map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            handleAddArrayFieldChange(
                              field,
                              index,
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Enter ${field.slice(0, -1)}`}
                        />
                        {addFormData[field].length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddArrayField(field, index)}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Tags and Status */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Tags
                        </h3>
                        <button
                          type="button"
                          onClick={() => addAddArrayField("tags")}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          + Add Tag
                        </button>
                      </div>

                      {addFormData.tags.map((tag, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tag}
                            onChange={(e) =>
                              handleAddArrayFieldChange(
                                "tags",
                                index,
                                e.target.value
                              )
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter tag"
                          />
                          {addFormData.tags.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAddArrayField("tags", index)}
                              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Package Status
                      </h3>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="addIsActive"
                          checked={addFormData.availability.isActive}
                          onChange={(e) =>
                            handleAddNestedFormChange(
                              "availability",
                              "isActive",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor="addIsActive"
                          className="ml-2 text-sm font-medium text-gray-700"
                        >
                          Package is Active
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Active packages are visible to customers for booking
                      </p>
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
                  onClick={handleCreatePackage}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {actionLoading && (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Create Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesPage;
