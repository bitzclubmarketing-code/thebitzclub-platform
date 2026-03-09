import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier, password);
      toast.success(`Welcome back, ${user.name}!`);
      
      // Redirect based on role
      if (user.role === 'super_admin') {
        navigate('/admin');
      } else if (user.role === 'telecaller') {
        navigate('/telecaller');
      } else {
        navigate('/member');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1750763533241-7c2beccb9eab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjbHViJTIwaW50ZXJpb3IlMjBkYXJrJTIwbW9vZHl8ZW58MHx8fHwxNzczMDgwNzc5fDA&ixlib=rb-4.1.0&q=85)'
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-gold p-8 md:p-10">
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
              Welcome Back
            </h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="input-label">Mobile Number or Member ID</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter mobile or member ID"
                className="input-gold"
                data-testid="login-identifier"
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-gold pr-10"
                  data-testid="login-password"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#D4AF37] hover:underline" data-testid="register-link">
                Join Now
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-black/30 border border-white/10">
            <p className="text-xs text-gray-400 text-center mb-2">Demo Admin Credentials</p>
            <p className="text-xs text-gray-300 text-center font-mono">
              Mobile: 9999999999 | Password: admin123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
