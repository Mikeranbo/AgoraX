import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  PlusCircle, 
  Building2, 
  LayoutDashboard, 
  Plus, 
  X,
  TrendingUp,
  Award,
  Zap,
  Users,
  Filter,
  Search,
  Bell,
  Menu,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { MOCK_EVENTS, MOCK_VENUES } from './constants/mockData';
import { Event, Venue, User, EventCategory } from './types';
import { EventCard } from './components/EventCard';
import { VenueCard } from './components/VenueCard';

// --- Views ---

type ActiveModal = 'none' | 'list-venue' | 'more' | 'promote' | 'notifications' | 'search' | 'success';

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-[60]"
        />
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }} 
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass rounded-t-[40px] p-8 z-[70] max-h-[85vh] overflow-y-auto no-scrollbar border-t border-white/20"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-black text-white">{title}</h2>
            <button onClick={onClose} className="p-2 glass rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const FeedView = ({ events, onJoin, onSearch, onNotify }: { events: Event[], onJoin: (id: string) => void, onSearch: () => void, onNotify: () => void }) => {
  const [filter, setFilter] = useState<EventCategory | 'All'>('All');
  
  const filteredEvents = useMemo(() => {
    return filter === 'All' ? events : events.filter(e => e.category === filter);
  }, [events, filter]);

  const categories: (EventCategory | 'All')[] = ['All', 'Workshop', 'Concert', 'Cultural', 'Social', 'Fitness', 'Startup'];

  return (
    <div className="pb-24">
      <div className="px-6 pt-10 pb-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display font-black text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-primary">Discover</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Trending in your hub</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onSearch}
              className="glass p-2.5 rounded-2xl text-slate-300 hover:text-white transition-colors"
            >
              <Search size={20} />
            </button>
            <button 
              onClick={onNotify}
              className="glass p-2.5 rounded-2xl text-slate-300 hover:text-white relative group"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-secondary rounded-full border-2 border-brand-dark group-hover:scale-125 transition-transform"></span>
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-3 no-scrollbar pb-4 pr-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                filter === cat 
                  ? 'gradient-brand text-white shadow-lg shadow-indigo-500/20' 
                  : 'glass text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-6">
        {filteredEvents.map(event => (
          <EventCard key={event.id} event={event} onJoin={onJoin} />
        ))}
      </div>
    </div>
  );
};

const CreateView = ({ onAddEvent, venues }: { onAddEvent: (e: any) => void, venues: Venue[] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Cultural' as EventCategory,
    price: 15,
    minParticipants: 20,
    deadline: '',
    venueId: '',
  });

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      currentParticipants: 0,
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      status: 'Pending',
      organizerId: 'me',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    };
    onAddEvent(newEvent);
  };

  return (
    <div className="pb-32 px-6 pt-12 overflow-y-auto max-h-[90vh] no-scrollbar">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-white tracking-tight mb-2">Create Logic Event</h1>
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} className="text-brand-secondary" /> Zero local risk infrastructure
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Event Title</label>
          <input 
            required
            className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="e.g. Startup Mixer"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Category</label>
            <select 
              className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as EventCategory })}
            >
              <option className="bg-[#0f172a]">Workshop</option>
              <option className="bg-[#0f172a]">Concert</option>
              <option className="bg-[#0f172a]">Cultural</option>
              <option className="bg-[#0f172a]">Social</option>
              <option className="bg-[#0f172a]">Fitness</option>
              <option className="bg-[#0f172a]">Startup</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Price (€)</label>
            <input 
              type="number"
              className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="p-6 gradient-creation rounded-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 blur-2xl rounded-full group-hover:scale-110 transition-transform"></div>
          <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
            <Zap size={16} className="text-brand-secondary" /> The Threshold
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] uppercase font-bold text-indigo-100 tracking-widest">Min. Participants</label>
                <span className="font-black text-white text-xl">{formData.minParticipants}</span>
              </div>
              <input 
                type="range" min="5" max="100" step="5"
                className="w-full accent-brand-secondary h-1.5 bg-indigo-900/40 rounded-full appearance-none cursor-pointer"
                value={formData.minParticipants}
                onChange={e => setFormData({ ...formData, minParticipants: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold text-indigo-100 tracking-widest block mb-1">Confirmation Deadline</label>
              <input 
                type="datetime-local"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 ring-brand-secondary"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              />
              <p className="text-[9px] text-white/60 font-medium italic mt-2 leading-tight">
                * If threshold isn't met, venue booking is released and payments refunded automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Attach Source Venue</label>
          <div className="grid grid-cols-1 gap-4">
             {!selectedVenue ? (
               <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                 {venues.map(v => (
                   <div key={v.id} onClick={() => { setSelectedVenue(v); setFormData({ ...formData, venueId: v.id }); }} className="cursor-pointer shrink-0 w-64">
                     <VenueCard venue={v} compact />
                   </div>
                 ))}
               </div>
             ) : (
               <div className="relative group">
                 <VenueCard venue={selectedVenue} compact />
                 <button 
                   type="button"
                   onClick={() => setSelectedVenue(null)}
                   className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform"
                 >
                   <X size={14} />
                 </button>
               </div>
             )}
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-5 bg-white text-[#0f172a] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transform active:scale-95 transition-transform mt-4"
        >
          Launch Logic Event
        </button>
      </form>
    </div>
  );
};

const VenueMarketplace = ({ venues, onListVenue, onSelectVenue }: { venues: Venue[], onListVenue: () => void, onSelectVenue: (v: Venue) => void }) => {
  return (
    <div className="pb-32 px-6 pt-12">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight uppercase">Spaces</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Monetize unused capacity</p>
          </div>
        </div>
        <button 
          onClick={onListVenue}
          className="glass px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-secondary flex items-center gap-2 hover:bg-white/10 transition-colors"
        >
          <Plus size={14} /> List Space
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {venues.map(venue => (
          <VenueCard key={venue.id} venue={venue} onSelect={() => onSelectVenue(venue)} />
        ))}
      </div>
    </div>
  );
};

const DashboardView = ({ events, onPromote }: { events: Event[], onPromote: () => void }) => {
  const organiserEvents = events.filter(e => e.organizerId === 'user1' || e.organizerId === 'me');
  
  const stats = {
    totalProjected: organiserEvents.reduce((acc, e) => acc + (e.currentParticipants * e.price), 0),
    activeEvents: organiserEvents.filter(e => e.status === 'Pending').length,
    successRate: '92%'
  };

  return (
    <div className="pb-32 px-6 pt-12">
      <h1 className="text-3xl font-display font-black text-white tracking-tight mb-8">Organiser Hub</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass p-5 rounded-3xl overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={64} className="text-brand-secondary" />
          </div>
          <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-1">Projected Earnings</p>
          <p className="text-2xl font-display font-black text-white">€{stats.totalProjected}</p>
          <div className="flex items-center gap-1 text-brand-secondary text-[9px] font-bold mt-3">
             +12.5% vs last week
          </div>
        </div>
        <div className="glass p-5 rounded-3xl overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Award size={64} className="text-brand-primary" />
          </div>
          <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-1">Success Rate</p>
          <p className="text-2xl font-display font-black text-white">{stats.successRate}</p>
          <div className="flex items-center gap-1 text-brand-primary text-[9px] font-bold mt-3 uppercase tracking-wider italic">
            Elite Organizer
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display font-bold text-white text-lg uppercase tracking-tight">Active Sourcing</h2>
          <button className="text-brand-secondary text-[11px] font-bold uppercase tracking-widest">History</button>
        </div>
        <div className="space-y-4">
          {organiserEvents.map(e => (
            <div key={e.id} className="glass p-4 rounded-2xl flex items-center gap-4 group cursor-pointer hover:border-brand-primary/50 transition-all">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                <img src={e.imageUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-white text-sm leading-tight mb-1">{e.title}</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                    <Users size={10} /> {e.currentParticipants}/{e.minParticipants}
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                    e.status === 'Confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {e.status}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-brand-secondary transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="gradient-boost p-8 rounded-3xl border border-brand-secondary/30 relative overflow-hidden group shadow-2xl shadow-brand-secondary/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
          <Sparkles size={140} className="text-white" />
        </div>
        <div className="relative z-10">
          <h3 className="font-display font-black text-white text-2xl mb-3 leading-tight">
            Boost Your Visibility
          </h3>
          <p className="text-white/70 text-xs mb-8 leading-relaxed max-w-[220px]">
            Acquire 1,000 extra local visits to your sourcing logic for only €19.99.
          </p>
          <button 
            onClick={onPromote}
            className="w-full py-4 bg-brand-secondary text-brand-dark rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-brand-secondary/20"
          >
            Promote Now
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'create' | 'venues' | 'dashboard'>('feed');
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [venues, setVenues] = useState<Venue[]>(MOCK_VENUES);

  const handleJoinEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const newParticipants = e.currentParticipants + 1;
        const newStatus = newParticipants >= e.minParticipants ? 'Confirmed' : e.status;
        return { ...e, currentParticipants: newParticipants, status: newStatus as any };
      }
      return e;
    }));
    setActiveModal('success');
  };

  const handleAddEvent = (newEvent: Event) => {
    setEvents([newEvent, ...events]);
    setActiveTab('feed');
    setActiveModal('success');
  };

  const handleAddVenue = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newVenue: Venue = {
      id: Math.random().toString(36).substr(2, 9),
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      description: 'A newly listed creative space ready for your event.',
      location: (form.elements.namedItem('location') as HTMLInputElement).value,
      hourlyRate: parseInt((form.elements.namedItem('rate') as HTMLInputElement).value),
      capacity: parseInt((form.elements.namedItem('capacity') as HTMLInputElement).value),
      imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    };
    setVenues([newVenue, ...venues]);
    setActiveModal('none');
    setActiveModal('success');
  };

  const handleStartWithVenue = (v: Venue) => {
    setActiveTab('create');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'feed': return <FeedView events={events} onJoin={handleJoinEvent} onSearch={() => setActiveModal('search')} onNotify={() => setActiveModal('notifications')} />;
      case 'create': return <CreateView onAddEvent={handleAddEvent} venues={venues} />;
      case 'venues': return <VenueMarketplace venues={venues} onListVenue={() => setActiveModal('list-venue')} onSelectVenue={handleStartWithVenue} />;
      case 'dashboard': return <DashboardView events={events} onPromote={() => setActiveModal('promote')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-white/5 selection:bg-brand-primary/30">
      
      {/* Bento Grid Background Accents */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 -right-20 w-64 h-64 bg-brand-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Decorative Header (Visible on Desktop Container) */}
      <div className="hidden sm:block absolute -left-64 top-20 w-48 p-5 glass rounded-3xl shadow-2xl transform rotate-3 z-0">
        <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2">The Mission</p>
        <p className="text-sm font-bold text-white leading-snug">Decentralising culture through community logic.</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Modals Interface */}
      <Modal isOpen={activeModal === 'list-venue'} onClose={() => setActiveModal('none')} title="List Your Space">
        <form onSubmit={handleAddVenue} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Venue Name</label>
            <input name="name" required className="w-full glass bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="e.g. Neon Warehouse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Rate (€/hr)</label>
              <input name="rate" type="number" required className="w-full glass bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="45" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Capacity</label>
              <input name="capacity" type="number" required className="w-full glass bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="100" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Location</label>
            <input name="location" required className="w-full glass bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Art District" />
          </div>
          <button type="submit" className="w-full py-4 gradient-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest mt-4">
            Register Space
          </button>
        </form>
      </Modal>

      <Modal isOpen={activeModal === 'promote'} onClose={() => setActiveModal('none')} title="Boost Visibility">
        <div className="space-y-4">
          <div className="p-4 glass rounded-2xl border-brand-secondary/30">
            <p className="text-xs text-slate-300 mb-2 font-medium">Selected Booster:</p>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">1,000 Local Impressions</span>
              <span className="text-brand-secondary font-black">€19.99</span>
            </div>
          </div>
          <div className="space-y-3">
             <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
               <span className="text-white text-sm">Targeting: <span className="font-bold text-brand-primary">Lansdowne Hub</span></span>
               <button className="text-[10px] text-brand-secondary font-bold underline">Change</button>
             </div>
          </div>
          <button 
            onClick={() => { setActiveModal('success'); }}
            className="w-full py-4 bg-brand-secondary text-brand-dark rounded-2xl font-black text-sm uppercase tracking-widest mt-6"
          >
            Confirm & Pay
          </button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'more'} onClose={() => setActiveModal('none')} title="More Options">
        <div className="space-y-2">
          {['Your Profile', 'Wallet & Payouts', 'Cultural Metrics', 'Network Stats', 'Security & Privacy', 'Help Center'].map((item, i) => (
            <button key={item} className="w-full p-4 glass rounded-2xl text-left text-slate-200 hover:text-white hover:bg-white/10 transition-all flex justify-between items-center group">
              <span className="text-sm font-bold uppercase tracking-wider">{item}</span>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-brand-secondary" />
            </button>
          ))}
          <button className="w-full p-4 text-red-400 font-bold text-sm uppercase tracking-widest mt-4 text-center">Sign Out</button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'notifications'} onClose={() => setActiveModal('none')} title="Notifications">
        <div className="space-y-4">
          {[
            { t: 'Event Confirmed!', d: 'Botanic Yoga reached its threshold.', age: '2m ago' },
            { t: 'New Space Near You', d: 'The Glasshouse is now listing afternoons.', age: '1h ago' },
            { t: 'Payout Successful', d: '€145.00 credited to your wallet.', age: '5h ago' }
          ].map((n, i) => (
            <div key={i} className="p-4 glass rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary"></div>
              <p className="text-white font-bold text-sm mb-1">{n.t}</p>
              <p className="text-slate-400 text-xs mb-2">{n.d}</p>
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{n.age}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'search'} onClose={() => setActiveModal('none')} title="Search AgoraX">
        <div className="space-y-6">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input className="w-full glass bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 ring-brand-primary outline-none" placeholder="Search events, venues, organizers..." autoFocus />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3 ml-1">Recent Searches</p>
            <div className="flex flex-wrap gap-2">
              {['Yoga', 'Jazz', 'Networking', 'Warehouse'].map(s => (
                <span key={s} className="px-4 py-2 glass rounded-full text-xs text-slate-300 font-medium cursor-pointer hover:bg-white/10 transition-colors">#{s}</span>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'success'} onClose={() => setActiveModal('none')} title="">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-display font-black text-white mb-2">Success!</h2>
          <p className="text-slate-400 text-sm max-w-[200px] leading-relaxed">
            Your action has been recorded in the cultural ledger.
          </p>
          <button 
            onClick={() => setActiveModal('none')}
            className="mt-10 px-8 py-3 bg-white text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            Continue
          </button>
        </div>
      </Modal>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-brand-dark/40 backdrop-blur-2xl border-t border-white/10 px-8 py-5 flex justify-between items-center z-50">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'feed' ? 'text-brand-secondary scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Compass size={24} strokeWidth={activeTab === 'feed' ? 2.5 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Feed</span>
        </button>
        <button 
          onClick={() => setActiveTab('venues')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'venues' ? 'text-brand-secondary scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Building2 size={24} strokeWidth={activeTab === 'venues' ? 2.5 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Venues</span>
        </button>
        
        {/* Centered Create Button */}
        <div className="relative -top-8">
          <button 
            onClick={() => setActiveTab('create')}
            className={`w-16 h-16 rounded-3xl shadow-2xl transition-all duration-300 flex items-center justify-center text-white active:scale-90 group ${activeTab === 'create' ? 'bg-white scale-110' : 'gradient-brand'}`}
          >
            <Plus size={36} className={`transition-colors duration-300 ${activeTab === 'create' ? 'text-brand-dark' : 'text-white'}`} />
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-brand-secondary scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <LayoutDashboard size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
          <span className="text-[9px] font-black uppercase tracking-widest">Owner</span>
        </button>
        <button 
          onClick={() => setActiveModal('more')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeModal === 'more' ? 'text-brand-secondary scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Menu size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">More</span>
        </button>
      </nav>

      {/* Logo Floating Top Banner (Mobile) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2 glass-dark rounded-full z-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-secondary shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse"></div>
          <span className="font-display font-black text-white text-xs tracking-[0.2em] italic">AGORA<span className="text-brand-secondary">X</span></span>
        </div>
      </div>
    </div>
  );
}


