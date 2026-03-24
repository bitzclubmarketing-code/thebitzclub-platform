import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Crown, Eye, EyeOff, Loader2, Check, Camera, X } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    referralId: '',
    planId: searchParams.get('plan') || ''
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
      // Step 1: Initiate registration and get Razorpay order
      const response = await axios.post(`${API}/registration/initiate`, {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email || null,
        date_of_birth: formData.dateOfBirth || null,
        password: formData.password,
        plan_id: formData.planId,
        referral_id: formData.referralId || null,
        photo_base64: photoBase64
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
          contact: formData.mobile
        },
        // UPI Intent/QR flow (VPA manual entry deprecated by NPCI Feb 2026)
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
            toast.info('Payment cancelled. You can try again.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Registration initiation failed:', error);
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
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

              <div>
                <label className="input-label">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  className="input-gold"
                  maxLength={10}
                  data-testid="register-mobile"
                />
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
                    Pay ₹{selectedPlan?.price?.toLocaleString() || '0'} & Register
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
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id} className="bg-[#1A1A1C]">
                        {plan.name} - ₹{plan.price.toLocaleString()} ({plan.duration_months} months)
                      </option>
                    ))}
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
                        <span className="text-3xl font-bold text-[#D4AF37]">₹{selectedPlan.price.toLocaleString()}</span>
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
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
