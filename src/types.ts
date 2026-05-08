export type EventCategory = 'Workshop' | 'Concert' | 'Cultural' | 'Social' | 'Fitness' | 'Startup';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  price: number;
  minParticipants: number;
  participantsCount: number;
  deadline: string; // ISO date string
  startTime: string; // ISO date string
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  organizerId: string;
  venueId?: string;
  imageUrls: string[];
  mapsLink?: string;
  impressions?: number;
  clicks?: number;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  hourlyRate: number;
  capacity: number;
  imageUrls: string[];
  ownerId: string;
}

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface User {
  id: string;
  role: 'Organiser' | 'VenueOwner' | 'Audience';
  name: string;
}
