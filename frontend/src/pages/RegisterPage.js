import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Crown, Eye, EyeOff, Loader2, Check, Camera, X, Globe, Phone, CreditCard, ChevronDown } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';

// Country configurations with validation rules
const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', currency: 'INR', symbol: '₹', mobileDigits: 10, pincodeFormat: /^\d{6}$/, pincodePlaceholder: '560001' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', currency: 'USD', symbol: '$', mobileDigits: 10, pincodeFormat: /^\d{5}(-\d{4})?$/, pincodePlaceholder: '10001' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', currency: 'GBP', symbol: '£', mobileDigits: 10, pincodeFormat: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, pincodePlaceholder: 'SW1A 1AA' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971', currency: 'AED', symbol: 'د.إ', mobileDigits: 9, pincodeFormat: /^.*$/, pincodePlaceholder: 'Optional' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', currency: 'SAR', symbol: 'ر.س', mobileDigits: 9, pincodeFormat: /^\d{5}$/, pincodePlaceholder: '11564' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', currency: 'SGD', symbol: 'S$', mobileDigits: 8, pincodeFormat: /^\d{6}$/, pincodePlaceholder: '018956' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', currency: 'AUD', symbol: 'A$', mobileDigits: 9, pincodeFormat: /^\d{4}$/, pincodePlaceholder: '2000' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', currency: 'CAD', symbol: 'C$', mobileDigits: 10, pincodeFormat: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, pincodePlaceholder: 'K1A 0B1' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', currency: 'EUR', symbol: '€', mobileDigits: 11, pincodeFormat: /^\d{5}$/, pincodePlaceholder: '10115' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974', currency: 'QAR', symbol: 'ر.ق', mobileDigits: 8, pincodeFormat: /^.*$/, pincodePlaceholder: 'Optional' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965', currency: 'KWD', symbol: 'د.ك', mobileDigits: 8, pincodeFormat: /^\d{5}$/, pincodePlaceholder: '12345' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968', currency: 'OMR', symbol: 'ر.ع', mobileDigits: 8, pincodeFormat: /^\d{3}$/, pincodePlaceholder: '100' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973', currency: 'BHD', symbol: 'د.ب', mobileDigits: 8, pincodeFormat: /^\d{3,4}$/, pincodePlaceholder: '1234' },
];

const MEMBER_TYPES = [
  { value: 'indian', label: 'Indian Resident', description: 'Living in India' },
  { value: 'nri', label: 'NRI', description: 'Non-Resident Indian' },
  { value: 'foreigner', label: 'Foreigner', description: 'Non-Indian National' },
];

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default India
  const [memberType, setMemberType] = useState('indian');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    referralId: searchParams.get('ref') || searchParams.get('referral') || '',
    planId: searchParams.get('plan') || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const countryDropdownRef = useRef(null);

  useEffect(() => {
    fetchPlans();
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    // Close dropdown on outside click
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.body.removeChild(script);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-fill referral from URL
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('referral');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralId: refCode }));
    }
  }, [searchParams]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans?is_active=true`);
      setPlans(response.data);
      if (!formData.planId && response.data.length > 0) {
        setFormData(prev => ({ ...prev, planId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Mobile number validation - only digits
    if (name === 'mobile') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= selectedCountry.mobileDigits) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    // Clear mobile when country changes
    setFormData(prev => ({ ...prev, mobile: '', pincode: '' }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    // Photo is mandatory
    if (!photoBase64) {
      toast.error('Please upload your photo - it is required for membership card');
      return false;
    }

    if (!formData.name || !formData.mobile || !formData.password) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    // Mobile validation based on country
    if (formData.mobile.length !== selectedCountry.mobileDigits) {
      toast.error(`Please enter a valid ${selectedCountry.mobileDigits}-digit mobile number for ${selectedCountry.name}`);
      return false;
    }

    // Pincode validation if provided
    if (formData.pincode && !selectedCountry.pincodeFormat.test(formData.pincode)) {
      toast.error(`Please enter a valid postal code for ${selectedCountry.name}`);
      return false;
    }

    if (!formData.planId) {
      toast.error('Please select a membership plan');
      return false;
    }

    return true;
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);

  // Get price based on currency
  const getPlanPrice = (plan) => {
    if (!plan) return { price: 0, symbol: '₹' };
    
    // Check if plan has multi-currency pricing
    if (plan.price_usd && selectedCountry.currency === 'USD') {
      return { price: plan.price_usd, symbol: '$' };
    }
    if (plan.price_aed && selectedCountry.currency === 'AED') {
      return { price: plan.price_aed, symbol: 'د.إ' };
    }
    // Default to INR
    return { price: plan.price, symbol: '₹' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Step 1: Initiate registration and get Razorpay order
      const response = await axios.post(`${API}/registration/initiate`, {
        name: formData.name,
        mobile: `${selectedCountry.dialCode}${formData.mobile}`,
        email: formData.email || null,
        date_of_birth: formData.dateOfBirth || null,
        password: formData.password,
        plan_id: formData.planId,
        referral_id: formData.referralId || null,
        photo_base64: photoBase64,
        country_code: selectedCountry.code,
        country_name: selectedCountry.name,
        currency: selectedCountry.currency,
        member_type: memberType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });

      const { registration_id, order_id, amount, razorpay_key, plan_name, currency } = response.data;

      // Step 2: Open Razorpay payment
      const isInternational = selectedCountry.code !== 'IN';
      
      const options = {
        key: razorpay_key,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency || 'INR',
        name: 'BITZ Club',
        description: `${plan_name} Membership`,
        order_id: order_id,
        handler: async function (razorpayResponse) {
          // Step 3: Complete registration after payment
          try {
            setPaymentStep(true);
            const completeResponse = await axios.post(`${API}/registration/complete`, null, {
              params: {
                registration_id: registration_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_signature: razorpayResponse.razorpay_signature
              }
            });

            // Login the user
            const { access_token, user } = completeResponse.data;
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            
            toast.success(`Welcome to BITZ Club! Your Member ID: ${completeResponse.data.member_id}`);
            
            // Reload auth context and navigate
            window.location.href = '/member';
          } catch (error) {
            console.error('Registration completion failed:', error);
            toast.error(error.response?.data?.detail || 'Failed to complete registration');
            setPaymentStep(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: `${selectedCountry.dialCode}${formData.mobile}`
        },
        // UPI Intent/QR flow for India, Cards for international
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
            sequence: isInternational ? ['block.other'] : ['block.upi', 'block.other'],
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
            toast.info('Payment cancelled. You can try again.');
          }
        },
        notes: {
          member_type: memberType,
          country: selectedCountry.name
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pricing = getPlanPrice(selectedPlan);

  return (
    <div className="min-h-screen bg-[#0F0F10] py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </Link>
          <h1 
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Join the <span className="text-[#D4AF37]">Elite</span>
          </h1>
          <p className="text-gray-400">Create your membership account</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Registration Form */}
          <div className="glass-gold p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Your Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Upload - MANDATORY */}
              <div>
                <label className="input-label flex items-center gap-2">
                  Profile Photo <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500">(Required for membership card)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-[#1A1A1C] cursor-pointer transition-colors ${
                      photoPreview ? 'border-green-500' : 'border-[#D4AF37]/50 hover:border-[#D4AF37]'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-[#D4AF37]/50 mx-auto" />
                        <span className="text-xs text-gray-500">Upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                    data-testid="register-photo"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Upload your photo for membership card</p>
                    <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG format</p>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="text-sm text-red-400 hover:text-red-300 mt-2 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Type Selection */}
              <div>
                <label className="input-label">Member Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {MEMBER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setMemberType(type.value)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        memberType === type.value
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <p className="text-white text-sm font-medium">{type.label}</p>
                      <p className="text-gray-500 text-xs">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Selector */}
              <div ref={countryDropdownRef} className="relative">
                <label className="input-label">Country / Region *</label>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="input-gold w-full flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                    <span className="text-gray-500">({selectedCountry.dialCode})</span>
                    <span className="text-[#D4AF37]">- {selectedCountry.currency}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCountryDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-[#1A1A1C] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                          selectedCountry.code === country.code ? 'bg-[#D4AF37]/10' : ''
                        }`}
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="text-white">{country.name}</span>
                        <span className="text-gray-500 text-sm">{country.dialCode}</span>
                        <span className="text-[#D4AF37] text-sm ml-auto">{country.symbol} {country.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="input-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="input-gold"
                  data-testid="register-name"
                />
              </div>

              {/* Mobile Number with Country Code */}
              <div>
                <label className="input-label">Mobile Number *</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A1C] border border-white/10 rounded-lg text-white min-w-[100px]">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder={`Enter ${selectedCountry.mobileDigits}-digit number`}
                    className="input-gold flex-1"
                    maxLength={selectedCountry.mobileDigits}
                    data-testid="register-mobile"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.mobile.length}/{selectedCountry.mobileDigits} digits
                </p>
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email (recommended)"
                  className="input-gold"
                  data-testid="register-email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="input-gold"
                    data-testid="register-dob"
                  />
                </div>
                <div>
                  <label className="input-label">Postal Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder={selectedCountry.pincodePlaceholder}
                    className="input-gold"
                    data-testid="register-pincode"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                  className="input-gold"
                  data-testid="register-city"
                />
              </div>

              {/* Referral Code - Auto-filled from URL */}
              <div>
                <label className="input-label">Referral Code (Optional)</label>
                <input
                  type="text"
                  name="referralId"
                  value={formData.referralId}
                  onChange={handleChange}
                  placeholder="e.g., BITZ-E001 or BITZ-A001"
                  className={`input-gold ${formData.referralId ? 'border-green-500' : ''}`}
                  data-testid="register-referral"
                />
                {formData.referralId && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Referral code applied
                  </p>
                )}
              </div>

              <div className="relative">
                <label className="input-label">Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 6 characters)"
                  className="input-gold pr-12"
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div>
                <label className="input-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="input-gold"
                  data-testid="register-confirm-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                data-testid="register-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay {pricing.symbol}{pricing.price?.toLocaleString() || '0'} & Register
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-[#D4AF37] hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Plan Selection - Dropdown */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Select Your Plan *</h2>
            
            {plans.length === 0 ? (
              <div className="card-dark p-6 text-center">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Loading plans...</p>
              </div>
            ) : (
              <>
                {/* Dropdown Select */}
                <div className="glass-gold p-4">
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData(prev => ({ ...prev, planId: e.target.value }))}
                    className="input-gold w-full text-lg cursor-pointer"
                    data-testid="plan-dropdown"
                  >
                    <option value="" className="bg-[#1A1A1C]">-- Select a Plan --</option>
                    {plans.map((plan) => {
                      const planPricing = getPlanPrice(plan);
                      return (
                        <option key={plan.id} value={plan.id} className="bg-[#1A1A1C]">
                          {plan.name} - {planPricing.symbol}{planPricing.price.toLocaleString()} ({plan.duration_months} months)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Selected Plan Details */}
                {selectedPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-gold p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{selectedPlan.name}</h3>
                        <p className="text-sm text-gray-400">{selectedPlan.duration_months} months validity</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-[#D4AF37]">
                          {pricing.symbol}{pricing.price?.toLocaleString()}
                        </span>
                        <p className="text-xs text-gray-500">{selectedCountry.currency}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-4">{selectedPlan.description}</p>
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-sm text-[#D4AF37] mb-2">Includes:</p>
                      <ul className="space-y-2">
                        {selectedPlan.features?.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* Payment Info */}
            <div className="p-4 bg-[#1A1A1C] border border-[#D4AF37]/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#D4AF37]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Secure Payment via Razorpay</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your membership will be activated immediately after successful payment. 
                    You'll receive your Member ID and digital card instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="p-4 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-lg">
              <h3 className="text-white font-semibold mb-3">Why Join BITZ Club?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-500" /> Access to premium partner facilities
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-500" /> Exclusive member discounts
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-500" /> Digital membership card with QR
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-500" /> Refer & earn rewards
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Check className="w-4 h-4 text-green-500" /> Family membership benefits
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
