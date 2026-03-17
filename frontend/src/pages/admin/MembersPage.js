import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Plus, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight,
  Filter, Download, UserPlus, RefreshCw, CreditCard, X, Calendar, Phone,
  Mail, MapPin, User, Clock, CheckCircle, AlertCircle, History, PlayCircle, FileText, QrCode
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
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [referralFilter, setReferralFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberPayments, setMemberPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [activating, setActivating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    plan_id: '',
    address: '',
    referral_id: '',
    date_of_birth: '',
    country_code: '+91',
    country: 'India',
    state: '',
    city: '',
    pincode: ''
  });
  
  const [activateData, setActivateData] = useState({
    payment_method: 'cash',
    amount: 0,
    transaction_id: '',
    notes: ''
  });
  
  const [renewData, setRenewData] = useState({
    plan_id: '',
    payment_method: 'cash',
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchMembers();
    fetchPlans();
    fetchTelecallers();
  }, [page, search, statusFilter, referralFilter]);

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (referralFilter) params.append('referral_id', referralFilter);
      
      const response = await axios.get(`${API}/members?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data.members || response.data);
      setTotalPages(response.data.pages || 1);
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

  const fetchMemberPayments = async (memberId) => {
    setLoadingPayments(true);
    try {
      const response = await axios.get(`${API}/payments?member_id=${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemberPayments(response.data.payments || response.data || []);
    } catch (error) {
      console.error('Failed to fetch payments');
      setMemberPayments([]);
    } finally {
      setLoadingPayments(false);
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

  const handleRenew = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/members/${selectedMember.id}/renew`, renewData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Membership renewed successfully!');
      setRenewModalOpen(false);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Renewal failed');
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

  const openViewModal = (member) => {
    setSelectedMember(member);
    setViewModalOpen(true);
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      mobile: member.mobile,
      email: member.email || '',
      plan_id: member.plan_id || '',
      address: member.address || '',
      referral_id: member.referral_id || '',
      date_of_birth: member.date_of_birth || ''
    });
    setModalOpen(true);
  };

  const openRenewModal = (member) => {
    setSelectedMember(member);
    const currentPlan = plans.find(p => p.id === member.plan_id);
    setRenewData({
      plan_id: member.plan_id || '',
      payment_method: 'cash',
      amount: currentPlan?.price || 0,
      notes: ''
    });
    setRenewModalOpen(true);
  };

  const openActivateModal = (member) => {
    setSelectedMember(member);
    const memberPlan = plans.find(p => p.id === member.plan_id);
    setActivateData({
      payment_method: 'cash',
      amount: memberPlan?.price || 0,
      transaction_id: '',
      notes: ''
    });
    setActivateModalOpen(true);
  };

  const openCardModal = (member) => {
    setSelectedMember(member);
    setCardModalOpen(true);
  };

  const handleActivateMember = async () => {
    if (!selectedMember) return;
    
    setActivating(true);
    try {
      // First record the payment
      await axios.post(`${API}/payments`, {
        member_id: selectedMember.member_id,
        amount: activateData.amount,
        payment_type: 'membership',
        payment_method: activateData.payment_method,
        transaction_id: activateData.transaction_id || `CASH-${Date.now()}`,
        notes: activateData.notes || 'Membership activation payment'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Then activate the member
      await axios.put(`${API}/members/${selectedMember.id}`, {
        status: 'active',
        membership_start: new Date().toISOString(),
        membership_end: new Date(Date.now() + (selectedMember.plan_duration || 12) * 30 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Member activated successfully!');
      setActivateModalOpen(false);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to activate member');
    } finally {
      setActivating(false);
    }
  };

  const openPaymentHistory = (member) => {
    setSelectedMember(member);
    fetchMemberPayments(member.member_id);
    setPaymentHistoryOpen(true);
  };

  const resetForm = () => {
    setSelectedMember(null);
    setFormData({ name: '', mobile: '', email: '', plan_id: '', address: '', referral_id: '', date_of_birth: '' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/10 text-green-400 border border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      expired: 'bg-red-500/10 text-red-400 border border-red-500/20',
      cancelled: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    };
    return styles[status] || styles.pending;
  };

  const exportToCSV = () => {
    const headers = ['Member ID', 'Name', 'Mobile', 'Email', 'Plan', 'Status', 'Valid Till', 'Referral ID'];
    const csvData = members.map(m => [
      m.member_id, m.name, m.mobile, m.email || '', m.plan_name || '', m.status,
      m.membership_end ? new Date(m.membership_end).toLocaleDateString() : '', m.referral_id || ''
    ]);
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Members
          </h1>
          <p className="text-gray-400 mt-1">Manage club memberships</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2" data-testid="export-csv-btn">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={() => navigate('/admin/members/add')} className="btn-primary flex items-center gap-2" data-testid="add-offline-member-btn">
            <UserPlus className="w-4 h-4" />
            Add Offline Member
          </button>
          <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-secondary flex items-center gap-2" data-testid="add-member-btn">
            <UserPlus className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-dark mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, member ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-gold pl-10 bg-[#0F0F10]"
              data-testid="search-members"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by Referral ID"
            value={referralFilter}
            onChange={(e) => { setReferralFilter(e.target.value); setPage(1); }}
            className="input-gold w-48 bg-[#0F0F10]"
            data-testid="filter-referral"
          />
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
            <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="members-table">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Member</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Contact</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Plan</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Status</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Validity</th>
                  <th className="text-center py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                          <span className="text-[#D4AF37] font-semibold">{member.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-xs text-[#D4AF37] font-mono">{member.member_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-300 text-sm">{member.mobile}</p>
                      <p className="text-gray-500 text-xs">{member.email || '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{member.plan_name || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <p className="text-gray-400">
                        {member.membership_end ? new Date(member.membership_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openViewModal(member)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="View Details"
                          data-testid={`view-member-${member.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-2 text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors"
                          title="Edit Member"
                          data-testid={`edit-member-${member.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {/* ACTIVATE button for PENDING members */}
                        {member.status === 'pending' && (
                          <button
                            onClick={() => openActivateModal(member)}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Activate Membership"
                            data-testid={`activate-member-${member.id}`}
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* RENEW button for ACTIVE or EXPIRED members */}
                        {(member.status === 'active' || member.status === 'expired') && (
                          <button
                            onClick={() => openRenewModal(member)}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Renew Membership"
                            data-testid={`renew-member-${member.id}`}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* View Card button for ACTIVE members */}
                        {member.status === 'active' && (
                          <button
                            onClick={() => openCardModal(member)}
                            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                            title="View Membership Card"
                            data-testid={`card-member-${member.id}`}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => openPaymentHistory(member)}
                          className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors"
                          title="Payment History"
                          data-testid={`payments-member-${member.id}`}
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Member"
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 text-gray-400 hover:text-white disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 text-gray-400 hover:text-white disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Member Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <span className="text-[#D4AF37] text-xl font-bold">{selectedMember?.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="text-xl">{selectedMember?.name}</p>
                <p className="text-sm text-[#D4AF37] font-mono font-normal">{selectedMember?.member_id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#0F0F10] rounded-lg">
                <span className="text-gray-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(selectedMember.status)}`}>
                  {selectedMember.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Phone className="w-3 h-3" /> Mobile
                  </div>
                  <p className="text-white">{selectedMember.mobile}</p>
                </div>
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Mail className="w-3 h-3" /> Email
                  </div>
                  <p className="text-white text-sm">{selectedMember.email || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <CreditCard className="w-3 h-3" /> Plan
                  </div>
                  <p className="text-white">{selectedMember.plan_name || '-'}</p>
                </div>
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar className="w-3 h-3" /> DOB
                  </div>
                  <p className="text-white">{selectedMember.date_of_birth ? new Date(selectedMember.date_of_birth).toLocaleDateString('en-IN') : '-'}</p>
                </div>
              </div>
              
              <div className="p-3 bg-[#0F0F10] rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Clock className="w-3 h-3" /> Membership Validity
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500">From</p>
                    <p className="text-white">{selectedMember.membership_start ? new Date(selectedMember.membership_start).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                  <div className="text-gray-600">→</div>
                  <div>
                    <p className="text-xs text-gray-500">Until</p>
                    <p className="text-white">{selectedMember.membership_end ? new Date(selectedMember.membership_end).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                </div>
              </div>
              
              {selectedMember.address && (
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <MapPin className="w-3 h-3" /> Address
                  </div>
                  <p className="text-white">{selectedMember.address}</p>
                </div>
              )}
              
              {selectedMember.referral_id && (
                <div className="p-3 bg-[#0F0F10] rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Referral ID</div>
                  <p className="text-[#D4AF37] font-mono">{selectedMember.referral_id}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button onClick={() => { setViewModalOpen(false); openEditModal(selectedMember); }} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                {selectedMember?.status === 'pending' ? (
                  <button onClick={() => { setViewModalOpen(false); openActivateModal(selectedMember); }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <PlayCircle className="w-4 h-4" /> Activate
                  </button>
                ) : selectedMember?.status === 'active' ? (
                  <button onClick={() => { setViewModalOpen(false); openCardModal(selectedMember); }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4" /> View Card
                  </button>
                ) : (
                  <button onClick={() => { setViewModalOpen(false); openRenewModal(selectedMember); }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Renew
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-gold" required data-testid="member-name-input" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="input-label">Country Code</label>
                <Select value={formData.country_code} onValueChange={(v) => setFormData({ ...formData, country_code: v })}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                    <SelectValue placeholder="+91" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1C] border-white/10 max-h-60">
                    <SelectItem value="+91">🇮🇳 +91</SelectItem>
                    <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    <SelectItem value="+971">🇦🇪 +971</SelectItem>
                    <SelectItem value="+44">🇬🇧 +44</SelectItem>
                    <SelectItem value="+65">🇸🇬 +65</SelectItem>
                    <SelectItem value="+61">🇦🇺 +61</SelectItem>
                    <SelectItem value="+49">🇩🇪 +49</SelectItem>
                    <SelectItem value="+33">🇫🇷 +33</SelectItem>
                    <SelectItem value="+81">🇯🇵 +81</SelectItem>
                    <SelectItem value="+86">🇨🇳 +86</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="input-label">Mobile *</label>
                <input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="input-gold" required disabled={!!selectedMember} data-testid="member-mobile-input" />
              </div>
            </div>
            <div>
              <label className="input-label">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-gold" required data-testid="member-email-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Country</label>
                <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1C] border-white/10 max-h-60">
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="input-label">State</label>
                <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="input-gold" placeholder="State/Province" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">City</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input-gold" placeholder="City" />
              </div>
              <div>
                <label className="input-label">Pincode</label>
                <input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} className="input-gold" placeholder="Pincode/ZIP" />
              </div>
            </div>
            <div>
              <label className="input-label">Date of Birth</label>
              <input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="input-gold" max={new Date().toISOString().split('T')[0]} data-testid="member-dob-input" />
            </div>
            <div>
              <label className="input-label">Plan *</label>
              <Select value={formData.plan_id} onValueChange={(v) => setFormData({ ...formData, plan_id: v })}>
                <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price?.toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="input-label">Referral ID</label>
              <input type="text" value={formData.referral_id} onChange={(e) => setFormData({ ...formData, referral_id: e.target.value })} className="input-gold" placeholder="e.g., BITZ-2603-0001" data-testid="member-referral-input" />
            </div>
            <div>
              <label className="input-label">Address</label>
              <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-gold resize-none" rows={2} />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" data-testid="save-member-btn">{selectedMember ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Renew Membership Modal */}
      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Renew Membership
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <form onSubmit={handleRenew} className="space-y-4 mt-4">
              <div className="p-3 bg-[#0F0F10] rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <span className="text-[#D4AF37] font-semibold">{selectedMember.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{selectedMember.name}</p>
                  <p className="text-xs text-[#D4AF37] font-mono">{selectedMember.member_id}</p>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400">
                  Current validity: {selectedMember.membership_end ? new Date(selectedMember.membership_end).toLocaleDateString('en-IN') : 'Not set'}
                </p>
              </div>
              
              <div>
                <label className="input-label">Select Plan *</label>
                <Select value={renewData.plan_id} onValueChange={(v) => {
                  const plan = plans.find(p => p.id === v);
                  setRenewData({ ...renewData, plan_id: v, amount: plan?.price || 0 });
                }}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price?.toLocaleString()} ({plan.duration_months} months)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="input-label">Payment Method *</label>
                <Select value={renewData.payment_method} onValueChange={(v) => setRenewData({ ...renewData, payment_method: v })}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online (Razorpay)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="input-label">Amount (₹) *</label>
                <input type="number" value={renewData.amount} onChange={(e) => setRenewData({ ...renewData, amount: parseFloat(e.target.value) })} className="input-gold" required min="0" />
              </div>
              
              <div>
                <label className="input-label">Notes</label>
                <textarea value={renewData.notes} onChange={(e) => setRenewData({ ...renewData, notes: e.target.value })} className="input-gold resize-none" rows={2} placeholder="Optional notes..." />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setRenewModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Renew Membership
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog open={paymentHistoryOpen} onOpenChange={setPaymentHistoryOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Payment History
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="mt-4">
              <div className="p-3 bg-[#0F0F10] rounded-lg flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <span className="text-[#D4AF37] font-semibold">{selectedMember.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{selectedMember.name}</p>
                  <p className="text-xs text-[#D4AF37] font-mono">{selectedMember.member_id}</p>
                </div>
              </div>
              
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                </div>
              ) : memberPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No payment records found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {memberPayments.map((payment, index) => (
                    <div key={payment.id || index} className="p-4 bg-[#0F0F10] rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {payment.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )}
                          <span className={`text-sm font-medium ${payment.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {payment.status?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xl font-bold text-[#D4AF37]">₹{payment.amount?.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Plan:</span>
                          <span className="text-white ml-2">{payment.plan_name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Method:</span>
                          <span className="text-white ml-2">{payment.payment_method || payment.payment_type || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="text-white ml-2">{payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-IN') : '-'}</span>
                        </div>
                        {payment.razorpay_payment_id && (
                          <div>
                            <span className="text-gray-500">Ref:</span>
                            <span className="text-gray-300 ml-2 text-xs font-mono">{payment.razorpay_payment_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activate Member Modal */}
      <Dialog open={activateModalOpen} onOpenChange={setActivateModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <PlayCircle className="w-5 h-5 text-green-400" />
              Activate Membership
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-[#0F0F10] rounded-lg">
                <p className="text-sm text-gray-400">Member</p>
                <p className="text-white font-medium">{selectedMember.name}</p>
                <p className="text-[#D4AF37] text-sm font-mono">{selectedMember.member_id}</p>
              </div>
              
              <div className="p-3 bg-[#0F0F10] rounded-lg">
                <p className="text-sm text-gray-400">Plan</p>
                <p className="text-white">{selectedMember.plan_name || 'No plan selected'}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={activateData.amount}
                  onChange={(e) => setActivateData({...activateData, amount: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-[#0F0F10] border border-white/10 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Payment Method</label>
                <Select value={activateData.payment_method} onValueChange={(v) => setActivateData({...activateData, payment_method: v})}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1C] border-white/10">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="razorpay">Razorpay (Online)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={activateData.transaction_id}
                  onChange={(e) => setActivateData({...activateData, transaction_id: e.target.value})}
                  placeholder="Enter transaction reference"
                  className="w-full px-4 py-3 bg-[#0F0F10] border border-white/10 rounded-lg text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Notes (Optional)</label>
                <textarea
                  value={activateData.notes}
                  onChange={(e) => setActivateData({...activateData, notes: e.target.value})}
                  placeholder="Add payment notes..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0F0F10] border border-white/10 rounded-lg text-white placeholder-gray-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActivateModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivateMember}
                  disabled={activating || activateData.amount <= 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Activate & Record Payment
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Membership Card Modal */}
      <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <QrCode className="w-5 h-5 text-cyan-400" />
              Membership Card
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="mt-4 space-y-4">
              {/* Card Preview */}
              <div className="bg-gradient-to-br from-[#1a1a1c] to-[#0f0f10] border border-[#D4AF37]/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">B</span>
                    </div>
                    <span className="text-white font-bold">BITZ Club</span>
                  </div>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded uppercase">Active</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#D4AF37] text-2xl font-bold">{selectedMember.name?.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedMember.name}</p>
                    <p className="text-[#D4AF37] font-mono text-sm">{selectedMember.member_id}</p>
                    <p className="text-gray-400 text-xs">Plan: {selectedMember.plan_name}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs">
                  <div>
                    <p className="text-gray-500">Valid From</p>
                    <p className="text-white">{selectedMember.membership_start ? new Date(selectedMember.membership_start).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Valid Until</p>
                    <p className="text-white">{selectedMember.membership_end ? new Date(selectedMember.membership_end).toLocaleDateString('en-IN') : '-'}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 text-center">
                Member can view and download their full card with QR code from their dashboard at<br/>
                <span className="text-[#D4AF37]">thebitzclub.com/member</span>
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setCardModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.open(`/member?member_id=${selectedMember.member_id}`, '_blank');
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Open Member Portal
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MembersPage;
