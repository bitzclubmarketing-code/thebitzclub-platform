import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Crown, CreditCard, Calendar, LogOut, User, Download, Gift,
  CheckCircle, Clock, XCircle, Loader2, ChevronRight
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';

const MemberDashboard = () => {
  const { user, token, logout } = useAuth();
  const [member, setMember] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef(null);

  useEffect(() => {
    fetchMemberData();
    fetchPartners();
  }, []);

  const fetchMemberData = async () => {
    try {
      const response = await axios.get(`${API}/members/${user.member_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMember(response.data);
    } catch (error) {
      console.error('Failed to fetch member data:', error);
      // If member profile doesn't exist, use user data
      setMember({
        member_id: user.member_id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        status: 'pending',
        plan_name: 'Not Selected'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await axios.get(`${API}/partners?is_active=true`);
      setPartners(response.data);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0F0F10',
        scale: 2
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98]
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      pdf.save(`BITZ_Card_${member?.member_id || 'member'}.pdf`);
      
      toast.success('Membership card downloaded!');
    } catch (error) {
      toast.error('Failed to download card');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'expired': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

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
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 hidden sm:block">Welcome, {user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 
              className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Your <span className="text-[#D4AF37]">Membership</span>
            </h1>
            <p className="text-gray-400">Manage your BITZ Club membership and benefits</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Membership Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Membership Card</h2>
                <button
                  onClick={downloadCard}
                  className="flex items-center gap-2 text-[#D4AF37] hover:text-[#E6D699] transition-colors text-sm"
                  data-testid="download-card-btn"
                >
                  <Download className="w-4 h-4" />
                  Download Card
                </button>
              </div>
              
              {/* Card Design */}
              <div 
                ref={cardRef}
                className="membership-card relative overflow-hidden"
                data-testid="membership-card"
              >
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-8 h-8 text-[#D4AF37]" />
                      <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                        BITZ Club
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs uppercase tracking-wider font-semibold ${getStatusColor(member?.status)}`}>
                      {member?.status || 'Pending'}
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Member</p>
                      <p className="text-xl font-semibold text-white">{member?.name || user?.name}</p>
                      <p className="font-mono text-[#D4AF37] text-sm mt-1">{member?.member_id || user?.member_id}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {member?.plan_name || 'Plan'} | Valid till: {
                          member?.membership_end 
                            ? new Date(member.membership_end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                            : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded">
                      <QRCode
                        value={member?.member_id || user?.member_id || 'BITZ'}
                        size={64}
                        level="M"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Info */}
              <p className="text-xs text-gray-400 text-center">
                Scan QR code at partner venues for instant verification
              </p>
            </div>

            {/* Member Info */}
            <div className="space-y-6">
              <div className="card-dark">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                  Profile Details
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-gray-400">Member ID</span>
                    <span className="font-mono text-[#D4AF37]">{member?.member_id || user?.member_id}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-gray-400">Mobile</span>
                    <span className="text-white">{member?.mobile || user?.mobile}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white">{member?.email || user?.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-gray-400">Plan</span>
                    <span className="text-white">{member?.plan_name || 'Not Selected'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(member?.status)}
                      <span className="text-white capitalize">{member?.status || 'Pending'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validity */}
              <div className="card-dark">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  Membership Validity
                </h2>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Valid From</p>
                    <p className="text-white">
                      {member?.membership_start 
                        ? new Date(member.membership_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Pending Activation'
                      }
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Valid Until</p>
                    <p className="text-white">
                      {member?.membership_end 
                        ? new Date(member.membership_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Pending Activation'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Partner Benefits */}
          <div className="mt-12">
            <h2 
              className="text-2xl font-bold text-white mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              <Gift className="w-6 h-6 text-[#D4AF37] inline mr-2" />
              Partner Benefits
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner) => (
                <div key={partner.id} className="card-dark card-interactive">
                  {partner.logo_url && (
                    <div 
                      className="h-32 bg-cover bg-center rounded mb-4"
                      style={{ backgroundImage: `url(${partner.logo_url})` }}
                    />
                  )}
                  <h3 className="text-lg font-semibold text-white mb-2">{partner.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{partner.description}</p>
                  
                  {partner.facilities?.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      {partner.facilities.map((facility, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{facility.facility_name}</span>
                          <span className="text-[#D4AF37] font-semibold">{facility.discount_percentage}% OFF</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default MemberDashboard;
