import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft, Save, Plus, Trash2, Loader2, User, CreditCard,
  Upload, Calendar, Phone, Mail, MapPin, Users, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'];
const RELATIONSHIPS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'];
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online (Razorpay)' }
];

const OfflineMemberPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('brief');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Brief Tab Form Data
  const [briefData, setBriefData] = useState({
    title: 'Mr',
    first_name: '',
    last_name: '',
    middle_name: '',
    mobile: '',
    country_code: '+91',
    email: '',
    password: '',
    joining_date: new Date().toISOString().split('T')[0]
  });
  
  // Personal Details Tab
  const [personalData, setPersonalData] = useState({
    date_of_birth: '',
    gender: 'Male',
    phone_residence: '',
    address: '',
    area: '',
    pincode: '',
    city: '',
    state: '',
    country: 'India'
  });
  
  // Payment Details Tab
  const [paymentData, setPaymentData] = useState({
    plan_id: '',
    payment_method: 'cash',
    amount: 0,
    gst_amount: 0,
    total_amount: 0,
    transaction_id: '',
    cheque_number: '',
    cheque_date: '',
    bank_name: '',
    upi_id: '',
    notes: '',
    referral_id: ''
  });
  
  // Family Members
  const [familyMembers, setFamilyMembers] = useState([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans?is_active=true`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans');
    }
  };

  // Handle plan selection and calculate amounts
  const handlePlanChange = (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const amount = plan.price || 0;
      const gst = Math.round(amount * 0.18); // 18% GST
      setPaymentData({
        ...paymentData,
        plan_id: planId,
        amount: amount,
        gst_amount: gst,
        total_amount: amount + gst
      });
    }
  };

  // Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Add family member
  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      { name: '', relationship: 'Spouse', date_of_birth: '', mobile: '', email: '' }
    ]);
  };

  // Remove family member
  const removeFamilyMember = (index) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  // Update family member
  const updateFamilyMember = (index, field, value) => {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  };

  // Auto-fill from pincode (India Post API)
  const fetchLocationFromPincode = async (pincode) => {
    if (!pincode || pincode.length !== 6) return;
    
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = response.data[0];
      
      if (data.Status === 'Success' && data.PostOffice?.length > 0) {
        const location = data.PostOffice[0];
        setPersonalData(prev => ({
          ...prev,
          city: location.District || location.Division || '',
          state: location.State || ''
        }));
        toast.success(`Location: ${location.District}, ${location.State}`);
      }
    } catch (error) {
      console.error('Failed to fetch location');
    }
  };

  // Submit form
  const handleSubmit = async () => {
    // Validate required fields
    if (!briefData.first_name || !briefData.mobile || !briefData.email) {
      toast.error('Please fill all required fields in Brief tab');
      setActiveTab('brief');
      return;
    }
    if (!paymentData.plan_id) {
      toast.error('Please select a membership plan');
      setActiveTab('payment');
      return;
    }
    
    setLoading(true);
    try {
      // Create member
      const fullName = [briefData.title, briefData.first_name, briefData.middle_name, briefData.last_name]
        .filter(Boolean).join(' ');
      
      const memberPayload = {
        name: fullName,
        mobile: briefData.mobile,
        country_code: briefData.country_code,
        email: briefData.email,
        password: briefData.password || null,
        date_of_birth: personalData.date_of_birth,
        address: personalData.address,
        area: personalData.area,
        city: personalData.city,
        state: personalData.state,
        country: personalData.country,
        pincode: personalData.pincode,
        plan_id: paymentData.plan_id,
        referral_id: paymentData.referral_id,
        source: 'offline_admin'
      };
      
      const memberResponse = await axios.post(`${API}/admin/members/offline`, memberPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newMemberId = memberResponse.data.member_id;
      
      // Record payment if amount > 0
      if (paymentData.amount > 0) {
        const paymentPayload = {
          member_id: newMemberId,
          amount: paymentData.total_amount,
          payment_type: 'offline',
          payment_method: paymentData.payment_method,
          transaction_id: paymentData.transaction_id || paymentData.cheque_number || `OFFLINE-${Date.now()}`,
          notes: paymentData.notes,
          plan_id: paymentData.plan_id,
          gst_amount: paymentData.gst_amount,
          cheque_details: paymentData.payment_method === 'cheque' ? {
            cheque_number: paymentData.cheque_number,
            cheque_date: paymentData.cheque_date,
            bank_name: paymentData.bank_name
          } : null
        };
        
        await axios.post(`${API}/payments`, paymentPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Add family members
      for (const family of familyMembers) {
        if (family.name) {
          await axios.post(`${API}/members/${newMemberId}/family`, {
            member_id: newMemberId,
            name: family.name,
            relationship: family.relationship,
            date_of_birth: family.date_of_birth,
            mobile: family.mobile,
            email: family.email
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      
      // Upload photo if provided
      if (photoPreview) {
        const formData = new FormData();
        const blob = await fetch(photoPreview).then(r => r.blob());
        formData.append('file', blob, 'photo.jpg');
        
        await axios.post(`${API}/members/${newMemberId}/photo`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      toast.success(`Member created successfully! ID: ${newMemberId}`);
      navigate('/admin/members');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/members')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            data-testid="go-back-btn"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              Add New Member (Offline)
            </h1>
            <p className="text-gray-400 text-sm">Manual entry for offline registrations</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
          data-testid="save-member-btn"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Member
        </button>
      </div>

      {/* Tabs */}
      <div className="card-dark">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-[#0F0F10] border-b border-white/10 rounded-none p-0">
            <TabsTrigger 
              value="brief" 
              className="flex-1 py-3 data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] rounded-none"
              data-testid="tab-brief"
            >
              <User className="w-4 h-4 mr-2" />
              Brief
            </TabsTrigger>
            <TabsTrigger 
              value="personal" 
              className="flex-1 py-3 data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] rounded-none"
              data-testid="tab-personal"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Personal Details
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              className="flex-1 py-3 data-[state=active]:bg-[#D4AF37]/10 data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] rounded-none"
              data-testid="tab-payment"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Details
            </TabsTrigger>
          </TabsList>

          {/* Brief Tab */}
          <TabsContent value="brief" className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="input-label">Title *</label>
                    <Select value={briefData.title} onValueChange={(v) => setBriefData({ ...briefData, title: v })}>
                      <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <label className="input-label">First Name *</label>
                    <input
                      type="text"
                      value={briefData.first_name}
                      onChange={(e) => setBriefData({ ...briefData, first_name: e.target.value })}
                      className="input-gold"
                      required
                      data-testid="first-name-input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Middle Name</label>
                    <input
                      type="text"
                      value={briefData.middle_name}
                      onChange={(e) => setBriefData({ ...briefData, middle_name: e.target.value })}
                      className="input-gold"
                    />
                  </div>
                  <div>
                    <label className="input-label">Last Name</label>
                    <input
                      type="text"
                      value={briefData.last_name}
                      onChange={(e) => setBriefData({ ...briefData, last_name: e.target.value })}
                      className="input-gold"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="input-label">Email *</label>
                  <input
                    type="email"
                    value={briefData.email}
                    onChange={(e) => setBriefData({ ...briefData, email: e.target.value })}
                    className="input-gold"
                    required
                    data-testid="email-input"
                  />
                </div>
                
                <div>
                  <label className="input-label">Password</label>
                  <input
                    type="password"
                    value={briefData.password}
                    onChange={(e) => setBriefData({ ...briefData, password: e.target.value })}
                    className="input-gold"
                    placeholder="Leave blank for auto-generated"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="input-label">Code</label>
                    <Select value={briefData.country_code} onValueChange={(v) => setBriefData({ ...briefData, country_code: v })}>
                      <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+91">+91</SelectItem>
                        <SelectItem value="+1">+1</SelectItem>
                        <SelectItem value="+971">+971</SelectItem>
                        <SelectItem value="+44">+44</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="input-label">Mobile No. *</label>
                    <input
                      type="tel"
                      value={briefData.mobile}
                      onChange={(e) => setBriefData({ ...briefData, mobile: e.target.value })}
                      className="input-gold"
                      required
                      data-testid="mobile-input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="input-label">Joining Date</label>
                  <input
                    type="date"
                    value={briefData.joining_date}
                    onChange={(e) => setBriefData({ ...briefData, joining_date: e.target.value })}
                    className="input-gold"
                  />
                </div>
              </div>
              
              {/* Right Column - Photo Upload */}
              <div className="flex flex-col items-center justify-start">
                <label className="input-label mb-2">Member Photo</label>
                <div className="w-40 h-48 border-2 border-dashed border-white/20 rounded-lg overflow-hidden flex items-center justify-center bg-[#0F0F10] relative">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Click to upload</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="btn-secondary mt-2 text-sm py-1 px-3"
                >
                  Clear Photo
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Personal Details Tab */}
          <TabsContent value="personal" className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Date of Birth</label>
                    <input
                      type="date"
                      value={personalData.date_of_birth}
                      onChange={(e) => setPersonalData({ ...personalData, date_of_birth: e.target.value })}
                      className="input-gold"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="input-label">Gender</label>
                    <Select value={personalData.gender} onValueChange={(v) => setPersonalData({ ...personalData, gender: v })}>
                      <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="input-label">Phone (Res)</label>
                  <input
                    type="tel"
                    value={personalData.phone_residence}
                    onChange={(e) => setPersonalData({ ...personalData, phone_residence: e.target.value })}
                    className="input-gold"
                    placeholder="Residence phone number"
                  />
                </div>
                
                <div>
                  <label className="input-label">Address</label>
                  <textarea
                    value={personalData.address}
                    onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                    className="input-gold resize-none"
                    rows={3}
                    placeholder="Full address"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Area</label>
                    <input
                      type="text"
                      value={personalData.area}
                      onChange={(e) => setPersonalData({ ...personalData, area: e.target.value })}
                      className="input-gold"
                    />
                  </div>
                  <div>
                    <label className="input-label">Pin Code</label>
                    <input
                      type="text"
                      value={personalData.pincode}
                      onChange={(e) => {
                        setPersonalData({ ...personalData, pincode: e.target.value });
                        if (e.target.value.length === 6) {
                          fetchLocationFromPincode(e.target.value);
                        }
                      }}
                      className="input-gold"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="input-label">Country</label>
                  <Select value={personalData.country} onValueChange={(v) => setPersonalData({ ...personalData, country: v })}>
                    <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="UAE">UAE</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="input-label">State</label>
                  <input
                    type="text"
                    value={personalData.state}
                    onChange={(e) => setPersonalData({ ...personalData, state: e.target.value })}
                    className="input-gold"
                  />
                </div>
                
                <div>
                  <label className="input-label">City / District</label>
                  <input
                    type="text"
                    value={personalData.city}
                    onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                    className="input-gold"
                  />
                </div>
              </div>
            </div>
            
            {/* Family Members Section */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#D4AF37]" />
                  Family Members
                </h3>
                <button
                  type="button"
                  onClick={addFamilyMember}
                  className="btn-secondary py-1 px-3 text-sm flex items-center gap-1"
                  data-testid="add-family-btn"
                >
                  <Plus className="w-4 h-4" /> Add Family Member
                </button>
              </div>
              
              {familyMembers.length === 0 ? (
                <p className="text-gray-500 text-sm">No family members added. Click "Add Family Member" to add.</p>
              ) : (
                <div className="space-y-4">
                  {familyMembers.map((member, index) => (
                    <div key={index} className="p-4 bg-[#0F0F10] rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm text-[#D4AF37]">Family Member #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFamilyMember(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid md:grid-cols-5 gap-3">
                        <div className="md:col-span-2">
                          <label className="input-label text-xs">Name</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                            className="input-gold text-sm"
                          />
                        </div>
                        <div>
                          <label className="input-label text-xs">Relationship</label>
                          <Select 
                            value={member.relationship} 
                            onValueChange={(v) => updateFamilyMember(index, 'relationship', v)}
                          >
                            <SelectTrigger className="w-full bg-[#1A1A1C] border-white/10 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="input-label text-xs">DOB</label>
                          <input
                            type="date"
                            value={member.date_of_birth}
                            onChange={(e) => updateFamilyMember(index, 'date_of_birth', e.target.value)}
                            className="input-gold text-sm"
                          />
                        </div>
                        <div>
                          <label className="input-label text-xs">Mobile</label>
                          <input
                            type="tel"
                            value={member.mobile}
                            onChange={(e) => updateFamilyMember(index, 'mobile', e.target.value)}
                            className="input-gold text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Payment Details Tab */}
          <TabsContent value="payment" className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="input-label">Card Type / Plan *</label>
                  <Select value={paymentData.plan_id} onValueChange={handlePlanChange}>
                    <SelectTrigger className="w-full bg-[#0F0F10] border-white/10" data-testid="plan-select">
                      <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ₹{plan.price?.toLocaleString()} ({plan.duration_months} months)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="input-label">Payment Method *</label>
                  <Select value={paymentData.payment_method} onValueChange={(v) => setPaymentData({ ...paymentData, payment_method: v })}>
                    <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Conditional fields based on payment method */}
                {paymentData.payment_method === 'cheque' && (
                  <div className="space-y-3 p-4 bg-[#0F0F10] rounded-lg">
                    <div>
                      <label className="input-label text-xs">Cheque Number</label>
                      <input
                        type="text"
                        value={paymentData.cheque_number}
                        onChange={(e) => setPaymentData({ ...paymentData, cheque_number: e.target.value })}
                        className="input-gold"
                      />
                    </div>
                    <div>
                      <label className="input-label text-xs">Cheque Date</label>
                      <input
                        type="date"
                        value={paymentData.cheque_date}
                        onChange={(e) => setPaymentData({ ...paymentData, cheque_date: e.target.value })}
                        className="input-gold"
                      />
                    </div>
                    <div>
                      <label className="input-label text-xs">Bank Name</label>
                      <input
                        type="text"
                        value={paymentData.bank_name}
                        onChange={(e) => setPaymentData({ ...paymentData, bank_name: e.target.value })}
                        className="input-gold"
                      />
                    </div>
                  </div>
                )}
                
                {paymentData.payment_method === 'upi' && (
                  <div>
                    <label className="input-label">UPI Transaction ID</label>
                    <input
                      type="text"
                      value={paymentData.transaction_id}
                      onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                      className="input-gold"
                      placeholder="e.g., UPI123456789"
                    />
                  </div>
                )}
                
                {(paymentData.payment_method === 'card' || paymentData.payment_method === 'bank_transfer') && (
                  <div>
                    <label className="input-label">Transaction ID</label>
                    <input
                      type="text"
                      value={paymentData.transaction_id}
                      onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                      className="input-gold"
                    />
                  </div>
                )}
                
                <div>
                  <label className="input-label">Referral ID</label>
                  <input
                    type="text"
                    value={paymentData.referral_id}
                    onChange={(e) => setPaymentData({ ...paymentData, referral_id: e.target.value })}
                    className="input-gold"
                    placeholder="e.g., BITZ-E001 or BITZ-A001"
                  />
                </div>
                
                <div>
                  <label className="input-label">Notes</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="input-gold resize-none"
                    rows={2}
                    placeholder="Any additional notes"
                  />
                </div>
              </div>
              
              {/* Payment Summary */}
              <div className="space-y-4">
                <div className="p-4 bg-[#0F0F10] rounded-lg space-y-3">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                    Payment Summary
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plan Amount</span>
                      <span className="text-white">₹{paymentData.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GST (18%)</span>
                      <span className="text-white">₹{paymentData.gst_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-white font-semibold">Total Amount</span>
                      <span className="text-[#D4AF37] font-bold text-lg">₹{paymentData.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Amount Override */}
                <div>
                  <label className="input-label">Custom Total Amount (if different)</label>
                  <input
                    type="number"
                    value={paymentData.total_amount}
                    onChange={(e) => setPaymentData({ ...paymentData, total_amount: parseFloat(e.target.value) || 0 })}
                    className="input-gold"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Override if discount applied or different amount collected</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default OfflineMemberPage;
