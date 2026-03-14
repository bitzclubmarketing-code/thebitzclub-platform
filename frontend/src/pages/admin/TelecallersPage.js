import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Search, Plus, Edit, Trash2, Eye, Loader2, Phone, Mail, User,
  Users, ArrowUpDown, Filter, RefreshCw, UserMinus, Download, X
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TelecallersPage = () => {
  const { token } = useAuth();
  const [telecallers, setTelecallers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortBy, setSortBy] = useState('name');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [assignedMembersModalOpen, setAssignedMembersModalOpen] = useState(false);
  
  const [selectedTelecaller, setSelectedTelecaller] = useState(null);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedMemberForReassign, setSelectedMemberForReassign] = useState(null);
  const [newTelecallerId, setNewTelecallerId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchTelecallers();
    fetchMembers();
  }, []);

  const fetchTelecallers = async () => {
    try {
      const response = await axios.get(`${API}/telecallers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelecallers(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch telecallers');
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

  const fetchAssignedMembers = async (telecallerId) => {
    try {
      const response = await axios.get(`${API}/members?assigned_telecaller=${telecallerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignedMembers(response.data.members || response.data || []);
    } catch (error) {
      // Filter locally if endpoint doesn't support the filter
      const assigned = members.filter(m => m.assigned_telecaller === telecallerId);
      setAssignedMembers(assigned);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTelecaller) {
        await axios.put(`${API}/telecallers/${selectedTelecaller.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Telecaller updated');
      } else {
        await axios.post(`${API}/telecallers`, { ...formData, role: 'telecaller' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Telecaller created');
      }
      setModalOpen(false);
      fetchTelecallers();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this telecaller? Their assigned members will be unassigned.')) return;
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

  const handleReassign = async () => {
    if (!selectedMemberForReassign || !newTelecallerId) {
      toast.error('Please select a telecaller');
      return;
    }
    try {
      await axios.put(`${API}/members/${selectedMemberForReassign.id}/assign`, {
        telecaller_id: newTelecallerId === 'none' ? null : newTelecallerId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Member reassigned');
      setReassignModalOpen(false);
      if (selectedTelecaller) {
        fetchAssignedMembers(selectedTelecaller.id);
      }
      fetchTelecallers();
    } catch (error) {
      toast.error('Failed to reassign member');
    }
  };

  const handleRemoveAssignment = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this telecaller?`)) return;
    try {
      await axios.put(`${API}/members/${member.id}/assign`, {
        telecaller_id: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Assignment removed');
      if (selectedTelecaller) {
        fetchAssignedMembers(selectedTelecaller.id);
      }
      fetchTelecallers();
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  const openViewModal = (tc) => {
    setSelectedTelecaller(tc);
    fetchAssignedMembers(tc.id);
    setViewModalOpen(true);
  };

  const openAssignedMembersModal = (tc) => {
    setSelectedTelecaller(tc);
    fetchAssignedMembers(tc.id);
    setAssignedMembersModalOpen(true);
  };

  const openReassignModal = (member) => {
    setSelectedMemberForReassign(member);
    setNewTelecallerId('');
    setReassignModalOpen(true);
  };

  const openEditModal = (tc) => {
    setSelectedTelecaller(tc);
    setFormData({
      name: tc.name,
      mobile: tc.mobile,
      email: tc.email || '',
      password: ''
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedTelecaller(null);
    setFormData({ name: '', mobile: '', email: '', password: '' });
  };

  // Sort telecallers
  const sortedTelecallers = [...telecallers].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name?.localeCompare(b.name) || 0;
    } else if (sortBy === 'assigned') {
      comparison = (a.assigned_count || 0) - (b.assigned_count || 0);
    } else if (sortBy === 'mobile') {
      comparison = a.mobile?.localeCompare(b.mobile) || 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Filter telecallers
  const filteredTelecallers = sortedTelecallers.filter(tc => {
    if (!statusFilter) return true;
    if (statusFilter === 'active') return tc.is_active !== false;
    if (statusFilter === 'inactive') return tc.is_active === false;
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Mobile', 'Email', 'Assigned Members', 'Status'];
    const csvData = filteredTelecallers.map(tc => [
      tc.name, tc.mobile, tc.email || '', tc.assigned_count || 0, tc.is_active !== false ? 'Active' : 'Inactive'
    ]);
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telecallers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Telecallers</h1>
          <p className="text-gray-400 mt-1">Manage telecaller team and assignments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Telecaller
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-dark mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-[#0F0F10] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg">
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Status:</span>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-32 bg-[#0F0F10] border-white/10">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Telecallers Grid */}
      <div className="card-dark">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : filteredTelecallers.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No telecallers found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTelecallers.map((tc) => (
              <div key={tc.id} className="p-4 bg-[#0F0F10] rounded-lg border border-white/5 hover:border-[#D4AF37]/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{tc.name}</p>
                      <p className="text-sm text-gray-400">{tc.mobile}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${tc.is_active !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {tc.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{tc.assigned_count || 0} assigned</span>
                  </div>
                  {tc.email && (
                    <div className="flex items-center gap-1 text-gray-400 truncate">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{tc.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 border-t border-white/5 pt-3">
                  <button onClick={() => openViewModal(tc)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg flex-1 flex items-center justify-center gap-1" title="View">
                    <Eye className="w-4 h-4" /> <span className="text-xs">View</span>
                  </button>
                  <button onClick={() => openAssignedMembersModal(tc)} className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg flex-1 flex items-center justify-center gap-1" title="Assigned">
                    <Users className="w-4 h-4" /> <span className="text-xs">Assigned</span>
                  </button>
                  <button onClick={() => openEditModal(tc)} className="p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tc.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTelecaller ? 'Edit Telecaller' : 'Add Telecaller'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-gold" required />
            </div>
            <div>
              <label className="input-label">Mobile *</label>
              <input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="input-gold" required disabled={!!selectedTelecaller} />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-gold" />
            </div>
            <div>
              <label className="input-label">{selectedTelecaller ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-gold" required={!selectedTelecaller} />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">{selectedTelecaller ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Telecaller Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Telecaller Details</DialogTitle>
          </DialogHeader>
          {selectedTelecaller && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">{selectedTelecaller.name}</p>
                  <p className="text-gray-400">{selectedTelecaller.mobile}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{selectedTelecaller.email || '-'}</p>
                </div>
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className={selectedTelecaller.is_active !== false ? 'text-green-400' : 'text-red-400'}>
                    {selectedTelecaller.is_active !== false ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="p-3 bg-[#0F0F10] rounded-lg col-span-2">
                  <p className="text-gray-400 text-sm">Assigned Members</p>
                  <p className="text-2xl font-bold text-[#D4AF37]">{assignedMembers.length}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assigned Members Modal */}
      <Dialog open={assignedMembersModalOpen} onOpenChange={setAssignedMembersModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Assigned Members - {selectedTelecaller?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-96 overflow-y-auto">
            {assignedMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No members assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedMembers.map((member) => (
                  <div key={member.id} className="p-3 bg-[#0F0F10] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <span className="text-[#D4AF37] font-semibold">{member.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-xs text-[#D4AF37] font-mono">{member.member_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded text-xs ${member.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {member.status}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openReassignModal(member)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Reassign">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRemoveAssignment(member)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg" title="Remove">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Modal */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Member</DialogTitle>
          </DialogHeader>
          {selectedMemberForReassign && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-[#0F0F10] rounded-lg">
                <p className="text-gray-400 text-sm">Member</p>
                <p className="text-white font-medium">{selectedMemberForReassign.name}</p>
                <p className="text-xs text-[#D4AF37] font-mono">{selectedMemberForReassign.member_id}</p>
              </div>
              <div>
                <label className="input-label">Assign to Telecaller *</label>
                <Select value={newTelecallerId} onValueChange={setNewTelecallerId}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                    <SelectValue placeholder="Select Telecaller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Unassign)</SelectItem>
                    {telecallers.filter(tc => tc.id !== selectedTelecaller?.id).map(tc => (
                      <SelectItem key={tc.id} value={tc.id}>{tc.name} ({tc.mobile})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setReassignModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleReassign} className="btn-primary flex-1">Reassign</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TelecallersPage;
