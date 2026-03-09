import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Loader2, Image, Save, X, GripVertical,
  Hotel, UtensilsCrossed, Sparkles, Dumbbell, Waves, Music, PartyPopper, Building2,
  Settings, ImagePlus, LayoutGrid, Eye
} from 'lucide-react';
import { useAuth, API } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Icon mapping for experiences
const iconMap = {
  Hotel, UtensilsCrossed, Sparkles, Dumbbell, Waves, Music, PartyPopper, Building2
};

const ContentPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('experiences');
  const [loading, setLoading] = useState(true);
  
  // Experiences state
  const [experiences, setExperiences] = useState([]);
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);
  const [expForm, setExpForm] = useState({
    title: '',
    image_url: '',
    discount: '',
    description: '',
    icon: 'Hotel',
    order: 0,
    is_active: true
  });

  // Gallery state
  const [gallery, setGallery] = useState([]);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    image_url: '',
    category: 'general',
    order: 0,
    is_active: true
  });

  // Settings state
  const [settings, setSettings] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_image: '',
    contact_phone: '',
    contact_email: '',
    contact_address: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchExperiences();
    fetchGallery();
    fetchSettings();
  }, []);

  const fetchExperiences = async () => {
    try {
      const response = await axios.get(`${API}/content/experiences`);
      setExperiences(response.data);
    } catch (error) {
      toast.error('Failed to fetch experiences');
    } finally {
      setLoading(false);
    }
  };

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API}/content/gallery`);
      setGallery(response.data);
    } catch (error) {
      console.error('Failed to fetch gallery');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/content/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings');
    }
  };

  // Experience handlers
  const handleExpSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedExp) {
        await axios.put(`${API}/content/experiences/${selectedExp.id}`, expForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Experience updated');
      } else {
        await axios.post(`${API}/content/experiences`, expForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Experience created');
      }
      setExpModalOpen(false);
      fetchExperiences();
      resetExpForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleExpDelete = async (id) => {
    if (!window.confirm('Delete this experience?')) return;
    try {
      await axios.delete(`${API}/content/experiences/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Experience deleted');
      fetchExperiences();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openExpEdit = (exp) => {
    setSelectedExp(exp);
    setExpForm({
      title: exp.title,
      image_url: exp.image_url,
      discount: exp.discount,
      description: exp.description,
      icon: exp.icon,
      order: exp.order,
      is_active: exp.is_active
    });
    setExpModalOpen(true);
  };

  const resetExpForm = () => {
    setSelectedExp(null);
    setExpForm({ title: '', image_url: '', discount: '', description: '', icon: 'Hotel', order: 0, is_active: true });
  };

  // Gallery handlers
  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedImage) {
        await axios.put(`${API}/content/gallery/${selectedImage.id}`, galleryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Image updated');
      } else {
        await axios.post(`${API}/content/gallery`, galleryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Image added');
      }
      setGalleryModalOpen(false);
      fetchGallery();
      resetGalleryForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleGalleryDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await axios.delete(`${API}/content/gallery/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Image deleted');
      fetchGallery();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openGalleryEdit = (img) => {
    setSelectedImage(img);
    setGalleryForm({
      title: img.title,
      image_url: img.image_url,
      category: img.category,
      order: img.order,
      is_active: img.is_active
    });
    setGalleryModalOpen(true);
  };

  const resetGalleryForm = () => {
    setSelectedImage(null);
    setGalleryForm({ title: '', image_url: '', category: 'general', order: 0, is_active: true });
  };

  // Settings handlers
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.put(`${API}/content/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const iconOptions = Object.keys(iconMap);
  const categoryOptions = ['general', 'hotel', 'dining', 'spa', 'gym', 'pool', 'party', 'wedding', 'corporate'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Website <span className="text-[#D4AF37]">Content</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Manage images, experiences, and website settings</p>
        </div>
        <a 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-secondary inline-flex items-center gap-2 text-sm"
        >
          <Eye className="w-4 h-4" />
          Preview Website
        </a>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#1A1A1C] border border-white/10 p-1">
          <TabsTrigger value="experiences" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Experiences
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Image className="w-4 h-4 mr-2" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Experiences Tab */}
        <TabsContent value="experiences" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">Manage lifestyle experience sections shown on the homepage</p>
            <button
              onClick={() => { resetExpForm(); setExpModalOpen(true); }}
              className="btn-primary flex items-center gap-2 text-sm"
              data-testid="add-experience-btn"
            >
              <Plus className="w-4 h-4" />
              Add Experience
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {experiences.map((exp) => {
              const IconComponent = iconMap[exp.icon] || Hotel;
              return (
                <div 
                  key={exp.id} 
                  className="card-dark rounded-xl overflow-hidden group"
                >
                  <div className="relative aspect-[4/3]">
                    <img 
                      src={exp.image_url} 
                      alt={exp.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openExpEdit(exp)}
                        className="p-2 bg-black/50 rounded hover:bg-[#D4AF37] transition-colors"
                      >
                        <Edit className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleExpDelete(exp.id)}
                        className="p-2 bg-black/50 rounded hover:bg-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <IconComponent className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-[#D4AF37] text-xs font-semibold">{exp.discount}</span>
                      </div>
                      <h3 className="text-white font-semibold">{exp.title}</h3>
                      <p className="text-gray-300 text-xs line-clamp-1">{exp.description}</p>
                    </div>
                  </div>
                  {!exp.is_active && (
                    <div className="px-3 py-1 bg-red-500/20 text-red-400 text-xs text-center">
                      Hidden
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">Manage gallery images for the website</p>
            <button
              onClick={() => { resetGalleryForm(); setGalleryModalOpen(true); }}
              className="btn-primary flex items-center gap-2 text-sm"
              data-testid="add-gallery-btn"
            >
              <ImagePlus className="w-4 h-4" />
              Add Image
            </button>
          </div>

          {gallery.length === 0 ? (
            <div className="card-dark rounded-xl p-12 text-center">
              <Image className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No gallery images yet</p>
              <button
                onClick={() => { resetGalleryForm(); setGalleryModalOpen(true); }}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {gallery.map((img) => (
                <div 
                  key={img.id} 
                  className="card-dark rounded-lg overflow-hidden group relative aspect-square"
                >
                  <img 
                    src={img.image_url} 
                    alt={img.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => openGalleryEdit(img)}
                      className="p-2 bg-[#D4AF37] rounded hover:bg-[#E6D699] transition-colors"
                    >
                      <Edit className="w-4 h-4 text-black" />
                    </button>
                    <button
                      onClick={() => handleGalleryDelete(img.id)}
                      className="p-2 bg-red-500 rounded hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs truncate">{img.title}</p>
                    <span className="text-[#D4AF37] text-[10px] uppercase">{img.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="card-dark rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Hero Section</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="input-label">Hero Title</label>
                <input
                  type="text"
                  value={settings.hero_title}
                  onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  className="input-gold"
                  placeholder="Elevate Your Lifestyle"
                  data-testid="hero-title-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="input-label">Hero Subtitle</label>
                <textarea
                  value={settings.hero_subtitle}
                  onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                  className="input-gold resize-none"
                  rows={3}
                  placeholder="Join BITZ Club and unlock exclusive access..."
                  data-testid="hero-subtitle-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="input-label">Hero Background Image URL (Optional)</label>
                <input
                  type="text"
                  value={settings.hero_image}
                  onChange={(e) => setSettings({ ...settings, hero_image: e.target.value })}
                  className="input-gold"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
          </div>

          <div className="card-dark rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Phone Number</label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="input-gold"
                  placeholder="+91 78129 01118"
                  data-testid="contact-phone-input"
                />
              </div>
              <div>
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="input-gold"
                  placeholder="hello@bitzclub.com"
                  data-testid="contact-email-input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="input-label">Address</label>
                <input
                  type="text"
                  value={settings.contact_address}
                  onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                  className="input-gold"
                  placeholder="Chennai, Tamil Nadu, India"
                  data-testid="contact-address-input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="btn-primary flex items-center gap-2"
              data-testid="save-settings-btn"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Experience Modal */}
      <Dialog open={expModalOpen} onOpenChange={setExpModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              {selectedExp ? 'Edit Experience' : 'Add Experience'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExpSubmit} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Title *</label>
              <input
                type="text"
                value={expForm.title}
                onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                className="input-gold"
                placeholder="Luxury Hotels"
                required
                data-testid="exp-title-input"
              />
            </div>
            <div>
              <label className="input-label">Image URL *</label>
              <input
                type="url"
                value={expForm.image_url}
                onChange={(e) => setExpForm({ ...expForm, image_url: e.target.value })}
                className="input-gold"
                placeholder="https://images.unsplash.com/..."
                required
                data-testid="exp-image-input"
              />
              {expForm.image_url && (
                <img 
                  src={expForm.image_url} 
                  alt="Preview" 
                  className="mt-2 h-24 w-full object-cover rounded"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Discount Text *</label>
                <input
                  type="text"
                  value={expForm.discount}
                  onChange={(e) => setExpForm({ ...expForm, discount: e.target.value })}
                  className="input-gold"
                  placeholder="Up to 40% Off"
                  required
                />
              </div>
              <div>
                <label className="input-label">Icon</label>
                <Select value={expForm.icon} onValueChange={(v) => setExpForm({ ...expForm, icon: v })}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="input-label">Description *</label>
              <input
                type="text"
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                className="input-gold"
                placeholder="Exclusive rates at 5-star properties"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Display Order</label>
                <input
                  type="number"
                  value={expForm.order}
                  onChange={(e) => setExpForm({ ...expForm, order: parseInt(e.target.value) || 0 })}
                  className="input-gold"
                  min="0"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expForm.is_active}
                    onChange={(e) => setExpForm({ ...expForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-[#0F0F10] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span className="text-sm text-gray-300">Show on website</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setExpModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" data-testid="save-exp-btn">
                {selectedExp ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog open={galleryModalOpen} onOpenChange={setGalleryModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              {selectedImage ? 'Edit Image' : 'Add Image'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGallerySubmit} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Title *</label>
              <input
                type="text"
                value={galleryForm.title}
                onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                className="input-gold"
                placeholder="Image title"
                required
                data-testid="gallery-title-input"
              />
            </div>
            <div>
              <label className="input-label">Image URL *</label>
              <input
                type="url"
                value={galleryForm.image_url}
                onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                className="input-gold"
                placeholder="https://images.unsplash.com/..."
                required
                data-testid="gallery-image-input"
              />
              {galleryForm.image_url && (
                <img 
                  src={galleryForm.image_url} 
                  alt="Preview" 
                  className="mt-2 h-32 w-full object-cover rounded"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Category</label>
                <Select value={galleryForm.category} onValueChange={(v) => setGalleryForm({ ...galleryForm, category: v })}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="input-label">Display Order</label>
                <input
                  type="number"
                  value={galleryForm.order}
                  onChange={(e) => setGalleryForm({ ...galleryForm, order: parseInt(e.target.value) || 0 })}
                  className="input-gold"
                  min="0"
                />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={galleryForm.is_active}
                  onChange={(e) => setGalleryForm({ ...galleryForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-[#0F0F10] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-sm text-gray-300">Show on website</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setGalleryModalOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" data-testid="save-gallery-btn">
                {selectedImage ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ContentPage;
