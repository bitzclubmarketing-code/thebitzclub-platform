import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  RefreshCw, Search, Calendar, CreditCard, User, Phone, 
  CheckCircle, AlertCircle, Clock, Loader2, Filter
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

const RenewalPage = () => {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersRes, plansRes] = await Promise.all([
        axios.get(`${API}/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/plans?is_active=true`)
      ]);
      setMembers(membersRes.data.members || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (endDate) => {
    if (!endDate) return 'unknown';
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring';
    return 'active';
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.mobile?.includes(searchTerm) ||
      member.member_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && getExpiryStatus(member.membership_end) === filterStatus;
  });

  const handleRenewal = async () => {
    if (!selectedMember || !selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setProcessing(true);
    try {
      await axios.post(`${API}/members/${selectedMember.member_id}/renew`, 
        { plan_id: selectedPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Membership renewed successfully!');
      setRenewalModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to renew membership');
    } finally {
      setProcessing(false);
    }
  };

  const openRenewalModal = (member) => {
    setSelectedMember(member);
    setSelectedPlan(member.plan_id || '');
    setRenewalModalOpen(true);
  };

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
          <h1 className="text-2xl font-bold text-white">Membership Renewals</h1>
          <p className="text-gray-400">Manage and process membership renewals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter(m => getExpiryStatus(m.membership_end) === 'active').length}
              </p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter(m => getExpiryStatus(m.membership_end) === 'expiring').length}
              </p>
              <p className="text-sm text-gray-400">Expiring Soon</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter(m => getExpiryStatus(m.membership_end) === 'expired').length}
              </p>
              <p className="text-sm text-gray-400">Expired</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/20 rounded-lg">
              <RefreshCw className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{members.length}</p>
              <p className="text-sm text-gray-400">Total Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, or member ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1c] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48 bg-[#1a1a1c] border-white/10 text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1c] border-white/10">
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Table */}
      <div className="bg-[#1a1a1c] rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f0f10]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Expiry Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMembers.map((member) => {
                const status = getExpiryStatus(member.membership_end);
                return (
                  <tr key={member.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-sm text-gray-400">{member.member_id}</p>
                        <p className="text-sm text-gray-500">{member.mobile}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">{member.plan_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {member.membership_end ? new Date(member.membership_end).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        status === 'active' ? 'bg-green-500/20 text-green-500' :
                        status === 'expiring' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {status === 'active' ? 'Active' : status === 'expiring' ? 'Expiring Soon' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openRenewalModal(member)}
                        className="px-3 py-1 bg-[#D4AF37] text-black rounded-lg text-sm font-medium hover:bg-[#c4a030] transition-colors"
                      >
                        Renew
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No members found
          </div>
        )}
      </div>

      {/* Renewal Modal */}
      <Dialog open={renewalModalOpen} onOpenChange={setRenewalModalOpen}>
        <DialogContent className="bg-[#1a1a1c] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Renew Membership</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f0f10] rounded-lg">
                <p className="text-white font-medium">{selectedMember.name}</p>
                <p className="text-sm text-gray-400">{selectedMember.member_id}</p>
                <p className="text-sm text-gray-400">{selectedMember.mobile}</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select Plan</label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="w-full bg-[#0f0f10] border-white/10 text-white">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10">
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price} ({plan.duration_months} months)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setRenewalModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenewal}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#c4a030] disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Process Renewal'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RenewalPage;
