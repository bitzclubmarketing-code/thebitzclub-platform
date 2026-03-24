import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Crown, ArrowRight, ArrowLeft, User, Phone, Mail, MapPin, Calendar,
  Upload, Users, CreditCard, CheckCircle, Loader2, Download, Share2,
  Camera, FileText, Gift
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

const API = process.env.REACT_APP_BACKEND_URL || '';

const MarketingLandingPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [memberData, setMemberData] = useState(null);
  
  // Step 1 - Lead Form
  const [leadData, setLeadData] = useState({
    name: '',
    mobile: '',
    email: '',
    country_code: '+91',
    member_type: 'indian' // indian, nri, foreigner
  });
  
  // Step 2 - Membership Details
  const [memberDetails, setMemberDetails] = useState({
    city: '',
    state: '',
    country: 'India',
    address: '',
    date_of_birth: '',
    referral_code: '',
    pincode: ''
  });
  
  // Currency based on member type
  const getCurrency = () => {
    if (leadData.member_type === 'indian') return 'INR';
    return 'USD';
  };
  
  const getCurrencySymbol = () => {
    if (leadData.member_type === 'indian') return '₹';
    return '$';
  };
  
  const getPriceForMemberType = (plan) => {
    if (leadData.member_type === 'indian') {
      return plan.price || 0;
    }
    // For NRI/Foreigner, use USD price or convert
    return plan.price_usd || Math.round(plan.price / 83); // Approx conversion
  };
  
  // Photo uploads
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  
  // Family Members
  const [familyMembers, setFamilyMembers] = useState([]);
  
  const profileInputRef = useRef(null);
  const idProofInputRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    fetchPlans();
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/api/plans?is_active=true`);
      setPlans(response.data);
      if (response.data.length > 0) {
        setSelectedPlan(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch plans');
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIdProofChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File must be less than 5MB');
        return;
      }
      setIdProof(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdProofPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { name: '', relationship: '', date_of_birth: '' }]);
  };

  const updateFamilyMember = (index, field, value) => {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  // Step 1: Submit Lead
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!leadData.name || !leadData.mobile) {
      toast.error('Please fill in name and mobile number');
      return;
    }
    if (leadData.mobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    try {
      // Save lead to database
      await axios.post(`${API}/api/leads`, {
        name: leadData.name,
        mobile: leadData.mobile,
        email: leadData.email || null,
        city: 'Not specified',
        interested_in: 'membership',
        source: 'marketing_landing'
      });
      toast.success('Details saved! Continue to membership details.');
      setStep(2);
    } catch (error) {
      // If lead already exists, still proceed
      if (error.response?.data?.detail?.includes('already')) {
        setStep(2);
      } else {
        toast.error('Failed to save details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Membership Details and Proceed to Payment
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!memberDetails.city) {
      toast.error('Please enter your city');
      return;
    }
    if (!selectedPlan) {
      toast.error('Please select a membership plan');
      return;
    }
    setStep(3);
  };

  // Step 3: Process Payment
  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setLoading(true);
    try {
      // Initiate registration with payment
      const response = await axios.post(`${API}/api/marketing/register`, {
        name: leadData.name,
        mobile: leadData.mobile,
        email: leadData.email || null,
        city: memberDetails.city,
        address: memberDetails.address || null,
        pincode: memberDetails.pincode || null,
        date_of_birth: memberDetails.date_of_birth || null,
        referral_code: memberDetails.referral_code || null,
        plan_id: selectedPlan.id,
        photo_base64: profilePhotoPreview,
        id_proof_base64: idProofPreview,
        family_members: familyMembers.filter(f => f.name)
      });

      const { registration_id, order_id, amount, razorpay_key } = response.data;

      // Open Razorpay with UPI Intent/QR (VPA manual entry deprecated by NPCI Feb 2026)
      const options = {
        key: razorpay_key,
        amount: amount * 100,
        currency: 'INR',
        name: 'BITZ Club',
        description: `${selectedPlan.name} Membership`,
        order_id: order_id,
        handler: async function (razorpayResponse) {
          try {
            setLoading(true);
            // Complete registration
            const completeResponse = await axios.post(`${API}/api/marketing/complete`, {
              registration_id: registration_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature
            });

            setMemberData(completeResponse.data);
            setRegistrationComplete(true);
            toast.success(`Welcome to BITZ Club! Your Member ID: ${completeResponse.data.member_id}`);
          } catch (error) {
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: leadData.name,
          email: leadData.email,
          contact: leadData.mobile
        },
        // UPI Intent/QR flow configuration
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay using UPI',
                instruments: [
                  { method: 'upi', flows: ['qrcode', 'intent'] }
                ]
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  { method: 'netbanking' },
                  { method: 'card' },
                  { method: 'wallet' }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        theme: {
          color: '#D4AF37'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `BITZ_Card_${memberData?.member_id || 'member'}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('Card downloaded!');
    } catch (error) {
      toast.error('Failed to download card');
    }
  };

  // Success Screen
  if (registrationComplete && memberData) {
    return (
      <div className="min-h-screen bg-[#0F0F10] py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to <span className="text-[#D4AF37]">BITZ Club!</span>
          </h1>
          <p className="text-gray-400 mb-8">Your membership has been activated successfully.</p>
          
          {/* Membership Card */}
          <div className="flex justify-center mb-6">
            <div 
              ref={cardRef}
              className="w-[340px] h-[215px] rounded-xl p-5 relative overflow-hidden border-2 border-[#D4AF37]"
              style={{ background: 'linear-gradient(135deg, #1A1A1C 0%, #0F0F10 50%, #1A1A1C 100%)' }}
            >
              <div className="absolute top-[-30px] right-[-30px] w-[120px] h-[120px] rounded-full" 
                style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-7 h-7 text-[#D4AF37]" />
                  <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>BITZ Club</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                  ACTIVE
                </span>
              </div>
              
              <div className="flex justify-between items-end h-[calc(100%-60px)]">
                <div className="flex gap-3 items-end">
                  <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-[#D4AF37] bg-[#2A2A2C] flex items-center justify-center">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-[#D4AF37] font-bold">{memberData?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Member</p>
                    <p className="text-base font-semibold text-white max-w-[120px] truncate">{memberData?.name}</p>
                    <p className="text-sm text-[#D4AF37] font-mono font-semibold">{memberData?.member_id}</p>
                    <div className="flex gap-3 mt-1">
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase">Plan</p>
                        <p className="text-[10px] text-gray-300">{selectedPlan?.name}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-500 uppercase">Valid Till</p>
                        <p className="text-[10px] text-gray-300">{memberData?.validity_end ? new Date(memberData.validity_end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <QRCode value={memberData?.member_id || 'BITZ'} size={70} level="M" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center mb-8">
            <button onClick={downloadCard} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Card
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'BITZ Club Membership', text: `I'm now a BITZ Club member! ID: ${memberData?.member_id}`, url: window.location.origin });
                } else {
                  navigator.clipboard.writeText(`I'm now a BITZ Club member! ID: ${memberData?.member_id}`);
                  toast.success('Copied to clipboard!');
                }
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
          
          <div className="p-4 bg-[#1A1A1C] rounded-xl border border-white/10 text-left">
            <h3 className="text-[#D4AF37] font-semibold mb-2">What's Next?</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>✓ Confirmation email sent to {leadData.email || 'your email'}</li>
              <li>✓ Your digital membership card is ready</li>
              <li>✓ Show this card at partner venues for discounts</li>
              <li>✓ Login to your account for more features</li>
            </ul>
          </div>
          
          <a href="/login" className="inline-block mt-6 text-[#D4AF37] hover:underline">
            Login to Member Dashboard →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Header */}
      <header className="bg-[#1A1A1C] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>BITZ Club</span>
          </a>
          <a href="/login" className="text-gray-400 hover:text-white text-sm">Already a member? Login</a>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-[#1A1A1C]/50 py-4 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${step >= s ? 'text-[#D4AF37]' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step > s ? 'bg-[#D4AF37] text-black' : step === s ? 'border-2 border-[#D4AF37] text-[#D4AF37]' : 'border border-gray-600 text-gray-500'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className="text-sm hidden sm:block">
                    {s === 1 ? 'Basic Info' : s === 2 ? 'Details' : 'Payment'}
                  </span>
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#D4AF37]' : 'bg-gray-600'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Lead Form */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Join the <span className="text-[#D4AF37]">Elite</span>
                </h1>
                <p className="text-gray-400">Start your premium lifestyle membership</p>
              </div>

              <form onSubmit={handleStep1Submit} className="glass-gold p-6 sm:p-8 rounded-2xl space-y-5">
                {/* Member Type Selection */}
                <div>
                  <label className="input-label mb-3">Member Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'indian', label: 'Indian', flag: '🇮🇳', code: '+91' },
                      { id: 'nri', label: 'NRI', flag: '🌍', code: '+1' },
                      { id: 'foreigner', label: 'Foreigner', flag: '🌐', code: '+1' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setLeadData({ 
                          ...leadData, 
                          member_type: type.id,
                          country_code: type.code
                        })}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          leadData.member_type === type.id
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl">{type.flag}</span>
                        <p className={`text-sm mt-1 ${leadData.member_type === type.id ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                          {type.label}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {leadData.member_type === 'indian' ? 'Pricing in INR (₹)' : 'Pricing in USD ($)'}
                  </p>
                </div>

                <div>
                  <label className="input-label flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" /> Full Name *
                  </label>
                  <input
                    type="text"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    className="input-gold"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="input-label flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#D4AF37]" /> Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={leadData.country_code}
                      onChange={(e) => setLeadData({ ...leadData, country_code: e.target.value })}
                      className="input-gold w-24"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+65">🇸🇬 +65</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+33">🇫🇷 +33</option>
                    </select>
                    <input
                      type="tel"
                      value={leadData.mobile}
                      onChange={(e) => setLeadData({ ...leadData, mobile: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                      className="input-gold flex-1"
                      placeholder="Mobile number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D4AF37]" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                    className="input-gold"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </motion.div>
          )}

          {/* Step 2: Membership Details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Membership <span className="text-[#D4AF37]">Details</span>
                </h1>
                <p className="text-gray-400">Complete your profile for a personalized experience</p>
              </div>

              <form onSubmit={handleStep2Submit} className="glass-gold p-6 sm:p-8 rounded-2xl space-y-5">
                {/* Plan Selection */}
                <div>
                  <label className="input-label mb-3">Select Membership Plan *</label>
                  <div className="grid gap-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedPlan?.id === plan.id
                            ? 'border-2 border-[#D4AF37] bg-[#D4AF37]/10'
                            : 'border border-white/10 bg-[#0F0F10] hover:border-white/30'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-semibold">{plan.name}</p>
                            <p className="text-sm text-gray-400">{plan.duration_months} months</p>
                          </div>
                          <p className="text-xl font-bold text-[#D4AF37]">
                            {getCurrencySymbol()}{getPriceForMemberType(plan).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Country/State for NRI/Foreigner */}
                {leadData.member_type !== 'indian' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Country *</label>
                      <select
                        value={memberDetails.country}
                        onChange={(e) => setMemberDetails({ ...memberDetails, country: e.target.value })}
                        className="input-gold"
                        required
                      >
                        <option value="">Select Country</option>
                        <option value="United States">United States</option>
                        <option value="UAE">UAE</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Australia">Australia</option>
                        <option value="Canada">Canada</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">State/Province</label>
                      <input
                        type="text"
                        value={memberDetails.state}
                        onChange={(e) => setMemberDetails({ ...memberDetails, state: e.target.value })}
                        className="input-gold"
                        placeholder="State/Province"
                      />
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D4AF37]" /> City *
                    </label>
                    <input
                      type="text"
                      value={memberDetails.city}
                      onChange={(e) => setMemberDetails({ ...memberDetails, city: e.target.value })}
                      className="input-gold"
                      placeholder="Your city"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">{leadData.member_type === 'indian' ? 'Pincode' : 'ZIP Code'}</label>
                    <input
                      type="text"
                      value={memberDetails.pincode}
                      onChange={(e) => setMemberDetails({ ...memberDetails, pincode: e.target.value })}
                      className="input-gold"
                      placeholder={leadData.member_type === 'indian' ? 'Pincode' : 'ZIP Code'}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Address</label>
                  <textarea
                    value={memberDetails.address}
                    onChange={(e) => setMemberDetails({ ...memberDetails, address: e.target.value })}
                    className="input-gold resize-none"
                    placeholder="Full address"
                    rows={2}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" /> Date of Birth
                    </label>
                    <input
                      type="date"
                      value={memberDetails.date_of_birth}
                      onChange={(e) => setMemberDetails({ ...memberDetails, date_of_birth: e.target.value })}
                      className="input-gold"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="input-label flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#D4AF37]" /> Referral Code
                    </label>
                    <input
                      type="text"
                      value={memberDetails.referral_code}
                      onChange={(e) => setMemberDetails({ ...memberDetails, referral_code: e.target.value.toUpperCase() })}
                      className="input-gold"
                      placeholder="e.g., BITZ-E001"
                    />
                  </div>
                </div>

                {/* Photo Uploads */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#D4AF37]" /> Profile Photo
                    </label>
                    <input type="file" ref={profileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />
                    <div 
                      onClick={() => profileInputRef.current?.click()}
                      className="h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#D4AF37]/50 transition-colors overflow-hidden"
                    >
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Upload Photo</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="input-label flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D4AF37]" /> ID Proof
                    </label>
                    <input type="file" ref={idProofInputRef} onChange={handleIdProofChange} accept="image/*,.pdf" className="hidden" />
                    <div 
                      onClick={() => idProofInputRef.current?.click()}
                      className="h-24 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#D4AF37]/50 transition-colors overflow-hidden"
                    >
                      {idProofPreview ? (
                        <img src={idProofPreview} alt="ID Proof" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Upload ID</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Family Members */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="input-label flex items-center gap-2 mb-0">
                      <Users className="w-4 h-4 text-[#D4AF37]" /> Family Members (Optional)
                    </label>
                    <button type="button" onClick={addFamilyMember} className="text-xs text-[#D4AF37] hover:underline">
                      + Add Family Member
                    </button>
                  </div>
                  {familyMembers.map((member, index) => (
                    <div key={index} className="p-3 bg-[#0F0F10] rounded-lg mb-2 border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Family Member {index + 1}</span>
                        <button type="button" onClick={() => removeFamilyMember(index)} className="text-xs text-red-400 hover:underline">Remove</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                          className="input-gold text-sm"
                          placeholder="Name"
                        />
                        <select
                          value={member.relationship}
                          onChange={(e) => updateFamilyMember(index, 'relationship', e.target.value)}
                          className="input-gold text-sm"
                        >
                          <option value="">Relation</option>
                          <option value="spouse">Spouse</option>
                          <option value="child">Child</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                        </select>
                        <input
                          type="date"
                          value={member.date_of_birth}
                          onChange={(e) => updateFamilyMember(index, 'date_of_birth', e.target.value)}
                          className="input-gold text-sm"
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Complete <span className="text-[#D4AF37]">Payment</span>
                </h1>
                <p className="text-gray-400">Secure payment via Razorpay</p>
              </div>

              <div className="glass-gold p-6 sm:p-8 rounded-2xl">
                {/* Order Summary */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-4">Order Summary</h3>
                  <div className="bg-[#0F0F10] rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plan</span>
                      <span className="text-white font-semibold">{selectedPlan?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration</span>
                      <span className="text-white">{selectedPlan?.duration_months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Base Amount</span>
                      <span className="text-white">₹{selectedPlan?.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GST (18%)</span>
                      <span className="text-white">₹{Math.round(selectedPlan?.price * 0.18)?.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/10 pt-3 flex justify-between">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-[#D4AF37] text-xl font-bold">₹{Math.round(selectedPlan?.price * 1.18)?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Member Info */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-3">Member Details</h3>
                  <div className="bg-[#0F0F10] rounded-lg p-4 text-sm">
                    <p className="text-white">{leadData.name}</p>
                    <p className="text-gray-400">{leadData.mobile} • {leadData.email || 'No email'}</p>
                    <p className="text-gray-400">{memberDetails.city}</p>
                    {memberDetails.referral_code && (
                      <p className="text-[#D4AF37] mt-1">Referral: {memberDetails.referral_code}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Pay ₹{Math.round(selectedPlan?.price * 1.18)?.toLocaleString()}</>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                  🔒 Secure payment powered by Razorpay
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MarketingLandingPage;
