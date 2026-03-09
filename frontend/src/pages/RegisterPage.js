import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Crown, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralId: '',
    planId: searchParams.get('plan') || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.mobile || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.mobile.length < 10) {
      toast.error('Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email || null,
        password: formData.password,
        role: 'member'
      });
      
      toast.success('Registration successful! Welcome to BITZ Club!');
      navigate('/member');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);

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
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
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
            <h2 className="text-xl font-semibold text-white mb-4">Select Your Plan</h2>
            
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setFormData(prev => ({ ...prev, planId: plan.id }))}
                className={`p-6 cursor-pointer transition-all ${
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
                    <span className="text-2xl font-bold text-[#D4AF37]">₹{plan.price.toLocaleString()}</span>
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
                    <p className="text-xs text-[#D4AF37] uppercase tracking-wider">Selected Plan</p>
                  </div>
                )}
              </div>
            ))}

            {/* Payment Notice */}
            <div className="p-4 bg-[#1A1A1C] border border-white/10">
              <p className="text-sm text-gray-400">
                Payment will be processed after registration. You can complete payment from your member dashboard.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
