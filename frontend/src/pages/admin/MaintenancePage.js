import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Wrench, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MaintenancePage = () => {
  const { token } = useAuth();
  const [fees, setFees] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  
  const [filters, setFilters] = useState({ status: '', fee_type: '' });
  
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    fee_type: 'monthly',
    due_date: '',
    payment_method: '',
    transaction_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchFees();
    fetchMembers();
  }, [filters]);

  const fetchFees = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.fee_type) params.append('fee_type', filters.fee_type);
      
      const response = await axios.get(`${API}/maintenance-fees?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFees(response.data || []);
      
      // Fetch summary
      const reportRes = await axios.get(`${API}/reports/maintenance?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(reportRes.data?.summary || null);
    } catch (error) {
      toast.error('Failed to fetch maintenance fees');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedFee) {
        await axios.put(`${API}/maintenance-fees/${selectedFee.id}`, {
          amount: formData.amount ? parseFloat(formData.amount) : null,
          status: formData.status || null,
          payment_method: formData.payment_method || null,
          transaction_id: formData.transaction_id || null,
          notes: formData.notes || null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Maintenance fee updated');
      } else {
        await axios.post(`${API}/maintenance-fees`, {
          member_id: formData.member_id,
          amount: parseFloat(formData.amount),
          fee_type: formData.fee_type,
          due_date: formData.due_date,
          payment_method: formData.payment_method || null,
          transaction_id: formData.transaction_id || null,
          notes: formData.notes || null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Maintenance fee created');
      }
      setModalOpen(false);
      fetchFees();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const markAsPaid = async (fee) => {
    try {
      await axios.put(`${API}/maintenance-fees/${fee.id}`, {
        status: 'paid',
        payment_method: 'cash'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Marked as paid');
      fetchFees();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await axios.delete(`${API}/maintenance-fees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted');
      fetchFees();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openEditModal = (fee) => {
    setSelectedFee(fee);
    setFormData({
      member_id: fee.member_id,
      amount: fee.amount,
      fee_type: fee.fee_type,
      due_date: fee.due_date?.split('T')[0],
      status: fee.status,
      payment_method: fee.payment_method || '',
      transaction_id: fee.transaction_id || '',
      notes: fee.notes || ''
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedFee(null);
    setFormData({
      member_id: '', amount: '', fee_type: 'monthly', due_date: '',
      payment_method: '', transaction_id: '', notes: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['Member', 'Amount', 'Type', 'Due Date', 'Status', 'Paid Date', 'Method'];
    const csvData = fees.map(f => [
      f.member_name, f.amount, f.fee_type, f.due_date?.split('T')[0],
      f.status, f.paid_date?.split('T')[0] || '', f.payment_method || ''
    ]);
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance_fees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-500/10 text-green-400 border border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      overdue: 'bg-red-500/10 text-red-400 border border-red-500/20'
    };
    return styles[status] || styles.pending;
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'paid') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Maintenance Fees</h1>
          <p className="text-gray-400 mt-1">Track member maintenance payments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Fee
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-dark">
            <p className="text-gray-400 text-sm">Total Records</p>
            <p className="text-2xl font-bold text-white">{summary.total_records}</p>
          </div>
          <div className="card-dark">
            <p className="text-gray-400 text-sm">Total Amount</p>
            <p className="text-2xl font-bold text-[#D4AF37]">₹{summary.total_amount?.toLocaleString()}</p>
          </div>
          <div className="card-dark">
            <p className="text-gray-400 text-sm">Collected</p>
            <p className="text-2xl font-bold text-green-400">₹{summary.paid_amount?.toLocaleString()}</p>
          </div>
          <div className="card-dark">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">₹{summary.pending_amount?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-dark mb-6">
        <div className="flex gap-4">
          <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
            <SelectTrigger className="w-40 bg-[#0F0F10] border-white/10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.fee_type || "all"} onValueChange={(v) => setFilters({ ...filters, fee_type: v === "all" ? "" : v })}>
            <SelectTrigger className="w-40 bg-[#0F0F10] border-white/10">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fees Table */}
      <div className="card-dark">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : fees.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No maintenance fees recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-xs uppercase text-gray-400">Member</th>
                  <th className="text-right py-4 px-4 text-xs uppercase text-gray-400">Amount</th>
                  <th className="text-center py-4 px-4 text-xs uppercase text-gray-400">Type</th>
                  <th className="text-center py-4 px-4 text-xs uppercase text-gray-400">Due Date</th>
                  <th className="text-center py-4 px-4 text-xs uppercase text-gray-400">Status</th>
                  <th className="text-center py-4 px-4 text-xs uppercase text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <p className="text-white">{fee.member_name}</p>
                      <p className="text-xs text-[#D4AF37] font-mono">{fee.member_id}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="text-[#D4AF37] font-semibold">₹{fee.amount?.toLocaleString()}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-gray-300 capitalize">{fee.fee_type}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <p className={`text-sm ${isOverdue(fee.due_date, fee.status) ? 'text-red-400' : 'text-gray-300'}`}>
                        {fee.due_date ? new Date(fee.due_date).toLocaleDateString('en-IN') : '-'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBadge(isOverdue(fee.due_date, fee.status) ? 'overdue' : fee.status)}`}>
                        {isOverdue(fee.due_date, fee.status) ? 'Overdue' : fee.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {fee.status === 'pending' && (
                          <button onClick={() => markAsPaid(fee)} className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg" title="Mark as Paid">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEditModal(fee)} className="p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(fee.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedFee ? 'Edit Maintenance Fee' : 'Add Maintenance Fee'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {!selectedFee && (
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
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Amount (₹) *</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-gold" required min="1" />
              </div>
              <div>
                <label className="input-label">Fee Type</label>
                <Select value={formData.fee_type} onValueChange={(v) => setFormData({ ...formData, fee_type: v })} disabled={!!selectedFee}>
                  <SelectTrigger className="bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!selectedFee && (
              <div>
                <label className="input-label">Due Date *</label>
                <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="input-gold" required />
              </div>
            )}
            {selectedFee && (
              <div>
                <label className="input-label">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="input-label">Payment Method</label>
              <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                <SelectTrigger className="bg-[#0F0F10] border-white/10">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not specified</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
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
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">{selectedFee ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MaintenancePage;
