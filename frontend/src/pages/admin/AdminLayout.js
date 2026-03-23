import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, LayoutDashboard, Users, CreditCard, Building2, Phone,
  BarChart3, Settings, LogOut, Menu, X, ChevronLeft, UserPlus, Image,
  Wallet, Tag, Wrench, ShieldCheck, Calendar, Gift, ImagePlus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Base menu items for all admins
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Members', path: '/admin/members' },
    { icon: UserPlus, label: 'Leads', path: '/admin/leads' },
    { icon: Gift, label: 'Referrals', path: '/admin/referrals' },
    { icon: Wallet, label: 'Payments', path: '/admin/payments' },
    { icon: CreditCard, label: 'Plans', path: '/admin/plans' },
    { icon: Tag, label: 'Coupons', path: '/admin/coupons' },
    { icon: Wrench, label: 'Maintenance', path: '/admin/maintenance' },
    { icon: Building2, label: 'Affiliations', path: '/admin/partners' },
    { icon: Phone, label: 'Telecallers', path: '/admin/telecallers' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
    { icon: Calendar, label: 'Events', path: '/admin/events' },
    { icon: Image, label: 'Content', path: '/admin/content' },
    { icon: ImagePlus, label: 'Media CMS', path: '/admin/media' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  // Add Admin Users link only for Super Admin
  if (user?.role === 'super_admin') {
    menuItems.push({ icon: ShieldCheck, label: 'Admin Users', path: '/admin/admin-users' });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] flex">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="hidden lg:block fixed left-0 top-0 h-full bg-[#1A1A1C] border-r border-white/5 z-40"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <NavLink to="/admin" className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-[#D4AF37]" />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  BITZ Admin
                </motion.span>
              )}
            </NavLink>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 py-6 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 mx-3 my-1 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-white/5">
            {sidebarOpen && (
              <div className="px-3 py-2 mb-3">
                <p className="text-white font-medium text-sm truncate">{user?.name}</p>
                <p className="text-gray-500 text-xs">Super Admin</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1A1A1C] border-b border-white/5 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Crown className="w-7 h-7 text-[#D4AF37]" />
          <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            BITZ Admin
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-[#1A1A1C] z-50"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="text-lg font-bold text-white">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
                        isActive
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-20'} transition-all pt-16 lg:pt-0`}>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
