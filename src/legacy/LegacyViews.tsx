/**
 * Screens from the first version of AgoraX that are no longer reachable (APP_CHANGES §3):
 * the venue marketplace ("Spaces") and the organiser dashboard ("Your Hub"). Kept so they
 * can come back later; nothing imports them today.
 */
import React from 'react';
import { Plus, Building2, TrendingUp, Award, Users, ChevronRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { Event, Venue } from '../types';
import { VenueCard } from '../components/VenueCard';

export const VenueMarketplace = ({ venues, onListVenue, onSelectVenue }: { venues: Venue[], onListVenue: () => void, onSelectVenue: (v: Venue) => void }) => {
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

export const DashboardView = ({ events, onSelectEvent, onCreateEvent }: { events: Event[], onSelectEvent: (e: Event) => void, onCreateEvent: () => void }) => {
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
                  <span className="w-full h-full grid place-items-center text-2xl" aria-hidden="true">{e.emoji}</span>
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

    </div>
  );
};
