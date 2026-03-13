import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Ticket, Plus, Search, Trash2, Edit, Copy, CheckCircle, 
  XCircle, Loader2, Calendar, Percent, Users
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

const CouponsPage = () => {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_amount: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    applicable_plans: [],
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [couponsRes, plansRes] = await Promise.all([
        axios.get(`${API}/coupons`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/plans`)
      ]);
      setCoupons(couponsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      // If coupons endpoint doesn't exist, just set empty
      setCoupons([]);
      try {
        const plansRes = await axios.get(`${API}/plans`);
        setPlans(plansRes.data || []);
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BITZ';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await axios.put(`${API}/coupons/${editingCoupon.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Coupon updated successfully');
      } else {
        await axios.post(`${API}/coupons`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Coupon created successfully');
      }
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await axios.delete(`${API}/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coupon deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied!');
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_amount: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      applicable_plans: [],
      is_active: true
    });
    setEditingCoupon(null);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_amount: coupon.min_amount || '',
      max_uses: coupon.max_uses || '',
      valid_from: coupon.valid_from?.split('T')[0] || '',
      valid_until: coupon.valid_until?.split('T')[0] || '',
      applicable_plans: coupon.applicable_plans || [],
      is_active: coupon.is_active
    });
    setModalOpen(true);
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Discount Coupons</h1>
          <p className="text-gray-400">Manage promotional discount codes</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#c4a030]"
        >
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
              <Ticket className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{coupons.length}</p>
              <p className="text-sm text-gray-400">Total Coupons</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {coupons.filter(c => c.is_active).length}
              </p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {coupons.reduce((sum, c) => sum + (c.times_used || 0), 0)}
              </p>
              <p className="text-sm text-gray-400">Total Uses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search coupons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1c] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
        />
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map((coupon) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyCode(coupon.code)}
                  className="flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/20 rounded-lg hover:bg-[#D4AF37]/30 transition-colors"
                >
                  <span className="text-[#D4AF37] font-mono font-bold">{coupon.code}</span>
                  <Copy className="w-3 h-3 text-[#D4AF37]" />
                </button>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                coupon.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}>
                {coupon.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-white">
                <Percent className="w-4 h-4 text-gray-400" />
                <span>
                  {coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}% Off`
                    : `₹${coupon.discount_value} Off`
                  }
                </span>
              </div>
              {coupon.valid_until && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Valid until {new Date(coupon.valid_until).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users className="w-4 h-4" />
                <span>Used {coupon.times_used || 0} / {coupon.max_uses || '∞'} times</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(coupon)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(coupon.id)}
                className="flex items-center justify-center px-3 py-2 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No coupons found</p>
          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="mt-4 text-[#D4AF37] hover:underline"
          >
            Create your first coupon
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1a1a1c] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Coupon Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="flex-1 px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white uppercase"
                  placeholder="BITZ2024"
                  required
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="px-3 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Discount Type</label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger className="bg-[#0f0f10] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Discount Value</label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
                  placeholder={formData.discount_type === 'percentage' ? '10' : '500'}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valid From</label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Uses</label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-white/10 bg-[#0f0f10] text-[#D4AF37]"
              />
              <label htmlFor="is_active" className="text-sm text-gray-400">Active</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#c4a030]"
              >
                {editingCoupon ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;
