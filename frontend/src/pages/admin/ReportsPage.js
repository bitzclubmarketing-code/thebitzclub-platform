import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Download, Filter, Loader2, Calendar, FileSpreadsheet } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const ReportsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    referral_id: ''
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchReportData();
    fetchStats();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.status) params.append('status', filters.status);
      if (filters.referral_id) params.append('referral_id', filters.referral_id);
      
      const response = await axios.get(`${API}/reports/members?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

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

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.status) params.append('status', filters.status);
      if (filters.referral_id) params.append('referral_id', filters.referral_id);
      
      const response = await axios.get(`${API}/reports/export-excel?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
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

  // Prepare chart data
  const statusData = [
    { name: 'Active', count: stats?.active_members || 0 },
    { name: 'Pending', count: stats?.pending_members || 0 },
    { name: 'Expired', count: stats?.expired_members || 0 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Reports
          </h1>
          <p className="text-gray-400 mt-1">Generate and export membership reports</p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={exporting}
          className="btn-primary flex items-center gap-2"
          data-testid="export-excel-btn"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          Export to Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <div className="card-dark">
          <p className="text-2xl font-bold text-white">{stats?.total_members || 0}</p>
          <p className="text-sm text-gray-400">Total Members</p>
        </div>
        <div className="card-dark">
          <p className="text-2xl font-bold text-green-400">{stats?.active_members || 0}</p>
          <p className="text-sm text-gray-400">Active</p>
        </div>
        <div className="card-dark">
          <p className="text-2xl font-bold text-yellow-400">{stats?.pending_members || 0}</p>
          <p className="text-sm text-gray-400">Pending</p>
        </div>
        <div className="card-dark">
          <p className="text-2xl font-bold text-[#D4AF37]">₹{(stats?.total_revenue || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-400">Total Revenue</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card-dark">
          <h2 className="text-lg font-semibold text-white mb-4">Member Status Overview</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  axisLine={{ stroke: '#27272A' }}
                />
                <YAxis 
                  tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  axisLine={{ stroke: '#27272A' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1C', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-dark">
          <h2 className="text-lg font-semibold text-white mb-4">Plan Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.plan_distribution || []} layout="vertical">
                <XAxis type="number" tick={{ fill: '#A1A1AA', fontSize: 12 }} axisLine={{ stroke: '#27272A' }} />
                <YAxis 
                  type="category" 
                  dataKey="plan" 
                  tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  axisLine={{ stroke: '#27272A' }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1C', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-dark mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Filters</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="input-gold bg-[#0F0F10]"
              data-testid="filter-start-date"
            />
          </div>
          <div>
            <label className="input-label">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="input-gold bg-[#0F0F10]"
              data-testid="filter-end-date"
            />
          </div>
          <div>
            <label className="input-label">Status</label>
            <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
              <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
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
          <div>
            <label className="input-label">Referral ID</label>
            <input
              type="text"
              placeholder="Filter by referral..."
              value={filters.referral_id}
              onChange={(e) => setFilters({ ...filters, referral_id: e.target.value })}
              className="input-gold bg-[#0F0F10]"
              data-testid="filter-referral-id"
            />
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="card-dark overflow-hidden">
        <h2 className="text-lg font-semibold text-white mb-4">Members Report</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No members found for the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="reports-table">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Member ID</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Mobile</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">DOB</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Referral ID</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {members.slice(0, 20).map((member) => (
                  <tr key={member.id} className="border-b border-white/5">
                    <td className="py-3 px-4 font-mono text-[#D4AF37] text-sm">{member.member_id}</td>
                    <td className="py-3 px-4 text-white">{member.name}</td>
                    <td className="py-3 px-4 text-gray-400">{member.mobile}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400">{member.plan_name}</td>
                    <td className="py-3 px-4 font-mono text-gray-300 text-sm">{member.referral_id || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length > 20 && (
              <div className="p-4 text-center text-gray-400 text-sm border-t border-white/5">
                Showing 20 of {members.length} members. Export to Excel for full report.
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReportsPage;
