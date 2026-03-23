import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Lock, Eye, EyeOff, Loader2, Shield, Key, Check } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API}/admin/change-password`, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account settings and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Change Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-xl border border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Change Password</h2>
              <p className="text-sm text-gray-400">Update your password regularly for security</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  data-testid="current-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  minLength={6}
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  minLength={6}
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="change-password-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 rounded-xl border border-gray-700 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Security Tips</h2>
              <p className="text-sm text-gray-400">Keep your account secure</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Use a strong password</p>
                <p className="text-gray-400 text-xs">At least 8 characters with numbers and symbols</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Don't share your password</p>
                <p className="text-gray-400 text-xs">Never share your login credentials with anyone</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Change password regularly</p>
                <p className="text-gray-400 text-xs">Update your password every 3 months</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
              <Check className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Log out from shared devices</p>
                <p className="text-gray-400 text-xs">Always log out when using public computers</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-400 text-sm">
              <strong>Logged in as:</strong> {user?.name || 'Admin'}
            </p>
            <p className="text-amber-400/70 text-xs mt-1">
              Role: {user?.role || 'admin'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
