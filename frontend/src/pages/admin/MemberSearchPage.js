import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Search, Filter, User, Phone, Mail, Calendar, CreditCard,
  CheckCircle, XCircle, Clock, Loader2, Download, Eye, Edit,
  ChevronLeft, ChevronRight
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

const MemberSearchPage = () => {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    plan: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersRes, plansRes] = await Promise.all([
        axios.get(`${API}/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/plans`)
      ]);
      setMembers(membersRes.data.members || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    // Search filter
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.mobile?.includes(searchTerm) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.member_id?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filters.status === 'all' || member.status === filters.status;

    // Plan filter
    const matchesPlan = filters.plan === 'all' || member.plan_id === filters.plan;

    // Date filter
    let matchesDate = true;
    if (filters.dateFrom) {
      matchesDate = new Date(member.created_at) >= new Date(filters.dateFrom);
    }
    if (filters.dateTo && matchesDate) {
      matchesDate = new Date(member.created_at) <= new Date(filters.dateTo);
    }

    return matchesSearch && matchesStatus && matchesPlan && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const viewMemberDetails = (member) => {
    setSelectedMember(member);
    setDetailsModalOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['Member ID', 'Name', 'Mobile', 'Email', 'Plan', 'Status', 'Join Date'];
    const rows = filteredMembers.map(m => [
      m.member_id,
      m.name,
      m.mobile,
      m.email || '',
      m.plan_name || '',
      m.status,
      new Date(m.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported successfully');
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-500',
      pending: 'bg-yellow-500/20 text-yellow-500',
      expired: 'bg-red-500/20 text-red-500',
      cancelled: 'bg-gray-500/20 text-gray-500'
    };
    return styles[status] || styles.pending;
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
          <h1 className="text-2xl font-bold text-white">Member Search</h1>
          <p className="text-gray-400">Search and filter members</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#1a1a1c] rounded-xl p-4 border border-white/10 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, email, or member ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-3 bg-[#0f0f10] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={filters.status} onValueChange={(v) => { setFilters({...filters, status: v}); setCurrentPage(1); }}>
            <SelectTrigger className="bg-[#0f0f10] border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1c] border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.plan} onValueChange={(v) => { setFilters({...filters, plan: v}); setCurrentPage(1); }}>
            <SelectTrigger className="bg-[#0f0f10] border-white/10 text-white">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1c] border-white/10">
              <SelectItem value="all">All Plans</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => { setFilters({...filters, dateFrom: e.target.value}); setCurrentPage(1); }}
            className="px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
            placeholder="From Date"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => { setFilters({...filters, dateTo: e.target.value}); setCurrentPage(1); }}
            className="px-3 py-2 bg-[#0f0f10] border border-white/10 rounded-lg text-white"
            placeholder="To Date"
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Found {filteredMembers.length} members</span>
          <button
            onClick={() => { setFilters({ status: 'all', plan: 'all', dateFrom: '', dateTo: '' }); setSearchTerm(''); }}
            className="text-[#D4AF37] hover:underline"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-[#1a1a1c] rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f0f10]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.member_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="w-3 h-3" />
                        <span className="text-sm">{member.mobile}</span>
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Mail className="w-3 h-3" />
                          <span className="text-sm">{member.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">{member.plan_name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => viewMemberDetails(member)}
                      className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedMembers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No members found matching your criteria
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Member Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="bg-[#1a1a1c] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedMember.name}</h3>
                  <p className="text-gray-400">{selectedMember.member_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#0f0f10] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Mobile</p>
                  <p className="text-white">{selectedMember.mobile}</p>
                </div>
                <div className="p-3 bg-[#0f0f10] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-white">{selectedMember.email || 'N/A'}</p>
                </div>
                <div className="p-3 bg-[#0f0f10] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Plan</p>
                  <p className="text-white">{selectedMember.plan_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-[#0f0f10] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(selectedMember.status)}`}>
                    {selectedMember.status}
                  </span>
                </div>
                <div className="p-3 bg-[#0f0f10] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Membership Start</p>
                  <p className="text-white">
                    {selectedMember.membership_start 
                      ? new Date(selectedMember.membership_start).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-[#0f0f10] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Membership End</p>
                  <p className="text-white">
                    {selectedMember.membership_end 
                      ? new Date(selectedMember.membership_end).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedMember.referral_id && (
                <div className="p-3 bg-[#0f0f10] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Referred By</p>
                  <p className="text-white">{selectedMember.referral_id}</p>
                </div>
              )}

              <button
                onClick={() => setDetailsModalOpen(false)}
                className="w-full px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#c4a030]"
              >
                Close
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberSearchPage;
