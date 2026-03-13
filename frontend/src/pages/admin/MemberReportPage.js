import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  User, Phone, Mail, Calendar, CreditCard, Building2, 
  ArrowLeft, Loader2, Download, Edit, RefreshCw, 
  CheckCircle, XCircle, Clock, FileText, Users, MapPin
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

const MemberReportPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedTelecaller, setSelectedTelecaller] = useState('');

  useEffect(() => {
    fetchMemberData();
    fetchTelecallers();
  }, [memberId]);

  const fetchMemberData = async () => {
    try {
      const [memberRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/members/${memberId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/members/${memberId}/payments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMember(memberRes.data);
      setPayments(paymentsRes.data || []);
      setEditForm(memberRes.data);
      setSelectedTelecaller(memberRes.data.assigned_telecaller || '');
    } catch (error) {
      toast.error('Failed to fetch member data');
      navigate('/admin/members');
    } finally {
      setLoading(false);
    }
  };

  const fetchTelecallers = async () => {
    try {
      const res = await axios.get(`${API}/telecallers`, { headers: { Authorization: `Bearer ${token}` } });
      setTelecallers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch telecallers');
    }
  };

  const handleUpdateMember = async () => {
    try {
      await axios.put(`${API}/members/${memberId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Member updated successfully');
      setEditModalOpen(false);
      fetchMemberData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update member');
    }
  };

  const handleAssignTelecaller = async () => {
    try {
      await axios.put(`${API}/members/${memberId}/assign`, 
        { telecaller_id: selectedTelecaller || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Telecaller assigned successfully');
      setAssignModalOpen(false);
      fetchMemberData();
    } catch (error) {
      toast.error('Failed to assign telecaller');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/20 text-green-500 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      expired: 'bg-red-500/20 text-red-500 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
      completed: 'bg-green-500/20 text-green-500 border-green-500/30',
      failed: 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    return colors[status] || colors.pending;
  };

  const getDaysRemaining = () => {
    if (!member?.membership_end) return null;
    const end = new Date(member.membership_end);
    const now = new Date();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return days;
  };

  const downloadReport = () => {
    const reportData = {
      member: member,
      payments: payments,
      generated_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `member_report_${memberId}.json`;
    a.click();
    toast.success('Report downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12 text-gray-400">
        Member not found
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/members')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Member Report</h1>
            <p className="text-gray-400">{member.member_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#c4a030]"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Member Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1a1a1c] rounded-xl border border-white/10 p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
              <User className="w-12 h-12 text-[#D4AF37]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{member.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(member.status)}`}>
                  {member.status?.toUpperCase()}
                </span>
              </div>
              <p className="text-[#D4AF37] font-medium mb-4">{member.member_id}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{member.mobile}</span>
                </div>
                {member.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.date_of_birth && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>DOB: {new Date(member.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                {member.referral_id && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Referral: {member.referral_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Membership Status Card */}
        <div className="bg-[#1a1a1c] rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Membership Status</h3>
          <div className="space-y-4">
            <div className="p-3 bg-[#0f0f10] rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Current Plan</p>
              <p className="text-white font-semibold">{member.plan_name || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0f0f10] rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Start Date</p>
                <p className="text-white text-sm">
                  {member.membership_start 
                    ? new Date(member.membership_start).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-[#0f0f10] rounded-lg">
                <p className="text-xs text-gray-400 mb-1">End Date</p>
                <p className="text-white text-sm">
                  {member.membership_end 
                    ? new Date(member.membership_end).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
            </div>
            {daysRemaining !== null && (
              <div className={`p-3 rounded-lg ${
                daysRemaining > 30 ? 'bg-green-500/10' : 
                daysRemaining > 0 ? 'bg-yellow-500/10' : 'bg-red-500/10'
              }`}>
                <p className="text-xs text-gray-400 mb-1">Days Remaining</p>
                <p className={`text-2xl font-bold ${
                  daysRemaining > 30 ? 'text-green-500' : 
                  daysRemaining > 0 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {daysRemaining > 0 ? daysRemaining : 'Expired'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Telecaller Assignment */}
      <div className="bg-[#1a1a1c] rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Telecaller Assignment</h3>
          <button
            onClick={() => setAssignModalOpen(true)}
            className="text-[#D4AF37] hover:underline text-sm"
          >
            Change Assignment
          </button>
        </div>
        {member.assigned_telecaller ? (
          <div className="flex items-center gap-4 p-4 bg-[#0f0f10] rounded-lg">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-white font-medium">
                {telecallers.find(t => t.id === member.assigned_telecaller)?.name || 'Unknown'}
              </p>
              <p className="text-gray-400 text-sm">
                {telecallers.find(t => t.id === member.assigned_telecaller)?.mobile || ''}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No telecaller assigned</p>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-[#1a1a1c] rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No payment records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f0f10]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-white">{payment.plan_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-white font-medium">₹{payment.amount}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{payment.payment_method || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Member Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-[#1a1a1c] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Member Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <Select 
                value={editForm.status || 'pending'} 
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger className="bg-[#0f0f10] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMember}
                className="flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#c4a030]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Telecaller Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="bg-[#1a1a1c] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Telecaller</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Select value={selectedTelecaller} onValueChange={setSelectedTelecaller}>
              <SelectTrigger className="bg-[#0f0f10] border-white/10 text-white">
                <SelectValue placeholder="Select telecaller" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1c] border-white/10">
                <SelectItem value="">No Assignment</SelectItem>
                {telecallers.map((tc) => (
                  <SelectItem key={tc.id} value={tc.id}>
                    {tc.name} ({tc.mobile})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTelecaller}
                className="flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#c4a030]"
              >
                Assign
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberReportPage;
