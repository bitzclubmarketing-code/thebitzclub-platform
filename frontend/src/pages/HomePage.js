import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Crown, 
  CreditCard, 
  Users, 
  Calendar, 
  QrCode, 
  ShieldCheck,
  ChevronRight,
  Star,
  Check,
  ArrowRight,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { API } from '@/context/AuthContext';

const HomePage = () => {
  const [plans, setPlans] = useState([]);
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    fetchPlans();
    fetchPartners();
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

  const features = [
    { icon: Crown, title: 'Premium Benefits', description: 'Exclusive access to luxury partners and facilities' },
    { icon: CreditCard, title: 'Digital Membership', description: 'QR-enabled membership card accessible anywhere' },
    { icon: Users, title: 'Partner Network', description: 'Discounts at our curated partner locations' },
    { icon: ShieldCheck, title: 'Verified Access', description: 'Instant verification at all partner venues' }
  ];

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <Crown className="w-8 h-8 text-[#D4AF37]" />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#plans" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Plans</a>
            <a href="#partners" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Partners</a>
            <a href="#contact" className="text-gray-300 hover:text-[#D4AF37] transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-[#D4AF37] hover:text-[#E6D699] transition-colors"
              data-testid="login-link"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="btn-primary"
              data-testid="register-link"
            >
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1691120254965-5158046d3929?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBjbHViJTIwaW50ZXJpb3IlMjBkYXJrJTIwbW9vZHl8ZW58MHx8fHwxNzczMDgwNzc5fDA&ixlib=rb-4.1.0&q=85)',
            filter: 'brightness(0.3)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F10] via-transparent to-[#0F0F10]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm uppercase tracking-widest mb-6">
              Exclusive Membership
            </span>
            <h1 
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Elevate Your <br />
              <span className="text-[#D4AF37]">Lifestyle</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join BITZ Club and unlock exclusive access to premium partners, 
              luxury experiences, and a world of privileges designed for the discerning few.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/register" 
                className="btn-primary inline-flex items-center justify-center gap-2"
                data-testid="hero-join-btn"
              >
                Become a Member
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#plans" 
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                View Plans
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#0F0F10]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 
              className="text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Why Choose <span className="text-[#D4AF37]">BITZ Club</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience the finest privileges with our curated membership benefits
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-dark card-interactive p-8"
              >
                <feature.icon className="w-10 h-10 text-[#D4AF37] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 bg-[#1A1A1C]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 
              className="text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Membership <span className="text-[#D4AF37]">Plans</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan that suits your lifestyle
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 ${
                  index === 1 
                    ? 'glass-gold gold-glow-strong' 
                    : 'card-dark'
                }`}
                data-testid={`plan-card-${plan.name.toLowerCase()}`}
              >
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4AF37] text-black text-xs uppercase tracking-widest font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Star className={`w-5 h-5 ${index === 1 ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                  <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {plan.name}
                  </h3>
                </div>
                <p className="text-gray-400 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#D4AF37]">₹{plan.price.toLocaleString()}</span>
                  <span className="text-gray-400">/{plan.duration_months} months</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features?.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/register?plan=${plan.id}`}
                  className={index === 1 ? 'btn-primary w-full text-center block' : 'btn-secondary w-full text-center block'}
                  data-testid={`select-plan-${plan.name.toLowerCase()}`}
                >
                  Select Plan
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-24 bg-[#0F0F10]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 
              className="text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Our <span className="text-[#D4AF37]">Partners</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Enjoy exclusive discounts at our premium partner network
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-dark card-interactive overflow-hidden"
                data-testid={`partner-card-${index}`}
              >
                {partner.logo_url && (
                  <div 
                    className="h-40 bg-cover bg-center"
                    style={{ backgroundImage: `url(${partner.logo_url})` }}
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{partner.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{partner.description}</p>
                  {partner.facilities?.length > 0 && (
                    <div className="space-y-2">
                      {partner.facilities.slice(0, 2).map((facility, fIndex) => (
                        <div key={fIndex} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{facility.facility_name}</span>
                          <span className="text-[#D4AF37] font-semibold">{facility.discount_percentage}% off</span>
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
      <section className="py-24 bg-gradient-to-b from-[#1A1A1C] to-[#0F0F10]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Ready to Join the <span className="text-[#D4AF37]">Elite</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Start your premium membership journey today and unlock a world of exclusive privileges.
            </p>
            <Link 
              to="/register" 
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
              data-testid="cta-join-btn"
            >
              Join BITZ Club
              <Crown className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-[#0F0F10] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 
                className="text-3xl font-bold text-white mb-6"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Get in <span className="text-[#D4AF37]">Touch</span>
              </h2>
              <p className="text-gray-400 mb-8">
                Have questions about membership? Our team is here to help.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-300">
                  <Phone className="w-5 h-5 text-[#D4AF37]" />
                  <span>+91 99999 99999</span>
                </div>
                <div className="flex items-center gap-4 text-gray-300">
                  <Mail className="w-5 h-5 text-[#D4AF37]" />
                  <span>hello@bitzclub.com</span>
                </div>
                <div className="flex items-center gap-4 text-gray-300">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <span>Mumbai, India</span>
                </div>
              </div>
            </div>
            <div className="glass-gold p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Inquiry</h3>
              <form className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    className="input-gold w-full bg-black/30"
                  />
                </div>
                <div>
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="input-gold w-full bg-black/30"
                  />
                </div>
                <div>
                  <textarea 
                    placeholder="Your Message" 
                    rows={3}
                    className="input-gold w-full bg-black/30 resize-none"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#0F0F10] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
                BITZ Club
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} BITZ Club. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
