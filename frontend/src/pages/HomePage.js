import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Crown, 
  CreditCard, 
  Users, 
  ShieldCheck,
  ChevronRight,
  Star,
  Check,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Hotel,
  UtensilsCrossed,
  Sparkles,
  Dumbbell,
  Waves,
  Music,
  PartyPopper,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { API } from '@/context/AuthContext';

// Icon mapping for dynamic content
const iconMap = {
  Hotel, UtensilsCrossed, Sparkles, Dumbbell, Waves, Music, PartyPopper, Building2
};

const HomePage = () => {
  const [plans, setPlans] = useState([]);
  const [partners, setPartners] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [settings, setSettings] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  useEffect(() => {
    fetchPlans();
    fetchPartners();
    fetchExperiences();
    fetchSettings();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans?is_active=true`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await axios.get(`${API}/partners?is_active=true`);
      setPartners(response.data);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const fetchExperiences = async () => {
    try {
      const response = await axios.get(`${API}/content/experiences`);
      const activeExperiences = response.data.filter(exp => exp.is_active);
      setExperiences(activeExperiences);
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
      // Fallback to default experiences
      setExperiences([
        { id: '1', title: 'Luxury Hotels', image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', discount: 'Up to 40% Off', description: 'Exclusive rates at 5-star properties', icon: 'Hotel' },
        { id: '2', title: 'Fine Dining', image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', discount: 'Up to 25% Off', description: 'Premium restaurants worldwide', icon: 'UtensilsCrossed' },
        { id: '3', title: 'Spa & Wellness', image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80', discount: 'Up to 35% Off', description: 'Rejuvenate at luxury spas', icon: 'Sparkles' },
        { id: '4', title: 'Premium Gyms', image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', discount: 'Up to 30% Off', description: 'Access elite fitness centers', icon: 'Dumbbell' }
      ]);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/content/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const features = [
    { icon: Crown, title: 'Premium Benefits', description: 'Exclusive access to luxury partners and facilities' },
    { icon: CreditCard, title: 'Digital Membership', description: 'QR-enabled membership card accessible anywhere' },
    { icon: Users, title: 'Partner Network', description: 'Discounts at our curated partner locations' },
    { icon: ShieldCheck, title: 'Verified Access', description: 'Instant verification at all partner venues' }
  ];

  // Auto-rotate gallery
  useEffect(() => {
    if (experiences.length === 0) return;
    const interval = setInterval(() => {
      setActiveGalleryIndex((prev) => (prev + 1) % experiences.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [experiences.length]);

  // Helper to get icon component
  const getIcon = (iconName) => iconMap[iconName] || Hotel;

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4AF37]" />
            <span className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#experiences" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Experiences</a>
            <a href="#plans" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Plans</a>
            <a href="#partners" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Partners</a>
            <a href="#contact" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Contact</a>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              to="/login" 
              className="text-[#D4AF37] hover:text-[#E6D699] transition-colors text-sm sm:text-base"
              data-testid="login-link"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="btn-primary text-xs sm:text-sm px-3 sm:px-6 py-2"
              data-testid="register-link"
            >
              Join Now
            </Link>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#1A1A1C] border-t border-white/10 px-4 py-4"
          >
            <div className="flex flex-col gap-4">
              <a href="#experiences" className="text-gray-300 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Experiences</a>
              <a href="#plans" className="text-gray-300 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Plans</a>
              <a href="#partners" className="text-gray-300 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Partners</a>
              <a href="#contact" className="text-gray-300 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section with Luxury Banner */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background Image Carousel */}
        <div className="absolute inset-0 overflow-hidden">
          {experiences.map((exp, index) => (
            <div
              key={exp.id || exp.title}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === activeGalleryIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${exp.image_url})`,
                  filter: 'brightness(0.25)'
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F10] via-transparent to-[#0F0F10]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F10] via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-3 sm:px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs sm:text-sm uppercase tracking-widest mb-4 sm:mb-6 rounded-full">
                Premium Lifestyle Membership
              </span>
              <h1 
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {settings.hero_title ? settings.hero_title.split(' ').slice(0, 2).join(' ') : 'Elevate Your'} <br />
                <span className="text-[#D4AF37]">{settings.hero_title ? settings.hero_title.split(' ').slice(2).join(' ') || 'Lifestyle' : 'Lifestyle'}</span>
              </h1>
              <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                {settings.hero_subtitle || 'Join BITZ Club and unlock exclusive access to luxury hotels, fine dining, spas, premium gyms and a world of privileges.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link 
                  to="/register" 
                  className="btn-primary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4"
                  data-testid="hero-join-btn"
                >
                  Become a Member
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a 
                  href="#plans" 
                  className="btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4"
                >
                  View Plans
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
            
            {/* Right - Featured Experience Card (Hidden on mobile, shown on desktop) */}
            {experiences.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hidden lg:block"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#D4AF37]/20 to-transparent blur-3xl" />
                  <div className="relative glass-gold rounded-2xl overflow-hidden">
                    <div className="aspect-[4/3] relative">
                      <img 
                        src={experiences[activeGalleryIndex]?.image_url}
                        alt={experiences[activeGalleryIndex]?.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center gap-3 mb-2">
                          {React.createElement(getIcon(experiences[activeGalleryIndex]?.icon), { className: "w-6 h-6 text-[#D4AF37]" })}
                          <span className="text-[#D4AF37] text-sm font-semibold uppercase tracking-wider">
                            {experiences[activeGalleryIndex]?.discount}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {experiences[activeGalleryIndex]?.title}
                        </h3>
                        <p className="text-gray-300 text-sm">{experiences[activeGalleryIndex]?.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gallery dots */}
                  <div className="flex justify-center gap-2 mt-4">
                    {experiences.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveGalleryIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === activeGalleryIndex ? 'bg-[#D4AF37] w-6' : 'bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
        >
          <ChevronRight className="w-8 h-8 text-[#D4AF37] rotate-90" />
        </motion.div>
      </section>

      {/* Lifestyle Experiences Gallery */}
      <section id="experiences" className="py-16 sm:py-24 bg-[#0F0F10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <span className="text-[#D4AF37] text-xs sm:text-sm uppercase tracking-widest mb-3 block">Exclusive Access</span>
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Lifestyle <span className="text-[#D4AF37]">Experiences</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base px-4">
              Unlock exclusive access to premium venues and experiences curated for the discerning few
            </p>
          </motion.div>

          {/* Image Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {experiences.map((experience, index) => {
              const IconComponent = getIcon(experience.icon);
              return (
                <motion.div
                  key={experience.id || experience.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer"
                >
                  <img 
                    src={experience.image_url}
                    alt={experience.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
                      <span className="text-[#D4AF37] text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                        {experience.discount}
                      </span>
                    </div>
                    <h3 
                      className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-0.5 sm:mb-1"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {experience.title}
                    </h3>
                    <p className="text-gray-300 text-[10px] sm:text-xs lg:text-sm line-clamp-2">{experience.description}</p>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#D4AF37]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#0F0F10] to-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 
              className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Why Choose <span className="text-[#D4AF37]">BITZ Club</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
              Experience the finest privileges with our curated membership benefits
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-dark card-interactive p-6 sm:p-8 rounded-xl sm:rounded-2xl text-center sm:text-left"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#D4AF37]/10 mb-4">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-16 sm:py-24 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <span className="text-[#D4AF37] text-xs sm:text-sm uppercase tracking-widest mb-3 block">Choose Your Tier</span>
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Membership <span className="text-[#D4AF37]">Plans</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 sm:p-8 rounded-xl sm:rounded-2xl ${
                  index === 1 ? 'bg-gradient-to-b from-[#D4AF37]/20 to-transparent border-2 border-[#D4AF37]' : 'card-dark border border-white/10'
                }`}
              >
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#D4AF37] text-black text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-bold text-[#D4AF37]">₹{plan.price?.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">/{plan.duration_months} months</span>
                </div>
                <ul className="space-y-3 mb-6 sm:mb-8">
                  {plan.features?.slice(0, 5).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/register"
                  className={`block w-full py-3 text-center font-semibold rounded-lg transition-all ${
                    index === 1 
                      ? 'bg-[#D4AF37] text-black hover:bg-[#E6D699]' 
                      : 'border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10'
                  }`}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-16 sm:py-24 bg-[#0F0F10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <span className="text-[#D4AF37] text-xs sm:text-sm uppercase tracking-widest mb-3 block">Our Network</span>
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Partner <span className="text-[#D4AF37]">Venues</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-dark card-interactive rounded-xl sm:rounded-2xl overflow-hidden"
              >
                {partner.logo_url && (
                  <div 
                    className="h-40 sm:h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${partner.logo_url})` }}
                  />
                )}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{partner.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{partner.description}</p>
                  {partner.facilities?.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-white/10">
                      {partner.facilities.slice(0, 3).map((facility, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{facility.facility_name}</span>
                          <span className="text-[#D4AF37] font-semibold">{facility.discount_percentage}% OFF</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920)',
            filter: 'brightness(0.2)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F10] via-transparent to-[#0F0F10]" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Crown className="w-12 h-12 sm:w-16 sm:h-16 text-[#D4AF37] mx-auto mb-4 sm:mb-6" />
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Ready to Experience <span className="text-[#D4AF37]">Luxury?</span>
            </h2>
            <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of members already enjoying exclusive benefits at premium venues across the country.
            </p>
            <Link 
              to="/register" 
              className="btn-primary inline-flex items-center justify-center gap-2 text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-24 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 
                className="text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-6"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Get in <span className="text-[#D4AF37]">Touch</span>
              </h2>
              <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
                Have questions about our membership? Our team is here to help you discover the perfect plan for your lifestyle.
              </p>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Call Us</p>
                    <p className="text-white text-sm sm:text-base">{settings.contact_phone || '+91 78129 01118'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Email Us</p>
                    <p className="text-white text-sm sm:text-base">{settings.contact_email || 'hello@bitzclub.com'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm">Visit Us</p>
                    <p className="text-white text-sm sm:text-base">{settings.contact_address || 'Chennai, Tamil Nadu, India'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-xl sm:rounded-2xl overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"
                alt="Luxury Hotel"
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6 sm:p-8">
                <div>
                  <p className="text-[#D4AF37] text-xs sm:text-sm uppercase tracking-wider mb-2">Premium Experience</p>
                  <p className="text-white text-lg sm:text-xl font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Join the elite community today
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-[#0F0F10] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                BITZ Club
              </span>
            </div>
            <p className="text-gray-500 text-sm text-center sm:text-left">
              © 2026 BITZ Club. All rights reserved.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link to="/login" className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">Login</Link>
              <Link to="/register" className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">Register</Link>
              <Link to="/landing" className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">Enquire</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
