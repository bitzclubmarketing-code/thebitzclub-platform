import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, LayoutDashboard, Users, CreditCard, Building2, Phone,
  BarChart3, Settings, LogOut, Menu, X, ChevronLeft, UserPlus, Image,
  RefreshCw, Ticket, Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Members', path: '/admin/members' },
    { icon: Search, label: 'Search', path: '/admin/search' },
    { icon: UserPlus, label: 'Leads', path: '/admin/leads' },
    { icon: CreditCard, label: 'Plans', path: '/admin/plans' },
    { icon: Building2, label: 'Partners', path: '/admin/partners' },
    { icon: Phone, label: 'Telecallers', path: '/admin/telecallers' },
    { icon: RefreshCw, label: 'Renewals', path: '/admin/renewals' },
    { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
    { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
    { icon: Image, label: 'Content', path: '/admin/content' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] flex">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col bg-[#1A1A1C] border-r border-white/5 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <Crown className="w-8 h-8 text-[#D4AF37] flex-shrink-0" />
          {sidebarOpen && (
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Club
            </span>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 bg-[#1A1A1C] border border-white/10 rounded-full p-1 hover:bg-[#27272A] transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded transition-colors relative ${
                  isActive
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#D4AF37] rounded-r" />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/5">
          {sidebarOpen && (
            <div className="mb-3 px-4">
              <p className="text-sm text-white font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Admin</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1A1A1C] border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Crown className="w-7 h-7 text-[#D4AF37]" />
            <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              BITZ Admin
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="lg:hidden fixed inset-0 z-40 bg-[#0F0F10] pt-16"
          >
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                      isActive
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 rounded transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 overflow-auto">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
