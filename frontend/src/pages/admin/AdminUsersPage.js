import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Users, Plus, Edit2, Trash2, Search, Shield, ShieldCheck,
  Mail, Phone, Building, Key, Loader2, X, Eye, EyeOff,
  UserCog, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';

const PERMISSIONS = [
  { id: 'members', label: 'Members', description: 'View and manage members' },
  { id: 'payments', label: 'Payments', description: 'View and manage payments' },
  { id: 'leads', label: 'Leads', description: 'View and manage leads' },
  { id: 'reports', label: 'Reports', description: 'View reports and analytics' },
  { id: 'plans', label: 'Plans', description: 'Manage membership plans' },
  { id: 'partners', label: 'Affiliations', description: 'Manage affiliations/partners' },
  { id: 'telecallers', label: 'Telecallers', description: 'Manage telecallers' },
  { id: 'maintenance', label: 'Maintenance', description: 'Manage maintenance fees' },
  { id: 'coupons', label: 'Coupons', description: 'Manage discount coupons' },
];

const DEPARTMENTS = [
  'Operations',
  'Marketing',
  'Finance',
  'Customer Support',
  'Sales',
  'Management'
];

const AdminUsersPage = () => {
  const { token, user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    department: '',
    permissions: ['members', 'leads']
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API}/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }
    
    if (!editingAdmin && !formData.password) {
      toast.error('Password is required for new admin');
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingAdmin) {
        // Update existing admin
        const updateData = {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          department: formData.department,
          permissions: formData.permissions
        };
        
        await axios.put(`${API}/superadmin/admins/${editingAdmin.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Admin updated successfully');
      } else {
        // Create new admin
        await axios.post(`${API}/superadmin/admins`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Admin created successfully');
      }
      
      setShowModal(false);
      setEditingAdmin(null);
      resetForm();
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      mobile: admin.mobile || '',
      password: '',
      department: admin.department || '',
      permissions: admin.permissions || ['members', 'leads']
    });
    setShowModal(true);
  };

  const handleDelete = async (admin) => {
    if (!confirm(`Are you sure you want to disable ${admin.name}?`)) return;
    
    try {
      await axios.delete(`${API}/superadmin/admins/${admin.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Admin disabled successfully');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to disable admin');
    }
  };

  const handleResetPassword = async (admin) => {
    const newPassword = prompt(`Enter new password for ${admin.name}:`);
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await axios.put(`${API}/superadmin/admins/${admin.id}/reset-password?new_password=${newPassword}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      password: '',
      department: '',
      permissions: ['members', 'leads']
    });
  };

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.admin_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if current user is super admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Only Super Admin can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-[#D4AF37]" />
              Admin Users Management
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Create and manage admin accounts for your employees
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setEditingAdmin(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Admin
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or admin ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-gold pl-10 w-full max-w-md"
          />
        </div>

        {/* Admin List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-dark p-5 rounded-xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <UserCog className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{admin.name}</h3>
                        {admin.is_active !== false ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Disabled</span>
                        )}
                      </div>
                      <p className="text-[#D4AF37] font-mono text-sm">{admin.admin_id}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {admin.email}
                        </span>
                        {admin.mobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {admin.mobile}
                          </span>
                        )}
                        {admin.department && (
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {admin.department}
                          </span>
                        )}
                      </div>
                      
                      {/* Permissions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {admin.permissions?.map(perm => (
                          <span key={perm} className="px-2 py-1 bg-white/5 text-gray-300 text-xs rounded capitalize">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-16 md:ml-0">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-[#D4AF37]" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(admin)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(admin)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Disable"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-12 card-dark rounded-xl">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No admin users found</p>
                <p className="text-gray-500 text-sm mt-1">Click "Add New Admin" to create one</p>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1A1A1C] rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    {editingAdmin ? 'Edit Admin User' : 'Add New Admin User'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-gold w-full mt-1"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Email ID (Login) *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-gold w-full mt-1"
                      placeholder="admin@company.com"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Admin will login using this email</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Mobile Number</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="input-gold w-full mt-1"
                      placeholder="10-digit mobile"
                      maxLength={10}
                    />
                  </div>

                  {!editingAdmin && (
                    <div>
                      <label className="text-sm text-gray-400">Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="input-gold w-full mt-1 pr-10"
                          placeholder="Min 6 characters"
                          required={!editingAdmin}
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-gray-400">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="input-gold w-full mt-1"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Permissions</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PERMISSIONS.map(perm => (
                        <label
                          key={perm.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            formData.permissions.includes(perm.id)
                              ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50'
                              : 'bg-white/5 border border-transparent hover:border-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded flex items-center justify-center ${
                            formData.permissions.includes(perm.id) ? 'bg-[#D4AF37]' : 'bg-white/10'
                          }`}>
                            {formData.permissions.includes(perm.id) && <CheckCircle className="w-3 h-3 text-black" />}
                          </div>
                          <span className="text-sm text-white">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 btn-primary"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        editingAdmin ? 'Update Admin' : 'Create Admin'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default AdminUsersPage;
