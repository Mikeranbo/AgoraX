export type EventCategory = 'Workshop' | 'Concert' | 'Cultural' | 'Social' | 'Fitness' | 'Startup';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  price: number;
  minParticipants: number;
  currentParticipants: number;
  deadline: string; // ISO date string
  startTime: string; // ISO date string
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  organizerId: string;
  venueId?: string;
  imageUrl: string;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  location: string;
  hourlyRate: number;
  capacity: number;
  imageUrl: string;
}

export interface User {
  id: string;
  role: 'Organiser' | 'VenueOwner' | 'Audience';
  name: string;
}
