import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, XCircle, Loader2, Calendar, User, CreditCard } from 'lucide-react';
import { API } from '@/context/AuthContext';

const VerifyMemberPage = () => {
  const { memberId } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyMember();
  }, [memberId]);

  const verifyMember = async () => {
    try {
      const response = await axios.get(`${API}/verify/${memberId}`);
      setMember(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Member not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Crown className="w-10 h-10 text-[#D4AF37]" />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </Link>
        </div>

        {error ? (
          <div className="card-dark p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Verification Failed
            </h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link to="/" className="btn-secondary">
              Go to Homepage
            </Link>
          </div>
        ) : (
          <div className={`p-8 ${member?.is_valid ? 'glass-gold gold-glow-strong' : 'card-dark border-red-500/50'}`}>
            <div className="text-center mb-6">
              {member?.is_valid ? (
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              )}
              <h2 
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {member?.is_valid ? 'Valid Membership' : 'Invalid Membership'}
              </h2>
              <p className={`text-sm uppercase tracking-wider ${member?.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                {member?.status}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-black/30 rounded">
                <User className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Member Name</p>
                  <p className="text-white font-semibold">{member?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-black/30 rounded">
                <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Member ID</p>
                  <p className="text-white font-mono">{member?.member_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-black/30 rounded">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Membership Type</p>
                  <p className="text-white font-semibold">{member?.plan_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-black/30 rounded">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Valid Until</p>
                  <p className="text-white">
                    {member?.membership_end ? new Date(member.membership_end).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-gray-400">
                Verified at {new Date().toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyMemberPage;
