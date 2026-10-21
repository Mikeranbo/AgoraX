import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Tile, pct } from '../ui';

export function Overview() {
  const { stats, venueOffers, suggestions } = useAdmin().state;
  return (
    <Section title="Overview" subtitle="Live — updates as people use the site">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Unique visitors" value={stats.visitors} hint="distinct uids in users" />
        <Tile label="Total joins" value={stats.totalJoins} />
        <Tile label="People who joined" value={stats.joiners} hint="at least one event" />
        <Tile label="Contacts captured" value={stats.contacts} hint={pct(stats.contacts, stats.visitors) + ' of visitors'} />
        <Tile label="Avg events picked" value={stats.avgPicks.toFixed(1)} hint="per person who joined" />
        <Tile label="Organiser interest" value={stats.organiserTaps} hint="“help run this” taps" />
        <Tile label="Venue offers" value={venueOffers.length} />
        <Tile label="Suggestions" value={suggestions.length} />
      </div>
    </Section>
  );
}
