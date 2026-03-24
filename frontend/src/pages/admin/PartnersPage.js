import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Plus, Edit, Trash2, Loader2, Building2, Percent, Upload, Image, X } from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PartnersPage = () => {
  const { token } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    facilities: [{ facility_name: '', discount_percentage: 0, description: '' }],
    is_active: true
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await axios.get(`${API}/partners`);
      setPartners(response.data);
    } catch (error) {
      toast.error('Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      facilities: formData.facilities.filter(f => f.facility_name.trim() !== '')
    };
    
    try {
      if (selectedPartner) {
        await axios.put(`${API}/partners/${selectedPartner.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Partner updated successfully');
      } else {
        await axios.post(`${API}/partners`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Partner created successfully');
      }
      setModalOpen(false);
      fetchPartners();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) return;
    try {
      await axios.delete(`${API}/partners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Partner deleted');
      fetchPartners();
    } catch (error) {
      toast.error('Failed to delete partner');
    }
  };

  const openEditModal = (partner) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      description: partner.description,
      logo_url: partner.logo_url || '',
      contact_email: partner.contact_email || '',
      contact_phone: partner.contact_phone || '',
      address: partner.address || '',
      facilities: partner.facilities?.length > 0 
        ? partner.facilities 
        : [{ facility_name: '', discount_percentage: 0, description: '' }],
      is_active: partner.is_active
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedPartner(null);
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      facilities: [{ facility_name: '', discount_percentage: 0, description: '' }],
      is_active: true
    });
  };

  const addFacility = () => {
    setFormData({
      ...formData,
      facilities: [...formData.facilities, { facility_name: '', discount_percentage: 0, description: '' }]
    });
  };

  const updateFacility = (index, field, value) => {
    const newFacilities = [...formData.facilities];
    newFacilities[index] = { ...newFacilities[index], [field]: value };
    setFormData({ ...formData, facilities: newFacilities });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await axios.post(`${API}/media/upload?category=partners`, uploadData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData({ ...formData, logo_url: response.data.media.url });
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const removeFacility = (index) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.filter((_, i) => i !== index)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Partner Affiliations
          </h1>
          <p className="text-gray-400 mt-1">Manage partners and facility discounts</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
          data-testid="add-partner-btn"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
        </div>
      ) : partners.length === 0 ? (
        <div className="card-dark text-center py-12">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No partners added yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card-dark overflow-hidden ${!partner.is_active ? 'opacity-60' : ''}`}
              data-testid={`partner-card-${index}`}
            >
              {partner.logo_url && (
                <div 
                  className="h-40 bg-cover bg-center -mx-6 -mt-6 mb-4"
                  style={{ backgroundImage: `url(${partner.logo_url})` }}
                />
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{partner.name}</h3>
                {!partner.is_active && (
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">Inactive</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4">{partner.description}</p>
              
              {partner.facilities?.length > 0 && (
                <div className="space-y-2 mb-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Discounts</p>
                  {partner.facilities.map((facility, fIndex) => (
                    <div key={fIndex} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{facility.facility_name}</span>
                      <span className="text-[#D4AF37] font-semibold flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {facility.discount_percentage}% OFF
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => openEditModal(partner)}
                  className="flex-1 btn-secondary py-2 flex items-center justify-center gap-2"
                  data-testid={`edit-partner-${partner.id}`}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(partner.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  data-testid={`delete-partner-${partner.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              {selectedPartner ? 'Edit Partner' : 'Add New Partner'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Partner Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-gold"
                required
                data-testid="partner-name-input"
              />
            </div>
            <div>
              <label className="input-label">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-gold resize-none"
                rows={2}
                required
              />
            </div>
            <div>
              <label className="input-label">Partner Logo / Image</label>
              <div className="space-y-3">
                {/* Logo Preview */}
                {formData.logo_url && (
                  <div className="relative inline-block">
                    <img 
                      src={formData.logo_url.startsWith('/') ? `${API.replace('/api', '')}${formData.logo_url}` : formData.logo_url}
                      alt="Partner Logo"
                      className="w-32 h-32 object-cover rounded-lg border border-[#D4AF37]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo_url: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    data-testid="partner-logo-input"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors disabled:opacity-50"
                    data-testid="upload-logo-btn"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                </div>
                
                {/* Or URL Input */}
                <div className="text-xs text-gray-500 my-1">Or enter URL directly:</div>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="input-gold"
                  placeholder="https://example.com/logo.jpg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="input-gold"
                />
              </div>
              <div>
                <label className="input-label">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="input-gold"
                />
              </div>
            </div>
            <div>
              <label className="input-label">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-gold"
              />
            </div>
            
            <div>
              <label className="input-label">Facility Discounts</label>
              {formData.facilities.map((facility, index) => (
                <div key={index} className="flex gap-2 mb-2 p-3 bg-black/30 rounded">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={facility.facility_name}
                      onChange={(e) => updateFacility(index, 'facility_name', e.target.value)}
                      className="input-gold"
                      placeholder="Facility name"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={facility.discount_percentage}
                        onChange={(e) => updateFacility(index, 'discount_percentage', parseFloat(e.target.value))}
                        className="input-gold w-24"
                        placeholder="% off"
                        min="0"
                        max="100"
                      />
                      <input
                        type="text"
                        value={facility.description}
                        onChange={(e) => updateFacility(index, 'description', e.target.value)}
                        className="input-gold flex-1"
                        placeholder="Description (optional)"
                      />
                    </div>
                  </div>
                  {formData.facilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFacility(index)}
                      className="p-2 text-gray-400 hover:text-red-400 self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFacility}
                className="text-sm text-[#D4AF37] hover:text-[#E6D699] flex items-center gap-1 mt-2"
              >
                <Plus className="w-4 h-4" /> Add Facility
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="partner_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="partner_active" className="text-sm text-gray-400">
                Partner is active
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" data-testid="save-partner-btn">
                {selectedPartner ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PartnersPage;
