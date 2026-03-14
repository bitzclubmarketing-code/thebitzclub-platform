import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Percent, Calendar, Tag, CheckCircle, XCircle } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CouponsPage = () => {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_amount: '',
    max_discount: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    applicable_plans: [],
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
    fetchPlans();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans`);
      setPlans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch plans');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_amount: parseFloat(formData.min_amount) || 0,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        usage_limit: parseInt(formData.usage_limit) || 0,
        applicable_plans: formData.applicable_plans,
        is_active: formData.is_active
      };

      if (selectedCoupon) {
        await axios.put(`${API}/coupons/${selectedCoupon.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Coupon updated');
      } else {
        await axios.post(`${API}/coupons`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Coupon created');
      }
      setModalOpen(false);
      fetchCoupons();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await axios.delete(`${API}/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const openEditModal = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_amount: coupon.min_amount || '',
      max_discount: coupon.max_discount || '',
      valid_from: coupon.valid_from?.split('T')[0] || '',
      valid_until: coupon.valid_until?.split('T')[0] || '',
      usage_limit: coupon.usage_limit || '',
      applicable_plans: coupon.applicable_plans || [],
      is_active: coupon.is_active
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedCoupon(null);
    setFormData({
      code: '', discount_type: 'percentage', discount_value: '', min_amount: '',
      max_discount: '', valid_from: '', valid_until: '', usage_limit: '',
      applicable_plans: [], is_active: true
    });
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Discount Coupons</h1>
          <p className="text-gray-400 mt-1">Manage promotional discounts</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="card-dark">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No coupons created yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="p-4 bg-[#0F0F10] rounded-lg border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                    <Percent className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-[#D4AF37] font-mono">{coupon.code}</p>
                      {!coupon.is_active && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Inactive</span>}
                      {coupon.is_active && isExpired(coupon.valid_until) && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Expired</span>}
                    </div>
                    <p className="text-white">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                      {coupon.max_discount && coupon.discount_type === 'percentage' && ` (Max ₹${coupon.max_discount})`}
                    </p>
                    <p className="text-sm text-gray-400">
                      Valid: {new Date(coupon.valid_from).toLocaleDateString()} - {new Date(coupon.valid_until).toLocaleDateString()}
                      {coupon.usage_limit > 0 && ` | Uses: ${coupon.used_count || 0}/${coupon.usage_limit}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(coupon)} className="p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(coupon.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Coupon Code *</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="input-gold font-mono" required placeholder="e.g., WELCOME20" disabled={!!selectedCoupon} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Discount Type</label>
                <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger className="bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="input-label">Discount Value *</label>
                <input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} className="input-gold" required min="1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Min. Amount (₹)</label>
                <input type="number" value={formData.min_amount} onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })} className="input-gold" placeholder="0" />
              </div>
              <div>
                <label className="input-label">Max. Discount (₹)</label>
                <input type="number" value={formData.max_discount} onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })} className="input-gold" placeholder="No limit" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Valid From *</label>
                <input type="date" value={formData.valid_from} onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })} className="input-gold" required />
              </div>
              <div>
                <label className="input-label">Valid Until *</label>
                <input type="date" value={formData.valid_until} onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })} className="input-gold" required />
              </div>
            </div>
            <div>
              <label className="input-label">Usage Limit</label>
              <input type="number" value={formData.usage_limit} onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })} className="input-gold" placeholder="0 = Unlimited" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="is_active" className="text-gray-300">Coupon is Active</label>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">{selectedCoupon ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CouponsPage;
