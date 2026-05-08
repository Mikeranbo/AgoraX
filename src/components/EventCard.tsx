import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Clock, MapPin, Tag, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Event } from '../types';
import { trackImpression } from '../services/firebaseService';

interface EventCardProps {
  event: Event;
  onJoin?: (id: string) => void;
  onClick?: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onJoin, onClick }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const progress = Math.min((event.participantsCount / event.minParticipants) * 100, 100);
  const isConfirmed = event.status === 'Confirmed' || event.participantsCount >= event.minParticipants;
  const isCancelled = event.status === 'Cancelled';

  useEffect(() => {
    // Track impression when card is rendered
    trackImpression(event.id);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(event.deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Deadline Passed');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [event.deadline, event.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick && onClick(event)}
      className="glass rounded-3xl overflow-hidden flex flex-col h-full group cursor-pointer"
    >
      <div className="relative h-48">
        <img
          src={event.imageUrls && event.imageUrls.length > 0 ? event.imageUrls[0] : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt={event.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-60"></div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/10 shadow-sm">
            {event.category}
          </span>
        </div>
        {isConfirmed && (
          <div className="absolute top-4 right-4 animate-pulse">
            <span className="px-3 py-1 bg-green-500/20 backdrop-blur-md text-green-400 border border-green-500/30 text-xs font-bold rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider">
              <CheckCircle2 size={14} /> Confirmed
            </span>
          </div>
        )}
        <div className="absolute bottom-4 right-4 text-[10px] font-mono text-brand-secondary font-bold bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
          {timeLeft}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow relative">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display text-xl font-bold text-white leading-tight group-hover:text-brand-secondary transition-colors">
            {event.title}
          </h3>
          <Info size={16} className="text-slate-500 group-hover:text-brand-secondary transition-colors" />
        </div>
        
        <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-grow">
          {event.description}
        </p>

        <div className="space-y-3 mb-6">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium mb-1">
              <div className="flex items-center gap-1 text-slate-300">
                <Users size={14} className="text-brand-primary" />
                <span>{event.participantsCount} Joined</span>
              </div>
              <span className="text-slate-500 italic">Target: {event.minParticipants}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${progress >= 100 ? 'bg-green-400' : 'bg-gradient-to-r from-brand-primary to-brand-secondary'}`}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Ticket</span>
            <span className="text-lg font-display font-bold text-white">
              {event.price === 0 ? 'Free' : `€${event.price}`}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin && onJoin(event.id);
            }}
            disabled={isCancelled || progress >= 100 || timeLeft === 'Deadline Passed'}
            className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 ${
              isConfirmed 
                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-white text-[#0f172a] hover:bg-slate-200'
            }`}
          >
            {isConfirmed ? 'Full' : 'Join Now'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
