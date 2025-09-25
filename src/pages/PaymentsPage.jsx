import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";

const PaymentsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  // Static payments data
  const payments = [
    {
      id: "PAY001",
      transactionId: "TXN20240922001",
      bookingId: "BK2024001",
      customerName: "Rajesh Kumar",
      customerEmail: "rajesh.kumar@email.com",
      amount: 25999,
      paymentMethod: "Credit Card",
      paymentGateway: "Razorpay",
      status: "Completed",
      paymentDate: "2024-09-22T14:30:00Z",
      description: "Golden Triangle Tour Package",
      gatewayFee: 650,
      netAmount: 25349,
      refundAmount: 0,
      currency: "INR",
      cardLast4: "4532",
      cardType: "Visa",
    },
    {
      id: "PAY002",
      transactionId: "TXN20240922002",
      bookingId: "BK2024002",
      customerName: "Priya Sharma",
      customerEmail: "priya.sharma@email.com",
      amount: 18999,
      paymentMethod: "UPI",
      paymentGateway: "PhonePe",
      status: "Completed",
      paymentDate: "2024-09-22T16:45:00Z",
      description: "Kerala Backwaters Experience",
      gatewayFee: 380,
      netAmount: 18619,
      refundAmount: 0,
      currency: "INR",
      upiId: "priya@oksbi",
    },
    {
      id: "PAY003",
      transactionId: "TXN20240922003",
      bookingId: "BK2024003",
      customerName: "Amit Singh",
      customerEmail: "amit.singh@email.com",
      amount: 15999,
      paymentMethod: "Net Banking",
      paymentGateway: "Payu",
      status: "Failed",
      paymentDate: "2024-09-22T18:20:00Z",
      description: "Himalayan Adventure Trek",
      gatewayFee: 0,
      netAmount: 0,
      refundAmount: 0,
      currency: "INR",
      bankName: "HDFC Bank",
      failureReason: "Insufficient funds",
    },
    {
      id: "PAY004",
      transactionId: "TXN20240921001",
      bookingId: "BK2024004",
      customerName: "Sneha Patel",
      customerEmail: "sneha.patel@email.com",
      amount: 12999,
      paymentMethod: "Debit Card",
      paymentGateway: "Razorpay",
      status: "Pending",
      paymentDate: "2024-09-21T12:15:00Z",
      description: "Goa Beach Paradise",
      gatewayFee: 325,
      netAmount: 12674,
      refundAmount: 0,
      currency: "INR",
      cardLast4: "8756",
      cardType: "Mastercard",
    },
    {
      id: "PAY005",
      transactionId: "TXN20240921002",
      bookingId: "BK2024005",
      customerName: "Vikash Yadav",
      customerEmail: "vikash.yadav@email.com",
      amount: 35999,
      paymentMethod: "Credit Card",
      paymentGateway: "Stripe",
      status: "Refunded",
      paymentDate: "2024-09-21T09:30:00Z",
      description: "Rajasthan Royal Heritage",
      gatewayFee: 900,
      netAmount: 35099,
      refundAmount: 35999,
      currency: "INR",
      cardLast4: "1234",
      cardType: "Visa",
      refundDate: "2024-09-22T10:00:00Z",
      refundReason: "Customer cancellation",
    },
    {
      id: "PAY006",
      transactionId: "TXN20240920001",
      bookingId: "BK2024006",
      customerName: "Anita Gupta",
      customerEmail: "anita.gupta@email.com",
      amount: 28999,
      paymentMethod: "Wallet",
      paymentGateway: "Paytm",
      status: "Completed",
      paymentDate: "2024-09-20T14:45:00Z",
      description: "Andaman Island Escape",
      gatewayFee: 580,
      netAmount: 28419,
      refundAmount: 0,
      currency: "INR",
      walletProvider: "Paytm Wallet",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "Refunded":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4" />;
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Failed":
        return <X className="h-4 w-4" />;
      case "Refunded":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "Credit Card":
      case "Debit Card":
        return "💳";
      case "UPI":
        return "📱";
      case "Net Banking":
        return "🏦";
      case "Wallet":
        return "👛";
      default:
        return "💰";
    }
  };

  // Calculate summary statistics
  const totalTransactions = payments.length;
  const completedPayments = payments.filter((p) => p.status === "Completed");
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalFees = completedPayments.reduce((sum, p) => sum + p.gatewayFee, 0);
  const netRevenue = totalRevenue - totalFees;
  const successRate = Math.round(
    (completedPayments.length / totalTransactions) * 100
  );

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      !search ||
      payment.customerName.toLowerCase().includes(search.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      payment.bookingId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesMethod =
      !methodFilter || payment.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payments & Finance</h1>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(totalRevenue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500">
                Net: ₹{(netRevenue / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalTransactions}
              </p>
              <p className="text-xs text-gray-500">
                {completedPayments.length} successful
              </p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {successRate}%
              </p>
              <p className="text-xs text-gray-500">Last 30 days</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gateway Fees</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{(totalFees / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-gray-500">
                {((totalFees / totalRevenue) * 100).toFixed(1)}% of revenue
              </p>
            </div>
            <div className="text-2xl">💸</div>
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
                placeholder="Search by customer, transaction ID, or booking ID..."
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
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
          <select
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">All Methods</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="UPI">UPI</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Wallet">Wallet</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
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
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.transactionId}
                      </div>
                      <div className="text-sm text-gray-500">
                        Booking: {payment.bookingId}
                      </div>
                      <div className="text-xs text-gray-400">
                        {payment.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        ₹{payment.amount.toLocaleString()}
                      </div>
                      {payment.gatewayFee > 0 && (
                        <div className="text-xs text-gray-500">
                          Fee: ₹{payment.gatewayFee}
                        </div>
                      )}
                      {payment.netAmount > 0 && (
                        <div className="text-xs text-green-600">
                          Net: ₹{payment.netAmount.toLocaleString()}
                        </div>
                      )}
                      {payment.refundAmount > 0 && (
                        <div className="text-xs text-red-600">
                          Refunded: ₹{payment.refundAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {getMethodIcon(payment.paymentMethod)}
                      </span>
                      <div>
                        <div className="text-sm text-gray-900">
                          {payment.paymentMethod}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.paymentGateway}
                        </div>
                        {payment.cardLast4 && (
                          <div className="text-xs text-gray-400">
                            **** {payment.cardLast4}
                          </div>
                        )}
                        {payment.upiId && (
                          <div className="text-xs text-gray-400">
                            {payment.upiId}
                          </div>
                        )}
                        {payment.bankName && (
                          <div className="text-xs text-gray-400">
                            {payment.bankName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>
                        {new Date(payment.paymentDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </div>
                      <div className="text-xs">
                        {new Date(payment.paymentDate).toLocaleTimeString(
                          "en-IN",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {getStatusIcon(payment.status)}
                      <span className="ml-1">{payment.status}</span>
                    </span>
                    {payment.status === "Failed" && payment.failureReason && (
                      <div className="text-xs text-red-600 mt-1">
                        {payment.failureReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Download Receipt"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {payment.status === "Completed" && (
                        <button
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Initiate Refund"
                        >
                          <TrendingDown className="h-4 w-4" />
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
            Showing {filteredPayments.length} of {payments.length} payments
            {search && ` matching "${search}"`}
            {statusFilter && ` with status "${statusFilter}"`}
            {methodFilter && ` via "${methodFilter}"`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
