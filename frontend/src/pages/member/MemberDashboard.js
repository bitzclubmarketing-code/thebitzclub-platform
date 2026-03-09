import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Crown, Calendar, LogOut, User, Download, Gift,
  CheckCircle, Clock, XCircle, Loader2, ChevronRight,
  Hotel, UtensilsCrossed, Sparkles, Dumbbell, Waves, Music, PartyPopper, Building2,
  Share2, Star
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';

const MemberDashboard = () => {
  const { user, token, logout } = useAuth();
  const [member, setMember] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrSize, setQrSize] = useState(64);
  const [activeTab, setActiveTab] = useState('card');
  const cardRef = useRef(null);

  // Premium lifestyle experiences
  const lifestyleExperiences = [
    { icon: Hotel, title: 'Luxury Hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', discount: 'Up to 40% Off' },
    { icon: UtensilsCrossed, title: 'Fine Dining', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', discount: 'Up to 25% Off' },
    { icon: Sparkles, title: 'Spa & Wellness', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80', discount: 'Up to 35% Off' },
    { icon: Dumbbell, title: 'Premium Gyms', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80', discount: 'Up to 30% Off' },
    { icon: Waves, title: 'Swimming Pool', image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80', discount: 'Complimentary' },
    { icon: Music, title: 'Party Hall', image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&q=80', discount: 'Up to 20% Off' },
    { icon: PartyPopper, title: 'Marriage Venue', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80', discount: 'Special Packages' },
    { icon: Building2, title: 'Corporate Events', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80', discount: 'Corporate Rates' },
  ];

  useEffect(() => {
    fetchMemberData();
    fetchPartners();
    
    // Handle responsive QR code size
    const handleResize = () => {
      setQrSize(window.innerWidth < 480 ? 50 : 64);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BITZ Club Membership',
          text: `I'm a proud member of BITZ Club! Member ID: ${member?.member_id}`,
          url: window.location.origin
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`I'm a proud member of BITZ Club! Check it out: ${window.location.origin}`);
      toast.success('Link copied to clipboard!');
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
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your membership...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Header */}
      <header className="bg-[#1A1A1C] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4AF37]" />
            <span className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-gray-400 hidden sm:block text-sm">Welcome, {user?.name?.split(' ')[0]}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 
              className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Your <span className="text-[#D4AF37]">Membership</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage your BITZ Club membership and explore exclusive benefits</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'card', label: 'My Card', icon: Crown },
              { id: 'experiences', label: 'Experiences', icon: Star },
              { id: 'benefits', label: 'Benefits', icon: Gift }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#D4AF37] text-black'
                    : 'bg-[#1A1A1C] text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Card Tab */}
          {activeTab === 'card' && (
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Membership Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-white">Membership Card</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={shareCard}
                      className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors text-xs sm:text-sm"
                      data-testid="share-card-btn"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                    <button
                      onClick={downloadCard}
                      className="flex items-center gap-2 text-[#D4AF37] hover:text-[#E6D699] transition-colors text-xs sm:text-sm"
                      data-testid="download-card-btn"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
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
                        <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />
                        <span className="text-base sm:text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                          BITZ Club
                        </span>
                      </div>
                      <div className={`px-2 sm:px-3 py-1 rounded text-[10px] sm:text-xs uppercase tracking-wider font-semibold ${getStatusColor(member?.status)}`}>
                        {member?.status || 'Pending'}
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-1">Member</p>
                        <p className="text-base sm:text-xl font-semibold text-white truncate member-name">{member?.name || user?.name}</p>
                        <p className="font-mono text-[#D4AF37] text-xs sm:text-sm mt-1 member-id">{member?.member_id || user?.member_id}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-2">
                          {member?.plan_name || 'Plan'} | Valid: {
                            member?.membership_end 
                              ? new Date(member.membership_end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                              : 'N/A'
                          }
                        </p>
                      </div>
                      <div className="bg-white p-1.5 sm:p-2 rounded flex-shrink-0">
                        <QRCode
                          value={member?.member_id || user?.member_id || 'BITZ'}
                          size={qrSize}
                          level="M"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Info */}
                <p className="text-xs text-gray-400 text-center">
                  Show QR code at partner venues for instant verification & discounts
                </p>
              </div>

              {/* Member Info */}
              <div className="space-y-4 sm:space-y-6">
                <div className="card-dark rounded-xl sm:rounded-2xl">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#D4AF37]" />
                    Profile Details
                  </h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-gray-400 text-sm">Member ID</span>
                      <span className="font-mono text-[#D4AF37] text-sm">{member?.member_id || user?.member_id}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-gray-400 text-sm">Mobile</span>
                      <span className="text-white text-sm">{member?.mobile || user?.mobile}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-gray-400 text-sm">Email</span>
                      <span className="text-white text-sm truncate ml-4">{member?.email || user?.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-gray-400 text-sm">Plan</span>
                      <span className="text-white text-sm">{member?.plan_name || 'Not Selected'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Status</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(member?.status)}
                        <span className="text-white capitalize text-sm">{member?.status || 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div className="card-dark rounded-xl sm:rounded-2xl">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#D4AF37]" />
                    Membership Validity
                  </h2>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Valid From</p>
                      <p className="text-white text-sm sm:text-base">
                        {member?.membership_start 
                          ? new Date(member.membership_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Pending'
                        }
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Valid Until</p>
                      <p className="text-white text-sm sm:text-base">
                        {member?.membership_end 
                          ? new Date(member.membership_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Experiences Tab */}
          {activeTab === 'experiences' && (
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Exclusive <span className="text-[#D4AF37]">Experiences</span>
                </h2>
                <p className="text-gray-400 text-sm">Unlock premium lifestyle experiences with your BITZ membership</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {lifestyleExperiences.map((experience, index) => (
                  <motion.div
                    key={experience.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden"
                  >
                    <img 
                      src={experience.image}
                      alt={experience.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <experience.icon className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-[#D4AF37] text-[10px] sm:text-xs font-semibold uppercase">
                          {experience.discount}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {experience.title}
                      </h3>
                    </div>
                    
                    <div className="absolute inset-0 bg-[#D4AF37]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits Tab */}
          {activeTab === 'benefits' && (
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Partner <span className="text-[#D4AF37]">Benefits</span>
                </h2>
                <p className="text-gray-400 text-sm">Show your membership card at these venues for exclusive discounts</p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {partners.length > 0 ? partners.map((partner) => (
                  <motion.div 
                    key={partner.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-dark card-interactive rounded-xl sm:rounded-2xl overflow-hidden"
                  >
                    {partner.logo_url && (
                      <div 
                        className="h-36 sm:h-40 bg-cover bg-center"
                        style={{ backgroundImage: `url(${partner.logo_url})` }}
                      />
                    )}
                    <div className="p-4 sm:p-5">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1">{partner.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 mb-4 line-clamp-2">{partner.description}</p>
                      
                      {partner.facilities?.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-white/5">
                          {partner.facilities.map((facility, index) => (
                            <div key={index} className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-gray-300">{facility.facility_name}</span>
                              <span className="text-[#D4AF37] font-semibold">{facility.discount_percentage}% OFF</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <Gift className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Partner benefits coming soon!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MemberDashboard;
