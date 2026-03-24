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
  X,
  Download,
  Smartphone,
  Gift
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
  const [offers, setOffers] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [settings, setSettings] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchPartners();
    fetchExperiences();
    fetchOffers();
    fetchGallery();
    fetchSettings();
    
    // PWA Install prompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Show offer popup after 3 seconds if not shown before in this session
    const popupShown = sessionStorage.getItem('offerPopupShown');
    if (!popupShown) {
      const timer = setTimeout(() => {
        setShowOfferPopup(true);
        sessionStorage.setItem('offerPopupShown', 'true');
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Show instructions for manual installation
      alert('To install the app:\n\n• On Android: Tap the menu (⋮) and select "Add to Home Screen"\n• On iOS: Tap Share and select "Add to Home Screen"\n• On Desktop: Click the install icon in the address bar');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('App installed');
    }
    setDeferredPrompt(null);
  };

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

  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${API}/offers?is_active=true`);
      setOffers(response.data);
      // Set the first offer for popup
      if (response.data.length > 0) {
        setCurrentOffer(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    }
  };

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API}/content/gallery`);
      setGallery(response.data.filter(img => img.is_active));
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
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
            <a href="#about" className="text-gray-300 hover:text-[#D4AF37] transition-colors">About Us</a>
            <a href="#offers" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Offers</a>
            <a href="#affiliations" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Affiliations</a>
            <a href="#gallery" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Gallery</a>
            <a href="#contact" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Contact</a>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              to="/login" 
              className="text-[#D4AF37] hover:text-[#E6D699] transition-colors text-sm sm:text-base"
              data-testid="login-link"
            >
              Member Login
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
              <a href="#about" className="text-gray-300 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>About Us</a>
              <a href="#offers" className="text-gray-300 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Offers</a>
              <a href="#affiliations" className="text-gray-300 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Affiliations</a>
              <a href="#gallery" className="text-gray-300 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
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

      {/* Offers Section */}
      <section id="offers" className="py-16 sm:py-24 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <span className="text-[#D4AF37] text-xs sm:text-sm uppercase tracking-widest mb-3 block">Special Deals</span>
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Exclusive <span className="text-[#D4AF37]">Offers</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Take advantage of special deals and discounts at our partner venues
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-dark card-interactive rounded-xl sm:rounded-2xl overflow-hidden"
              >
                {offer.image_url && (
                  <div 
                    className="h-40 sm:h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${offer.image_url})` }}
                  >
                    {offer.discount_text && (
                      <div className="absolute top-3 right-3 bg-[#D4AF37] text-black px-3 py-1 rounded-full text-sm font-bold">
                        {offer.discount_text}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{offer.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{offer.description}</p>
                  {offer.category && (
                    <span className="inline-block bg-white/10 text-[#D4AF37] px-3 py-1 rounded text-xs">
                      {offer.category}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliations Section (Partners) */}
      <section id="affiliations" className="py-16 sm:py-24 bg-[#0F0F10]">
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
              Our <span className="text-[#D4AF37]">Affiliations</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Premium partner venues where you can enjoy exclusive member benefits
            </p>
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
                {(partner.image_url || partner.logo_url) && (
                  <div 
                    className="h-40 sm:h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${partner.image_url || partner.logo_url})` }}
                  />
                )}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">{partner.name}</h3>
                    {partner.category && (
                      <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded">{partner.category}</span>
                    )}
                  </div>
                  
                  {partner.offers && (
                    <p className="text-[#D4AF37] text-sm font-semibold mb-2">{partner.offers}</p>
                  )}
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{partner.description}</p>
                  
                  {/* Affiliate Details */}
                  <div className="space-y-2 pt-4 border-t border-white/10 text-sm">
                    {partner.contact_person_1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Contact:</span>
                        <span className="text-gray-300">{partner.contact_person_1}</span>
                      </div>
                    )}
                    {partner.contact_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="text-gray-300">{partner.contact_phone}</span>
                      </div>
                    )}
                    {partner.city && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-300">{partner.city}</span>
                      </div>
                    )}
                    {partner.facilities?.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        {partner.facilities.slice(0, 2).map((facility, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-gray-400">{facility.facility_name}</span>
                            <span className="text-[#D4AF37] font-semibold">{facility.discount_percentage}% OFF</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 sm:py-24 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <span className="text-[#D4AF37] text-xs sm:text-sm uppercase tracking-widest mb-3 block">Glimpses</span>
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Photo <span className="text-[#D4AF37]">Gallery</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {gallery.length > 0 ? gallery.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square rounded-lg overflow-hidden"
              >
                <img 
                  src={img.image_url} 
                  alt={img.title}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </motion.div>
            )) : (
              // Default gallery images
              [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
                'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
                'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
                'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
                'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80'
              ].map((url, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="aspect-square rounded-lg overflow-hidden"
                >
                  <img 
                    src={url} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </motion.div>
              ))
            )}
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

      {/* App Download Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#0F0F10] to-[#1A1A1C]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-dark border border-[#D4AF37]/30 p-6 sm:p-10"
          >
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Phone Mockup */}
              <div className="order-2 lg:order-1 flex-shrink-0">
                <div className="relative">
                  <div className="w-52 h-[420px] bg-black rounded-[2.5rem] border-4 border-gray-800 overflow-hidden shadow-2xl shadow-[#D4AF37]/10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-xl z-10" />
                    <div className="h-full bg-gradient-to-b from-[#1A1A1C] to-[#0F0F10] p-4 pt-8">
                      <div className="flex items-center gap-2 mb-6">
                        <Crown className="w-6 h-6 text-[#D4AF37]" />
                        <span className="text-white font-bold">BITZ Club</span>
                      </div>
                      <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 rounded-xl p-4 mb-4 border border-[#D4AF37]/20">
                        <p className="text-[#D4AF37] text-xs font-semibold mb-1">MEMBER ID</p>
                        <p className="text-white font-bold">2607600015</p>
                        <p className="text-gray-400 text-xs mt-1">Gold Member</p>
                      </div>
                      <div className="space-y-3">
                        {['Digital Card', 'Exclusive Offers', 'Partner Deals', 'Quick Support'].map((item, i) => (
                          <div key={i} className="bg-white/5 rounded-lg p-3 flex items-center gap-3 border border-white/5">
                            <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center">
                              <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                            </div>
                            <span className="text-white text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-[#D4AF37]/5 rounded-[3rem] -z-10 blur-xl" />
                </div>
              </div>

              {/* Content */}
              <div className="order-1 lg:order-2 flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] text-sm font-medium mb-6">
                  <Download className="w-4 h-4" />
                  Available Now
                </div>
                <h2 
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Download the <span className="text-[#D4AF37]">BITZ App</span>
                </h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0">
                  Access your membership benefits, digital card, exclusive offers, and partner discounts - all from your phone.
                </p>
                
                <ul className="grid sm:grid-cols-2 gap-3 mb-8 text-left max-w-lg mx-auto lg:mx-0">
                  {[
                    'Digital Membership Card',
                    'Exclusive Member Offers',
                    'Partner Discount Access',
                    'Event Notifications',
                    'Easy Referral Sharing',
                    '24/7 Support Access'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <button
                    onClick={handleInstallApp}
                    className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#E6D699] text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    data-testid="install-app-btn"
                  >
                    <Download className="w-5 h-5" />
                    Install App Now
                  </button>
                  <p className="text-gray-500 text-sm">
                    No app store needed • Works on all devices
                  </p>
                </div>
              </div>
            </div>
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

      {/* Offer Popup Modal */}
      {showOfferPopup && currentOffer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-[#1A1A1C] to-[#0F0F10] border border-[#D4AF37]/30 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
          >
            {/* Offer Header */}
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#E6D699] p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-6 h-6 text-black" />
                <span className="text-black font-bold text-lg">SPECIAL OFFER!</span>
              </div>
              <p className="text-black/70 text-sm">Limited Time Only</p>
            </div>
            
            {/* Offer Content */}
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                {currentOffer.title}
              </h3>
              <p className="text-gray-400 mb-4">{currentOffer.description}</p>
              
              {currentOffer.discount_value && (
                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 mb-4">
                  <p className="text-[#D4AF37] text-3xl font-bold">
                    {currentOffer.discount_type === 'percentage' 
                      ? `${currentOffer.discount_value}% OFF`
                      : `₹${currentOffer.discount_value} OFF`}
                  </p>
                  {currentOffer.code && (
                    <p className="text-gray-400 text-sm mt-2">
                      Use Code: <span className="text-white font-mono bg-black/30 px-2 py-1 rounded">{currentOffer.code}</span>
                    </p>
                  )}
                </div>
              )}
              
              {currentOffer.valid_until && (
                <p className="text-gray-500 text-xs mb-4">
                  Valid until: {new Date(currentOffer.valid_until).toLocaleDateString()}
                </p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOfferPopup(false)}
                  className="flex-1 px-4 py-3 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Maybe Later
                </button>
                <Link
                  to="/register"
                  onClick={() => setShowOfferPopup(false)}
                  className="flex-1 px-4 py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#E6D699] transition-colors text-center"
                >
                  Join Now
                </Link>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setShowOfferPopup(false)}
              className="absolute top-3 right-3 text-black/50 hover:text-black transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
