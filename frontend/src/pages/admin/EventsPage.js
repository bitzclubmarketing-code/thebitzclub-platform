import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Plus, Edit, Trash2, Eye, Loader2, MapPin, Clock, Users, DollarSign, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const EventsPage = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    venue: '',
    venue_address: '',
    city: '',
    image_url: '',
    category: 'networking',
    max_attendees: '',
    entry_fee: 0,
    currency: 'INR',
    is_members_only: true,
    is_active: true,
    registration_deadline: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        entry_fee: parseFloat(formData.entry_fee) || 0
      };
      
      if (selectedEvent) {
        await axios.put(`${API}/events/${selectedEvent.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event updated successfully');
      } else {
        await axios.post(`${API}/events`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event created successfully');
      }
      setModalOpen(false);
      fetchEvents();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`${API}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Event deleted');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const openViewModal = async (event) => {
    setSelectedEvent(event);
    try {
      const response = await axios.get(`${API}/events/${event.id}/registrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data);
    } catch (error) {
      setRegistrations([]);
    }
    setViewModalOpen(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_date: event.event_date?.split('T')[0] || '',
      event_time: event.event_time || '',
      venue: event.venue || '',
      venue_address: event.venue_address || '',
      city: event.city || '',
      image_url: event.image_url || '',
      category: event.category || 'networking',
      max_attendees: event.max_attendees || '',
      entry_fee: event.entry_fee || 0,
      currency: event.currency || 'INR',
      is_members_only: event.is_members_only !== false,
      is_active: event.is_active !== false,
      registration_deadline: event.registration_deadline?.split('T')[0] || ''
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setSelectedEvent(null);
    setFormData({
      title: '', description: '', event_date: '', event_time: '', venue: '',
      venue_address: '', city: '', image_url: '', category: 'networking',
      max_attendees: '', entry_fee: 0, currency: 'INR', is_members_only: true,
      is_active: true, registration_deadline: ''
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { INR: '₹', USD: '$', AED: 'د.إ', GBP: '£', EUR: '€' };
    return symbols[currency] || currency;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            Events Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage member events and registrations</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
          data-testid="add-event-btn"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(event => (
          <div key={event.id} className="bg-[#1A1A1C] border border-white/10 rounded-xl overflow-hidden">
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-semibold">{event.title}</h3>
                <span className={`px-2 py-0.5 text-xs rounded ${event.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {event.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.event_date)}</span>
                  {event.event_time && <span>at {event.event_time}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue}, {event.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{event.attendee_count || 0} registered</span>
                  {event.max_attendees && <span className="text-gray-500">/ {event.max_attendees} max</span>}
                </div>
                {event.entry_fee > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{getCurrencySymbol(event.currency)}{event.entry_fee}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openViewModal(event)} className="flex-1 btn-secondary text-sm py-2">
                  <Eye className="w-4 h-4 mr-1 inline" /> View
                </button>
                <button onClick={() => openEditModal(event)} className="flex-1 btn-primary text-sm py-2">
                  <Edit className="w-4 h-4 mr-1 inline" /> Edit
                </button>
                <button onClick={() => handleDelete(event.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No events found. Create your first event!</p>
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              {selectedEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="input-label">Event Title *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-gold" required />
            </div>
            <div>
              <label className="input-label">Description *</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-gold resize-none" rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Event Date *</label>
                <input type="date" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} className="input-gold" required />
              </div>
              <div>
                <label className="input-label">Event Time</label>
                <input type="time" value={formData.event_time} onChange={(e) => setFormData({...formData, event_time: e.target.value})} className="input-gold" />
              </div>
            </div>
            <div>
              <label className="input-label">Venue *</label>
              <input type="text" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} className="input-gold" required placeholder="Venue name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Venue Address</label>
                <input type="text" value={formData.venue_address} onChange={(e) => setFormData({...formData, venue_address: e.target.value})} className="input-gold" />
              </div>
              <div>
                <label className="input-label">City</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="input-gold" />
              </div>
            </div>
            <div>
              <label className="input-label">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1C] border-white/10">
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="party">Party</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="celebration">Celebration</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="input-label">Entry Fee</label>
                <input type="number" value={formData.entry_fee} onChange={(e) => setFormData({...formData, entry_fee: e.target.value})} className="input-gold" min="0" />
              </div>
              <div>
                <label className="input-label">Currency</label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({...formData, currency: v})}>
                  <SelectTrigger className="w-full bg-[#0F0F10] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1C] border-white/10">
                    <SelectItem value="INR">₹ INR</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="AED">د.إ AED</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="input-label">Max Attendees</label>
                <input type="number" value={formData.max_attendees} onChange={(e) => setFormData({...formData, max_attendees: e.target.value})} className="input-gold" min="1" placeholder="Unlimited" />
              </div>
            </div>
            <div>
              <label className="input-label">Image URL</label>
              <input type="url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="input-gold" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_members_only} onChange={(e) => setFormData({...formData, is_members_only: e.target.checked})} className="w-4 h-4 accent-[#D4AF37]" />
                <span className="text-sm text-gray-300">Members Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 accent-[#D4AF37]" />
                <span className="text-sm text-gray-300">Active</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">{selectedEvent ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Event Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#1A1A1C] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>
              Event Registrations
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-[#0F0F10] rounded-lg">
                <h3 className="text-white font-semibold">{selectedEvent.title}</h3>
                <p className="text-gray-400 text-sm">{formatDate(selectedEvent.event_date)} at {selectedEvent.venue}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-2">Registered Members ({registrations.length})</p>
                {registrations.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {registrations.map(reg => (
                      <div key={reg.id} className="p-3 bg-[#0F0F10] rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm">{reg.member_name || reg.member_id}</p>
                          <p className="text-gray-500 text-xs">{reg.member_mobile}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#D4AF37] text-xs">+{reg.guests || 0} guests</p>
                          <p className="text-gray-500 text-xs">{new Date(reg.registered_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No registrations yet</p>
                )}
              </div>
              
              <button onClick={() => setViewModalOpen(false)} className="btn-secondary w-full">Close</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default EventsPage;
