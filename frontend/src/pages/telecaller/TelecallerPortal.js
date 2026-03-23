import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  ClipboardList, Users, User, Info, Building2, PhoneCall, 
  ListTodo, HelpCircle, Bell, Calendar, Settings, LogOut,
  ChevronRight, Loader2
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// Telecaller Dashboard Home
export const TelecallerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    assignedMembers: 0,
    pendingCalls: 0,
    completedCalls: 0,
    todayTasks: 0
  });
  const [loading, setLoading] = useState(true);

  const dashboardItems = [
    { icon: ClipboardList, label: 'My Tasks', path: '/telecaller/tasks', color: 'bg-blue-500' },
    { icon: Users, label: 'Assigned Members', path: '/telecaller/members', color: 'bg-green-500' },
    { icon: User, label: 'My Profile', path: '/telecaller/profile', color: 'bg-purple-500' },
    { icon: Info, label: 'Member Info', path: '/telecaller/member-info', color: 'bg-cyan-500' },
    { icon: Building2, label: 'Affiliate Info', path: '/telecaller/affiliates', color: 'bg-indigo-500' },
    { icon: PhoneCall, label: 'Call Logs', path: '/telecaller/call-logs', color: 'bg-orange-500' },
    { icon: ListTodo, label: 'To-Do List', path: '/telecaller/todo', color: 'bg-pink-500' },
    { icon: HelpCircle, label: 'FAQ', path: '/telecaller/faq', color: 'bg-gray-500' },
  ];

  useEffect(() => {
    // Fetch telecaller stats
    setLoading(false);
  }, []);

  return (
    <div className="p-6" data-testid="telecaller-dashboard">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {dashboardItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={item.path}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
            >
              <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <span className="text-gray-700 font-medium text-center">{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Telecaller Layout with Navigation
export const TelecallerLayout = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState(0);

  const navItems = [
    { label: 'Call Center', path: '/telecaller' },
    { label: 'My Tasks', path: '/telecaller/tasks' },
    { label: 'Assigned Sales', path: '/telecaller/members' },
    { label: 'New Sales', path: '/telecaller/new-sale' },
    { label: 'FAQ', path: '/telecaller/faq' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Redirect non-telecallers
  useEffect(() => {
    if (user && user.role !== 'telecaller' && user.role !== 'admin' && user.role !== 'super_admin') {
      navigate('/login');
      toast.error('Access denied. Telecaller access required.');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left Nav Items */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right Nav Items */}
            <div className="flex items-center space-x-2">
              <Link
                to="/telecaller/calendar"
                className="flex items-center px-3 py-1.5 text-sm bg-blue-500 rounded-md hover:bg-blue-400"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Calendar
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{calendarEvents}</span>
              </Link>
              
              <Link
                to="/telecaller/notifications"
                className="flex items-center px-3 py-1.5 text-sm bg-blue-500 rounded-md hover:bg-blue-400"
              >
                <Bell className="w-4 h-4 mr-1" />
                Notifications
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{notifications}</span>
              </Link>

              <Link
                to="/telecaller/profile"
                className="px-3 py-1.5 text-sm hover:bg-blue-500 rounded-md"
              >
                My Profile
              </Link>

              <div className="relative group">
                <button className="px-3 py-1.5 text-sm hover:bg-blue-500 rounded-md flex items-center">
                  Settings
                  <ChevronRight className="w-4 h-4 ml-1 transform group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-1.5 text-sm bg-red-500 rounded-md hover:bg-red-400"
              >
                Logout
                <LogOut className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm">
        ©2014 - 2026 Bitz Club
      </footer>
    </div>
  );
};

// Telecaller Tasks Page
export const TelecallerTasks = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarFilter, setSidebarFilter] = useState('assigned');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'assigned', label: 'Assigned Members' },
    { id: 'maintenance', label: 'Maintenance Due' },
    { id: 'renewal', label: 'Account Renewal' },
    { id: 'toCall', label: 'List To Call' },
    { id: 'called', label: 'Called List' },
  ];

  const sidebarItems = [
    { id: 'callLogs', label: 'Call Logs', path: '/telecaller/call-logs' },
    { id: 'todo', label: 'To-Do List', path: '/telecaller/todo' },
    { id: 'assigned', label: 'Assigned Member' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'renewal', label: 'Renewal' },
    { id: 'amount', label: 'Amount Wise' },
    { id: 'pincode', label: 'Pin Code' },
  ];

  useEffect(() => {
    fetchMembers();
  }, [activeTab, sidebarFilter]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/members?telecaller_id=${user?.id || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allMembers = response.data.members || response.data || [];
      
      // Filter based on active tab
      let filtered = allMembers;
      if (activeTab === 'maintenance') {
        filtered = allMembers.filter(m => m.maintenance_due > 0);
      } else if (activeTab === 'renewal') {
        const now = new Date();
        filtered = allMembers.filter(m => {
          const expiry = new Date(m.membership_end);
          const daysLeft = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
          return daysLeft <= 30;
        });
      }
      
      setMembers(filtered);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex" data-testid="telecaller-tasks">
      {/* Sidebar */}
      <div className="w-48 bg-white border-r border-gray-200 min-h-[calc(100vh-8rem)]">
        <div className="p-4 space-y-2">
          <button className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded font-medium text-left">
            Filter
          </button>
          <button className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded font-medium text-left">
            Help
          </button>
        </div>
        <div className="border-t border-gray-200">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.path ? window.location.href = item.path : setSidebarFilter(item.id)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 ${
                sidebarFilter === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* User Info */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="w-5 h-5" />
            <span>{user?.name || 'Telecaller'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Member List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Member List</h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm text-gray-600">
                Search Unassigned Members:
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ml-2 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="text-sm text-gray-600">
                Search:
                <input
                  type="text"
                  className="ml-2 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">Processing...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Call Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No members found
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id || member.member_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/telecaller/member/${member.member_id}`} className="text-blue-600 hover:underline">
                          {member.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{member.mobile}</td>
                      <td className="px-4 py-3 text-gray-600">{member.plan_name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {member.membership_end ? new Date(member.membership_end).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          member.call_status === 'called' ? 'bg-green-100 text-green-700' :
                          member.call_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {member.call_status || 'Not Called'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Log Call
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// Call Logs Page
export const TelecallerCallLogs = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const tabs = [
    { id: 'all', label: 'All List' },
    { id: 'collection', label: 'Collection Date' },
    { id: 'paid', label: 'Paid' },
    { id: 'rescheduled', label: 'Rescheduled' },
    { id: 'paidBefore', label: 'Paid Before Call' },
    { id: 'invalid', label: 'Invalid Mobile' },
    { id: 'notReachable', label: 'Not Reachable' },
    { id: 'notAnswered', label: 'Not Answered' },
    { id: 'notInterested', label: 'Not Interested' },
  ];

  useEffect(() => {
    fetchCallLogs();
  }, [activeTab, dateFrom, dateTo]);

  const fetchCallLogs = async () => {
    setLoading(true);
    try {
      let url = `${API}/call-logs?telecaller_id=${user?.id || ''}`;
      if (activeTab !== 'all') url += `&status=${activeTab}`;
      if (dateFrom) url += `&from=${dateFrom}`;
      if (dateTo) url += `&to=${dateTo}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCallLogs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch call logs:', error);
      // Use mock data for now
      setCallLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6" data-testid="telecaller-call-logs">
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="flex items-center space-x-4 mb-4">
        <div>
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="ml-2 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="ml-2 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Call Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Show</label>
            <select className="px-2 py-1 border border-gray-300 rounded text-sm">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>
          <div>
            <label className="text-sm text-gray-600">
              Search:
              <input
                type="text"
                className="ml-2 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Call Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Date/Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {callLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No call logs found
                  </td>
                </tr>
              ) : (
                callLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3">
                      <Link to={`/telecaller/member/${log.member_id}`} className="text-blue-600 hover:underline">
                        {log.member_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        log.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        log.status === 'Not Interested' ? 'bg-red-100 text-red-700' :
                        log.status === 'Rescheduled' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.description || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{log.call_datetime || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{log.scheduled_datetime || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// New Sale Page (Telecaller can register new members)
export const TelecallerNewSale = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    date_of_birth: '',
    plan_id: '',
    password: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans`);
      setPlans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create member via telecaller
      const response = await axios.post(`${API}/members`, {
        ...formData,
        source: 'telecaller',
        assigned_telecaller: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Member registered successfully!');
      navigate('/telecaller/members');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto" data-testid="telecaller-new-sale">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Register New Member</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
            <input
              type="tel"
              required
              value={formData.mobile}
              onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({...formData, pincode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan *</label>
            <select
              required
              value={formData.plan_id}
              onChange={(e) => setFormData({...formData, plan_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ₹{plan.price}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Register Member'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TelecallerDashboard;
