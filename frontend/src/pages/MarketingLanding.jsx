import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Crown, Star, ArrowRight, ArrowLeft, MessageCircle, Phone, X,
  Hotel, UtensilsCrossed, Sparkles, Dumbbell, PartyPopper,
  Waves, Baby, Music, Building2, CheckCircle, Loader2, 
  User, Mail, MapPin, Calendar, Lock, Upload, Camera,
  CreditCard, Shield, Gift, Send, ChevronDown, Globe, XCircle
} from 'lucide-react';
import { API, useAuth } from '@/context/AuthContext';

const WHATSAPP_NUMBER = '+917812901118';
const PHONE_NUMBER = '+917812901118';

// Country codes with flags and phone formats
const COUNTRY_CODES = [
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳', digits: 10 },
  { code: '+1', country: 'US', name: 'United States', flag: '🇺🇸', digits: 10 },
  { code: '+44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧', digits: 10 },
  { code: '+971', country: 'AE', name: 'UAE', flag: '🇦🇪', digits: 9 },
  { code: '+65', country: 'SG', name: 'Singapore', flag: '🇸🇬', digits: 8 },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺', digits: 9 },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪', digits: 11 },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷', digits: 9 },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵', digits: 10 },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳', digits: 11 },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', digits: 9 },
  { code: '+974', country: 'QA', name: 'Qatar', flag: '🇶🇦', digits: 8 },
  { code: '+968', country: 'OM', name: 'Oman', flag: '🇴🇲', digits: 8 },
  { code: '+973', country: 'BH', name: 'Bahrain', flag: '🇧🇭', digits: 8 },
  { code: '+965', country: 'KW', name: 'Kuwait', flag: '🇰🇼', digits: 8 },
];

const MarketingLanding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  // Step state: 1 = Lead capture, 2 = Full details, 3 = Payment, 4 = Success (Photo/ID upload)
  const [currentStep, setCurrentStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  
  // Chat modal
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSubmitting, setChatSubmitting] = useState(false);
  
  // Country code selection
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default India
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  
  // PIN code loading state
  const [pincodeLoading, setPincodeLoading] = useState(false);
  
  // Form data - Auto-populate referral from URL params (ref, referral, code, promo)
  const getReferralFromURL = () => {
    return searchParams.get('ref') || 
           searchParams.get('referral') || 
           searchParams.get('code') || 
           searchParams.get('promo') ||
           searchParams.get('utm_campaign') || // UTM tracking
           '';
  };
  
  const [step1Data, setStep1Data] = useState({
    name: '',
    mobile: '',
    email: '',
    referral_code: getReferralFromURL(),
    member_type: 'indian' // indian, nri, foreigner
  });
  
  // Member types with pricing currency
  const MEMBER_TYPES = [
    { id: 'indian', label: 'Indian', flag: '🇮🇳', currency: 'INR', symbol: '₹' },
    { id: 'nri', label: 'NRI', flag: '🌍', currency: 'USD', symbol: '$' },
    { id: 'foreigner', label: 'Foreigner', flag: '🌐', currency: 'USD', symbol: '$' }
  ];
  
  const getCurrentMemberType = () => MEMBER_TYPES.find(t => t.id === step1Data.member_type) || MEMBER_TYPES[0];
  
  const getPriceForMemberType = (plan) => {
    const memberType = getCurrentMemberType();
    if (memberType.id === 'indian') {
      return { price: plan.price || 0, currency: 'INR', symbol: '₹' };
    }
    // For NRI/Foreigner use USD price or convert from INR
    const usdPrice = plan.price_usd || Math.round((plan.price || 0) / 83);
    return { price: usdPrice, currency: 'USD', symbol: '$' };
  };
  
  const [step2Data, setStep2Data] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    date_of_birth: '',
    plan_id: '',
    password: '',
    confirmPassword: ''
  });
  
  // Photo/ID upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const photoInputRef = useRef(null);
  const idInputRef = useRef(null);

  const [referralValid, setReferralValid] = useState(null);
  const [referralInfo, setReferralInfo] = useState(null);

  useEffect(() => {
    fetchPlans();
    
    // Show referral code toast if pre-filled from URL and validate it
    const referral = getReferralFromURL();
    if (referral) {
      validateReferralCode(referral);
    }
  }, []);

  const validateReferralCode = async (code) => {
    if (!code || code.length < 4) {
      setReferralValid(null);
      setReferralInfo(null);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/referrals/validate?referral_code=${code}`);
      setReferralValid(response.data.valid);
      setReferralInfo(response.data);
      if (response.data.valid) {
        toast.success(response.data.message);
      }
    } catch (error) {
      setReferralValid(false);
      setReferralInfo(null);
    }
  };

  // Auto-fill city/state from PIN code (India Post API)
  const fetchLocationFromPincode = useCallback(async (pincode) => {
    if (!pincode || pincode.length !== 6 || selectedCountry.country !== 'IN') return;
    
    setPincodeLoading(true);
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = response.data[0];
      
      if (data.Status === 'Success' && data.PostOffice && data.PostOffice.length > 0) {
        const location = data.PostOffice[0];
        setStep2Data(prev => ({
          ...prev,
          city: location.District || location.Division || '',
          state: location.State || '',
          country: 'India'
        }));
        toast.success(`Location found: ${location.District}, ${location.State}`);
      } else {
        toast.error('Invalid PIN code. Please check and try again.');
      }
    } catch (error) {
      console.error('Failed to fetch location from pincode:', error);
      // Silently fail - user can still enter manually
    } finally {
      setPincodeLoading(false);
    }
  }, [selectedCountry.country]);

  // Handle PIN code change with debounce
  const handlePincodeChange = (value) => {
    const pincode = value.replace(/\D/g, '').slice(0, 6);
    setStep2Data(prev => ({ ...prev, pincode }));
    
    // Auto-fetch location when 6 digits entered (for India)
    if (pincode.length === 6 && selectedCountry.country === 'IN') {
      fetchLocationFromPincode(pincode);
    }
  };

  // Handle country selection
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setStep2Data(prev => ({ ...prev, country: country.name }));
    // Clear mobile if it doesn't match new country format
    if (step1Data.mobile.length > country.digits) {
      setStep1Data(prev => ({ ...prev, mobile: prev.mobile.slice(0, country.digits) }));
    }
  };

  // Get full phone number with country code
  const getFullPhoneNumber = () => {
    return `${selectedCountry.code}${step1Data.mobile}`;
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans?is_active=true`);
      setPlans(response.data);
      if (response.data.length > 0) {
        // Pre-select the most popular (second) plan or first plan
        setStep2Data(prev => ({ ...prev, plan_id: response.data[1]?.id || response.data[0]?.id }));
      }
    } catch (error) {
      console.error('Failed to fetch plans');
    }
  };

  // Step 1: Submit lead
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!step1Data.name || !step1Data.mobile) {
      toast.error('Please enter your name and mobile number');
      return;
    }
    if (step1Data.mobile.length !== selectedCountry.digits) {
      toast.error(`Please enter a valid ${selectedCountry.digits}-digit mobile number for ${selectedCountry.name}`);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/marketing/lead`, {
        name: step1Data.name,
        mobile: getFullPhoneNumber(), // Send with country code
        email: step1Data.email || null,
        referral_code: step1Data.referral_code || null,
        country_code: selectedCountry.code,
        country: selectedCountry.name,
        source: 'marketing_landing'
      });
      
      setLeadId(response.data.lead_id);
      toast.success('Details captured! Please complete your registration.');
      setCurrentStep(2);
    } catch (error) {
      const message = error.response?.data?.detail || 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit full details and initiate payment
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!step2Data.plan_id) {
      toast.error('Please select a membership plan');
      return;
    }
    if (!step2Data.password || step2Data.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (step2Data.password !== step2Data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/marketing/lead/${leadId}/step2`, {
        lead_id: leadId,
        address: step2Data.address,
        city: step2Data.city,
        state: step2Data.state,
        pincode: step2Data.pincode,
        country: step2Data.country || selectedCountry.name,
        date_of_birth: step2Data.date_of_birth,
        plan_id: step2Data.plan_id,
        password: step2Data.password
      });

      // Determine if international payment (non-Indian)
      const isInternational = selectedCountry.country !== 'IN';

      // Initiate Razorpay payment with international support
      const options = {
        key: response.data.razorpay_key,
        amount: response.data.amount * 100,
        currency: response.data.currency,
        name: 'BITZ Club',
        description: `${response.data.plan_name} Membership`,
        order_id: response.data.order_id,
        prefill: {
          name: response.data.name,
          email: response.data.email || '',
          contact: getFullPhoneNumber()
        },
        theme: {
          color: '#D4AF37'
        },
        // Enable all payment methods including international cards
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay using UPI/Net Banking',
                instruments: [
                  { method: 'upi' },
                  { method: 'netbanking' }
                ]
              },
              cards: {
                name: 'Pay using Cards',
                instruments: [
                  { method: 'card' }
                ]
              }
            },
            sequence: isInternational ? ['block.cards'] : ['block.banks', 'block.cards'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        handler: async function (paymentResponse) {
          await completeRegistration(paymentResponse);
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error('Payment cancelled');
          },
          confirm_close: true,
          escape: false
        },
        notes: {
          country: selectedCountry.name,
          country_code: selectedCountry.code
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpay.open();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to process. Please try again.';
      toast.error(message);
      setLoading(false);
    }
  };

  // Complete registration after payment
  const completeRegistration = async (paymentResponse) => {
    try {
      const response = await axios.post(
        `${API}/marketing/lead/${leadId}/complete?razorpay_payment_id=${paymentResponse.razorpay_payment_id}&razorpay_order_id=${paymentResponse.razorpay_order_id}&razorpay_signature=${paymentResponse.razorpay_signature}`
      );

      setMemberId(response.data.member_id);
      setAccessToken(response.data.access_token);
      
      // Store token for photo upload
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Payment successful! Welcome to BITZ Club!');
      setCurrentStep(4);
    } catch (error) {
      const message = error.response?.data?.detail || 'Payment verification failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle ID proof upload
  const handleIdSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File must be less than 5MB');
        return;
      }
      setIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Upload photo to server
  const uploadPhoto = async () => {
    if (!photoFile || !memberId) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', photoFile);
      
      await axios.post(`${API}/members/${memberId}/photo`, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Photo uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Go to dashboard
  const goToDashboard = async () => {
    if (photoFile) {
      await uploadPhoto();
    }
    
    // Login the user
    login({ token: accessToken, user: JSON.parse(localStorage.getItem('user') || '{}') });
    navigate('/member');
  };

  // Chat submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!step1Data.name || !step1Data.mobile || !chatMessage) {
      toast.error('Please fill all fields');
      return;
    }

    setChatSubmitting(true);
    try {
      await axios.post(`${API}/marketing/enquiry`, {
        name: step1Data.name,
        mobile: step1Data.mobile,
        email: step1Data.email || null,
        message: chatMessage,
        source: 'marketing_landing'
      });
      
      toast.success('Message sent! We will contact you soon.');
      setShowChat(false);
      setChatMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setChatSubmitting(false);
    }
  };

  const lifestyleExperiences = [
    { icon: Hotel, title: 'Luxury Hotels', desc: 'Up to 40% off at 5-star properties' },
    { icon: UtensilsCrossed, title: 'Fine Dining', desc: 'Premium restaurants & cafes' },
    { icon: Sparkles, title: 'Spa & Wellness', desc: 'Rejuvenating spa experiences' },
    { icon: Dumbbell, title: 'Premium Gyms', desc: 'Elite fitness centers' },
    { icon: Waves, title: 'Swimming Pools', desc: 'Premium pool facilities' },
    { icon: PartyPopper, title: 'Event Venues', desc: 'Exclusive party halls' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Floating Contact Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <motion.a
          href={`tel:${PHONE_NUMBER}`}
          className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          data-testid="call-now-btn"
        >
          <Phone className="w-6 h-6 text-white" />
        </motion.a>
        <motion.a
          href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          data-testid="whatsapp-btn"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </motion.a>
        <motion.button
          onClick={() => setShowChat(true)}
          className="w-14 h-14 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg hover:bg-[#E6D699] transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          data-testid="chat-btn"
        >
          <Send className="w-6 h-6 text-black" />
        </motion.button>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-[#1A1A1C] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Send us a Message</h3>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleChatSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Your Name</label>
                  <input
                    type="text"
                    value={step1Data.name}
                    onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })}
                    className="input-gold mt-1"
                    placeholder="Enter your name"
                    data-testid="chat-name"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Mobile Number</label>
                  <input
                    type="tel"
                    value={step1Data.mobile}
                    onChange={(e) => setStep1Data({ ...step1Data, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="input-gold mt-1"
                    placeholder="10-digit mobile"
                    data-testid="chat-mobile"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Your Message</label>
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="input-gold mt-1 min-h-[100px]"
                    placeholder="How can we help you?"
                    data-testid="chat-message"
                  />
                </div>
                <button
                  type="submit"
                  disabled={chatSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  data-testid="chat-submit"
                >
                  {chatSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {chatSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a 
              href={`tel:${PHONE_NUMBER}`}
              className="hidden sm:flex items-center gap-2 text-white hover:text-[#D4AF37] transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{PHONE_NUMBER}</span>
            </a>
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-full text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section with Form */}
      <section className="relative min-h-screen flex items-center pt-20 pb-10">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920)',
            filter: 'brightness(0.2)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm uppercase tracking-widest mb-6 rounded-full">
                Exclusive Membership
              </span>
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Live the <span className="text-[#D4AF37]">Premium</span> Lifestyle
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Join BITZ Club and unlock exclusive privileges at luxury hotels, 
                fine dining, spas, premium gyms and curated experiences.
              </p>
              
              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {lifestyleExperiences.slice(0, 4).map((exp, index) => (
                  <motion.div
                    key={exp.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                  >
                    <exp.icon className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">{exp.title}</p>
                      <p className="text-gray-400 text-xs">{exp.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Stats */}
              <div className="flex gap-8">
                <div>
                  <p className="text-3xl font-bold text-[#D4AF37]">500+</p>
                  <p className="text-sm text-gray-400">Partner Venues</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#D4AF37]">40%</p>
                  <p className="text-sm text-gray-400">Avg. Savings</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#D4AF37]">10K+</p>
                  <p className="text-sm text-gray-400">Happy Members</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass-gold p-6 sm:p-8 gold-glow"
            >
              {/* Step Progress */}
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3, 4].map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                          currentStep >= step 
                            ? 'bg-[#D4AF37] text-black' 
                            : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                      </div>
                      <span className="text-xs text-gray-400 mt-1 hidden sm:block">
                        {step === 1 && 'Details'}
                        {step === 2 && 'Plan'}
                        {step === 3 && 'Payment'}
                        {step === 4 && 'Complete'}
                      </span>
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-0.5 mx-2 ${currentStep > step ? 'bg-[#D4AF37]' : 'bg-white/10'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Lead Capture */}
              {currentStep === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Join BITZ Club
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Start your premium lifestyle journey</p>
                  </div>

                  {/* Member Type Selection */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Member Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {MEMBER_TYPES.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setStep1Data({ ...step1Data, member_type: type.id });
                            // Auto-select country based on member type
                            if (type.id === 'indian') {
                              setSelectedCountry(COUNTRY_CODES[0]); // India
                            } else if (type.id === 'nri' || type.id === 'foreigner') {
                              setSelectedCountry(COUNTRY_CODES[1]); // US as default for international
                            }
                          }}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            step1Data.member_type === type.id
                              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                          data-testid={`member-type-${type.id}`}
                        >
                          <span className="text-2xl">{type.flag}</span>
                          <p className={`text-sm mt-1 ${step1Data.member_type === type.id ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                            {type.label}
                          </p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Pricing in {getCurrentMemberType().symbol} ({getCurrentMemberType().currency})
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      <User className="w-4 h-4" /> Full Name *
                    </label>
                    <input
                      type="text"
                      value={step1Data.name}
                      onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })}
                      className="input-gold mt-1"
                      placeholder="Enter your full name"
                      data-testid="step1-name"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Mobile Number *
                    </label>
                    <div className="flex gap-2 mt-1">
                      {/* Country Code Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="input-gold flex items-center gap-2 px-3 py-3 min-w-[100px] justify-between"
                          data-testid="country-selector"
                        >
                          <span className="flex items-center gap-1">
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span className="text-sm">{selectedCountry.code}</span>
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Country Dropdown */}
                        <AnimatePresence>
                          {showCountryDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 mt-1 w-64 bg-[#1A1A1C] border border-white/10 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
                            >
                              {COUNTRY_CODES.map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                                    selectedCountry.code === country.code ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-white'
                                  }`}
                                >
                                  <span className="text-xl">{country.flag}</span>
                                  <span className="flex-1 text-left text-sm">{country.name}</span>
                                  <span className="text-gray-400 text-sm">{country.code}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {/* Mobile Number Input */}
                      <input
                        type="tel"
                        value={step1Data.mobile}
                        onChange={(e) => setStep1Data({ ...step1Data, mobile: e.target.value.replace(/\D/g, '').slice(0, selectedCountry.digits) })}
                        className="input-gold flex-1"
                        placeholder={`${selectedCountry.digits}-digit number`}
                        maxLength={selectedCountry.digits}
                        data-testid="step1-mobile"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedCountry.country === 'IN' ? 'Indian' : 'International'} payments supported via Razorpay
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email ID
                    </label>
                    <input
                      type="email"
                      value={step1Data.email}
                      onChange={(e) => setStep1Data({ ...step1Data, email: e.target.value })}
                      className="input-gold mt-1"
                      placeholder="your@email.com"
                      data-testid="step1-email"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      <Gift className="w-4 h-4" /> Referral Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={step1Data.referral_code}
                        onChange={(e) => {
                          const code = e.target.value.toUpperCase();
                          setStep1Data({ ...step1Data, referral_code: code });
                          if (code.length >= 4) {
                            validateReferralCode(code);
                          } else {
                            setReferralValid(null);
                            setReferralInfo(null);
                          }
                        }}
                        className={`input-gold mt-1 pr-10 ${referralValid === true ? 'border-green-500' : referralValid === false ? 'border-red-500' : ''}`}
                        placeholder="Enter referral code (if any)"
                        data-testid="step1-referral"
                      />
                      {referralValid === true && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                      {referralValid === false && (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {referralInfo?.valid && referralInfo?.referrer_name && (
                      <p className="text-xs text-green-400 mt-1">
                        Referred by {referralInfo.referrer_name}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                    data-testid="step1-submit"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Continue <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    By continuing, you agree to our Terms & Privacy Policy
                  </p>
                </form>
              )}

              {/* Step 2: Full Details & Plan Selection */}
              {currentStep === 2 && (
                <form onSubmit={handleStep2Submit} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Complete Your Profile
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Select your plan and create password</p>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="text-sm text-gray-400 flex items-center gap-2 mb-3">
                      <Crown className="w-4 h-4" /> Select Membership Plan *
                    </label>
                    <div className="space-y-3">
                      {plans.map((plan, index) => (
                        <label
                          key={plan.id}
                          className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            step2Data.plan_id === plan.id
                              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="plan"
                                value={plan.id}
                                checked={step2Data.plan_id === plan.id}
                                onChange={(e) => setStep2Data({ ...step2Data, plan_id: e.target.value })}
                                className="w-4 h-4 accent-[#D4AF37]"
                              />
                              <div>
                                <p className="text-white font-semibold">{plan.name}</p>
                                <p className="text-gray-400 text-xs">{plan.duration_months} months</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {(() => {
                                const pricing = getPriceForMemberType(plan);
                                return (
                                  <p className="text-[#D4AF37] font-bold text-lg">
                                    {pricing.symbol}{pricing.price.toLocaleString()}
                                  </p>
                                );
                              })()}
                              {index === 1 && (
                                <span className="text-xs bg-[#D4AF37] text-black px-2 py-0.5 rounded">Popular</span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* PIN Code with auto-fill (India only) */}
                  {selectedCountry.country === 'IN' ? (
                    <>
                      <div>
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> PIN Code (Auto-fill City/State)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={step2Data.pincode}
                            onChange={(e) => handlePincodeChange(e.target.value)}
                            className="input-gold mt-1"
                            placeholder="Enter 6-digit PIN code"
                            maxLength={6}
                            data-testid="step2-pincode"
                          />
                          {pincodeLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          City and state will be auto-filled from PIN code
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">City</label>
                          <input
                            type="text"
                            value={step2Data.city}
                            onChange={(e) => setStep2Data({ ...step2Data, city: e.target.value })}
                            className="input-gold mt-1"
                            placeholder="Auto-filled from PIN"
                            data-testid="step2-city"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">State</label>
                          <input
                            type="text"
                            value={step2Data.state}
                            onChange={(e) => setStep2Data({ ...step2Data, state: e.target.value })}
                            className="input-gold mt-1"
                            placeholder="Auto-filled from PIN"
                            data-testid="step2-state"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* International - Manual city/country entry */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> City
                          </label>
                          <input
                            type="text"
                            value={step2Data.city}
                            onChange={(e) => setStep2Data({ ...step2Data, city: e.target.value })}
                            className="input-gold mt-1"
                            placeholder="Your city"
                            data-testid="step2-city"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Country
                          </label>
                          <input
                            type="text"
                            value={step2Data.country || selectedCountry.name}
                            onChange={(e) => setStep2Data({ ...step2Data, country: e.target.value })}
                            className="input-gold mt-1"
                            placeholder="Country"
                            data-testid="step2-country"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Postal/ZIP Code</label>
                        <input
                          type="text"
                          value={step2Data.pincode}
                          onChange={(e) => setStep2Data({ ...step2Data, pincode: e.target.value })}
                          className="input-gold mt-1"
                          placeholder="Postal code"
                          data-testid="step2-pincode"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Date of Birth
                    </label>
                    <input
                      type="date"
                      value={step2Data.date_of_birth}
                      onChange={(e) => setStep2Data({ ...step2Data, date_of_birth: e.target.value })}
                      className="input-gold mt-1"
                      data-testid="step2-dob"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Create Password *
                    </label>
                    <input
                      type="password"
                      value={step2Data.password}
                      onChange={(e) => setStep2Data({ ...step2Data, password: e.target.value })}
                      className="input-gold mt-1"
                      placeholder="Min 6 characters"
                      data-testid="step2-password"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={step2Data.confirmPassword}
                      onChange={(e) => setStep2Data({ ...step2Data, confirmPassword: e.target.value })}
                      className="input-gold mt-1"
                      placeholder="Re-enter password"
                      data-testid="step2-confirm-password"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-[2] flex items-center justify-center gap-2 py-4"
                      data-testid="step2-submit"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" /> Proceed to Pay
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4" />
                    Secure payment via Razorpay
                  </div>
                </form>
              )}

              {/* Step 4: Success - Photo Upload */}
              {currentStep === 4 && (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                  </motion.div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Welcome to BITZ Club!
                    </h2>
                    <p className="text-[#D4AF37] font-mono text-lg mt-2">Member ID: {memberId}</p>
                    <p className="text-gray-400 text-sm mt-1">Your membership is now active</p>
                  </div>

                  {/* Photo Upload */}
                  <div className="bg-black/30 p-6 rounded-lg">
                    <h3 className="text-white font-semibold mb-4">Upload Your Photo (Optional)</h3>
                    <p className="text-gray-400 text-sm mb-4">Add your photo to your digital membership card</p>
                    
                    <div className="flex flex-col items-center gap-4">
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-32 h-32 rounded-full object-cover border-4 border-[#D4AF37]"
                          />
                          <button
                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          className="w-32 h-32 rounded-full border-2 border-dashed border-[#D4AF37]/50 flex flex-col items-center justify-center hover:border-[#D4AF37] transition-colors"
                        >
                          <Camera className="w-8 h-8 text-[#D4AF37] mb-2" />
                          <span className="text-xs text-gray-400">Add Photo</span>
                        </button>
                      )}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* ID Proof Upload */}
                  <div className="bg-black/30 p-6 rounded-lg">
                    <h3 className="text-white font-semibold mb-4">Upload ID Proof (Optional)</h3>
                    <p className="text-gray-400 text-sm mb-4">Aadhaar, PAN, or Driving License</p>
                    
                    <div className="flex flex-col items-center gap-4">
                      {idPreview ? (
                        <div className="relative">
                          <img
                            src={idPreview}
                            alt="ID Preview"
                            className="w-full max-w-[200px] rounded-lg border-2 border-[#D4AF37]"
                          />
                          <button
                            onClick={() => { setIdFile(null); setIdPreview(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => idInputRef.current?.click()}
                          className="w-full py-4 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center hover:border-[#D4AF37]/50 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-400">Click to upload ID</span>
                        </button>
                      )}
                      <input
                        ref={idInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleIdSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <button
                    onClick={goToDashboard}
                    disabled={uploading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                    data-testid="go-to-dashboard"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        View My Membership Card <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/member')}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Membership <span className="text-[#D4AF37]">Benefits</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Unlock a world of exclusive privileges and premium experiences
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lifestyleExperiences.map((exp, index) => (
              <motion.div
                key={exp.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-dark p-6 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                  <exp.icon className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">{exp.title}</h3>
                  <p className="text-gray-400 text-sm">{exp.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#D4AF37]/20 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Ready to Experience <span className="text-[#D4AF37]">Luxury</span>?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of happy members enjoying exclusive benefits
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
            >
              <Crown className="w-5 h-5" />
              Join Now
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Hi, I'm interested in BITZ Club membership`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white inline-flex items-center justify-center gap-2 text-lg px-8 py-4 rounded font-semibold transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Us
            </a>
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="btn-secondary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0F0F10] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-[#D4AF37]" />
            <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BITZ Club. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a href={`tel:${PHONE_NUMBER}`} className="text-gray-400 hover:text-[#D4AF37] text-sm">
              {PHONE_NUMBER}
            </a>
            <span className="text-gray-600">|</span>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-green-500 text-sm"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLanding;
