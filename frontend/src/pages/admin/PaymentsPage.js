import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Search, Plus, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight,
  Filter, Download, CreditCard, X, Calendar, Receipt, CheckCircle,
  AlertCircle, Clock, IndianRupee, Percent
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PaymentsPage = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    payment_type: '',
    payment_method: '',
    plan_id: '',
    status: ''
  });
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_type: 'offline',
    payment_method: 'cash',
    plan_id: '',
    transaction_id: '',
    notes: '',
    coupon_code: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchMembers();
    fetchPlans();
    fetchCoupons();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${API}/reports/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || []);
      setSummary(response.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch payments');
      // Fallback to regular payments endpoint
      try {
        const response = await axios.get(`${API}/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(response.data.payments || response.data || []);
      } catch (e) {
        toast.error('Failed to fetch payments');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data.members || response.data || []);
    } catch (error) {
      console.error('Failed to fetch members');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans?is_active=true`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans');
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Failed to fetch coupons');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/payments/manual`, {
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        payment_type: formData.payment_type,
        payment_method: formData.payment_method,
        plan_id: formData.plan_id || null,
        transaction_id: formData.transaction_id || null,
        notes: formData.notes || null,
        coupon_code: formData.coupon_code || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Payment recorded! Total: ₹${response.data.total_amount} (incl. GST: ₹${response.data.gst_amount})`);
      setAddModalOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleEditPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/payments/${selectedPayment.id}`, {
        amount: formData.amount ? parseFloat(formData.amount) : null,
        payment_method: formData.payment_method || null,
        status: formData.status || null,
        transaction_id: formData.transaction_id || null,
        notes: formData.notes || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Payment updated');
      setEditModalOpen(false);
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update payment');
    }
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      amount: payment.amount,
      payment_method: payment.payment_method,
      status: payment.status,
      transaction_id: payment.transaction_id || '',
      notes: payment.notes || ''
    });
    setEditModalOpen(true);
  };

  const openViewModal = (payment) => {
    setSelectedPayment(payment);
    setViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      member_id: '',
      amount: '',
      payment_type: 'offline',
      payment_method: 'cash',
      plan_id: '',
      transaction_id: '',
      notes: '',
      coupon_code: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Order ID', 'Member', 'Plan', 'Base Amount', 'GST', 'Discount', 'Total', 'Type', 'Method', 'Status'];
    const csvData = payments.map(p => [
      p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
      p.order_id || p.id,
      p.member_name,
      p.plan_name || '',
      p.base_amount || p.amount,
      p.gst_amount || 0,
      p.discount_amount || 0,
      p.amount,
      p.payment_type,
      p.payment_method,
      p.status
    ]);
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      failed: 'bg-red-500/10 text-red-400 border border-red-500/20'
    };
    return styles[status] || styles.pending;
  };

  const getPaymentTypeIcon = (type) => {
    if (type === 'online') return <CreditCard className="w-4 h-4 text-blue-400" />;
    if (type === 'renewal') return <Receipt className="w-4 h-4 text-purple-400" />;
    return <IndianRupee className="w-4 h-4 text-green-400" />;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Payments
          </h1>
          <p className="text-gray-400 mt-1">Manage all payment transactions</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => { resetForm(); setAddModalOpen(true); }} className="btn-primary flex items-center gap-2" data-testid="add-payment-btn">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-dark">
            <p className="text-gray-400 text-sm">Total Payments</p>
            <p className="text-2xl font-bold text-white">{summary.total_payments}</p>
          </div>
          <div className="card-dark">
            <p className="text-gray-400 text-sm">Total Amount</p>
            <p className="text-2xl font-bold text-[#D4AF37]">₹{summary.total_amount?.toLocaleString()}</p>
          </div>
          <div className="card-dark">
            <p className="text-gray-400 text-sm">Total GST</p>
            <p className="text-2xl font-bold text-blue-400">₹{summary.total_gst?.toLocaleString()}</p>
          </div>
          <div className="card-dark">
            <p className="text-gray-400 text-sm">Total Discounts</p>
            <p className="text-2xl font-bold text-green-400">₹{summary.total_discount?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-dark mb-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="input-gold text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="input-gold text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type</label>
            <Select value={filters.payment_type || "all"} onValueChange={(v) => setFilters({ ...filters, payment_type: v === "all" ? "" : v })}>
              <SelectTrigger className="bg-[#0F0F10] border-white/10">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Method</label>
            <Select value={filters.payment_method || "all"} onValueChange={(v) => setFilters({ ...filters, payment_method: v === "all" ? "" : v })}>
              <SelectTrigger className="bg-[#0F0F10] border-white/10">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Plan</label>
            <Select value={filters.plan_id || "all"} onValueChange={(v) => setFilters({ ...filters, plan_id: v === "all" ? "" : v })}>
              <SelectTrigger className="bg-[#0F0F10] border-white/10">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Status</label>
            <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
              <SelectTrigger className="bg-[#0F0F10] border-white/10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card-dark overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400">Date</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400">Member</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400">Plan</th>
                  <th className="text-right py-4 px-4 text-xs uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="text-right py-4 px-4 text-xs uppercase tracking-wider text-gray-400">GST</th>
                  <th className="text-center py-4 px-4 text-xs uppercase tracking-wider text-gray-400">Type</th>
                  <th className="text-center py-4 px-4 text-xs uppercase tracking-wider text-gray-400">Status</th>
                  <th className="text-center py-4 px-4 text-xs uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <p className="text-white text-sm">{payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-IN') : '-'}</p>
                      <p className="text-xs text-gray-500 font-mono">{payment.order_id?.substring(0, 15) || payment.id?.substring(0, 8)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white">{payment.member_name}</p>
                      <p className="text-xs text-[#D4AF37] font-mono">{payment.member_id}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{payment.plan_name || '-'}</td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-[#D4AF37] font-semibold">₹{payment.amount?.toLocaleString()}</p>
                      {payment.discount_amount > 0 && (
                        <p className="text-xs text-green-400">-₹{payment.discount_amount}</p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-blue-400">
                      {payment.gst_amount ? `₹${payment.gst_amount}` : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {getPaymentTypeIcon(payment.payment_type)}
                        <span className="text-sm text-gray-300 capitalize">{payment.payment_type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openViewModal(payment)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(payment)} className="p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Record Manual Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Member *</label>
              <Select value={formData.member_id} onValueChange={(v) => setFormData({ ...formData, member_id: v })}>
                <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.member_id}>{m.name} ({m.member_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="input-label">Plan (Optional)</label>
              <Select value={formData.plan_id} onValueChange={(v) => setFormData({ ...formData, plan_id: v })}>
                <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Plan</SelectItem>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.price?.toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="input-label">Amount (₹) *</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-gold" required min="1" />
              <p className="text-xs text-gray-500 mt-1">GST (18%) will be added automatically</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Type</label>
                <Select value={formData.payment_type} onValueChange={(v) => setFormData({ ...formData, payment_type: v })}>
                  <SelectTrigger className="bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="input-label">Method</label>
                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                  <SelectTrigger className="bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="input-label">Coupon Code (Optional)</label>
              <input type="text" value={formData.coupon_code} onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })} className="input-gold" placeholder="Enter coupon code" />
            </div>
            <div>
              <label className="input-label">Transaction ID</label>
              <input type="text" value={formData.transaction_id} onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })} className="input-gold" placeholder="UPI/Bank ref number" />
            </div>
            <div>
              <label className="input-label">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-gold resize-none" rows={2} />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setAddModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Record Payment</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Edit Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPayment} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Amount (₹)</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-gold" />
            </div>
            <div>
              <label className="input-label">Payment Method</label>
              <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                <SelectTrigger className="bg-[#0F0F10] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="input-label">Status</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-[#0F0F10] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="input-label">Transaction ID</label>
              <input type="text" value={formData.transaction_id} onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })} className="input-gold" />
            </div>
            <div>
              <label className="input-label">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-gold resize-none" rows={2} />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Update Payment</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Payment Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-[#0F0F10] rounded-lg text-center">
                <p className="text-gray-400 text-sm">Total Amount</p>
                <p className="text-3xl font-bold text-[#D4AF37]">₹{selectedPayment.amount?.toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <p className="text-gray-400 text-xs">Base Amount</p>
                  <p className="text-white">₹{selectedPayment.base_amount?.toLocaleString() || selectedPayment.amount}</p>
                </div>
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <p className="text-gray-400 text-xs">GST ({selectedPayment.gst_rate || 18}%)</p>
                  <p className="text-blue-400">₹{selectedPayment.gst_amount?.toLocaleString() || 0}</p>
                </div>
              </div>
              
              {selectedPayment.discount_amount > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-gray-400 text-xs">Discount Applied</p>
                  <p className="text-green-400">-₹{selectedPayment.discount_amount} ({selectedPayment.coupon_code})</p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Member</span>
                  <span className="text-white">{selectedPayment.member_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white">{selectedPayment.plan_name || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white capitalize">{selectedPayment.payment_type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Method</span>
                  <span className="text-white capitalize">{selectedPayment.payment_method}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(selectedPayment.status)}`}>{selectedPayment.status}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">{selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleString('en-IN') : '-'}</span>
                </div>
                {selectedPayment.transaction_id && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400">Transaction ID</span>
                    <span className="text-white font-mono text-sm">{selectedPayment.transaction_id}</span>
                  </div>
                )}
                {selectedPayment.razorpay_payment_id && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Razorpay ID</span>
                    <span className="text-white font-mono text-xs">{selectedPayment.razorpay_payment_id}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PaymentsPage;
