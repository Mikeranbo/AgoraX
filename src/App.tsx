import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import {
  subscribeToEvents,
  subscribeToMyUser,
  joinEvent,
  leaveEvent,
  bumpEventCounter,
  recordOrganiserInterest,
  recordPriceAnswer,
  subscribeToComments,
  addComment,
} from './services/firebaseService';
import { ensureAnonymousAuth, touchUser, linkContact, getSource, describeAuthError } from './services/identity';
import { track, AnalyticsName } from './services/analytics';
import { once } from './services/session';
import { nextPriceFor } from './data/priceLadder';
import { canOfferHosting, formatDuration } from './data/earnings';
import { hasEnough, progressLabel, progressPercent } from './data/progress';
import { Event, Venue, EventCategory, Comment, UserDoc, PriceAnswer, PUBLIC_CATEGORIES } from './types';
import { EventCard } from './components/EventCard';
import { EventCover } from './components/EventCover';
import { VenueCard } from './components/VenueCard';
import { Modal } from './components/Modal';
import { ContactForm, ContactValues } from './components/ContactForm';
import { OrganiserPanel } from './components/OrganiserPanel';
import { PriceLadderSheet, LadderPrompt } from './components/PriceLadderSheet';
import { BottomBar } from './components/BottomBar';
import { SuggestionBox } from './components/SuggestionBox';
import { VenueOfferModal } from './components/VenueOfferModal';

// --- Components ---

const AuthHero = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0f172a] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-secondary/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 gradient-brand rounded-[32px] flex items-center justify-center mb-6 shadow-2xl shadow-brand-primary/20">
            <span className="font-display font-black text-white text-3xl italic">A<span className="text-brand-secondary">X</span></span>
          </div>
          <h1 className="text-3xl font-display font-black text-white mb-2 tracking-tight">AgoraX Secure Access</h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Distributed Culture Logic</p>
        </div>

        <div className="glass p-8 rounded-[40px] border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Profile Name</label>
                <input 
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm transition-all"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Email Protocol</label>
              <input 
                type="email"
                required
                placeholder="email@example.com"
                className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Access Key</label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                className="w-full glass bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase font-bold tracking-widest p-3 rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 gradient-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transform active:scale-95 transition-all mt-6 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isRegistering ? 'Initialize Identity' : 'Secure Entry'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary transition-colors"
            >
              {isRegistering ? 'Already have an access key?' : "Don't have an identity yet?"}
            </button>
          </div>
        </div>

        <p className="text-center mt-12 text-slate-600 text-[9px] uppercase tracking-widest font-medium">
          Protected by end-to-end encrypted protocol V2.4.0
        </p>
      </motion.div>
    </div>
  );
};

// --- Views ---

// Firestore serverTimestamp() fields arrive as Timestamp objects (or null
// briefly, before the write round-trips), not ISO strings — new Date() alone
// can't parse either.
const formatCommentTime = (value: any): string => {
  if (!value) return 'Just now';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return 'Just now';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface FeedViewProps {
  events: Event[];
  eventsLoaded: boolean;
  eventsError: boolean;
  joined: Set<string>;
  pending: Set<string>;
  onJoin: (e: Event) => void;
  onLeave: (e: Event) => void;
  onOpen: (e: Event) => void;
  onHelpRun: (e: Event) => void;
  onOfferSpace: () => void;
}

/** The scan-to-browse page: one question, a rule, and a grid of things people can vote for. */
const FeedView = ({ events, eventsLoaded, eventsError, joined, pending, onJoin, onLeave, onOpen, onHelpRun, onOfferSpace }: FeedViewProps) => {
  const [filter, setFilter] = useState<EventCategory | 'All'>('All');

  // Cancelled events are withdrawn from the public page; admins still see them at /admin.
  const visible = useMemo(() => events.filter((e) => e.status !== 'Cancelled'), [events]);
  const filtered = useMemo(
    () => (filter === 'All' ? visible : visible.filter((e) => e.category === filter)),
    [visible, filter],
  );
  const categories: (EventCategory | 'All')[] = ['All', ...PUBLIC_CATEGORIES];

  return (
    <div className="pb-40">
      <div className="px-6 pt-20 pb-4">
        <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight leading-tight max-w-2xl">
          What would you actually go to in Groningen?
        </h1>
        <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed">
          Every event has a target. When enough people want one, we run it.
        </p>

        <div className="flex overflow-x-auto gap-3 no-scrollbar py-5 pr-6" role="tablist" aria-label="Event categories">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={filter === cat}
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

      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            joined={joined.has(event.id)}
            busy={pending.has(event.id)}
            onJoin={onJoin}
            onLeave={onLeave}
            onOpen={onOpen}
            onHelpRun={onHelpRun}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="p-6 glass rounded-full mb-4">
            <Filter className="text-slate-600" size={32} />
          </div>
          <p className="text-white font-bold opacity-50 uppercase tracking-widest text-xs">
            {eventsError
              ? "Couldn't load events — check your connection and refresh"
              : !eventsLoaded
                ? 'Loading events…'
                : visible.length === 0
                  ? 'Events are being added — check back soon'
                  : 'No events in this category yet'}
          </p>
        </div>
      )}

      <div className="px-6">
        <SuggestionBox />
      </div>

      <footer className="px-6 mt-10 text-center">
        <button onClick={onOfferSpace} className="text-sm font-bold text-brand-secondary hover:text-white transition-colors underline underline-offset-4">
          I have a space
        </button>
        <p className="text-[11px] text-slate-600 mt-3">No account needed. Nothing is charged until an event runs.</p>
      </footer>
    </div>
  );
};

interface EventDetailViewProps {
  event: Event;
  joined: boolean;
  busy: boolean;
  onBack: () => void;
  onJoin: (e: Event) => void;
  onLeave: (e: Event) => void;
  onHelpRun: (e: Event) => void;
}

const EventDetailView = ({ event, joined, busy, onBack, onJoin, onLeave, onHelpRun }: EventDetailViewProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => subscribeToComments(event.id, setComments), [event.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await addComment(event.id, {
      eventId: event.id,
      userId: auth.currentUser?.uid || 'anon',
      userName: auth.currentUser?.displayName || 'Student',
      text: commentText.trim().slice(0, 500),
    });
    setCommentText('');
  };

  const images = (event.imageUrls ?? []).filter((u) => u && u.trim() !== '');
  const cover = { ...event, imageUrls: images.length ? [images[Math.min(activeImageIndex, images.length - 1)]] : [] };
  const enough = hasEnough(event);
  const cancelled = event.status === 'Cancelled';
  const duration = formatDuration(event.durationHours);

  return (
    <div className="pb-40 min-h-screen bg-[#0f172a]">
      <EventCover event={cover} size="hero" className="h-72 md:max-w-2xl md:mx-auto md:mt-8 md:rounded-[32px]">
        {images.length > 1 && (
          <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-2 z-20">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Photo ${i + 1}`}
                onClick={() => setActiveImageIndex(i)}
                className={`h-1 rounded-full transition-all ${i === activeImageIndex ? 'w-8 bg-brand-secondary' : 'w-2 bg-white/30'}`}
              />
            ))}
          </div>
        )}
        <button
          onClick={onBack}
          aria-label="Back to events"
          className="absolute top-14 left-6 p-3 glass rounded-2xl text-white active:scale-90 transition-transform z-20"
        >
          <ChevronRight className="rotate-180" size={20} />
        </button>
      </EventCover>

      <div className="px-6 -mt-12 relative z-10 md:max-w-2xl md:mx-auto">
        <div className="glass p-6 rounded-[32px] border-white/10 shadow-2xl mb-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary mb-1 block">
                {event.category}
                {event.season === 'spring' && ' · Spring trip'}
              </span>
              <h1 className="text-3xl font-display font-black text-white leading-tight">{event.title}</h1>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-white font-bold text-xs whitespace-nowrap">
              {event.price === 0 ? 'Free' : `€${event.price}`}
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent(event)}%` }}
                className={`h-full rounded-full ${enough ? 'bg-green-400' : 'gradient-brand shadow-[0_0_12px_rgba(34,211,238,0.4)]'}`}
              />
            </div>
            <p className="text-xs font-bold text-slate-200">{progressLabel(event)}</p>
          </div>
        </div>

        <div className="space-y-8 mb-10">
          <div>
            <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3 ml-1">About this event</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          {(duration || event.venueNote || event.bringYourOwn) && (
            <ul className="space-y-2 text-sm text-slate-300">
              {duration && <li>⏱ {duration}</li>}
              {event.venueNote && <li>📍 {event.venueNote}</li>}
              {event.bringYourOwn && <li>🎒 Not included: {event.bringYourOwn}</li>}
            </ul>
          )}

          {canOfferHosting(event) && !cancelled && (
            <button
              onClick={() => onHelpRun(event)}
              className="w-full py-3 rounded-2xl text-sm font-bold text-brand-secondary glass hover:bg-white/10 transition-colors"
            >
              Want to run this one? See what a host keeps
            </button>
          )}

          {event.mapsLink && (
            <div>
              <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3 ml-1">Location</h3>
              <a
                href={event.mapsLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 glass rounded-2xl group hover:border-brand-primary/50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white">
                  <ExternalLink size={18} />
                </div>
                <div className="flex-grow min-w-0">
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
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={c.id || i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {c.userName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="glass-dark p-3 rounded-2xl rounded-tl-none border border-white/5 flex-grow">
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-[10px] font-bold tracking-tight">{c.userName}</span>
                      <span className="text-[8px] text-slate-600 font-bold uppercase">{formatCommentTime(c.createdAt)}</span>
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
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                maxLength={500}
                className="w-full glass bg-white/5 border border-white/10 rounded-2xl pl-4 pr-14 py-4 text-white text-xs focus:ring-2 ring-brand-primary outline-none transition-all"
              />
              <button
                type="submit"
                aria-label="Post comment"
                className="absolute right-2 top-2 bottom-2 aspect-square gradient-brand rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="fixed bottom-6 left-6 right-6 max-w-md md:max-w-2xl mx-auto z-50">
          {cancelled ? (
            <button disabled className="w-full py-5 rounded-3xl font-black text-sm bg-slate-800 text-slate-500 cursor-not-allowed">
              Cancelled
            </button>
          ) : joined ? (
            <div className="flex items-center gap-3">
              <div className="flex-grow py-5 rounded-3xl font-black text-sm tracking-wide bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur-xl text-center">
                You're in
              </div>
              <button
                onClick={() => onLeave(event)}
                disabled={busy}
                className="px-6 py-5 rounded-3xl text-sm font-bold text-slate-300 glass backdrop-blur-xl disabled:opacity-50"
              >
                Leave
              </button>
            </div>
          ) : (
            <button
              onClick={() => onJoin(event)}
              disabled={busy}
              className="w-full py-5 gradient-brand text-white rounded-3xl font-black text-sm tracking-wide shadow-2xl shadow-brand-primary/40 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {busy ? 'Saving…' : <>I'd join <Users size={18} /></>}
            </button>
          )}
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
    <div className="pb-32 px-6 pt-12 overflow-y-auto max-h-[90vh] no-scrollbar md:max-w-xl md:mx-auto">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map(venue => (
          <VenueCard key={venue.id} venue={venue} onSelect={() => onSelectVenue(venue)} />
        ))}
        {venues.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 glass rounded-full mb-4">
              <Building2 className="text-slate-600" size={32} />
            </div>
            <p className="text-white font-bold opacity-40 uppercase tracking-widest text-xs">No spaces listed yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardView = ({ events, onPromote, onSelectEvent, onCreateEvent }: { events: Event[], onPromote: () => void, onSelectEvent: (e: Event) => void, onCreateEvent: () => void }) => {
  const organiserEvents = events.filter(e => e.organizerId === auth.currentUser?.uid);
  
  const stats = {
    totalProjected: organiserEvents.reduce((acc, e) => acc + (e.participantsCount * e.price), 0),
    activeEvents: organiserEvents.filter(e => e.status === 'Pending').length,
    successRate: organiserEvents.length > 0 ? `${Math.round((organiserEvents.filter(e => e.participantsCount >= e.minParticipants).length / organiserEvents.length) * 100)}%` : '0%'
  };

  return (
    <div className="pb-32 px-6 pt-12 overflow-y-auto max-h-[90vh] no-scrollbar md:max-w-xl md:mx-auto">
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
              onClick={onCreateEvent}
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
  const [stripeConnected, setStripeConnected] = useState(false);

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
                  {auth.currentUser?.displayName?.[0] || auth.currentUser?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="text-white font-bold">{auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0]}</p>
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
            <button
              onClick={() => setStripeConnected(true)}
              disabled={stripeConnected}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                stripeConnected
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                  : 'glass text-white hover:bg-white/5'
              }`}
            >
              {stripeConnected ? (<><CheckCircle2 size={16} /> Stripe Connected</>) : 'Connect Stripe'}
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

// --- Landing page (the public app) ---

const BANNER_DISMISSED_KEY = 'agorax_banner_dismissed';
let pageViewSent = false;

function readSessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [authError, setAuthError] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventsError, setEventsError] = useState(false);
  const [me, setMe] = useState<UserDoc | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [venueOfferOpen, setVenueOfferOpen] = useState(false);
  const [organiserEvent, setOrganiserEvent] = useState<Event | null>(null);
  const [ladder, setLadder] = useState<LadderPrompt | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => readSessionFlag(BANNER_DISMISSED_KEY));
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState('');

  const scrollBeforeOpen = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // No sign-in screen, ever: get an anonymous user first, then subscribe.
  useEffect(() => {
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];
    document.title = 'AgoraX — What would you actually go to in Groningen?';

    ensureAnonymousAuth()
      .then((user) => {
        if (cancelled) return;
        setUid(user.uid);
        setPhase('ready');
        void touchUser();
        if (!pageViewSent) {
          pageViewSent = true;
          track('page_view', { path: window.location.pathname });
        }
        unsubscribers.push(
          subscribeToEvents(
            (list) => {
              setEvents(list);
              setEventsLoaded(true);
              setEventsError(false);
            },
            () => {
              setEventsLoaded(true);
              setEventsError(true);
            },
          ),
        );
        unsubscribers.push(subscribeToMyUser(user.uid, setMe));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setAuthError(describeAuthError(err));
        setPhase('error');
      });

    return () => {
      cancelled = true;
      unsubscribers.forEach((u) => u());
    };
  }, []);

  // scroll_depth_25/50/75/100 — each fires once per session.
  useEffect(() => {
    if (phase !== 'ready' || selectedId) return;
    const onScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = (window.scrollY / scrollable) * 100;
      const atBottom = window.scrollY + window.innerHeight >= el.scrollHeight - 4;
      for (const mark of [25, 50, 75, 100] as const) {
        const reached = mark === 100 ? atBottom : pct >= mark;
        if (reached && once(`scroll:${mark}`)) track(`scroll_depth_${mark}` as AnalyticsName);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [phase, selectedId]);

  const joined = useMemo(() => new Set(me?.joinedEvents ?? []), [me]);
  const picks = useMemo(() => events.filter((e) => joined.has(e.id) && e.status !== 'Cancelled'), [events, joined]);
  const selected = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return events.filter(
      (e) =>
        e.status !== 'Cancelled' &&
        (e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)),
    );
  }, [events, searchQuery]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4000);
  };

  const setBusy = (eventId: string, on: boolean) =>
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(eventId);
      else next.delete(eventId);
      return next;
    });

  const handleJoin = async (event: Event) => {
    if (!uid || pending.has(event.id) || joined.has(event.id)) return;
    const joinsBefore = joined.size;
    track('join_click', { eventId: event.id, price: event.price });
    setBusy(event.id, true);
    try {
      const created = await joinEvent(event.id, uid, { priceSeen: event.price, source: getSource() });
      // Price ladder: on the first join, then roughly every third. Never blocks the join.
      if (created && joinsBefore % 3 === 0 && !me?.priceAnswers?.[event.id]) {
        setLadder({ event, nextPrice: nextPriceFor(event) });
      }
    } catch (err) {
      console.error(err);
      showToast("Couldn't save that — please try again.");
    } finally {
      setBusy(event.id, false);
    }
  };

  const handleLeave = async (event: Event) => {
    if (!uid || pending.has(event.id)) return;
    track('leave_click', { eventId: event.id });
    setBusy(event.id, true);
    try {
      await leaveEvent(event.id, uid);
    } catch (err) {
      console.error(err);
      showToast("Couldn't save that — please try again.");
    } finally {
      setBusy(event.id, false);
    }
  };

  const handleOpen = (event: Event) => {
    scrollBeforeOpen.current = window.scrollY;
    setSelectedId(event.id);
    window.scrollTo(0, 0);
    if (once(`open:${event.id}`)) {
      void bumpEventCounter(event.id, 'opens');
      track('card_open', { eventId: event.id });
    }
  };

  const handleBack = () => {
    setSelectedId(null);
    requestAnimationFrame(() => window.scrollTo(0, scrollBeforeOpen.current));
  };

  const handleJumpTo = (event: Event) => {
    const el = document.getElementById(`event-${event.id}`);
    if (!el) return;
    // window.scrollTo only moves the page vertically; scrollIntoView can also scroll the
    // shell sideways (it has decorative elements hanging off its right edge).
    const top = el.getBoundingClientRect().top + window.scrollY - (window.innerHeight - el.offsetHeight) / 2;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const handleHelpRun = (event: Event) => {
    setOrganiserEvent(event);
    track('organiser_panel_open', { eventId: event.id });
  };

  const handleInterest = async (event: Event) => {
    if (!uid) return;
    await recordOrganiserInterest(event.id, uid);
    track('organiser_interest_click', { eventId: event.id });
  };

  const submitContact = async (values: ContactValues, via: 'banner' | 'organiser') => {
    await linkContact({
      name: values.name,
      email: values.email,
      phone: values.phone,
      purpose: via === 'organiser' ? 'organising' : 'updates',
      wantsToOrganise: via === 'organiser',
    });
    track('contact_submit', { via, hasPhone: values.phone !== '', hasEmail: values.email !== '' });
  };

  const handleLadderAnswer = (prompt: LadderPrompt, answer: PriceAnswer) => {
    setLadder(null);
    if (!uid) return;
    track('price_ladder_answer', {
      eventId: prompt.event.id,
      answer,
      priceAsked: prompt.nextPrice,
      priceSeen: prompt.event.price,
    });
    recordPriceAnswer(uid, prompt.event.id, prompt.event.price, prompt.nextPrice, answer).catch((err) =>
      console.warn('price answer not saved', err),
    );
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" role="status" aria-label="Loading">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-8">
        <div className="glass rounded-3xl p-8 max-w-sm text-center">
          <h1 className="font-display text-2xl font-black text-white mb-3">Something went wrong</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{authError}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 gradient-brand text-white rounded-2xl font-black text-sm">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto relative shadow-2xl overflow-clip border-x border-white/5 selection:bg-brand-primary/30">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 -right-20 w-64 h-64 bg-brand-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Logo */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2 glass-dark rounded-full z-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-secondary shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse"></div>
          <span className="font-display font-black text-white text-xs tracking-[0.2em] italic">AGORA<span className="text-brand-secondary">X</span></span>
        </div>
      </div>

      {!selected && (
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search events"
          className="absolute top-3 right-4 z-50 glass p-2.5 rounded-2xl text-slate-300 hover:text-white transition-colors"
        >
          <Search size={20} />
        </button>
      )}

      <motion.div
        key={selected ? `detail-${selected.id}` : 'feed'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative z-10"
      >
        {selected ? (
          <EventDetailView
            event={selected}
            joined={joined.has(selected.id)}
            busy={pending.has(selected.id)}
            onBack={handleBack}
            onJoin={handleJoin}
            onLeave={handleLeave}
            onHelpRun={handleHelpRun}
          />
        ) : (
          <FeedView
            events={events}
            eventsLoaded={eventsLoaded}
            eventsError={eventsError}
            joined={joined}
            pending={pending}
            onJoin={handleJoin}
            onLeave={handleLeave}
            onOpen={handleOpen}
            onHelpRun={handleHelpRun}
            onOfferSpace={() => setVenueOfferOpen(true)}
          />
        )}
      </motion.div>

      {!selected && (
        <BottomBar
          picks={picks}
          showContactBanner={picks.length > 0 && !me?.hasContact && !bannerDismissed}
          onOpenContact={() => setContactOpen(true)}
          onDismissBanner={dismissBanner}
          onJumpTo={handleJumpTo}
        />
      )}

      {/* Sheets */}
      <OrganiserPanel
        event={organiserEvent}
        hasContact={!!me?.hasContact}
        onClose={() => setOrganiserEvent(null)}
        onInterest={handleInterest}
        onContact={(values) => submitContact(values, 'organiser')}
      />

      <PriceLadderSheet prompt={ladder} onAnswer={handleLadderAnswer} onSkip={() => setLadder(null)} />

      <Modal isOpen={contactOpen} onClose={() => setContactOpen(false)} title="Hear when it's happening">
        <p className="text-slate-400 text-sm mb-5">Leave a number and we'll tell you when one of your events is happening.</p>
        <ContactForm
          onSubmit={async (values) => {
            await submitContact(values, 'banner');
            setContactOpen(false);
          }}
        />
      </Modal>

      <VenueOfferModal isOpen={venueOfferOpen} onClose={() => setVenueOfferOpen(false)} />

      <Modal isOpen={searchOpen} onClose={closeSearch} title="Search events">
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 ring-brand-primary outline-none"
              placeholder="Chess, hiking, pottery…"
              autoFocus
            />
          </div>

          {searchQuery.trim() === '' ? (
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3 ml-1">Browse by type</p>
              <div className="flex flex-wrap gap-2">
                {PUBLIC_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSearchQuery(c)}
                    className="px-4 py-2 glass rounded-full text-xs text-slate-300 font-medium hover:bg-white/10 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar">
              {searchResults.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    closeSearch();
                    handleOpen(e);
                  }}
                  className="w-full text-left glass p-3 rounded-2xl flex items-center gap-3 hover:border-brand-primary/50 transition-all"
                >
                  <EventCover event={e} className="w-12 h-12 rounded-xl shrink-0" size="card" />
                  <div className="flex-grow min-w-0">
                    <p className="text-white text-sm font-bold truncate">{e.title}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{e.category}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 shrink-0" />
                </button>
              ))}
              {searchResults.length === 0 && (
                <p className="text-center text-slate-600 text-xs font-bold uppercase tracking-widest py-8">No matches — suggest it at the bottom of the page</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {toast && (
        <div role="status" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] glass-dark px-4 py-2 rounded-full text-xs text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
