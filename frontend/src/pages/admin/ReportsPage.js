import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Download, Filter, Loader2, Calendar, FileSpreadsheet, Users, CreditCard,
  MapPin, Phone, Gift, Clock, TrendingUp, Search, X, Printer, FileText,
  ChevronDown, RefreshCw, Cake, AlertCircle
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#D4AF37', '#E6D699', '#B8860B', '#FFD700', '#DAA520', '#F0E68C'];

const ReportsPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Data states
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({});
  const [locationData, setLocationData] = useState([]);
  const [telecallerData, setTelecallerData] = useState([]);
  const [referralData, setReferralData] = useState({ referrals: [], summary: {} });
  const [birthdayData, setBirthdayData] = useState([]);
  const [expiryData, setExpiryData] = useState([]);
  const [stats, setStats] = useState(null);
  const [plans, setPlans] = useState([]);
  
  // Filter states
  const [memberFilters, setMemberFilters] = useState({
    search: '',
    status: '',
    plan_id: '',
    city: '',
    area: '',
    pincode: '',
    referral_id: '',
    start_date: '',
    end_date: '',
    expiry_start: '',
    expiry_end: '',
    dob_month: ''
  });
  
  const [paymentFilters, setPaymentFilters] = useState({
    payment_type: '',
    payment_method: '',
    plan_id: '',
    min_amount: '',
    max_amount: '',
    start_date: '',
    end_date: '',
    month: '',
    year: ''
  });
  
  const [locationGroupBy, setLocationGroupBy] = useState('city');
  const [birthdayPeriod, setBirthdayPeriod] = useState('today');
  const [expiryPeriod, setExpiryPeriod] = useState('7days');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPlans();
  }, []);

  useEffect(() => {
    if (activeTab === 'members') fetchMemberReport();
    else if (activeTab === 'payments') fetchPaymentReport();
    else if (activeTab === 'location') fetchLocationReport();
    else if (activeTab === 'telecaller') fetchTelecallerReport();
    else if (activeTab === 'referral') fetchReferralReport();
    else if (activeTab === 'birthday') fetchBirthdayReport();
    else if (activeTab === 'expiry') fetchExpiryReport();
  }, [activeTab, memberFilters, paymentFilters, locationGroupBy, birthdayPeriod, expiryPeriod]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/reports/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans');
    }
  };

  const fetchMemberReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(memberFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${API}/reports/members?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to fetch member report');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(paymentFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${API}/reports/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || []);
      setPaymentSummary(response.data.summary || {});
    } catch (error) {
      toast.error('Failed to fetch payment report');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/location?group_by=${locationGroupBy}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocationData(response.data);
    } catch (error) {
      toast.error('Failed to fetch location report');
    } finally {
      setLoading(false);
    }
  };

  const fetchTelecallerReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/telecaller-performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelecallerData(response.data);
    } catch (error) {
      toast.error('Failed to fetch telecaller report');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/referral`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferralData(response.data);
    } catch (error) {
      toast.error('Failed to fetch referral report');
    } finally {
      setLoading(false);
    }
  };

  const fetchBirthdayReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/birthday?period=${birthdayPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBirthdayData(response.data);
    } catch (error) {
      toast.error('Failed to fetch birthday report');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiryReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reports/expiry?period=${expiryPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpiryData(response.data);
    } catch (error) {
      toast.error('Failed to fetch expiry report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async (reportType) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('report_type', reportType);
      
      if (reportType === 'members') {
        Object.entries(memberFilters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      
      const response = await axios.get(`${API}/reports/export-excel?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel exported successfully!');
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = async (reportType) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('report_type', reportType);
      if (memberFilters.status) params.append('status', memberFilters.status);
      
      const response = await axios.get(`${API}/reports/export-csv?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  const resetFilters = () => {
    setMemberFilters({
      search: '', status: '', plan_id: '', city: '', pincode: '',
      referral_id: '', start_date: '', end_date: '', expiry_start: '', expiry_end: ''
    });
    setPaymentFilters({
      payment_type: '', payment_method: '', plan_id: '',
      min_amount: '', max_amount: '', start_date: '', end_date: '', month: '', year: ''
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="print:bg-white"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white print:text-black" style={{ fontFamily: 'Playfair Display, serif' }}>
            Reports & <span className="text-[#D4AF37]">Analytics</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm print:hidden">Comprehensive reports with filters and export options</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={printReport}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 print:hidden">
          <div className="card-dark p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_members}</p>
                <p className="text-xs text-gray-400">Total Members</p>
              </div>
            </div>
          </div>
          <div className="card-dark p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active_members}</p>
                <p className="text-xs text-gray-400">Active</p>
              </div>
            </div>
          </div>
          <div className="card-dark p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.expired_members}</p>
                <p className="text-xs text-gray-400">Expired</p>
              </div>
            </div>
          </div>
          <div className="card-dark p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.today_registrations || 0}</p>
                <p className="text-xs text-gray-400">Today</p>
              </div>
            </div>
          </div>
          <div className="card-dark p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.month_revenue)}</p>
                <p className="text-xs text-gray-400">Monthly Revenue</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-[#1A1A1C] border border-white/10 p-1 flex flex-wrap gap-1 print:hidden">
          <TabsTrigger value="members" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1 sm:mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
            <CreditCard className="w-4 h-4 mr-1 sm:mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="location" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
            <MapPin className="w-4 h-4 mr-1 sm:mr-2" />
            Location
          </TabsTrigger>
          <TabsTrigger value="telecaller" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
            <Phone className="w-4 h-4 mr-1 sm:mr-2" />
            Telecaller
          </TabsTrigger>
          <TabsTrigger value="referral" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
            <Gift className="w-4 h-4 mr-1 sm:mr-2" />
            Referral
          </TabsTrigger>
          <TabsTrigger value="birthday" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
            <Cake className="w-4 h-4 mr-1 sm:mr-2" />
            Birthday
          </TabsTrigger>
          <TabsTrigger value="expiry" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
            <Clock className="w-4 h-4 mr-1 sm:mr-2" />
            Expiry
          </TabsTrigger>
        </TabsList>

        {/* Member Reports */}
        <TabsContent value="members" className="space-y-4">
          {/* Filters */}
          {showFilters && (
            <div className="card-dark p-4 rounded-xl space-y-4 print:hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Filter Members</h3>
                <button onClick={resetFilters} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="input-label">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={memberFilters.search}
                      onChange={(e) => setMemberFilters({ ...memberFilters, search: e.target.value })}
                      className="input-gold pl-10"
                      placeholder="Name, Mobile, ID"
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Status</label>
                  <Select value={memberFilters.status} onValueChange={(v) => setMemberFilters({ ...memberFilters, status: v })}>
                    <SelectTrigger className="bg-[#0F0F10] border-white/10">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="input-label">Plan</label>
                  <Select value={memberFilters.plan_id} onValueChange={(v) => setMemberFilters({ ...memberFilters, plan_id: v })}>
                    <SelectTrigger className="bg-[#0F0F10] border-white/10">
                      <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Plans</SelectItem>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="input-label">City</label>
                  <input
                    type="text"
                    value={memberFilters.city}
                    onChange={(e) => setMemberFilters({ ...memberFilters, city: e.target.value })}
                    className="input-gold"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="input-label">Pincode</label>
                  <input
                    type="text"
                    value={memberFilters.pincode}
                    onChange={(e) => setMemberFilters({ ...memberFilters, pincode: e.target.value })}
                    className="input-gold"
                    placeholder="Enter pincode"
                  />
                </div>
                <div>
                  <label className="input-label">Area</label>
                  <input
                    type="text"
                    value={memberFilters.area}
                    onChange={(e) => setMemberFilters({ ...memberFilters, area: e.target.value })}
                    className="input-gold"
                    placeholder="Enter area"
                  />
                </div>
                <div>
                  <label className="input-label">Birthday Month</label>
                  <Select value={memberFilters.dob_month} onValueChange={(v) => setMemberFilters({ ...memberFilters, dob_month: v })}>
                    <SelectTrigger className="bg-[#0F0F10] border-white/10">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Months</SelectItem>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="input-label">Referral ID</label>
                  <input
                    type="text"
                    value={memberFilters.referral_id}
                    onChange={(e) => setMemberFilters({ ...memberFilters, referral_id: e.target.value })}
                    className="input-gold"
                    placeholder="BITZ-E001"
                  />
                </div>
                <div>
                  <label className="input-label">Registered From</label>
                  <input
                    type="date"
                    value={memberFilters.start_date}
                    onChange={(e) => setMemberFilters({ ...memberFilters, start_date: e.target.value })}
                    className="input-gold"
                  />
                </div>
                <div>
                  <label className="input-label">Registered To</label>
                  <input
                    type="date"
                    value={memberFilters.end_date}
                    onChange={(e) => setMemberFilters({ ...memberFilters, end_date: e.target.value })}
                    className="input-gold"
                  />
                </div>
                <div>
                  <label className="input-label">Expiry From</label>
                  <input
                    type="date"
                    value={memberFilters.expiry_start}
                    onChange={(e) => setMemberFilters({ ...memberFilters, expiry_start: e.target.value })}
                    className="input-gold"
                  />
                </div>
                <div>
                  <label className="input-label">Expiry To</label>
                  <input
                    type="date"
                    value={memberFilters.expiry_end}
                    onChange={(e) => setMemberFilters({ ...memberFilters, expiry_end: e.target.value })}
                    className="input-gold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex gap-2 print:hidden">
            <button onClick={() => exportToExcel('members')} disabled={exporting} className="btn-primary flex items-center gap-2 text-sm">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Export Excel
            </button>
            <button onClick={() => exportToCSV('members')} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Members Table */}
          <div className="card-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 print:border-gray-300">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">Member ID</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">Name</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">Mobile</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">DOB</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">City</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">Plan</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">Referral</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">Status</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium print:text-black">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="py-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : members.length === 0 ? (
                    <tr><td colSpan={9} className="py-8 text-center text-gray-400">No members found</td></tr>
                  ) : (
                    members.slice(0, 100).map((member) => (
                      <tr key={member.id} className="border-b border-white/5 print:border-gray-200">
                        <td className="py-3 px-4 font-mono text-[#D4AF37] text-sm print:text-black">{member.member_id}</td>
                        <td className="py-3 px-4 text-white print:text-black">{member.name}</td>
                        <td className="py-3 px-4 text-gray-400 print:text-black">{member.mobile}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm print:text-black">{formatDate(member.date_of_birth)}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm print:text-black">{member.city || '-'}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm print:text-black">{member.plan_name}</td>
                        <td className="py-3 px-4 font-mono text-gray-300 text-xs print:text-black">{member.referral_id || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBadge(member.status)} print:bg-transparent print:text-black`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm print:text-black">{formatDate(member.membership_end)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {members.length > 100 && (
              <div className="p-3 text-center text-sm text-gray-400 border-t border-white/5">
                Showing 100 of {members.length} records. Export to see all.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Payment Reports */}
        <TabsContent value="payments" className="space-y-4">
          {showFilters && (
            <div className="card-dark p-4 rounded-xl space-y-4 print:hidden">
              <h3 className="text-white font-semibold">Filter Payments</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="input-label">Payment Type</label>
                  <Select value={paymentFilters.payment_type} onValueChange={(v) => setPaymentFilters({ ...paymentFilters, payment_type: v })}>
                    <SelectTrigger className="bg-[#0F0F10] border-white/10">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="online">Online (Razorpay)</SelectItem>
                      <SelectItem value="offline">Offline (Cash)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="input-label">Min Amount</label>
                  <input
                    type="number"
                    value={paymentFilters.min_amount}
                    onChange={(e) => setPaymentFilters({ ...paymentFilters, min_amount: e.target.value })}
                    className="input-gold"
                    placeholder="₹0"
                  />
                </div>
                <div>
                  <label className="input-label">Max Amount</label>
                  <input
                    type="number"
                    value={paymentFilters.max_amount}
                    onChange={(e) => setPaymentFilters({ ...paymentFilters, max_amount: e.target.value })}
                    className="input-gold"
                    placeholder="₹100000"
                  />
                </div>
                <div>
                  <label className="input-label">Year</label>
                  <Select value={paymentFilters.year} onValueChange={(v) => setPaymentFilters({ ...paymentFilters, year: v })}>
                    <SelectTrigger className="bg-[#0F0F10] border-white/10">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-dark p-4 rounded-xl">
              <p className="text-gray-400 text-xs uppercase">Total Payments</p>
              <p className="text-xl font-bold text-white">{paymentSummary.total_count || 0}</p>
            </div>
            <div className="card-dark p-4 rounded-xl">
              <p className="text-gray-400 text-xs uppercase">Total Amount</p>
              <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(paymentSummary.total_amount)}</p>
            </div>
            <div className="card-dark p-4 rounded-xl">
              <p className="text-gray-400 text-xs uppercase">Online</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(paymentSummary.online_amount)}</p>
            </div>
            <div className="card-dark p-4 rounded-xl">
              <p className="text-gray-400 text-xs uppercase">Offline</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(paymentSummary.offline_amount)}</p>
            </div>
          </div>

          <button onClick={() => exportToExcel('payments')} disabled={exporting} className="btn-primary flex items-center gap-2 text-sm print:hidden">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export Payments
          </button>

          <div className="card-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Payment ID</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Member</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Method</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Plan</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-400">No payments found</td></tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-white/5">
                        <td className="py-3 px-4 font-mono text-[#D4AF37] text-sm">{payment.id}</td>
                        <td className="py-3 px-4 text-white">{payment.member_name || payment.member_id}</td>
                        <td className="py-3 px-4 text-green-400 font-semibold">{formatCurrency(payment.amount)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs uppercase ${payment.payment_type === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {payment.payment_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">{payment.payment_method || '-'}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm">{payment.plan_name || '-'}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm">{formatDate(payment.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Location Reports */}
        <TabsContent value="location" className="space-y-4">
          <div className="flex gap-2 print:hidden">
            <Select value={locationGroupBy} onValueChange={setLocationGroupBy}>
              <SelectTrigger className="w-40 bg-[#0F0F10] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="city">City-wise</SelectItem>
                <SelectItem value="pincode">Pincode-wise</SelectItem>
                <SelectItem value="area">Area-wise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card-dark p-4 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Location Distribution</h3>
              {locationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationData.slice(0, 10)}>
                    <XAxis dataKey="location" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1C', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'No location data available'}
                </div>
              )}
            </div>
            <div className="card-dark rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="text-white font-semibold">Location Breakdown</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#1A1A1C]">
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2 px-4 text-xs uppercase text-gray-400">Location</th>
                      <th className="text-right py-2 px-4 text-xs uppercase text-gray-400">Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationData.map((loc, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-2 px-4 text-white">{loc.location}</td>
                        <td className="py-2 px-4 text-right text-[#D4AF37] font-semibold">{loc.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Telecaller Performance */}
        <TabsContent value="telecaller" className="space-y-4">
          <div className="flex gap-2 print:hidden mb-4">
            <button onClick={() => exportToExcel('telecaller')} disabled={exporting} className="btn-primary flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4" />
              Export Telecaller Report
            </button>
          </div>
          <div className="card-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Telecaller</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Leads Assigned</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Contacted</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Converted</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Pending</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Members Created</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Payments Collected</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="py-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : telecallerData.length === 0 ? (
                    <tr><td colSpan={8} className="py-8 text-center text-gray-400">No telecaller data</td></tr>
                  ) : (
                    telecallerData.map((tc) => (
                      <tr key={tc.telecaller_id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">{tc.telecaller_name}</p>
                          <p className="text-gray-400 text-xs">{tc.telecaller_mobile}</p>
                        </td>
                        <td className="py-3 px-4 text-center text-white">{tc.leads_assigned}</td>
                        <td className="py-3 px-4 text-center text-blue-400">{tc.leads_contacted}</td>
                        <td className="py-3 px-4 text-center text-green-400">{tc.leads_converted}</td>
                        <td className="py-3 px-4 text-center text-yellow-400">{tc.leads_pending}</td>
                        <td className="py-3 px-4 text-center text-purple-400">{tc.members_created || 0}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[#D4AF37] font-semibold">₹{(tc.payments_collected || 0).toLocaleString()}</span>
                          <span className="text-gray-500 text-xs ml-1">({tc.payments_count || 0})</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${tc.conversion_rate >= 50 ? 'bg-green-500/20 text-green-400' : tc.conversion_rate >= 25 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {tc.conversion_rate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Referral Reports */}
        <TabsContent value="referral" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card-dark p-4 rounded-xl">
              <p className="text-gray-400 text-xs uppercase">Total Referrals</p>
              <p className="text-xl font-bold text-white">{referralData.summary?.total_referrals || 0}</p>
            </div>
            <div className="card-dark p-4 rounded-xl">
              <p className="text-gray-400 text-xs uppercase">Employee Referrals</p>
              <p className="text-xl font-bold text-blue-400">{referralData.summary?.employee_referrals || 0}</p>
            </div>
            <div className="card-dark p-4 rounded-xl">
              <p className="text-gray-400 text-xs uppercase">Associate Referrals</p>
              <p className="text-xl font-bold text-green-400">{referralData.summary?.associate_referrals || 0}</p>
            </div>
            <div className="card-dark p-4 rounded-xl">
              <p className="text-gray-400 text-xs uppercase">Member Referrals</p>
              <p className="text-xl font-bold text-purple-400">{referralData.summary?.member_referrals || 0}</p>
            </div>
          </div>

          <button onClick={() => exportToExcel('referral')} disabled={exporting} className="btn-primary flex items-center gap-2 text-sm print:hidden">
            <FileSpreadsheet className="w-4 h-4" />
            Export Referrals
          </button>

          <div className="card-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Referral ID</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Type</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Members Referred</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : (referralData.referrals || []).length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400">No referral data</td></tr>
                  ) : (
                    (referralData.referrals || []).map((ref) => (
                      <React.Fragment key={ref.referral_id}>
                        <tr className="border-b border-white/10 bg-[#0F0F10]">
                          <td className="py-3 px-4 font-mono text-[#D4AF37] font-semibold">{ref.referral_id}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs uppercase ${ref.referral_type === 'employee' ? 'bg-blue-500/20 text-blue-400' : ref.referral_type === 'associate' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                              {ref.referral_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-white font-semibold">{ref.count} members</td>
                        </tr>
                        {/* Show referred members */}
                        {ref.members_referred && ref.members_referred.map((m, idx) => (
                          <tr key={`${ref.referral_id}-${idx}`} className="border-b border-white/5">
                            <td className="py-2 px-4 pl-8">
                              <span className="text-gray-500">↳</span>
                              <span className="text-white ml-2">{m.name}</span>
                              <span className="text-gray-500 ml-2 text-xs">({m.member_id})</span>
                            </td>
                            <td className="py-2 px-4 text-gray-400 text-sm">{m.plan}</td>
                            <td className="py-2 px-4 text-center text-gray-400 text-sm">
                              {m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-IN') : '-'}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Birthday Reports */}
        <TabsContent value="birthday" className="space-y-4">
          <div className="flex gap-2 print:hidden">
            <Select value={birthdayPeriod} onValueChange={setBirthdayPeriod}>
              <SelectTrigger className="w-48 bg-[#0F0F10] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today's Birthdays</SelectItem>
                <SelectItem value="7days">Next 7 Days</SelectItem>
                <SelectItem value="30days">Next 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => exportToExcel('birthday')} disabled={exporting} className="btn-primary flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="card-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Member</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Mobile</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">DOB</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Plan</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Days Until</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : birthdayData.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No upcoming birthdays</td></tr>
                  ) : (
                    birthdayData.map((member) => (
                      <tr key={member.id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-[#D4AF37] text-xs font-mono">{member.member_id}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-400">{member.mobile}</td>
                        <td className="py-3 px-4 text-gray-400">{formatDate(member.date_of_birth)}</td>
                        <td className="py-3 px-4 text-gray-400">{member.plan_name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${member.days_until_birthday === 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-blue-500/20 text-blue-400'}`}>
                            {member.days_until_birthday === 0 ? '🎂 Today!' : `${member.days_until_birthday} days`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Expiry Reports */}
        <TabsContent value="expiry" className="space-y-4">
          <div className="flex gap-2 print:hidden">
            <Select value={expiryPeriod} onValueChange={setExpiryPeriod}>
              <SelectTrigger className="w-48 bg-[#0F0F10] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Expiring in 7 Days</SelectItem>
                <SelectItem value="30days">Expiring in 30 Days</SelectItem>
                <SelectItem value="expired">Already Expired</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={() => exportToExcel('expiry')} disabled={exporting} className="btn-primary flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="card-dark rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Member</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Mobile</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Plan</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Expiry Date</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-gray-400">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : expiryData.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No expiring memberships</td></tr>
                  ) : (
                    expiryData.map((member) => (
                      <tr key={member.id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">{member.name}</p>
                          <p className="text-[#D4AF37] text-xs font-mono">{member.member_id}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-400">{member.mobile}</td>
                        <td className="py-3 px-4 text-gray-400">{member.plan_name}</td>
                        <td className="py-3 px-4 text-gray-400">{formatDate(member.membership_end)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-semibold ${member.days_until_expiry < 0 ? 'bg-red-500/20 text-red-400' : member.days_until_expiry <= 7 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {member.days_until_expiry < 0 ? `Expired ${Math.abs(member.days_until_expiry)} days ago` : `${member.days_until_expiry} days`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ReportsPage;
