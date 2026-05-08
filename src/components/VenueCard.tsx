import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Users, Euro, Info, ChevronRight } from 'lucide-react';
import { Venue } from '../types';

interface VenueCardProps {
  venue: Venue;
  onSelect?: (venue: Venue) => void;
  compact?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, onSelect, compact }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`glass rounded-3xl overflow-hidden group transition-all hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 ${
        compact ? 'flex flex-row h-28' : 'flex flex-col'
      }`}
    >
      <div className={`${compact ? 'w-32 h-full' : 'h-40 w-full'} overflow-hidden relative`}>
        <img
          src={venue.imageUrls && venue.imageUrls.length > 0 ? venue.imageUrls[0] : 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80'}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark opacity-40"></div>
      </div>

      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <h4 className="font-display font-bold text-white leading-tight group-hover:text-brand-secondary transition-colors">
            {venue.name}
          </h4>
          <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
            <MapPin size={12} className="text-brand-secondary" />
            <span>{venue.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Users size={12} />
              <span>{venue.capacity}</span>
            </div>
            <div className="flex items-center gap-0.5 text-white font-bold text-sm">
              <Euro size={12} className="text-brand-secondary" />
              <span>{venue.hourlyRate}</span>
              <span className="text-[10px] text-slate-500 font-medium ml-0.5">/hr</span>
            </div>
          </div>

          <button
            onClick={() => onSelect && onSelect(venue)}
            className="text-brand-secondary font-bold text-xs hover:text-white transition-colors flex items-center gap-1"
          >
            Select <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
