import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Users, CreditCard, Building2, TrendingUp, Calendar, DollarSign,
  ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/reports/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#D4AF37', '#8F741F', '#665316', '#3D320D'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Members',
      value: stats?.total_members || 0,
      icon: Users,
      change: `+${stats?.month_members || 0} this month`,
      positive: true
    },
    {
      title: 'Active Members',
      value: stats?.active_members || 0,
      icon: CreditCard,
      change: `${Math.round((stats?.active_members / (stats?.total_members || 1)) * 100)}% of total`,
      positive: true
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: `₹${(stats?.month_revenue || 0).toLocaleString()} this month`,
      positive: true
    },
    {
      title: 'Partners',
      value: stats?.partners_count || 0,
      icon: Building2,
      change: 'Active partnerships',
      positive: true
    }
  ];

  const memberStatusData = [
    { name: 'Active', value: stats?.active_members || 0 },
    { name: 'Pending', value: stats?.pending_members || 0 },
    { name: 'Expired', value: stats?.expired_members || 0 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 
          className="text-3xl font-bold text-white"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Dashboard
        </h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with BITZ Club.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-dark"
            data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-[#D4AF37]/10 rounded">
                <stat.icon className="w-5 h-5 text-[#D4AF37]" />
              </div>
              {stat.positive ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.title}</p>
            <p className="text-xs text-[#D4AF37] mt-2">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Member Status Pie Chart */}
        <div className="card-dark">
          <h2 className="text-lg font-semibold text-white mb-4">Member Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memberStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1C', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {memberStatusData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm text-gray-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="card-dark">
          <h2 className="text-lg font-semibold text-white mb-4">Plan Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.plan_distribution || []}>
                <XAxis 
                  dataKey="plan" 
                  tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  axisLine={{ stroke: '#27272A' }}
                />
                <YAxis 
                  tick={{ fill: '#A1A1AA', fontSize: 12 }}
                  axisLine={{ stroke: '#27272A' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1C', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="card-dark flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-full">
            <Calendar className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats?.pending_members || 0}</p>
            <p className="text-sm text-gray-400">Pending Activations</p>
          </div>
        </div>

        <div className="card-dark flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <TrendingUp className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats?.expired_members || 0}</p>
            <p className="text-sm text-gray-400">Expired Memberships</p>
          </div>
        </div>

        <div className="card-dark flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-full">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats?.telecallers_count || 0}</p>
            <p className="text-sm text-gray-400">Active Telecallers</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
