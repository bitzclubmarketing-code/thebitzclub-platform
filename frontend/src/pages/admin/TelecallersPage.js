import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Phone, Users } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TelecallersPage = () => {
  const { token } = useAuth();
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTelecaller, setSelectedTelecaller] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchTelecallers();
  }, []);

  const fetchTelecallers = async () => {
    try {
      const response = await axios.get(`${API}/telecallers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelecallers(response.data);
    } catch (error) {
      toast.error('Failed to fetch telecallers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedTelecaller) {
        await axios.put(`${API}/telecallers/${selectedTelecaller.id}`, {
          name: formData.name,
          email: formData.email,
          is_active: formData.is_active
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Telecaller updated successfully');
      } else {
        await axios.post(`${API}/telecallers`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Telecaller created successfully');
      }
      setModalOpen(false);
      fetchTelecallers();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this telecaller? Their assigned members will be unassigned.')) return;
    try {
      await axios.delete(`${API}/telecallers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Telecaller deleted');
      fetchTelecallers();
    } catch (error) {
      toast.error('Failed to delete telecaller');
    }
  };

  const openEditModal = (telecaller) => {
    setSelectedTelecaller(telecaller);
    setFormData({
      name: telecaller.name,
      mobile: telecaller.mobile,
      email: telecaller.email || '',
      password: '',
      is_active: telecaller.is_active
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedTelecaller(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: '',
      is_active: true
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
            Telecallers
          </h1>
          <p className="text-gray-400 mt-1">Manage telecaller accounts and assignments</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
          data-testid="add-telecaller-btn"
        >
          <Plus className="w-4 h-4" />
          Add Telecaller
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
        </div>
      ) : telecallers.length === 0 ? (
        <div className="card-dark text-center py-12">
          <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No telecallers added yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {telecallers.map((telecaller, index) => (
            <motion.div
              key={telecaller.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card-dark ${!telecaller.is_active ? 'opacity-60' : ''}`}
              data-testid={`telecaller-card-${index}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{telecaller.name}</h3>
                    <p className="text-sm text-gray-400">{telecaller.mobile}</p>
                  </div>
                </div>
                {!telecaller.is_active && (
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">Inactive</span>
                )}
              </div>
              
              {telecaller.email && (
                <p className="text-sm text-gray-400 mb-4">{telecaller.email}</p>
              )}

              <div className="flex items-center gap-2 p-3 bg-black/30 rounded mb-4">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm text-gray-300">
                  <span className="text-white font-semibold">{telecaller.assigned_count || 0}</span> members assigned
                </span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => openEditModal(telecaller)}
                  className="flex-1 btn-secondary py-2 flex items-center justify-center gap-2"
                  data-testid={`edit-telecaller-${telecaller.id}`}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(telecaller.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  data-testid={`delete-telecaller-${telecaller.id}`}
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
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              {selectedTelecaller ? 'Edit Telecaller' : 'Add New Telecaller'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-gold"
                required
                data-testid="telecaller-name-input"
              />
            </div>
            <div>
              <label className="input-label">Mobile Number *</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="input-gold"
                required
                disabled={!!selectedTelecaller}
                data-testid="telecaller-mobile-input"
              />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-gold"
              />
            </div>
            {!selectedTelecaller && (
              <div>
                <label className="input-label">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-gold"
                  required={!selectedTelecaller}
                  data-testid="telecaller-password-input"
                />
              </div>
            )}
            
            {selectedTelecaller && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tc_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="tc_active" className="text-sm text-gray-400">
                  Telecaller is active
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" data-testid="save-telecaller-btn">
                {selectedTelecaller ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TelecallersPage;
