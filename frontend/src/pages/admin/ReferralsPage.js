import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Users, Gift, TrendingUp, Search, Filter, ChevronRight,
  User, CheckCircle, Clock, Download, Loader2, Award, Share2
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ReferralsPage = () => {
  const { token } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedReferral, setExpandedReferral] = useState(null);

  useEffect(() => {
    fetchReferrals();
  }, [page, filterType]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (filterType !== 'all') {
        params.append('referral_type', filterType);
      }
      if (search) {
        params.append('search', search);
      }
      
      const response = await axios.get(`${API}/admin/referrals?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReferrals(response.data.referrals || []);
      setSummary(response.data.summary || {});
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch referrals');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchReferrals();
  };

  const exportToCSV = () => {
    if (referrals.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = ['Referral Code', 'Type', 'Referrer Name', 'Total Referrals', 'Active Referrals'];
    const rows = referrals.map(r => [
      r.referral_code,
      r.referral_type,
      r.referrer?.name || '-',
      r.total_referrals,
      r.active_referrals
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report exported!');
  };

  const getReferralTypeBadge = (type) => {
    const styles = {
      employee: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      associate: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      member: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
    };
    return styles[type] || styles.member;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Referral <span className="text-[#D4AF37]">Management</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track and manage member referrals</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="btn-secondary flex items-center gap-2"
          data-testid="export-referrals-btn"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.total_referrers || 0}</p>
              <p className="text-xs text-gray-400">Total Referrers</p>
            </div>
          </div>
        </div>
        
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.total_referred_members || 0}</p>
              <p className="text-xs text-gray-400">Total Referred</p>
            </div>
          </div>
        </div>
        
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.by_type?.employee || 0}</p>
              <p className="text-xs text-gray-400">Employee Refs</p>
            </div>
          </div>
        </div>
        
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.by_type?.member || 0}</p>
              <p className="text-xs text-gray-400">Member Refs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-dark p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by referral code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input-gold pl-10"
              data-testid="search-referrals"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48 bg-[#0F0F10] border-white/10">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="associate">Associate</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={handleSearch} className="btn-primary">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Referrals List */}
      <div className="card-dark overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No referrals found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {referrals.map((referral, index) => (
              <div key={index} className="p-4 hover:bg-white/5 transition-colors">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedReferral(expandedReferral === index ? null : index)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <span className="text-[#D4AF37] font-bold">
                        {referral.referrer?.name?.charAt(0) || referral.referral_code?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#D4AF37]">{referral.referral_code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getReferralTypeBadge(referral.referral_type)}`}>
                          {referral.referral_type}
                        </span>
                      </div>
                      {referral.referrer && (
                        <p className="text-sm text-gray-400 mt-1">
                          {referral.referrer.name} • {referral.referrer.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{referral.total_referrals}</p>
                      <p className="text-xs text-gray-500">Total Referrals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">{referral.active_referrals}</p>
                      <p className="text-xs text-gray-500">Active</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedReferral === index ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedReferral === index && referral.recent_referrals?.length > 0 && (
                  <div className="mt-4 pl-14 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recent Referrals</p>
                    {referral.recent_referrals.map((member, mIndex) => (
                      <div key={mIndex} className="flex items-center justify-between p-2 bg-[#0F0F10] rounded-lg">
                        <div className="flex items-center gap-3">
                          {member.status === 'active' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-400" />
                          )}
                          <div>
                            <p className="text-white text-sm">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.member_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#D4AF37]">{member.plan_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(member.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1 px-3 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-400 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-1 px-3 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReferralsPage;
