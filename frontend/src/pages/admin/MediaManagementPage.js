import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Plus, Trash2, Loader2, Image, Video, Upload, X, 
  Settings, ImagePlus, LayoutGrid, Eye, Save, Link,
  Play, Pause, Volume2, VolumeX
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const MediaManagementPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('homepage');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Media Library state
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  // Homepage Settings state
  const [homepageSettings, setHomepageSettings] = useState({
    hero_type: 'image',
    hero_image: '',
    hero_video_url: '',
    hero_title: 'Welcome to BITZ Club',
    hero_subtitle: 'Premium Lifestyle Membership',
    hero_autoplay: true,
    hero_muted: true,
    offers_title: 'Exclusive Offers',
    offers_subtitle: 'Member-only benefits',
    gallery_title: 'Experience Luxury',
    gallery_subtitle: 'Our premium facilities',
    show_offers: true,
    show_gallery: true
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Offers state
  const [offers, setOffers] = useState([]);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    image_url: '',
    discount_text: '',
    valid_until: '',
    is_active: true,
    is_featured: false
  });

  // Gallery state
  const [gallery, setGallery] = useState([]);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    image_url: '',
    media_type: 'image',
    video_url: '',
    description: '',
    order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMediaLibrary(),
        fetchHomepageSettings(),
        fetchOffers(),
        fetchGallery()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaLibrary = async () => {
    try {
      const response = await axios.get(`${API}/media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMediaLibrary(response.data);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const fetchHomepageSettings = async () => {
    try {
      const response = await axios.get(`${API}/homepage-settings`);
      setHomepageSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error fetching homepage settings:', error);
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${API}/offers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API}/homepage-gallery`);
      setGallery(response.data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  };

  const handleFileUpload = async (e, category = 'general') => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    setUploading(true);
    try {
      const response = await axios.post(`${API}/media/upload?category=${category}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Image uploaded successfully!');
      fetchMediaLibrary();
      return response.data.media;
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      await axios.delete(`${API}/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Media deleted successfully');
      fetchMediaLibrary();
    } catch (error) {
      toast.error('Failed to delete media');
    }
  };

  const saveHomepageSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.put(`${API}/homepage-settings`, homepageSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Homepage settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveOffer = async () => {
    try {
      if (selectedOffer) {
        await axios.put(`${API}/offers/${selectedOffer.id}`, offerForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Offer updated successfully');
      } else {
        await axios.post(`${API}/offers`, offerForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Offer created successfully');
      }
      setOfferModalOpen(false);
      setSelectedOffer(null);
      fetchOffers();
    } catch (error) {
      toast.error('Failed to save offer');
    }
  };

  const deleteOffer = async (offerId) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      await axios.delete(`${API}/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Offer deleted successfully');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  const saveGalleryItem = async () => {
    try {
      const data = {
        title: galleryForm.title,
        image_url: galleryForm.media_type === 'image' ? galleryForm.image_url : galleryForm.video_url,
        media_type: galleryForm.media_type,
        description: galleryForm.description,
        order: galleryForm.order,
        is_active: galleryForm.is_active
      };

      await axios.post(`${API}/homepage-gallery`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Gallery item added successfully');
      setGalleryModalOpen(false);
      fetchGallery();
    } catch (error) {
      toast.error('Failed to add gallery item');
    }
  };

  const deleteGalleryItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) return;

    try {
      await axios.delete(`${API}/homepage-gallery/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Gallery item deleted successfully');
      fetchGallery();
    } catch (error) {
      toast.error('Failed to delete gallery item');
    }
  };

  const selectMediaForField = (field) => {
    setSelectedMedia({ field });
    setMediaModalOpen(true);
  };

  const applySelectedMedia = (media) => {
    if (selectedMedia?.field === 'hero_image') {
      setHomepageSettings(prev => ({ ...prev, hero_image: media.url }));
    } else if (selectedMedia?.field === 'offer_image') {
      setOfferForm(prev => ({ ...prev, image_url: media.url }));
    } else if (selectedMedia?.field === 'gallery_image') {
      setGalleryForm(prev => ({ ...prev, image_url: media.url }));
    }
    setMediaModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="media-management-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Management</h1>
          <p className="text-gray-400">Manage homepage images, videos, and content</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-800/50 border border-gray-700">
          <TabsTrigger value="homepage" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Settings className="w-4 h-4 mr-2" />
            Homepage Settings
          </TabsTrigger>
          <TabsTrigger value="offers" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <ImagePlus className="w-4 h-4 mr-2" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="library" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Image className="w-4 h-4 mr-2" />
            Media Library
          </TabsTrigger>
        </TabsList>

        {/* Homepage Settings Tab */}
        <TabsContent value="homepage" className="mt-6">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Hero Section Settings</h2>
            
            {/* Hero Type Selection */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Hero Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hero_type"
                    value="image"
                    checked={homepageSettings.hero_type === 'image'}
                    onChange={(e) => setHomepageSettings(prev => ({ ...prev, hero_type: e.target.value }))}
                    className="text-amber-500"
                  />
                  <Image className="w-4 h-4 text-gray-400" />
                  <span className="text-white">Image Banner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hero_type"
                    value="video"
                    checked={homepageSettings.hero_type === 'video'}
                    onChange={(e) => setHomepageSettings(prev => ({ ...prev, hero_type: e.target.value }))}
                    className="text-amber-500"
                  />
                  <Video className="w-4 h-4 text-gray-400" />
                  <span className="text-white">Video Banner</span>
                </label>
              </div>
            </div>

            {/* Hero Image */}
            {homepageSettings.hero_type === 'image' && (
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Hero Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={homepageSettings.hero_image || ''}
                    onChange={(e) => setHomepageSettings(prev => ({ ...prev, hero_image: e.target.value }))}
                    placeholder="Image URL or upload new"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  <button
                    onClick={() => selectMediaForField('hero_image')}
                    className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Select
                  </button>
                </div>
                {homepageSettings.hero_image && (
                  <img 
                    src={homepageSettings.hero_image.startsWith('/') ? `${API.replace('/api', '')}${homepageSettings.hero_image}` : homepageSettings.hero_image} 
                    alt="Hero Preview" 
                    className="h-32 object-cover rounded-lg mt-2"
                  />
                )}
              </div>
            )}

            {/* Hero Video URL */}
            {homepageSettings.hero_type === 'video' && (
              <div className="space-y-2">
                <label className="text-sm text-gray-400">YouTube Video URL</label>
                <input
                  type="text"
                  value={homepageSettings.hero_video_url || ''}
                  onChange={(e) => setHomepageSettings(prev => ({ ...prev, hero_video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={homepageSettings.hero_autoplay}
                      onChange={(e) => setHomepageSettings(prev => ({ ...prev, hero_autoplay: e.target.checked }))}
                      className="text-amber-500"
                    />
                    <Play className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">Autoplay</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={homepageSettings.hero_muted}
                      onChange={(e) => setHomepageSettings(prev => ({ ...prev, hero_muted: e.target.checked }))}
                      className="text-amber-500"
                    />
                    <VolumeX className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">Muted</span>
                  </label>
                </div>
              </div>
            )}

            {/* Hero Title & Subtitle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Hero Title</label>
                <input
                  type="text"
                  value={homepageSettings.hero_title || ''}
                  onChange={(e) => setHomepageSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Hero Subtitle</label>
                <input
                  type="text"
                  value={homepageSettings.hero_subtitle || ''}
                  onChange={(e) => setHomepageSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            {/* Section Toggles */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-medium mb-3">Section Visibility</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homepageSettings.show_offers}
                    onChange={(e) => setHomepageSettings(prev => ({ ...prev, show_offers: e.target.checked }))}
                    className="text-amber-500"
                  />
                  <span className="text-white">Show Offers Section</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homepageSettings.show_gallery}
                    onChange={(e) => setHomepageSettings(prev => ({ ...prev, show_gallery: e.target.checked }))}
                    className="text-amber-500"
                  />
                  <span className="text-white">Show Gallery Section</span>
                </label>
              </div>
            </div>

            <button
              onClick={saveHomepageSettings}
              disabled={savingSettings}
              className="px-6 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2 disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Manage Offers</h2>
            <button
              onClick={() => {
                setSelectedOffer(null);
                setOfferForm({
                  title: '',
                  description: '',
                  image_url: '',
                  discount_text: '',
                  valid_until: '',
                  is_active: true,
                  is_featured: false
                });
                setOfferModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Offer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                {offer.image_url && (
                  <img 
                    src={offer.image_url.startsWith('/') ? `${API.replace('/api', '')}${offer.image_url}` : offer.image_url}
                    alt={offer.title} 
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-white font-medium">{offer.title}</h3>
                  {offer.discount_text && (
                    <span className="text-amber-400 text-sm">{offer.discount_text}</span>
                  )}
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{offer.description}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setSelectedOffer(offer);
                        setOfferForm(offer);
                        setOfferModalOpen(true);
                      }}
                      className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Homepage Gallery</h2>
            <button
              onClick={() => {
                setGalleryForm({
                  title: '',
                  image_url: '',
                  media_type: 'image',
                  video_url: '',
                  description: '',
                  order: gallery.length,
                  is_active: true
                });
                setGalleryModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Gallery Item
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div key={item.id} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden relative group">
                {item.media_type === 'video' ? (
                  <div className="w-full h-32 bg-gray-900 flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-500" />
                  </div>
                ) : (
                  <img 
                    src={item.image_url?.startsWith('/') ? `${API.replace('/api', '')}${item.image_url}` : item.image_url}
                    alt={item.title} 
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-2">
                  <p className="text-white text-sm truncate">{item.title || 'Untitled'}</p>
                </div>
                <button
                  onClick={() => deleteGalleryItem(item.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Media Library Tab */}
        <TabsContent value="library" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Media Library</h2>
            <label className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'general')}
              />
            </label>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-amber-400 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaLibrary.map((media) => (
              <div key={media.id} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden relative group">
                <img 
                  src={media.url?.startsWith('/') ? `${API.replace('/api', '')}${media.url}` : media.url}
                  alt={media.original_name} 
                  className="w-full h-24 object-cover"
                />
                <div className="p-2">
                  <p className="text-gray-400 text-xs truncate">{media.original_name}</p>
                </div>
                <button
                  onClick={() => handleDeleteMedia(media.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Media Selection Modal */}
      <Dialog open={mediaModalOpen} onOpenChange={setMediaModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Select Media</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 flex items-center gap-2 cursor-pointer w-fit">
              <Upload className="w-4 h-4" />
              Upload New
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const media = await handleFileUpload(e, 'general');
                  if (media) applySelectedMedia(media);
                }}
              />
            </label>
          </div>
          <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {mediaLibrary.map((media) => (
              <button
                key={media.id}
                onClick={() => applySelectedMedia(media)}
                className="relative group hover:ring-2 hover:ring-amber-500 rounded-lg overflow-hidden"
              >
                <img 
                  src={media.url?.startsWith('/') ? `${API.replace('/api', '')}${media.url}` : media.url}
                  alt={media.original_name} 
                  className="w-full h-20 object-cover"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer Modal */}
      <Dialog open={offerModalOpen} onOpenChange={setOfferModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedOffer ? 'Edit Offer' : 'Add Offer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Title *</label>
              <input
                type="text"
                value={offerForm.title}
                onChange={(e) => setOfferForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Description *</label>
              <textarea
                value={offerForm.description}
                onChange={(e) => setOfferForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Discount Text (e.g., "20% OFF")</label>
              <input
                type="text"
                value={offerForm.discount_text}
                onChange={(e) => setOfferForm(prev => ({ ...prev, discount_text: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Image URL</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={offerForm.image_url}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, image_url: e.target.value }))}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
                <button
                  onClick={() => selectMediaForField('offer_image')}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerForm.is_active}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <span className="text-white text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerForm.is_featured}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                />
                <span className="text-white text-sm">Featured</span>
              </label>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={saveOffer}
                className="flex-1 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
              >
                {selectedOffer ? 'Update Offer' : 'Create Offer'}
              </button>
              <button
                onClick={() => setOfferModalOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog open={galleryModalOpen} onOpenChange={setGalleryModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Add Gallery Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Title</label>
              <input
                type="text"
                value={galleryForm.title}
                onChange={(e) => setGalleryForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Media Type</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gallery_media_type"
                    value="image"
                    checked={galleryForm.media_type === 'image'}
                    onChange={(e) => setGalleryForm(prev => ({ ...prev, media_type: e.target.value }))}
                  />
                  <span className="text-white">Image</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gallery_media_type"
                    value="video"
                    checked={galleryForm.media_type === 'video'}
                    onChange={(e) => setGalleryForm(prev => ({ ...prev, media_type: e.target.value }))}
                  />
                  <span className="text-white">YouTube Video</span>
                </label>
              </div>
            </div>
            {galleryForm.media_type === 'image' ? (
              <div>
                <label className="text-sm text-gray-400">Image</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={galleryForm.image_url}
                    onChange={(e) => setGalleryForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Image URL"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  <button
                    onClick={() => selectMediaForField('gallery_image')}
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm text-gray-400">YouTube URL</label>
                <input
                  type="text"
                  value={galleryForm.video_url}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mt-1"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-gray-400">Description (optional)</label>
              <textarea
                value={galleryForm.description}
                onChange={(e) => setGalleryForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={saveGalleryItem}
                className="flex-1 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
              >
                Add to Gallery
              </button>
              <button
                onClick={() => setGalleryModalOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaManagementPage;
