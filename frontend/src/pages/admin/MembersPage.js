import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Search, Plus, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight,
  Filter, Download, UserPlus
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

const MembersPage = () => {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    plan_id: '',
    address: ''
  });

  useEffect(() => {
    fetchMembers();
    fetchPlans();
    fetchTelecallers();
  }, [page, search, statusFilter]);

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/members?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data.members);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
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

  const fetchTelecallers = async () => {
    try {
      const response = await axios.get(`${API}/telecallers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelecallers(response.data);
    } catch (error) {
      console.error('Failed to fetch telecallers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedMember) {
        await axios.put(`${API}/members/${selectedMember.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Member updated successfully');
      } else {
        const response = await axios.post(`${API}/members`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Member created! Temporary password: ${response.data.temporary_password}`);
      }
      setModalOpen(false);
      fetchMembers();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`${API}/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Member deleted');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to delete member');
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      mobile: member.mobile,
      email: member.email || '',
      plan_id: member.plan_id,
      address: member.address || ''
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedMember(null);
    setFormData({ name: '', mobile: '', email: '', plan_id: '', address: '' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/10 text-green-400',
      pending: 'bg-yellow-500/10 text-yellow-400',
      expired: 'bg-red-500/10 text-red-400',
      cancelled: 'bg-gray-500/10 text-gray-400'
    };
    return styles[status] || styles.pending;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Members
          </h1>
          <p className="text-gray-400 mt-1">Manage club memberships</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
          data-testid="add-member-btn"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="card-dark mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, or member ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-gold pl-10 bg-[#0F0F10]"
              data-testid="search-members"
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-[#0F0F10] border-white/10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Table */}
      <div className="card-dark overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="members-table">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Member ID</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Name</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Mobile</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Plan</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Status</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Valid Till</th>
                  <th className="text-right py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono text-[#D4AF37] text-sm">{member.member_id}</span>
                    </td>
                    <td className="py-4 px-4 text-white">{member.name}</td>
                    <td className="py-4 px-4 text-gray-400">{member.mobile}</td>
                    <td className="py-4 px-4 text-gray-400">{member.plan_name}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {member.membership_end ? new Date(member.membership_end).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors"
                          data-testid={`edit-member-${member.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          data-testid={`delete-member-${member.id}`}
                        >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-white/5">
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              {selectedMember ? 'Edit Member' : 'Add New Member'}
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
                data-testid="member-name-input"
              />
            </div>
            <div>
              <label className="input-label">Mobile *</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="input-gold"
                required
                disabled={!!selectedMember}
                data-testid="member-mobile-input"
              />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-gold"
                data-testid="member-email-input"
              />
            </div>
            <div>
              <label className="input-label">Plan *</label>
              <Select 
                value={formData.plan_id} 
                onValueChange={(v) => setFormData({ ...formData, plan_id: v })}
              >
                <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="input-label">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-gold resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" data-testid="save-member-btn">
                {selectedMember ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MembersPage;
