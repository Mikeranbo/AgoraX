import React, { useState, useMemo, useEffect } from 'react';
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
  CheckCircle2,
  MessageSquare,
  Send,
  ExternalLink,
  Info,
  LogOut,
  User as UserIcon,
  Wallet,
  Shield,
  Activity,
  HelpCircle,
  Hash,
  Upload,
} from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  subscribeToEvents, 
  subscribeToVenues, 
  createEvent, 
  createVenue, 
  joinEvent,
  trackImpression,
  trackClick,
  subscribeToComments,
  addComment
} from './services/firebaseService';
import { Event, Venue, User, EventCategory, Comment } from './types';
import { EventCard } from './components/EventCard';
import { VenueCard } from './components/VenueCard';

// --- Components ---

const AuthHero = () => {
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#0f172a]">
      <div className="w-24 h-24 gradient-brand rounded-[40px] flex items-center justify-center mb-8 shadow-2xl shadow-brand-primary/20 animate-pulse">
        <span className="font-display font-black text-white text-4xl italic">A<span className="text-brand-secondary">X</span></span>
      </div>
      <h1 className="text-4xl font-display font-black text-white mb-4 tracking-tighter">Welcome to AgoraX</h1>
      <p className="text-slate-400 text-sm max-w-[280px] mb-12 leading-relaxed font-medium mt-2">
        A decentralized infrastructure for culture and community logic.
      </p>
      <button 
        onClick={handleLogin}
        className="w-full max-w-xs py-4 bg-white text-brand-dark rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
      >
        Login with Google
      </button>
    </div>
  );
};

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

const FeedView = ({ events, onJoin, onSearch, onNotify, onSelectEvent }: { events: Event[], onJoin: (id: string) => void, onSearch: () => void, onNotify: () => void, onSelectEvent: (e: Event) => void }) => {
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
          <EventCard key={event.id} event={event} onJoin={onJoin} onClick={onSelectEvent} />
        ))}
        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 glass rounded-full mb-4">
              <Filter className="text-slate-600" size={32} />
            </div>
            <p className="text-white font-bold opacity-40 uppercase tracking-widest text-xs">No events found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

const EventDetailView = ({ event, onBack, onJoin }: { event: Event, onBack: () => void, onJoin: (id: string) => void }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  useEffect(() => {
    trackClick(event.id);
    return subscribeToComments(event.id, setComments);
  }, [event.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    await addComment(event.id, {
      eventId: event.id,
      userId: auth.currentUser?.uid || 'anon',
      userName: auth.currentUser?.displayName || 'Anonymous User',
      text: commentText
    });
    setCommentText('');
  };

  const progress = Math.min((event.participantsCount / event.minParticipants) * 100, 100);
  const images = event.imageUrls && event.imageUrls.length > 0 ? event.imageUrls : ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'];

  return (
    <div className="pb-32 min-h-screen bg-[#0f172a]">
      <div className="relative h-80 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            src={images[activeImageIndex]} 
            className="w-full h-full object-cover" 
            alt="" 
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent"></div>
        
        {/* Gallery Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-2 z-20">
            {images.map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`h-1 rounded-full transition-all ${i === activeImageIndex ? 'w-8 bg-brand-secondary' : 'w-2 bg-white/30'}`}
              />
            ))}
          </div>
        )}

        <button 
          onClick={onBack}
          className="absolute top-12 left-6 p-3 glass rounded-2xl text-white active:scale-90 transition-transform z-20"
        >
          <ChevronRight className="rotate-180" size={20} />
        </button>
      </div>

      <div className="px-6 -mt-20 relative z-10">
        <div className="glass p-6 rounded-[32px] border-white/10 shadow-2xl mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary mb-1 block">
                {event.category}
              </span>
              <h1 className="text-3xl font-display font-black text-white leading-tight">
                {event.title}
              </h1>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-white font-bold text-xs">
              €{event.price}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-brand-primary flex items-center justify-center text-[10px] font-bold text-white">
                +{event.participantsCount}
              </div>
            </div>
            <span className="text-slate-400 text-xs font-medium">Joined the sourcing</span>
          </div>

          <div className="space-y-4">
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full gradient-brand shadow-[0_0_12px_rgba(34,211,238,0.4)]"
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-brand-secondary">{Math.round(progress)}% of Minimum goal</span>
              <span className="text-slate-500">{event.minParticipants} required</span>
            </div>
          </div>
        </div>

        <div className="space-y-8 mb-10">
          <div>
            <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3 ml-1">About this Event</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {event.mapsLink && (
            <div>
              <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3 ml-1">Location Details</h3>
              <a 
                href={event.mapsLink} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 p-4 glass rounded-2xl group hover:border-brand-primary/50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white">
                  <ExternalLink size={18} />
                </div>
                <div className="flex-grow">
                  <p className="text-white text-sm font-bold truncate">{event.mapsLink}</p>
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-0.5">Open in Google Maps</p>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-brand-secondary" />
              </a>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4 ml-1">
              <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">Community Feed</h3>
              <span className="text-[10px] font-bold py-1 px-2 bg-white/5 rounded-md text-slate-400">{comments.length} Comments</span>
            </div>
            
            <div className="space-y-4 mb-6">
              {comments.map((c, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={c.id || i} 
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {c.userName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="glass-dark p-3 rounded-2xl rounded-tl-none border border-white/5 flex-grow">
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-[10px] font-bold tracking-tight">{c.userName}</span>
                      <span className="text-[8px] text-slate-600 font-bold uppercase">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{c.text}</p>
                  </div>
                </motion.div>
              ))}
              {comments.length === 0 && (
                <div className="p-8 border border-dashed border-white/5 rounded-3xl text-center">
                  <MessageSquare className="mx-auto text-slate-700 mb-2" size={24} />
                  <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">Start the conversation</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAddComment} className="relative">
              <input 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full glass bg-white/5 border border-white/10 rounded-2xl pl-4 pr-14 py-4 text-white text-xs focus:ring-2 ring-brand-primary outline-none transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 aspect-square gradient-brand rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="fixed bottom-10 left-6 right-6 max-w-md mx-auto z-50">
          <button
            onClick={() => onJoin(event.id)}
            className="w-full py-5 gradient-brand text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-primary/40 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Join This Event <Users size={18} />
          </button>
        </div>
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
    mapsLink: '',
  });

  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const handleFileUpload = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleImageChange(index, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImageField = () => setImageUrls([...imageUrls, '']);
  const handleRemoveImageField = (index: number) => {
    const newImages = [...imageUrls];
    newImages.splice(index, 1);
    setImageUrls(newImages);
  };
  const handleImageChange = (index: number, val: string) => {
    const newImages = [...imageUrls];
    newImages[index] = val;
    setImageUrls(newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = {
      ...formData,
      participantsCount: 0,
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      status: 'Pending' as const,
      organizerId: auth.currentUser?.uid || 'anon',
      imageUrls: imageUrls.filter(url => url.trim() !== ''),
    };
    onAddEvent(newEvent);
  };

  return (
    <div className="pb-32 px-6 pt-12 overflow-y-auto max-h-[90vh] no-scrollbar">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black text-white tracking-tight mb-2">Create Event</h1>
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

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Event Description</label>
          <textarea 
            required
            className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[120px] text-sm"
            placeholder="What is this event about?"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Google Maps Link</label>
          <input 
            className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="Paste Google Maps URL"
            value={formData.mapsLink}
            onChange={e => setFormData({ ...formData, mapsLink: e.target.value })}
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

        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Event Images</label>
          <div className="space-y-3">
            {imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-grow group">
                  <input 
                    className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                    placeholder="Paste URL or upload"
                    value={url}
                    onChange={e => handleImageChange(index, e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    <label className="cursor-pointer text-slate-500 hover:text-white transition-colors">
                      <Upload size={18} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileUpload(index)}
                      />
                    </label>
                  </div>
                </div>
                {imageUrls.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => handleRemoveImageField(index)}
                    className="p-4 glass rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button"
              onClick={handleAddImageField}
              className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-widest hover:border-brand-primary/50 hover:text-brand-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Add Another Image
            </button>
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
          Launch Event
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

const DashboardView = ({ events, onPromote, onSelectEvent }: { events: Event[], onPromote: () => void, onSelectEvent: (e: Event) => void }) => {
  const organiserEvents = events.filter(e => e.organizerId === auth.currentUser?.uid);
  
  const stats = {
    totalProjected: organiserEvents.reduce((acc, e) => acc + (e.participantsCount * e.price), 0),
    activeEvents: organiserEvents.filter(e => e.status === 'Pending').length,
    successRate: organiserEvents.length > 0 ? `${Math.round((organiserEvents.filter(e => e.participantsCount >= e.minParticipants).length / organiserEvents.length) * 100)}%` : '0%'
  };

  return (
    <div className="pb-32 px-6 pt-12 overflow-y-auto max-h-[90vh] no-scrollbar">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-display font-black text-white tracking-tight">Your Hub</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Sourcing Dashboard</p>
        </div>
        <div className="glass p-2 rounded-xl text-brand-secondary flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
          <span className="text-[10px] font-black uppercase">Live Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass p-5 rounded-3xl overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={64} className="text-brand-secondary" />
          </div>
          <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-1">Projected €</p>
          <p className="text-2xl font-display font-black text-white">€{stats.totalProjected}</p>
        </div>
        <div className="glass p-5 rounded-3xl overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Award size={64} className="text-brand-primary" />
          </div>
          <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-1">Status Hit</p>
          <p className="text-2xl font-display font-black text-white">{stats.successRate}</p>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display font-bold text-white text-lg uppercase tracking-tight">Your Sourcing</h2>
          <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">{organiserEvents.length} Total</span>
        </div>
        
        {organiserEvents.length > 0 ? (
          <div className="space-y-4">
            {organiserEvents.map(e => (
              <div 
                key={e.id} 
                onClick={() => onSelectEvent(e)}
                className="glass p-4 rounded-2xl flex items-center gap-4 group cursor-pointer hover:border-brand-primary/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                  <img src={e.imageUrls && e.imageUrls.length > 0 ? e.imageUrls[0] : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-white text-sm leading-tight mb-1">{e.title}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                      <Users size={10} /> {e.participantsCount}/{e.minParticipants}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-brand-secondary font-bold uppercase">
                      <TrendingUp size={10} /> {e.impressions || 0} hits
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-brand-secondary transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 glass rounded-[32px] text-center border-dashed border-white/10">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No events created yet</p>
            <button 
              onClick={() => onPromote()} // Using onPromote as a placeholder to trigger something or just show a message
              className="mt-4 text-brand-primary text-xs font-black uppercase tracking-widest"
            >
              Start Sourcing
            </button>
          </div>
        )}
      </div>

      <div className="gradient-boost p-8 rounded-3xl border border-brand-secondary/30 relative overflow-hidden group shadow-2xl shadow-brand-secondary/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
          <Sparkles size={140} className="text-white" />
        </div>
        <div className="relative z-10">
          <h3 className="font-display font-black text-white text-2xl mb-3 leading-tight">
            Boost Visibility
          </h3>
          <p className="text-white/70 text-xs mb-8 leading-relaxed max-w-[220px]">
            Acquire 1,000 extra local visits for only €19.99.
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

const MoreModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [view, setView] = useState<'root' | 'profile' | 'wallet' | 'metrics' | 'network' | 'security' | 'help'>('root');

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  const menuItems = [
    { id: 'profile', label: 'Your Profile', icon: UserIcon },
    { id: 'wallet', label: 'Wallet & Payouts', icon: Wallet },
    { id: 'metrics', label: 'Cultural Metrics', icon: Activity },
    { id: 'network', label: 'Network Stats', icon: Compass },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
  ];

  const renderModalContent = () => {
    switch (view) {
      case 'profile':
        return (
          <div className="p-8">
            <button onClick={() => setView('root')} className="mb-6 text-slate-500 flex items-center gap-2 font-bold text-xs uppercase">
              <ChevronRight className="rotate-180" size={16} /> Back
            </button>
            <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Your Identity</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 glass rounded-3xl">
                <div className="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center text-white text-xl font-bold">
                  {auth.currentUser?.displayName?.[0] || 'A'}
                </div>
                <div>
                  <p className="text-white font-bold">{auth.currentUser?.displayName}</p>
                  <p className="text-slate-500 text-xs">{auth.currentUser?.email}</p>
                </div>
              </div>
              <div className="p-4 glass rounded-3xl border-white/5">
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Member Since</p>
                <p className="text-white text-sm font-bold">{new Date(auth.currentUser?.metadata.creationTime || '').toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        );
      case 'wallet':
        return (
          <div className="p-8">
            <button onClick={() => setView('root')} className="mb-6 text-slate-500 flex items-center gap-2 font-bold text-xs uppercase">
              <ChevronRight className="rotate-180" size={16} /> Back
            </button>
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Wallet Balance</h2>
            <div className="gradient-brand p-8 rounded-[40px] shadow-2xl shadow-brand-primary/20 mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120} /></div>
               <p className="text-white/70 text-[10px] uppercase font-black tracking-widest mb-1">Available Funds</p>
               <p className="text-5xl font-display font-black text-white tracking-tighter">€0.00</p>
            </div>
            <button className="w-full py-4 glass text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
              Connect Stripe
            </button>
          </div>
        );
      case 'metrics':
        return (
          <div className="p-8">
            <button onClick={() => setView('root')} className="mb-6 text-slate-500 flex items-center gap-2 font-bold text-xs uppercase">
              <ChevronRight className="rotate-180" size={16} /> Back
            </button>
            <h2 className="text-2xl font-black text-white mb-6 tracking-tight">Cultural Metrics</h2>
            <div className="space-y-4">
              {[
                { label: 'Network Trust', value: 'Level 4', color: 'text-brand-primary' },
                { label: 'Event Reliability', value: '100%', color: 'text-green-400' },
                { label: 'Community Karma', value: '2,450', color: 'text-brand-secondary' }
              ].map(item => (
                <div key={item.label} className="p-4 glass rounded-2xl flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{item.label}</span>
                  <span className={`font-black ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'network':
      case 'security':
      case 'help':
        return (
          <div className="p-8">
            <button onClick={() => setView('root')} className="mb-6 text-slate-500 flex items-center gap-2 font-bold text-xs uppercase">
              <ChevronRight className="rotate-180" size={16} /> Back
            </button>
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight uppercase italic">
              {view === 'network' ? 'Network Stats' : view === 'security' ? 'Security & Privacy' : 'Help Center'}
            </h2>
            <div className="p-12 glass rounded-[40px] flex flex-col items-center justify-center text-center">
              <Activity className="text-brand-primary/20 mb-4 animate-pulse" size={48} />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Syncing...</p>
              <p className="text-[10px] text-slate-600 mt-2 italic px-8">Decrypting regional protocol data in your sector.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-8">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-display font-black text-white tracking-tight italic">Options<span className="text-brand-secondary">.</span></h2>
              <button onClick={onClose} className="p-2 glass rounded-xl text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-10">
              {menuItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className="w-full glass p-5 rounded-3xl flex items-center justify-between group hover:border-brand-primary/50 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                      <item.icon size={20} />
                    </div>
                    <span className="text-white font-bold text-sm tracking-tight uppercase">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-700 group-hover:text-brand-secondary transition-colors" />
                </button>
              ))}
            </div>

            <button 
              onClick={handleLogout}
              className="w-full py-5 glass-dark border border-white/5 text-slate-500 hover:text-red-400 hover:border-red-400/30 rounded-3xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg glass-dark rounded-t-[48px] sm:rounded-b-[48px] overflow-hidden relative shadow-2xl border border-white/10"
          >
            {renderModalContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'create' | 'venues' | 'dashboard'>('feed');
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [venueImageUrls, setVenueImageUrls] = useState<string[]>(['']);

  const handleVenueFileUpload = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleVenueImageChange(index, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVenueImageField = () => setVenueImageUrls([...venueImageUrls, '']);
  const handleRemoveVenueImageField = (index: number) => {
    const newImages = [...venueImageUrls];
    newImages.splice(index, 1);
    setVenueImageUrls(newImages);
  };
  const handleVenueImageChange = (index: number, val: string) => {
    const newImages = [...venueImageUrls];
    newImages[index] = val;
    setVenueImageUrls(newImages);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    const unsubscribeEvents = subscribeToEvents(setEvents);
    const unsubscribeVenues = subscribeToVenues(setVenues);

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
      unsubscribeVenues();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthHero />;
  }

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return;
    await joinEvent(eventId, user.uid);
    setActiveModal('success');
  };

  const handleAddEvent = async (newEvent: any) => {
    await createEvent(newEvent);
    setActiveTab('feed');
    setActiveModal('success');
  };

  const handleAddVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    await createVenue({
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      description: 'A newly listed creative space ready for your event.',
      location: (form.elements.namedItem('location') as HTMLInputElement).value,
      hourlyRate: parseInt((form.elements.namedItem('rate') as HTMLInputElement).value),
      capacity: parseInt((form.elements.namedItem('capacity') as HTMLInputElement).value),
      imageUrls: venueImageUrls.filter(url => url.trim() !== ''),
      ownerId: user.uid
    });
    setVenueImageUrls(['']);
    setActiveModal('none');
    setActiveModal('success');
  };

  const handleSelectEvent = (e: Event) => {
    setSelectedEvent(e);
  };

  const handleStartWithVenue = (v: Venue) => {
    setActiveTab('create');
  };

  const renderContent = () => {
    if (selectedEvent) {
      return (
        <EventDetailView 
          event={selectedEvent} 
          onBack={() => setSelectedEvent(null)} 
          onJoin={handleJoinEvent} 
        />
      );
    }

    switch (activeTab) {
      case 'feed': return (
        <FeedView 
          events={events} 
          onJoin={handleJoinEvent} 
          onSearch={() => setActiveModal('search')} 
          onNotify={() => setActiveModal('notifications')} 
          onSelectEvent={handleSelectEvent}
        />
      );
      case 'create': return <CreateView onAddEvent={handleAddEvent} venues={venues} />;
      case 'venues': return <VenueMarketplace venues={venues} onListVenue={() => setActiveModal('list-venue')} onSelectVenue={handleStartWithVenue} />;
      case 'dashboard': return <DashboardView events={events} onPromote={() => setActiveModal('promote')} onSelectEvent={handleSelectEvent} />;
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
      <MoreModal isOpen={activeModal === 'more'} onClose={() => setActiveModal('none')} />
      
      <Modal isOpen={activeModal === 'list-venue'} onClose={() => { setActiveModal('none'); setVenueImageUrls(['']); }} title="List Your Space">
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

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500">Space Images</label>
            <div className="space-y-2">
              {venueImageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-grow">
                    <input 
                      className="w-full glass bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-white text-sm"
                      placeholder="Paste URL or upload"
                      value={url}
                      onChange={e => handleVenueImageChange(index, e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      <label className="cursor-pointer text-slate-500 hover:text-white transition-colors">
                        <Upload size={14} />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleVenueFileUpload(index)}
                        />
                      </label>
                    </div>
                  </div>
                  {venueImageUrls.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveVenueImageField(index)}
                      className="p-3 glass rounded-xl text-red-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button"
                onClick={handleAddVenueImageField}
                className="w-full py-2 border border-dashed border-white/10 rounded-xl text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Plus size={12} /> Add Another Image
              </button>
            </div>
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


