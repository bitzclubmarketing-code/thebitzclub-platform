import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Crown, Calendar, LogOut, User, Download, Gift,
  CheckCircle, Clock, XCircle, Loader2, ChevronRight,
  Hotel, UtensilsCrossed, Sparkles, Dumbbell, Waves, Music, PartyPopper, Building2,
  Share2, Star, Camera, RotateCw, FileImage, FileText
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import { MembershipCardFront, MembershipCardBack } from '@/components/MembershipCard';

const MemberDashboard = () => {
  const { user, token, logout } = useAuth();
  const [member, setMember] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('card');
  const [showCardBack, setShowCardBack] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const cardFrontRef = useRef(null);
  const cardBackRef = useRef(null);
  const fileInputRef = useRef(null);

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
  }, []);

  const fetchMemberData = async () => {
    try {
      const response = await axios.get(`${API}/members/${user.member_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMember(response.data);
    } catch (error) {
      console.error('Failed to fetch member data:', error);
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const memberId = member?.member_id || user?.member_id;
      const response = await axios.post(`${API}/members/${memberId}/photo`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update member with new photo URL
      setMember(prev => ({ ...prev, photo_url: response.data.photo_url }));
      toast.success('Photo uploaded successfully!');
    } catch (error) {
      console.error('Photo upload failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const downloadCardAsImage = async () => {
    if (!cardFrontRef.current || !cardBackRef.current) return;
    
    setDownloading(true);
    try {
      // Capture front side
      const frontCanvas = await html2canvas(cardFrontRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true
      });
      
      // Capture back side
      const backCanvas = await html2canvas(cardBackRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true
      });

      // Create a combined canvas
      const combinedCanvas = document.createElement('canvas');
      const gap = 40;
      combinedCanvas.width = frontCanvas.width;
      combinedCanvas.height = frontCanvas.height + gap + backCanvas.height;
      
      const ctx = combinedCanvas.getContext('2d');
      ctx.fillStyle = '#0F0F10';
      ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, frontCanvas.height + gap);
      
      // Download as PNG
      const link = document.createElement('a');
      link.download = `BITZ_Card_${member?.member_id || 'member'}.png`;
      link.href = combinedCanvas.toDataURL('image/png', 1.0);
      link.click();
      
      toast.success('Card image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download card image');
    } finally {
      setDownloading(false);
    }
  };

  const downloadCardAsPDF = async () => {
    if (!cardFrontRef.current || !cardBackRef.current) return;
    
    setDownloading(true);
    try {
      // Credit card size: 85.6mm x 53.98mm
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      
      // Capture front side
      const frontCanvas = await html2canvas(cardFrontRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true
      });
      
      // Capture back side
      const backCanvas = await html2canvas(cardBackRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true
      });

      // Create PDF with two pages (front and back)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [cardWidth, cardHeight]
      });
      
      // Add front side
      const frontImgData = frontCanvas.toDataURL('image/png', 1.0);
      pdf.addImage(frontImgData, 'PNG', 0, 0, cardWidth, cardHeight);
      
      // Add back side on new page
      pdf.addPage([cardWidth, cardHeight], 'landscape');
      const backImgData = backCanvas.toDataURL('image/png', 1.0);
      pdf.addImage(backImgData, 'PNG', 0, 0, cardWidth, cardHeight);
      
      // Save PDF
      pdf.save(`BITZ_Card_${member?.member_id || 'member'}.pdf`);
      
      toast.success('Card PDF downloaded!');
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('Failed to download card PDF');
    } finally {
      setDownloading(false);
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
            <div className="space-y-8">
              {/* Card Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                    data-testid="photo-upload-input"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-white rounded-lg transition-colors border border-white/10 text-sm"
                    data-testid="upload-photo-btn"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  <button
                    onClick={() => setShowCardBack(!showCardBack)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-white rounded-lg transition-colors border border-white/10 text-sm"
                    data-testid="flip-card-btn"
                  >
                    <RotateCw className="w-4 h-4" />
                    {showCardBack ? 'Show Front' : 'Show Back'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={shareCard}
                    className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-[#D4AF37] transition-colors text-sm"
                    data-testid="share-card-btn"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <button
                    onClick={downloadCardAsImage}
                    disabled={downloading}
                    className="flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg transition-colors text-sm"
                    data-testid="download-image-btn"
                  >
                    <FileImage className="w-4 h-4" />
                    Image
                  </button>
                  <button
                    onClick={downloadCardAsPDF}
                    disabled={downloading}
                    className="flex items-center gap-2 px-3 py-2 bg-[#D4AF37] hover:bg-[#E6D699] text-black rounded-lg transition-colors text-sm font-medium"
                    data-testid="download-pdf-btn"
                  >
                    {downloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Card Display */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Membership Card Preview */}
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    {showCardBack ? 'Back Side' : 'Front Side'}
                  </h2>
                  
                  <div className="flex justify-center">
                    <motion.div
                      key={showCardBack ? 'back' : 'front'}
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="transform-gpu"
                    >
                      {showCardBack ? (
                        <MembershipCardBack ref={cardBackRef} member={member} />
                      ) : (
                        <MembershipCardFront ref={cardFrontRef} member={member} user={user} qrSize={80} />
                      )}
                    </motion.div>
                  </div>

                  {/* Hidden cards for PDF generation */}
                  <div className="fixed -left-[9999px] top-0">
                    <MembershipCardFront ref={cardFrontRef} member={member} user={user} qrSize={80} />
                    <MembershipCardBack ref={cardBackRef} member={member} />
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    Credit card size (85.6mm × 53.98mm) - Print ready for both sides
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
