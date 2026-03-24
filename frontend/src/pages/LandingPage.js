import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Crown, Star, Play, ArrowRight, MessageCircle, Phone,
  Hotel, UtensilsCrossed, Sparkles, Dumbbell, PartyPopper,
  Waves, Baby, Music, Building2, Users, ChevronRight, 
  CheckCircle, Loader2, MapPin, Download, Smartphone
} from 'lucide-react';
import { API } from '@/context/AuthContext';
import { toast } from 'sonner';

const LandingPage = () => {
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    city: '',
    interested_in: 'membership'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    fetchPlans();
    
    // PWA Install prompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      toast.info('To install: Open browser menu and select "Add to Home Screen" or "Install App"');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('App installed successfully!');
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans?is_active=true`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile || !formData.city) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        ...formData,
        source: 'social_media_landing'
      });
      setSubmitted(true);
      toast.success('Thank you! We will contact you soon.');
      setFormData({ name: '', mobile: '', city: '', interested_in: 'membership' });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const lifestyleExperiences = [
    { icon: Hotel, title: 'Luxury Hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600', desc: 'Exclusive rates at 5-star properties' },
    { icon: UtensilsCrossed, title: 'Fine Dining', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', desc: 'Premium restaurants worldwide' },
    { icon: Sparkles, title: 'Spa & Wellness', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600', desc: 'Rejuvenate at luxury spas' },
    { icon: Dumbbell, title: 'Premium Gyms', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', desc: 'Access elite fitness centers' },
    { icon: Star, title: 'Exclusive Experiences', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600', desc: 'Curated luxury experiences' },
    { icon: Waves, title: 'Swimming Pool', image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600', desc: 'Premium pool facilities' },
    { icon: Baby, title: 'Kids Pool', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600', desc: 'Safe fun for little ones' },
    { icon: Music, title: 'Party Hall', image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600', desc: 'Celebrate in style' },
    { icon: PartyPopper, title: 'Marriage Venue', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600', desc: 'Dream wedding destinations' },
    { icon: Building2, title: 'Corporate Day Out', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600', desc: 'Team building at its finest' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <a 
              href="https://wa.me/7812901118"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-full text-sm transition-colors"
              data-testid="whatsapp-btn"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp Us</span>
            </a>
            <Link to="/register" className="btn-primary text-sm px-4 py-2" data-testid="join-btn">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920)',
            filter: 'brightness(0.25)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0F10]/50 to-[#0F0F10]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm uppercase tracking-widest mb-6 rounded-full">
              Premium Lifestyle Membership
            </span>
            <h1 
              className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              BITZ Club
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#D4AF37] mb-4 font-light">
              Premium Lifestyle Membership
            </p>
            <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed px-4">
              Unlock exclusive privileges at luxury hotels, fine dining restaurants, 
              spas, premium gyms and curated lifestyle experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="#enquiry" 
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
                data-testid="hero-enquiry-btn"
              >
                Enquire Now
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link 
                to="/register" 
                className="btn-secondary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                Join Membership
                <Crown className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-[#D4AF37] rotate-90" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '500+', label: 'Partner Venues' },
              { value: '10,000+', label: 'Happy Members' },
              { value: '50+', label: 'Cities' },
              { value: '40%', label: 'Avg. Savings' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="text-3xl sm:text-4xl font-bold text-[#D4AF37] mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lifestyle Experiences Section */}
      <section className="py-20 bg-[#0F0F10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              The BITZ <span className="text-[#D4AF37]">Lifestyle</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience the finest that life has to offer with our curated lifestyle benefits
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {lifestyleExperiences.map((exp, index) => (
              <motion.div
                key={exp.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-lg aspect-[4/5] cursor-pointer"
                data-testid={`lifestyle-${exp.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${exp.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <exp.icon className="w-8 h-8 text-[#D4AF37] mb-2" />
                  <h3 className="text-white font-semibold text-lg">{exp.title}</h3>
                  <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {exp.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-[#1A1A1C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
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
              Experience <span className="text-[#D4AF37]">Luxury</span>
            </h2>
            <p className="text-gray-400">Watch our lifestyle showcase</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-lg overflow-hidden glass-gold gold-glow-strong"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: 'url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200)',
                filter: 'brightness(0.7)'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                className="w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center hover:bg-[#E6D699] transition-colors gold-glow-strong"
                data-testid="play-video-btn"
              >
                <Play className="w-8 h-8 text-black ml-1" />
              </button>
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <p className="text-white text-lg font-semibold">Discover the BITZ Club Experience</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Membership Plans Section */}
      <section id="plans" className="py-20 bg-[#0F0F10]">
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
              Membership <span className="text-[#D4AF37]">Plans</span>
            </h2>
            <p className="text-gray-400">Choose the perfect plan for your lifestyle</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 sm:p-8 ${index === 1 ? 'glass-gold gold-glow-strong' : 'card-dark'}`}
              >
                {index === 1 && (
                  <div className="text-center mb-4">
                    <span className="px-3 py-1 bg-[#D4AF37] text-black text-xs uppercase tracking-wider font-semibold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#D4AF37]">₹{plan.price.toLocaleString()}</span>
                  <span className="text-gray-400">/{plan.duration_months} months</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features?.slice(0, 4).map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-gray-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/register?plan=${plan.id}`}
                  className={`block text-center w-full ${index === 1 ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Select Plan
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture Form Section */}
      <section id="enquiry" className="py-20 bg-gradient-to-b from-[#1A1A1C] to-[#0F0F10]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-gold p-6 sm:p-10 gold-glow-strong"
          >
            <div className="text-center mb-8">
              <h2 
                className="text-3xl sm:text-4xl font-bold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Get in <span className="text-[#D4AF37]">Touch</span>
              </h2>
              <p className="text-gray-400">
                Fill the form and our team will reach out to you within 24 hours
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-gray-400 mb-6">Our team will contact you shortly.</p>
                <button 
                  onClick={() => setSubmitted(false)} 
                  className="btn-secondary"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="input-label">Your Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      className="input-gold bg-black/30"
                      data-testid="lead-name"
                    />
                  </div>
                  <div>
                    <label className="input-label">Mobile Number *</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="Enter mobile number"
                      className="input-gold bg-black/30"
                      maxLength={10}
                      data-testid="lead-mobile"
                    />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="input-label">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Your city"
                      className="input-gold bg-black/30"
                      data-testid="lead-city"
                    />
                  </div>
                  <div>
                    <label className="input-label">Interested In *</label>
                    <select
                      value={formData.interested_in}
                      onChange={(e) => setFormData({ ...formData, interested_in: e.target.value })}
                      className="input-gold bg-black/30 cursor-pointer"
                      data-testid="lead-interest"
                    >
                      <option value="membership">Membership</option>
                      <option value="partnership">Partner With BITZ Club</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                  data-testid="submit-lead-btn"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Enquiry
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-16 bg-gradient-to-b from-[#0F0F10] to-[#1A1A1C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-gold p-6 sm:p-10 gold-glow-strong"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <div className="w-16 h-16 bg-[#D4AF37] rounded-2xl flex items-center justify-center">
                    <Crown className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                      BITZ Club App
                    </h3>
                    <p className="text-gray-400 text-sm">Download Now</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6">
                  Get instant access to your membership benefits, digital card, exclusive offers, and more right from your phone.
                </p>
                <ul className="grid sm:grid-cols-2 gap-2 mb-6">
                  {[
                    'Digital Membership Card',
                    'Exclusive Member Offers',
                    'Partner Discounts',
                    'Event Notifications',
                    'Easy Referrals',
                    'Quick Support'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleInstallApp}
                  className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                  data-testid="install-app-btn"
                >
                  <Download className="w-5 h-5" />
                  Install App
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  Works on Android & iOS • No app store needed
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  <div className="w-48 h-96 bg-black rounded-[3rem] border-4 border-gray-800 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10" />
                    <div className="h-full bg-gradient-to-b from-[#1A1A1C] to-[#0F0F10] p-4 pt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Crown className="w-6 h-6 text-[#D4AF37]" />
                        <span className="text-white font-bold text-sm">BITZ Club</span>
                      </div>
                      <div className="bg-[#D4AF37]/20 rounded-lg p-3 mb-3">
                        <p className="text-[#D4AF37] text-xs font-semibold mb-1">Member ID</p>
                        <p className="text-white text-sm">BITZ-2607600015</p>
                      </div>
                      <div className="space-y-2">
                        {['My Card', 'Offers', 'Partners', 'Support'].map((item, i) => (
                          <div key={i} className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#D4AF37]/20 rounded flex items-center justify-center">
                              <Smartphone className="w-3 h-3 text-[#D4AF37]" />
                            </div>
                            <span className="text-white text-xs">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Buttons Section */}
      <section className="py-16 bg-[#0F0F10]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to="/register" 
              className="btn-primary text-center py-4 flex items-center justify-center gap-2"
              data-testid="cta-join"
            >
              <Crown className="w-5 h-5" />
              Join Membership
            </Link>
            <a 
              href="#plans" 
              className="btn-secondary text-center py-4 flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5" />
              View Plans
            </a>
            <a 
              href="#enquiry" 
              className="btn-secondary text-center py-4 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Partner With Us
            </a>
            <a 
              href="https://wa.me/7812901118"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white text-center py-4 rounded flex items-center justify-center gap-2 transition-colors font-semibold uppercase tracking-wider text-sm"
              data-testid="cta-whatsapp"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#1A1A1C] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-8 h-8 text-[#D4AF37]" />
                <span className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                  BITZ Club
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Premium Lifestyle Membership for the discerning few.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/" className="block text-gray-400 hover:text-[#D4AF37] transition-colors">Home</Link>
                <Link to="/register" className="block text-gray-400 hover:text-[#D4AF37] transition-colors">Join Membership</Link>
                <a href="#plans" className="block text-gray-400 hover:text-[#D4AF37] transition-colors">Plans</a>
                <a href="#enquiry" className="block text-gray-400 hover:text-[#D4AF37] transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <div className="space-y-2">
                <a href="tel:7812901118" className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors">
                  <Phone className="w-4 h-4" />
                  +91 78129 01118
                </a>
                <a 
                  href="https://wa.me/7812901118" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-green-500 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Us
                </a>
                <p className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  India
                </p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} BITZ Club. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
