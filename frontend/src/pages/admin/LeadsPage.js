import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Search, Loader2, ChevronLeft, ChevronRight, Filter,
  FileSpreadsheet, Phone, MapPin, Calendar, Edit, Trash2,
  Users, UserCheck, UserX, TrendingUp
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

const LeadsPage = () => {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [page, search, statusFilter, interestFilter]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (interestFilter) params.append('interested_in', interestFilter);
      
      const response = await axios.get(`${API}/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data.leads);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/leads/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/leads/${selectedLead.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lead updated successfully');
      setModalOpen(false);
      fetchLeads();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await axios.delete(`${API}/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lead deleted');
      fetchLeads();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (interestFilter) params.append('interested_in', interestFilter);
      
      const response = await axios.get(`${API}/leads/export-excel?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Leads exported successfully');
    } catch (error) {
      toast.error('Failed to export leads');
    } finally {
      setExporting(false);
    }
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setFormData({
      status: lead.status,
      notes: lead.notes || ''
    });
    setModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-500/10 text-blue-400',
      contacted: 'bg-yellow-500/10 text-yellow-400',
      converted: 'bg-green-500/10 text-green-400',
      not_interested: 'bg-red-500/10 text-red-400'
    };
    return styles[status] || 'bg-gray-500/10 text-gray-400';
  };

  const getInterestBadge = (interest) => {
    return interest === 'membership' 
      ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
      : 'bg-purple-500/10 text-purple-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Leads
          </h1>
          <p className="text-gray-400 mt-1">Manage enquiries from landing page</p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={exporting}
          className="btn-primary flex items-center gap-2"
          data-testid="export-leads-btn"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          Export to Excel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card-dark">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              <p className="text-sm text-gray-400">Total Leads</p>
            </div>
          </div>
        </div>
        <div className="card-dark">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.new || 0}</p>
              <p className="text-sm text-gray-400">New Leads</p>
            </div>
          </div>
        </div>
        <div className="card-dark">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded">
              <UserCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.converted || 0}</p>
              <p className="text-sm text-gray-400">Converted</p>
            </div>
          </div>
        </div>
        <div className="card-dark">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4AF37]/10 rounded">
              <UserX className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.membership_leads || 0}</p>
              <p className="text-sm text-gray-400">Membership Interest</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-dark mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, or city..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-gold pl-10 bg-[#0F0F10]"
              data-testid="search-leads"
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-[#0F0F10] border-white/10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>
          <Select value={interestFilter || "all"} onValueChange={(v) => { setInterestFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-[#0F0F10] border-white/10">
              <SelectValue placeholder="All Interest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Interest</SelectItem>
              <SelectItem value="membership">Membership</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card-dark overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="leads-table">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Name</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Mobile</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">City</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Interest</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Status</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Source</th>
                  <th className="text-left py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Date</th>
                  <th className="text-right py-4 px-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{lead.name}</td>
                    <td className="py-4 px-4">
                      <a href={`tel:${lead.mobile}`} className="text-gray-400 hover:text-[#D4AF37] flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.mobile}
                      </a>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.city}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getInterestBadge(lead.interested_in)}`}>
                        {lead.interested_in}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBadge(lead.status)}`}>
                        {lead.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{lead.source || '-'}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(lead)}
                          className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors"
                          data-testid={`edit-lead-${lead.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          data-testid={`delete-lead-${lead.id}`}
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

      {/* Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Update Lead
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="mt-4">
              <div className="mb-4 p-3 bg-black/30 rounded">
                <p className="text-white font-semibold">{selectedLead.name}</p>
                <p className="text-gray-400 text-sm">{selectedLead.mobile} • {selectedLead.city}</p>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="input-label">Status</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="input-label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-gold resize-none"
                    rows={3}
                    placeholder="Add notes about this lead..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1" data-testid="save-lead-btn">
                    Update
                  </button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default LeadsPage;
