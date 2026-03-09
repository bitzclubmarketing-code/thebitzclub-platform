import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Crown, Users, Phone, Calendar, LogOut, Loader2, Plus, Edit,
  CheckCircle, Clock, AlertCircle, ChevronRight
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

const TelecallerDashboard = () => {
  const { user, token, logout } = useAuth();
  const [members, setMembers] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  
  // Modal states
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [memberForm, setMemberForm] = useState({
    name: '', mobile: '', email: '', plan_id: '', address: ''
  });
  
  const [followUpForm, setFollowUpForm] = useState({
    member_id: '', notes: '', follow_up_date: '', status: 'pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersRes, followUpsRes, plansRes] = await Promise.all([
        axios.get(`${API}/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/follow-ups`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/plans?is_active=true`)
      ]);
      setMembers(membersRes.data.members || []);
      setFollowUps(followUpsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/members`, memberForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Member created! Temp password: ${response.data.temporary_password}`);
      setMemberModalOpen(false);
      setMemberForm({ name: '', mobile: '', email: '', plan_id: '', address: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create member');
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/follow-ups`, followUpForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Follow-up created');
      setFollowUpModalOpen(false);
      setFollowUpForm({ member_id: '', notes: '', follow_up_date: '', status: 'pending' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create follow-up');
    }
  };

  const updateFollowUpStatus = async (id, status) => {
    try {
      await axios.put(`${API}/follow-ups/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Follow-up updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update follow-up');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/10 text-green-400',
      pending: 'bg-yellow-500/10 text-yellow-400',
      expired: 'bg-red-500/10 text-red-400',
      completed: 'bg-green-500/10 text-green-400'
    };
    return styles[status] || 'bg-gray-500/10 text-gray-400';
  };

  const todayFollowUps = followUps.filter(f => {
    const today = new Date().toISOString().split('T')[0];
    return f.follow_up_date === today && f.status !== 'completed';
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Header */}
      <header className="bg-[#1A1A1C] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                BITZ Club
              </span>
              <span className="text-xs text-[#D4AF37] ml-2 uppercase tracking-wider">Telecaller</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 hidden sm:block">{user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              data-testid="telecaller-logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="card-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#D4AF37]/10 rounded">
                  <Users className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{members.length}</p>
                  <p className="text-sm text-gray-400">Assigned Members</p>
                </div>
              </div>
            </div>
            <div className="card-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{todayFollowUps.length}</p>
                  <p className="text-sm text-gray-400">Today's Follow-ups</p>
                </div>
              </div>
            </div>
            <div className="card-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {followUps.filter(f => f.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-400">Completed Follow-ups</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/5">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'members' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'
              }`}
              data-testid="tab-members"
            >
              Assigned Members
              {activeTab === 'members' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'followups' ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'
              }`}
              data-testid="tab-followups"
            >
              Follow-ups
              {todayFollowUps.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded">
                  {todayFollowUps.length}
                </span>
              )}
              {activeTab === 'followups' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />
              )}
            </button>
          </div>

          {/* Content */}
          {activeTab === 'members' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setMemberModalOpen(true)}
                  className="btn-primary flex items-center gap-2"
                  data-testid="add-member-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>
              
              {members.length === 0 ? (
                <div className="card-dark text-center py-12">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No members assigned yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {members.map((member) => (
                    <div key={member.id} className="card-dark card-interactive">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{member.name}</h3>
                          <p className="text-sm text-gray-400">{member.mobile}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBadge(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{member.plan_name}</span>
                        <span className="font-mono text-[#D4AF37]">{member.member_id}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                        <button
                          onClick={() => {
                            setFollowUpForm({ ...followUpForm, member_id: member.id });
                            setFollowUpModalOpen(true);
                          }}
                          className="btn-secondary flex-1 py-2 text-sm"
                        >
                          Add Follow-up
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'followups' && (
            <div>
              {/* Today's Follow-ups Alert */}
              {todayFollowUps.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <p className="text-yellow-400">
                    You have {todayFollowUps.length} follow-up(s) scheduled for today
                  </p>
                </div>
              )}
              
              {followUps.length === 0 ? (
                <div className="card-dark text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No follow-ups scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followUps.map((followUp) => {
                    const member = members.find(m => m.id === followUp.member_id);
                    return (
                      <div key={followUp.id} className="card-dark">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-semibold">{member?.name || 'Unknown'}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(followUp.status)}`}>
                                {followUp.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{followUp.notes}</p>
                            <p className="text-xs text-gray-500">
                              Scheduled: {new Date(followUp.follow_up_date).toLocaleDateString()}
                            </p>
                          </div>
                          {followUp.status !== 'completed' && (
                            <button
                              onClick={() => updateFollowUpStatus(followUp.id, 'completed')}
                              className="btn-secondary py-2 px-4 text-sm"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Add Member Modal */}
      <Dialog open={memberModalOpen} onOpenChange={setMemberModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Add New Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                className="input-gold"
                required
              />
            </div>
            <div>
              <label className="input-label">Mobile *</label>
              <input
                type="tel"
                value={memberForm.mobile}
                onChange={(e) => setMemberForm({ ...memberForm, mobile: e.target.value })}
                className="input-gold"
                required
              />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                className="input-gold"
              />
            </div>
            <div>
              <label className="input-label">Plan *</label>
              <Select 
                value={memberForm.plan_id} 
                onValueChange={(v) => setMemberForm({ ...memberForm, plan_id: v })}
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
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setMemberModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">Create</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Follow-up Modal */}
      <Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Schedule Follow-up</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFollowUp} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Member *</label>
              <Select 
                value={followUpForm.member_id} 
                onValueChange={(v) => setFollowUpForm({ ...followUpForm, member_id: v })}
              >
                <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.mobile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="input-label">Follow-up Date *</label>
              <input
                type="date"
                value={followUpForm.follow_up_date}
                onChange={(e) => setFollowUpForm({ ...followUpForm, follow_up_date: e.target.value })}
                className="input-gold bg-[#0F0F10]"
                required
              />
            </div>
            <div>
              <label className="input-label">Notes *</label>
              <textarea
                value={followUpForm.notes}
                onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                className="input-gold resize-none"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setFollowUpModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">Schedule</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TelecallerDashboard;
