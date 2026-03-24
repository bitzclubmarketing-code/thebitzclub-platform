import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Crown, Eye, EyeOff, Loader2, Check, Camera, X, Globe } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';

// Country codes with currency
const COUNTRIES = [
  { code: 'IN', name: 'India', dialCode: '+91', currency: 'INR', symbol: '₹' },
  { code: 'AE', name: 'UAE', dialCode: '+971', currency: 'AED', symbol: 'AED ' },
  { code: 'US', name: 'USA', dialCode: '+1', currency: 'USD', symbol: '$' },
  { code: 'GB', name: 'UK', dialCode: '+44', currency: 'GBP', symbol: '£' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', currency: 'SGD', symbol: 'S$' },
  { code: 'AU', name: 'Australia', dialCode: '+61', currency: 'AUD', symbol: 'A$' },
  { code: 'CA', name: 'Canada', dialCode: '+1', currency: 'CAD', symbol: 'C$' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', currency: 'SAR', symbol: 'SAR ' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', currency: 'QAR', symbol: 'QAR ' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', currency: 'KWD', symbol: 'KWD ' },
  { code: 'OM', name: 'Oman', dialCode: '+968', currency: 'OMR', symbol: 'OMR ' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', currency: 'BHD', symbol: 'BHD ' },
];

// Currency conversion rates (approximate - should be fetched from API in production)
const CURRENCY_RATES = {
  INR: 1,
  USD: 0.012,
  AED: 0.044,
  GBP: 0.0095,
  SGD: 0.016,
  AUD: 0.018,
  CAD: 0.016,
  SAR: 0.045,
  QAR: 0.044,
  KWD: 0.0037,
  OMR: 0.0046,
  BHD: 0.0045,
};

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default India
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    referralId: searchParams.get('ref') || searchParams.get('referral') || '',
    planId: searchParams.get('plan') || '',
    couponCode: searchParams.get('coupon') || '',
    country: 'IN'
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [couponApplied, setCouponApplied] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Convert price to selected currency
  const convertPrice = (priceInINR) => {
    const rate = CURRENCY_RATES[selectedCountry.currency] || 1;
    const converted = Math.round(priceInINR * rate);
    return `${selectedCountry.symbol}${converted.toLocaleString()}`;
  };

  useEffect(() => {
    fetchPlans();
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
    if (!formData.name || !formData.mobile || !formData.password) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.mobile.length < 10) {
      toast.error('Please enter a valid mobile number');
      return false;
    }

    if (!formData.planId) {
      toast.error('Please select a membership plan');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Format mobile with country code
      const fullMobile = `${selectedCountry.dialCode}${formData.mobile.replace(/^0+/, '')}`;
      
      // Step 1: Initiate registration and get Razorpay order
      const response = await axios.post(`${API}/registration/initiate`, {
        name: formData.name,
        mobile: fullMobile,
        email: formData.email || null,
        date_of_birth: formData.dateOfBirth || null,
        password: formData.password,
        plan_id: formData.planId,
        referral_id: formData.referralId || null,
        photo_base64: photoBase64,
        country: selectedCountry.code,
        currency: selectedCountry.currency
      });

      const { registration_id, order_id, amount, razorpay_key, plan_name } = response.data;

      // Step 2: Open Razorpay payment
      const options = {
        key: razorpay_key,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
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
            
            // Show success popup with app download option
            toast.success(
              <div className="text-center">
                <p className="font-bold text-lg mb-2">🎉 Welcome to BITZ Club!</p>
                <p className="mb-2">Member ID: <span className="font-mono">{completeResponse.data.member_id}</span></p>
                <p className="text-sm text-gray-300 mb-3">Install our app for the best experience</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      // Trigger PWA install or show instructions
                      if (window.deferredPrompt) {
                        window.deferredPrompt.prompt();
                      } else {
                        window.open('/member', '_self');
                      }
                    }}
                    className="px-4 py-2 bg-[#D4AF37] text-black rounded font-semibold"
                  >
                    📱 Download App
                  </button>
                  <button 
                    onClick={() => window.location.href = '/member?tab=family'}
                    className="px-4 py-2 bg-white/10 text-white rounded"
                  >
                    👨‍👩‍👧 Add Family Members
                  </button>
                </div>
              </div>,
              { duration: 15000 }
            );
            
            // Navigate to member dashboard after delay
            setTimeout(() => {
              window.location.href = '/member';
            }, 3000);
          } catch (error) {
            console.error('Registration completion failed:', error);
            toast.error(error.response?.data?.detail || 'Failed to complete registration');
            setPaymentStep(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.mobile
        },
        theme: {
          color: '#D4AF37'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.info('Payment cancelled. You can try again.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Registration initiation failed:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error?.description || 'Registration failed. Please try again.';
      
      // Handle Razorpay rate limiting
      if (errorMessage.toLowerCase().includes('too many requests') || 
          error.response?.data?.error?.code === 'BAD_REQUEST_ERROR') {
        toast.error(
          <div>
            <p className="font-bold">⚠️ Too Many Attempts</p>
            <p className="text-sm mt-1">Please wait 2-3 minutes before trying again.</p>
            <p className="text-xs text-gray-400 mt-2">This is a payment gateway security measure.</p>
          </div>,
          { duration: 10000 }
        );
      }
      // Check if user is already registered
      else if (errorMessage.toLowerCase().includes('already registered') || 
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('mobile number already')) {
        toast.error(
          <div>
            <p>{errorMessage}</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="mt-2 px-4 py-1 bg-[#D4AF37] text-black rounded text-sm font-semibold"
            >
              Go to Login
            </button>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      if (!paymentStep) {
        setLoading(false);
      }
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);

  if (paymentStep) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Creating Your Membership...</h2>
          <p className="text-gray-400">Please wait while we activate your account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F10] py-20 px-4">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1756981168649-0e3c3c8a32f3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBjbHViJTIwaW50ZXJpb3IlMjBkYXJrJTIwbW9vZHl8ZW58MHx8fHwxNzczMDgwNzc5fDA&ixlib=rb-4.1.0&q=85)'
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Crown className="w-10 h-10 text-[#D4AF37]" />
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
              {/* Photo Upload */}
              <div>
                <label className="input-label">Profile Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-[#D4AF37]/50 flex items-center justify-center overflow-hidden bg-[#1A1A1C] cursor-pointer hover:border-[#D4AF37] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-[#D4AF37]/50" />
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
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="text-sm text-red-400 hover:text-red-300 mt-1 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
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

              {/* Country Selection */}
              <div>
                <label className="input-label flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#D4AF37]" />
                  Country / Region *
                </label>
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const country = COUNTRIES.find(c => c.code === e.target.value);
                    setSelectedCountry(country);
                    setFormData({ ...formData, country: e.target.value });
                  }}
                  className="input-gold"
                  data-testid="register-country"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.dialCode}) - {country.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Mobile Number *</label>
                <div className="flex gap-2">
                  <div className="w-24 flex-shrink-0">
                    <div className="input-gold bg-[#D4AF37]/10 text-center font-semibold text-[#D4AF37]">
                      {selectedCountry.dialCode}
                    </div>
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    className="input-gold flex-1"
                    maxLength={15}
                    data-testid="register-mobile"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedCountry.code === 'IN' ? 'Enter 10-digit number without country code' : 'Enter number without country code'}
                </p>
              </div>

              <div>
                <label className="input-label">Email (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="input-gold"
                  data-testid="register-email"
                />
              </div>

              <div>
                <label className="input-label">Date of Birth (Optional)</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="input-gold"
                  max={new Date().toISOString().split('T')[0]}
                  data-testid="register-dob"
                />
                <p className="text-xs text-gray-500 mt-1">We'll send you special birthday offers!</p>
              </div>

              <div>
                <label className="input-label">Referral ID (Optional)</label>
                <input
                  type="text"
                  name="referralId"
                  value={formData.referralId}
                  onChange={handleChange}
                  placeholder="e.g., BITZ-E001 or BITZ-A001"
                  className="input-gold"
                  data-testid="register-referral-id"
                />
                <p className="text-xs text-gray-500 mt-1">Employee ID (BITZ-E***) or Associate ID (BITZ-A***)</p>
              </div>

              <div>
                <label className="input-label">Coupon Code (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={(e) => {
                      handleChange(e);
                      setCouponApplied(null);
                    }}
                    placeholder="Enter coupon code"
                    className="input-gold flex-1"
                    data-testid="register-coupon-code"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.couponCode) return;
                      setValidatingCoupon(true);
                      try {
                        const selectedPlan = plans.find(p => p.id === formData.planId || p.plan_id === formData.planId);
                        const amount = selectedPlan?.price || 0;
                        const response = await axios.post(`${API}/coupons/validate?code=${formData.couponCode}&amount=${amount}`);
                        setCouponApplied(response.data);
                        toast.success(`Coupon applied! You save ₹${response.data.discount_amount}`);
                      } catch (error) {
                        setCouponApplied(null);
                        toast.error(error.response?.data?.detail || 'Invalid coupon code');
                      } finally {
                        setValidatingCoupon(false);
                      }
                    }}
                    disabled={validatingCoupon || !formData.couponCode}
                    className="px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/30 disabled:opacity-50"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-green-400 mt-1">
                    ✓ Coupon applied! Discount: ₹{couponApplied.discount_amount}
                  </p>
                )}
              </div>

              <div>
                <label className="input-label">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="input-gold pr-10"
                    data-testid="register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
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
                    Pay {convertPrice(selectedPlan?.price || 0)} & Register
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

          {/* Plan Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Select Your Plan *</h2>
            
            {plans.length === 0 ? (
              <div className="card-dark p-6 text-center">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Loading plans...</p>
              </div>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setFormData(prev => ({ ...prev, planId: plan.id }))}
                  className={`p-6 cursor-pointer transition-all rounded-lg ${
                    formData.planId === plan.id
                      ? 'glass-gold gold-glow'
                      : 'card-dark card-interactive'
                  }`}
                  data-testid={`select-plan-${plan.name.toLowerCase()}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.duration_months} months</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#D4AF37]">{convertPrice(plan.price)}</span>
                      {selectedCountry.code !== 'IN' && (
                        <p className="text-xs text-gray-500">₹{plan.price.toLocaleString()} INR</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{plan.description}</p>
                  <ul className="space-y-1">
                    {plan.features?.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="w-3 h-3 text-[#D4AF37]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {formData.planId === plan.id && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                        <Check className="w-4 h-4" /> Selected Plan
                      </p>
                    </div>
                  )}
                </div>
              ))
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
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
