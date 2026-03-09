import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Check, Star } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PlansPage = () => {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_months: 12,
    price: 0,
    features: [''],
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans`);
      setPlans(response.data);
    } catch (error) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== '')
    };
    
    try {
      if (selectedPlan) {
        await axios.put(`${API}/plans/${selectedPlan.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Plan updated successfully');
      } else {
        await axios.post(`${API}/plans`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Plan created successfully');
      }
      setModalOpen(false);
      fetchPlans();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await axios.delete(`${API}/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Plan deleted');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      duration_months: plan.duration_months,
      price: plan.price,
      features: plan.features?.length > 0 ? plan.features : [''],
      is_active: plan.is_active
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedPlan(null);
    setFormData({
      name: '',
      description: '',
      duration_months: 12,
      price: 0,
      features: [''],
      is_active: true
    });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Membership Plans
          </h1>
          <p className="text-gray-400 mt-1">Manage pricing and plan features</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
          data-testid="add-plan-btn"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card-dark relative ${!plan.is_active ? 'opacity-60' : ''}`}
              data-testid={`plan-card-${plan.name.toLowerCase()}`}
            >
              {!plan.is_active && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                  Inactive
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {plan.name}
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-[#D4AF37]">₹{plan.price.toLocaleString()}</span>
                <span className="text-gray-400">/{plan.duration_months} months</span>
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features?.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-[#D4AF37]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex-1 btn-secondary py-2 flex items-center justify-center gap-2"
                  data-testid={`edit-plan-${plan.id}`}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  data-testid={`delete-plan-${plan.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              {selectedPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Plan Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-gold"
                required
                data-testid="plan-name-input"
              />
            </div>
            <div>
              <label className="input-label">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-gold resize-none"
                rows={2}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Duration (Months) *</label>
                <input
                  type="number"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                  className="input-gold"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="input-label">Price (₹) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="input-gold"
                  min="0"
                  required
                  data-testid="plan-price-input"
                />
              </div>
            </div>
            
            <div>
              <label className="input-label">Features</label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="input-gold flex-1"
                    placeholder="Feature description"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-2 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-sm text-[#D4AF37] hover:text-[#E6D699] flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Feature
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm text-gray-400">
                Plan is active and visible to users
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" data-testid="save-plan-btn">
                {selectedPlan ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PlansPage;
