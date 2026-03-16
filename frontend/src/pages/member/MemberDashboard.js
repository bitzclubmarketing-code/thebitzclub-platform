import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Crown, Calendar, LogOut, User, Download, Gift,
  CheckCircle, Clock, XCircle, Loader2, ChevronRight,
  Hotel, UtensilsCrossed, Sparkles, Dumbbell, Waves, Music, PartyPopper, Building2,
  Share2, Star, Camera, RotateCw, FileImage, FileText, CreditCard, History, MessageSquare,
  MapPin, Phone, Globe, CalendarDays, Users, Copy, MessageCircle, Send
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import { MembershipCardFront, MembershipCardBack } from '@/components/MembershipCard';

const MemberDashboard = () => {
  const { user, token, logout } = useAuth();
  const [member, setMember] = useState(null);
  const [partners, setPartners] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('card');
  const [showCardBack, setShowCardBack] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [bookingAffiliate, setBookingAffiliate] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [creatingBooking, setCreatingBooking] = useState(false);
  
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
    fetchBookings();
    fetchPayments();
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

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API}/members/${user.member_id}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const createBooking = async () => {
    if (!bookingAffiliate || !bookingDate) {
      toast.error('Please select an affiliate and date');
      return;
    }
    
    setCreatingBooking(true);
    try {
      await axios.post(`${API}/bookings`, {
        affiliate_id: bookingAffiliate.id,
        booking_date: bookingDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Booking confirmed at ${bookingAffiliate.name}!`);
      setBookingAffiliate(null);
      setBookingDate('');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setCreatingBooking(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    
    setSubmittingFeedback(true);
    try {
      await axios.post(`${API}/marketing/enquiry`, {
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        message: `[MEMBER FEEDBACK] ${feedbackMessage}`,
        source: 'member_dashboard'
      });
      
      toast.success('Thank you for your feedback!');
      setFeedbackMessage('');
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
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
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'referral', label: 'Refer & Earn', icon: Gift },
              { id: 'affiliations', label: 'Affiliations', icon: Building2 },
              { id: 'bookings', label: 'Bookings', icon: CalendarDays },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'feedback', label: 'Feedback', icon: MessageSquare }
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
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <div className="card-dark rounded-xl sm:rounded-2xl">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                  My Profile
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Member ID</label>
                      <p className="text-white font-mono mt-1">{member?.member_id || user?.member_id}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Name</label>
                      <p className="text-white mt-1">{member?.name || user?.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Mobile</label>
                      <p className="text-white mt-1">{member?.mobile || user?.mobile}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
                      <p className="text-white mt-1">{member?.email || user?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Plan</label>
                      <p className="text-[#D4AF37] font-semibold mt-1">{member?.plan_name || 'Not Selected'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(member?.status)}
                        <span className="text-white capitalize">{member?.status || 'Pending'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Membership Start</label>
                      <p className="text-white mt-1">
                        {member?.membership_start 
                          ? new Date(member.membership_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Pending'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Membership End</label>
                      <p className="text-white mt-1">
                        {member?.membership_end 
                          ? new Date(member.membership_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>
                  {member?.address && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Address</label>
                      <p className="text-white mt-1">{member.address}, {member.city} {member.pincode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Refer & Earn Tab */}
          {activeTab === 'referral' && (
            <div className="space-y-8">
              {/* Referral Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-2xl mb-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Refer Friends & <span className="text-[#D4AF37]">Earn Rewards</span>
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Share BITZ Club with friends and family. When they join using your referral code, you both get exclusive benefits!
                </p>
              </div>

              {/* Referral Code Card */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-[#1A1A1C] to-[#2A2A2C] rounded-2xl p-6 border border-[#D4AF37]/20">
                  <div className="text-center mb-6">
                    <p className="text-gray-400 text-sm mb-2">Your Referral Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <span 
                        className="text-3xl sm:text-4xl font-bold text-[#D4AF37] font-mono tracking-wider"
                        data-testid="referral-code"
                      >
                        {member?.member_id || user?.member_id || 'BITZ-XXXX-XXXX'}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(member?.member_id || user?.member_id);
                          toast.success('Referral code copied!');
                        }}
                        className="p-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 rounded-lg transition-colors"
                        data-testid="copy-referral-code-btn"
                      >
                        <Copy className="w-5 h-5 text-[#D4AF37]" />
                      </button>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* WhatsApp Share */}
                    <button
                      onClick={() => {
                        const text = encodeURIComponent(
                          `🌟 Join BITZ Club - Premium Lifestyle Membership!\n\n` +
                          `I'm a member of BITZ Club and I love the exclusive benefits! Use my referral code to join and get special discounts.\n\n` +
                          `🎁 Referral Code: ${member?.member_id || user?.member_id}\n\n` +
                          `✨ Benefits:\n` +
                          `• Up to 40% off at luxury hotels\n` +
                          `• Exclusive dining discounts\n` +
                          `• Premium spa & wellness offers\n` +
                          `• And much more!\n\n` +
                          `👉 Join now: ${window.location.origin}/join?ref=${member?.member_id || user?.member_id}`
                        );
                        window.open(`https://wa.me/?text=${text}`, '_blank');
                        toast.success('Opening WhatsApp...');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#22c55e] text-white rounded-xl font-medium transition-colors"
                      data-testid="share-whatsapp-btn"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </button>

                    {/* SMS Share */}
                    <button
                      onClick={() => {
                        const text = encodeURIComponent(
                          `Join BITZ Club with my referral code: ${member?.member_id || user?.member_id}. ` +
                          `Get exclusive discounts at luxury hotels, restaurants & more! ` +
                          `Join: ${window.location.origin}/join?ref=${member?.member_id || user?.member_id}`
                        );
                        window.open(`sms:?body=${text}`, '_blank');
                        toast.success('Opening Messages...');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#3B82F6] hover:bg-[#2563eb] text-white rounded-xl font-medium transition-colors"
                      data-testid="share-sms-btn"
                    >
                      <Send className="w-5 h-5" />
                      SMS
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/join?ref=${member?.member_id || user?.member_id}`;
                        navigator.clipboard.writeText(link);
                        toast.success('Referral link copied to clipboard!');
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-white rounded-xl font-medium transition-colors border border-white/10"
                      data-testid="copy-link-btn"
                    >
                      <Copy className="w-5 h-5" />
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="max-w-3xl mx-auto">
                <h3 className="text-lg font-semibold text-white mb-6 text-center">How It Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#1A1A1C] rounded-xl p-5 text-center border border-white/5">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Share2 className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <h4 className="text-white font-medium mb-1">1. Share Your Code</h4>
                    <p className="text-gray-400 text-sm">Send your unique referral code to friends via WhatsApp, SMS or copy the link</p>
                  </div>
                  <div className="bg-[#1A1A1C] rounded-xl p-5 text-center border border-white/5">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <h4 className="text-white font-medium mb-1">2. Friend Joins</h4>
                    <p className="text-gray-400 text-sm">Your friend uses your code while signing up for BITZ Club membership</p>
                  </div>
                  <div className="bg-[#1A1A1C] rounded-xl p-5 text-center border border-white/5">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Gift className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <h4 className="text-white font-medium mb-1">3. Both Get Rewards</h4>
                    <p className="text-gray-400 text-sm">You and your friend both receive exclusive benefits and discounts</p>
                  </div>
                </div>
              </div>

              {/* Benefits Preview */}
              <div className="max-w-3xl mx-auto bg-gradient-to-r from-[#D4AF37]/10 to-[#B8860B]/10 rounded-2xl p-6 border border-[#D4AF37]/20">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-black" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="text-white font-semibold text-lg mb-1">Referral Benefits</h4>
                    <p className="text-gray-400 text-sm">
                      For every successful referral, earn extended membership validity, additional discounts at partner venues, 
                      and exclusive access to premium events. The more you refer, the more you earn!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Affiliations Tab */}
          {activeTab === 'affiliations' && (
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Our <span className="text-[#D4AF37]">Affiliations</span>
                </h2>
                <p className="text-gray-400 text-sm">Book your visit at these venues for exclusive discounts</p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {partners.length > 0 ? partners.map((partner) => (
                  <motion.div 
                    key={partner.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-dark rounded-xl sm:rounded-2xl overflow-hidden"
                  >
                    {(partner.image_url || partner.logo_url) && (
                      <div 
                        className="h-36 sm:h-40 bg-cover bg-center"
                        style={{ backgroundImage: `url(${partner.image_url || partner.logo_url})` }}
                      />
                    )}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-white">{partner.name}</h3>
                        {partner.category && (
                          <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded">{partner.category}</span>
                        )}
                      </div>
                      
                      {partner.offers && (
                        <p className="text-[#D4AF37] text-sm font-semibold mb-2">{partner.offers}</p>
                      )}
                      
                      <p className="text-xs sm:text-sm text-gray-400 mb-4 line-clamp-2">{partner.description}</p>
                      
                      {/* Contact Details */}
                      <div className="space-y-2 pt-3 border-t border-white/5 text-sm">
                        {partner.contact_person_1 && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <User className="w-4 h-4 text-[#D4AF37]" />
                            {partner.contact_person_1}
                            {partner.contact_person_1_phone && ` - ${partner.contact_person_1_phone}`}
                          </div>
                        )}
                        {partner.contact_phone && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone className="w-4 h-4 text-[#D4AF37]" />
                            <a href={`tel:${partner.contact_phone}`} className="hover:text-white">{partner.contact_phone}</a>
                          </div>
                        )}
                        {partner.address && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4 text-[#D4AF37]" />
                            {partner.address}, {partner.city}
                          </div>
                        )}
                        {partner.website && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Globe className="w-4 h-4 text-[#D4AF37]" />
                            <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:text-white truncate">{partner.website}</a>
                          </div>
                        )}
                      </div>
                      
                      {/* Book Button */}
                      {partner.booking_enabled !== false && (
                        <button
                          onClick={() => setBookingAffiliate(partner)}
                          className="mt-4 w-full btn-primary text-sm py-2"
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Affiliations coming soon!</p>
                  </div>
                )}
              </div>
              
              {/* Booking Modal */}
              {bookingAffiliate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#1A1A1C] rounded-xl p-6 max-w-md w-full"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Book at {bookingAffiliate.name}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">Member ID</label>
                        <p className="text-white font-mono">{member?.member_id}</p>
                      </div>
                      
                      {bookingAffiliate.offers && (
                        <div>
                          <label className="text-sm text-gray-400">Offers</label>
                          <p className="text-[#D4AF37]">{bookingAffiliate.offers}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm text-gray-400">Visit Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="input-gold w-full mt-1"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setBookingAffiliate(null)}
                          className="flex-1 btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createBooking}
                          disabled={creatingBooking}
                          className="flex-1 btn-primary"
                        >
                          {creatingBooking ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Booking'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* Bookings History Tab */}
          {activeTab === 'bookings' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Bookings <span className="text-[#D4AF37]">History</span>
                </h2>
              </div>
              
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="card-dark rounded-xl p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-white font-semibold">{booking.affiliate_name}</h3>
                          <p className="text-[#D4AF37] text-sm">{booking.affiliate_offers}</p>
                          <p className="text-gray-400 text-sm">Booking Date: {new Date(booking.booking_date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            booking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {booking.status?.toUpperCase()}
                          </span>
                          <p className="text-gray-500 text-xs mt-2">
                            Booked: {new Date(booking.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Booking Details */}
                      <div className="mt-4 pt-4 border-t border-white/5 grid sm:grid-cols-2 gap-3 text-sm">
                        {booking.affiliate_contact_1 && (
                          <div>
                            <span className="text-gray-400">Contact: </span>
                            <span className="text-white">{booking.affiliate_contact_1}</span>
                          </div>
                        )}
                        {booking.affiliate_phone && (
                          <div>
                            <span className="text-gray-400">Phone: </span>
                            <span className="text-white">{booking.affiliate_phone}</span>
                          </div>
                        )}
                        {booking.affiliate_address && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-400">Address: </span>
                            <span className="text-white">{booking.affiliate_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No bookings yet. Visit Affiliations to book!</p>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Payment <span className="text-[#D4AF37]">History</span>
                </h2>
              </div>
              
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="card-dark rounded-xl p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-white font-semibold capitalize">
                            {payment.payment_type || 'Membership'} Payment
                          </h3>
                          <p className="text-gray-400 text-sm">{payment.plan_name || payment.notes}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(payment.created_at).toLocaleDateString('en-IN', { 
                              day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#D4AF37] text-xl font-bold">₹{payment.amount?.toLocaleString()}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {payment.status?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
                        <span className="text-gray-400">Method: {payment.payment_method || 'Online'}</span>
                        {payment.transaction_id && (
                          <span className="text-gray-500 font-mono text-xs">{payment.transaction_id}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No payment history yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="max-w-2xl mx-auto">
              <div className="card-dark rounded-xl">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
                  Share Your Feedback
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Your Message</label>
                    <textarea
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Tell us about your experience, suggestions, or any issues..."
                      className="input-gold w-full mt-1 min-h-[150px]"
                    />
                  </div>
                  
                  <button
                    onClick={submitFeedback}
                    disabled={submittingFeedback}
                    className="btn-primary w-full"
                  >
                    {submittingFeedback ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Your feedback helps us improve our services.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MemberDashboard;
